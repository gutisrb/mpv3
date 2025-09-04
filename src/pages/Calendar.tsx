// src/pages/Calendar.tsx
import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

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

  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        start: b.start_date,     // ISO
        end: b.end_date,         // ISO (FullCalendar treats end as exclusive; OK for allDay)
        title: b.source || 'Rezervacija',
        allDay: true,
      })),
    [bookings]
  );

  // ----- Create booking flow -----
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

  // Single-tap a date → open modal for that day
  const onDateClick = (arg: { dateStr: string }) => {
    setSelectedDates({ start: arg.dateStr, end: arg.dateStr });
    setIsModalOpen(true);
  };

  // Drag/select (or long-press on mobile) → open modal with range
  const onSelect = (arg: { startStr: string; endStr: string }) => {
    setSelectedDates({ start: arg.startStr, end: arg.endStr });
    setIsModalOpen(true);
  };

  // ----- Delete booking flow -----
  // Tap an existing event (booking) → confirm → delete
  const onEventClick = async (info: any) => {
    try {
      const bookingId = info?.event?.id as string | undefined;
      const start = info?.event?.startStr || '';
      const end = info?.event?.endStr || '';
      if (!bookingId || !propertyId) return;

      const pretty = (s: string) => (s ? new Date(s).toLocaleDateString() : '');
      const ok = window.confirm(
        `Obrisati rezervaciju?\n\nPeriod: ${pretty(start)} → ${pretty(end)}`
      );
      if (!ok) return;

      await deleteBooking.mutateAsync({ bookingId, propertyId });
      // FullCalendar will refresh because our query invalidates onSuccess in the hook
    } catch (e) {
      console.error(e);
      alert('Brisanje nije uspelo. Pokušajte ponovo.');
    }
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
          // Mobile-friendly taps
          dateClick={onDateClick}
          selectable
          select={onSelect}
          eventClick={onEventClick}
          // Remove long-press delays on mobile
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
          // Data
          events={events}
          // Touch target classes (paired with CSS you already added)
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
    </div>
  );
};

export default Calendar;
