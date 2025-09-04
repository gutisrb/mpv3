import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking, Booking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

/** In-app confirm modal (no browser/iframe popup) */
const ConfirmDialog: React.FC<{
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}> = ({ open, title = 'Delete manual booking?', message = 'This action cannot be undone.', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Calendar: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id || '';
  const { data: bookings = [] } = useBookings(propertyId);
  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);

  const getBookingDetails = (source: string | null) => {
    const clean = (source || '').toLowerCase().trim();
    if (clean === 'airbnb') return { color: '#FF5A5F', title: 'Airbnb' };
    if (clean === 'booking.com' || clean === 'booking') return { color: '#003580', title: 'Booking.com' };
    if (clean === 'manual') return { color: '#F59E0B', title: 'Manual' };
    return { color: '#6B7280', title: clean || 'Unknown' };
  };

  // Events render as BACKGROUND so the whole day cell is filled.
  // We also keep them clickable (see CSS + eventDidMount).
  const events = useMemo(() => {
    return bookings.map((b: Booking) => {
      const d = getBookingDetails(b.source);
      const endExclusive = new Date(b.end_date);
      endExclusive.setDate(endExclusive.getDate() + 1);
      return {
        id: b.id,                      // clicking any day in the range deletes the WHOLE booking
        title: '',                     // background events don’t need text
        start: b.start_date,
        end: endExclusive.toISOString().split('T')[0],
        allDay: true,
        display: 'background',         // fill entire date boxes
        backgroundColor: d.color,
        borderColor: d.color,
        extendedProps: { source: b.source }
      };
    });
  }, [bookings]);

  const isDateRangeBooked = (start: Date, end: Date) => {
    return bookings.some((b) => {
      const bs = new Date(b.start_date);
      const be = new Date(b.end_date);
      return start < be && end > bs;
    });
  };

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start;
    const end = selectInfo.end;
    if (isDateRangeBooked(start, end)) return; // don’t allow placing over existing
    setSelectedDates({ start, end });
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (bookingData: { start_date: string; end_date: string; source: 'manual' | 'airbnb' | 'booking.com' }) => {
    if (!currentProperty) return;
    await createBooking.mutateAsync({
      property_id: currentProperty.id,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      source: 'manual'
    });
  };

  const handleEventClick = (clickInfo: any) => {
    // Get the booking row for the WHOLE range by ID
    const b = bookings.find((x) => x.id === clickInfo.event.id);
    if (!b) return;
    if ((b.source || '').toLowerCase() !== 'manual') {
      alert('Only manual bookings can be deleted.');
      return;
    }
    setTargetBookingId(b.id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentProperty || !targetBookingId) {
      setDeleteOpen(false);
      return;
    }
    try {
      await deleteBooking.mutateAsync({ bookingId: targetBookingId, propertyId: currentProperty.id });
      setDeleteOpen(false);
      setTargetBookingId(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to delete booking.');
    }
  };

  // Loading/empty states (unchanged)
  if (isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Checking your account…</h3>
          <p className="text-gray-500">Please wait a moment.</p>
        </div>
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
          <p className="text-gray-500">{clientError.message}</p>
        </div>
      </div>
    );
  }
  if (!currentProperty) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
          <p className="text-gray-500">Choose a property from the dropdown above to view its calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Calendar — {currentProperty.name}</h1>
        <p className="text-gray-500">Tap any booked day to delete the whole manual booking. Long-press on a date to create a booking on mobile.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDidMount={(info) => {
            // Ensure background events are clickable on all devices
            info.el.addEventListener('click', () => handleEventClick({ event: info.event }));
          }}
          selectLongPressDelay={250}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          dayMaxEvents={false}
          moreLinkClick="popover"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayHeaderFormat={{ weekday: 'short' } as any}
          buttonText={{ today: 'Today' }}
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
        open={deleteOpen}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};

export default Calendar;
