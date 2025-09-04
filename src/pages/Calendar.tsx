import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Plus } from 'lucide-react';

// Ensure YYYY-MM-DD (FullCalendar passes ISO strings sometimes)
const toYMD = (s?: string) => (s ? s.substring(0, 10) : '');

type SelectedRange = { start: string; end: string } | null;

const Calendar: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id || '';

  const { data: bookings = [] } = useBookings(propertyId);
  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<SelectedRange>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; start: string; end: string } | null>(null);

  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        start: b.start_date,
        end: b.end_date,
        title: b.source || 'Rezervacija',
        allDay: true,
      })),
    [bookings]
  );

  // ----- Create -----
  const handleCreateBooking = async (form: {
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    start_date: string;
    end_date: string;
    notes?: string;
  }) => {
    if (!propertyId) return;
    await createBooking.mutateAsync({
      property_id: propertyId,
      start_date: form.start_date,
      end_date: form.end_date,
      source: 'Direct site',
      external_uid: null,
      channel: 'Direct',
    } as any);
    setIsModalOpen(false);
    setSelectedDates(null);
  };

  const onDateClick = (arg: { dateStr: string }) => {
    const d = toYMD(arg.dateStr);
    setSelectedDates({ start: d, end: d });
    setIsModalOpen(true);
  };

  const onSelect = (arg: { startStr: string; endStr: string }) => {
    const s = toYMD(arg.startStr);
    const e = toYMD(arg.endStr) || s;
    setSelectedDates({ start: s, end: e });
    setIsModalOpen(true);
  };

  // ----- Delete -----
  const onEventClick = (info: any) => {
    const id = info?.event?.id as string | undefined;
    if (!id) return;
    const start = toYMD(info?.event?.startStr);
    const end = toYMD(info?.event?.endStr);
    setPendingDelete({ id, start, end });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !propertyId) return;
    await deleteBooking.mutateAsync({ bookingId: pendingDelete.id, propertyId });
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  // ----- UI states -----
  if (isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Setup Required</h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            Your account isn’t linked to a client yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!propertyId) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Please select a property in Settings first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow border p-2 sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={onDateClick}
          selectable
          select={onSelect}
          eventClick={onEventClick}
          // Mobile touch friendliness
          selectLongPressDelay={0}
          eventLongPressDelay={0}
          longPressDelay={0}
          // Layout
          height="auto"
          expandRows
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayMaxEventRows={2}
          dayMaxEvents
          handleWindowResize
          events={events}
          dayCellClassNames={() => ['touch-target']}
          eventClassNames={() => ['touch-target']}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
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
