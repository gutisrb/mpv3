import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

const toYMD = (s?: string) => (s ? s.substring(0, 10) : '');
const addDays = (ymd: string, n = 1) => {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
};

type SelectedRange = { start: string; end: string } | null;

const Calendar: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id || '';

  const { data: bookings = [] } = useBookings(propertyId);
  const createBooking = useCreateBooking();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<SelectedRange>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; start: string; end: string } | null>(null);

  const calRef = useRef<FullCalendar | null>(null);

  // Display fix: render checkout as inclusive by passing end+1 day to FullCalendar
  // (DB keeps end as checkout; UI shows all occupied nights)
  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        start: b.start_date,
        end: addDays(b.end_date, 1), // key line: inclusive display
        allDay: true,
        display: 'background',       // fills the whole cell (requested look)
        color: '#60a5fa',
      })),
    [bookings]
  );

  // Helper: does [s,e) overlap any existing rendered event?
  const overlapsExisting = (s: Date, e: Date) => {
    const api = calRef.current?.getApi();
    if (!api) return false;
    return api.getEvents().some((ev) => {
      const es = ev.start ? ev.start.getTime() : 0;
      const ee = ev.end ? ev.end.getTime() : es;
      const ss = s.getTime();
      const eeSel = e.getTime();
      return es < eeSel && ss < ee; // intersect
    });
  };

  // CREATE (dates only – DB constraint-safe)
  const handleCreateBooking = async (payload: { start_date: string; end_date: string }) => {
    if (!propertyId) return;
    await createBooking.mutateAsync({
      property_id: propertyId,
      start_date: payload.start_date, // stored as checkout (no +1 in DB)
      end_date: payload.end_date,
      channel: 'Airbnb',  // passes your CHECK constraint
      source: 'manual',
      external_uid: null,
    } as any);
    setIsModalOpen(false);
    setSelectedDates(null);
  };

  // CLICK a day:
  // - if it contains a booking => open delete
  // - else => open new booking modal
  const onDateClick = (arg: { dateStr: string }) => {
    const api = calRef.current?.getApi();
    const clicked = new Date(arg.dateStr + 'T00:00:00');

    const eventsOnDay =
      api
        ?.getEvents()
        .filter((ev) => {
          const es = ev.start ? new Date(ev.start) : null;
          const ee = ev.end ? new Date(ev.end) : es;
          if (!es || !ee) return false;
          // remember: our rendered end is already +1 day
          return es <= clicked && clicked < ee;
        }) || [];

    if (eventsOnDay.length) {
      const ev = eventsOnDay[0];
      const start = toYMD(ev.start?.toISOString() ?? '');
      const endRendered = toYMD(ev.end?.toISOString() ?? '');
      const endCheckout = endRendered ? addDays(endRendered, -1) : start;

      setPendingDelete({ id: String(ev.id), start, end: endCheckout });
      setConfirmOpen(true);
      return;
    }

    const d = toYMD(arg.dateStr);
    setSelectedDates({ start: d, end: d });
    setIsModalOpen(true);
  };

  // DRAG/SELECT a range: block if it hits an existing booking (prevents double popups)
  const onSelect = (arg: { start: Date; end: Date; startStr: string; endStr: string }) => {
    if (overlapsExisting(arg.start, arg.end)) return;
    // FullCalendar gives end exclusive; convert to checkout = end-1
    const s = toYMD(arg.startStr);
    const ex = toYMD(arg.endStr);
    const e = ex ? addDays(ex, -1) : s;
    setSelectedDates({ start: s, end: e });
    setIsModalOpen(true);
  };
  const selectAllow = (arg: { start: Date; end: Date }) => !overlapsExisting(arg.start, arg.end);

  // DELETE
  const confirmDelete = async () => {
    if (!pendingDelete || !propertyId) return;
    const { id } = pendingDelete;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('property_id', propertyId);

    if (error) {
      alert('Brisanje nije uspelo: ' + error.message);
      return;
    }

    setConfirmOpen(false);
    setPendingDelete(null);

    // refresh bookings everywhere
    await queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && String(q.queryKey[0]).includes('bookings'),
    });
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  // --------- states ----------
  if (isLoadingClient) return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  if (clientError) return <div className="p-6 text-sm text-gray-600">Your account isn’t linked to a client. Contact support.</div>;
  if (!propertyId) return <div className="p-6 text-sm text-gray-600">Please select a property in Settings first.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow border p-2 sm:p-4">
        <FullCalendar
          ref={calRef as any}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={onDateClick}
          selectable
          select={onSelect}
          selectAllow={selectAllow}
          // mobile: no long-press delay
          selectLongPressDelay={0}
          eventLongPressDelay={0}
          longPressDelay={0}
          // layout
          height="auto"
          expandRows
          fixedWeekCount={false}
          showNonCurrentDates={false}
          handleWindowResize
          // data
          events={events}
          dayMaxEvents
          dayMaxEventRows={2}
          dayCellClassNames={() => ['touch-target']}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
        />
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBooking}
        initialStartDate={selectedDates?.start}
        initialEndDate={selectedDates?.end}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Obrisati rezervaciju?"
        message={
          <div className="text-sm">
            Period: <b>{pendingDelete?.start}</b> → <b>{pendingDelete?.end}</b>
          </div>
        }
        confirmText="Obriši"
        cancelText="Otkaži"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default Calendar;
