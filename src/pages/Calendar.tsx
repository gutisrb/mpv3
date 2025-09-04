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

  const calendarRef = useRef<FullCalendar | null>(null);

  // Render bookings as BACKGROUND events and with end+1 day (inclusive display)
  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        start: b.start_date,
        end: addDays(b.end_date, 1), // end exclusive -> +1 to show both nights
        display: 'background',       // fills whole cell
        color: '#60a5fa',            // Tailwind sky-400-ish
        allDay: true,
      })),
    [bookings]
  );

  // Check if a selection overlaps any existing rendered event
  const hasOverlap = (start: Date, endExclusive: Date) => {
    const api = calendarRef.current?.getApi();
    if (!api) return false;
    const events = api.getEvents();
    return events.some((e) => {
      const es = e.start ? e.start.getTime() : 0;
      const ee = e.end ? e.end.getTime() : es;
      const s = start.getTime();
      const eeSel = endExclusive.getTime();
      // overlap if ranges intersect: [es, ee) ∩ [s, eeSel) ≠ ∅
      return es < eeSel && s < ee;
    });
  };

  // ----- Create booking (dates only; DB constraint-safe) -----
  const handleCreateBooking = async (form: { start_date: string; end_date: string }) => {
    if (!propertyId) return;
    await createBooking.mutateAsync({
      property_id: propertyId,
      start_date: form.start_date,
      end_date: form.end_date,
      // use values allowed by your CHECK constraint
      channel: 'Airbnb',
      source: 'manual',
      external_uid: null,
    } as any);
    setIsModalOpen(false);
    setSelectedDates(null);
  };

  // Tap/click a day: if it contains a booking -> ask to delete; else open new-booking modal
  const onDateClick = (arg: { dateStr: string }) => {
    const api = calendarRef.current?.getApi();
    const clicked = new Date(arg.dateStr + 'T00:00:00');

    const eventsOnDay =
      api
        ?.getEvents()
        .filter((e) => {
          const start = e.start ? new Date(e.start) : null;
          const end = e.end ? new Date(e.end) : start;
          if (!start || !end) return false;
          // inclusive for display: start <= clicked < end
          return start <= clicked && clicked < end;
        }) || [];

    if (eventsOnDay.length > 0) {
      const e = eventsOnDay[0];
      // e.end is +1 day for rendering; show end-1 to the user
      const uiEnd = e.end ? addDays(toYMD(e.end.toISOString()), -1) : toYMD(e.start?.toISOString() ?? '');
      setPendingDelete({
        id: String(e.id),
        start: toYMD(e.start?.toISOString() ?? ''),
        end: uiEnd,
      });
      setConfirmOpen(true);
      return;
    }

    const d = toYMD(arg.dateStr);
    setSelectedDates({ start: d, end: d });
    setIsModalOpen(true);
  };

  // Drag/select (range). Block if any overlap with existing bookings to prevent double dialogs.
  const onSelect = (arg: { start: Date; end: Date; startStr: string; endStr: string }) => {
    // abort if overlaps existing events
    if (hasOverlap(arg.start, arg.end)) return;

    // FullCalendar gives end exclusive; convert to checkout = end-1
    const s = toYMD(arg.startStr);
    const eExclusive = toYMD(arg.endStr);
    const e = eExclusive ? addDays(eExclusive, -1) : s;
    setSelectedDates({ start: s, end: e });
    setIsModalOpen(true);
  };

  // Also block selection before it starts (prevents the double open)
  const selectAllow = (arg: { start: Date; end: Date }) => !hasOverlap(arg.start, arg.end);

  // Delete booking
  const confirmDelete = async () => {
    if (!pendingDelete || !propertyId) return;
    await supabase.from('bookings').delete().eq('id', pendingDelete.id).eq('property_id', propertyId);
    setConfirmOpen(false);
    setPendingDelete(null);
    // refresh
    queryClient.invalidateQueries({ queryKey: ['bookings', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  if (isLoadingClient) {
    return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  }
  if (clientError) {
    return <div className="p-6 text-sm text-gray-600">Your account isn’t linked to a client. Contact support.</div>;
  }
  if (!propertyId) {
    return <div className="p-6 text-sm text-gray-600">Please select a property in Settings first.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow border p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef as any}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          // tap/click behaviors
          dateClick={onDateClick}
          selectable
          select={onSelect}
          selectAllow={selectAllow}
          // mobile: no long-press delays
          selectLongPressDelay={0}
          eventLongPressDelay={0}
          longPressDelay={0}
          // layout
          height="auto"
          expandRows
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayMaxEventRows={2}
          dayMaxEvents
          handleWindowResize
          // data
          events={events}
          dayCellClassNames={() => ['touch-target']}
          eventClassNames={() => ['touch-target']}
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
