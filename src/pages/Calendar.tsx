import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking, Booking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';

/** Lightweight in-app confirm (no browser alert/confirm) */
const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        <div className="p-5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Calendar page
 * - Manual-only delete with in-app confirmation
 * - Mobile friendly (long press to select)
 * - Multi-day bookings render correctly (exclusive end)
 * - Bulk "Danger Zone" REMOVED as requested
 */
const Calendar: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id || '';
  const { data: bookings = [] } = useBookings(propertyId);

  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  // delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getBookingDetails = (source: string | null) => {
    const s = (source || '').toLowerCase().trim();
    if (s === 'airbnb') return { color: '#FF5A5F', title: 'Airbnb' };
    if (s === 'booking.com' || s === 'booking') return { color: '#003580', title: 'Booking.com' };
    if (s === 'manual' || s === 'web' || s === 'website') return { color: '#F59E0B', title: 'Manual' };
    return { color: '#6B7280', title: s || 'Other' };
    // NOTE: only 'manual' will be deletable; display title is informational.
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
    const start = selectInfo.start as Date;
    const end = selectInfo.end as Date;
    if (isDateRangeBooked(start, end)) return;
    setSelectedDates({ start, end });
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (bookingData: {
    start_date: string;
    end_date: string;
    source: 'manual' | 'web' | 'airbnb' | 'booking.com';
  }) => {
    if (!currentProperty) return;
    await createBooking.mutateAsync({
      property_id: currentProperty.id,
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      source: 'manual'
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const source = (clickInfo?.event?.extendedProps?.source || '').toLowerCase();
    if (source !== 'manual') {
      // No delete for OTA bookings
      return;
    }
    setDeleteTarget({ id: String(clickInfo.event.id), label: clickInfo.event.title || 'manual booking' });
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentProperty || !deleteTarget) return;
    try {
      setDeleting(true);
      await deleteBooking.mutateAsync({
        bookingId: deleteTarget.id,
        propertyId: currentProperty.id
      });
    } catch (e) {
      // Surface error in a simple way
      console.error(e);
      alert((e as Error)?.message ?? 'Failed to delete booking.');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  // Loading/empty states
  if (isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
          <p className="text-gray-500">Choose a property from the dropdown above to view its calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calendar — {currentProperty.name}</h1>
        <p className="text-gray-500">Tap/Click a manual booking to delete it. Long-press on a date to create a booking on mobile.</p>
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
          height="auto
