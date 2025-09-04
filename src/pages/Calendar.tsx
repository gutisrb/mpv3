import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking, useDeleteAllManualBookings, Booking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Calendar page
 * - Adds manual-only delete on event click
 * - Adds a bulk "Delete all manual bookings" button
 * - Mobile friendly (long press to select)
 * - Multi-day bookings render correctly (exclusive end)
 */
const Calendar: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id || '';
  const { data: bookings = [] } = useBookings(propertyId);
  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();
  const deleteAllManual = useDeleteAllManualBookings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  const getBookingDetails = (source: string | null) => {
    const cleanSource = (source || '').toLowerCase().trim();
    if (cleanSource === 'airbnb')    return { color: '#FF5A5F', title: 'Airbnb' };
    if (cleanSource === 'booking.com' || cleanSource === 'booking') return { color: '#003580', title: 'Booking.com' };
    if (cleanSource === 'manual' || cleanSource === 'web' || cleanSource === 'website') return { color: '#F59E0B', title: 'Manual' };
    return { color: '#6B7280', title: cleanSource || 'Unknown' };
  };

  const events = useMemo(() => {
    return bookings.map((booking: Booking) => {
      const details = getBookingDetails(booking.source);
      // FullCalendar expects an exclusive end date to span both days
      const endExclusive = new Date(booking.end_date);
      endExclusive.setDate(endExclusive.getDate() + 1);
      return {
        id: booking.id,
        title: details.title,
        start: booking.start_date,
        end: endExclusive.toISOString().split('T')[0],
        allDay: true,
        backgroundColor: details.color,
        borderColor: details.color,
        textColor: '#FFFFFF',
        extendedProps: { source: booking.source }
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
    if (isDateRangeBooked(start, end)) return;
    setSelectedDates({ start, end });
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (bookingData: { start_date: string; end_date: string; source: 'manual' | 'web' | 'airbnb' | 'booking.com' }) => {
    if (!currentProperty) return;
    await createBooking.mutateAsync({
      property_id: currentProperty.id,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      source: 'manual'
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const b = bookings.find((x) => x.id === clickInfo.event.id);
    if (!b) return;
    const s = (b.source || '').toLowerCase();
    if (s !== 'manual' && s !== 'web' && s !== 'website') {
      alert('Only manual bookings can be deleted.');
      return;
    }
    if (!currentProperty) return;
    if (confirm('Delete this manual booking?')) {
      deleteBooking.mutate({ bookingId: b.id, propertyId: currentProperty.id });
    }
  };

  // Loading/empty states
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
        <p className="text-gray-500">Tap/Click a manual booking to delete it. Long-press on a date to create a booking on mobile.</p>
      </div>

      {/* Danger Zone: bulk delete */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">
          This will permanently delete <strong>all manual bookings</strong> for this property. Bookings from Airbnb / Booking.com will not be touched.
        </p>
        <button
          onClick={async () => {
            if (!currentProperty) return;
            if (!confirm('Delete ALL manual bookings for this property? This cannot be undone.')) return;
            try {
              await deleteAllManual.mutateAsync({ propertyId: currentProperty.id });
              alert('All manual bookings were deleted.');
            } catch (e: any) {
              alert(e?.message || 'Failed to delete manual bookings.');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Trash2 className="w-4 h-4" />
          Delete all manual bookings
        </button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { color: '#F59E0B', label: 'Manual' },
          { color: '#FF5A5F', label: 'Airbnb' },
          { color: '#003580', label: 'Booking.com' },
          { color: '#6B7280', label: 'Other' },
        ].map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: it.color }} />
            <span className="text-sm text-gray-600">{it.label}</span>
          </div>
        ))}
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
    </div>
  );
};

export default Calendar;
