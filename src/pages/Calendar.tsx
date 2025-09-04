import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking, useDeleteBooking, Booking } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

/** Lightweight in-app confirm modal (no browser "embedded page" dialog) */
const ConfirmDialog: React.FC<{
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}> = ({ open, title = 'Confirm', message = 'Are you sure?', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
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
 * - Delete only manual bookings (with in-app confirm modal)
 * - Mobile friendly (long press to select)
 * - Multi-day bookings render correctly (exclusive end)
 * - "Danger Zone" (bulk delete) has been removed as requested
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

  // Delete confirm modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);

  const getBookingDetails = (source: string | null) => {
    const cleanSource = (source || '').toLowerCase().trim();
    if (cleanSource === 'airbnb') return { color: '#FF5A5F', title: 'Airbnb' };
    if (cleanSource === 'booking.com' || cleanSource === 'booking') return { color: '#003580', title: 'Booking.com' };
    if (cleanSource === 'manual') return { color: '#F59E0B', title: 'Manual' };
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
    const b = bookings.find((x) => x.id === clickInfo.event.id);
    if (!b) return;
    const s = (b.source || '').toLowerCase();
    if (s !== 'manual') {
      alert('Only manual bookings can be deleted.');
      return;
    }
    setTargetBookingId(b.id);
    setDeleteOpen(true); // open in-app modal (no browser "embedded page" dialog)
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
          <p classNa
