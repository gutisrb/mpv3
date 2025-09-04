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

// helpers
const toYMD = (s?: string) => (s ? s.substring(0, 10) : '');
const addDays = (dateYmd: string, n = 1) => {
  const d = new Date(dateYmd + 'T00:00:00');
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

  // Display events with end date INCLUSIVE (fills both boxes visually).
  // We keep DB end_date as the checkout date; for rendering, we add +1 day.
  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        start: b.start_date,                 // e.g. 2025-09-19
        end: addDays(b.end_date, 1),         // render inclusive: 2025-09-20 -> shows 19 & 20
        title: b.source || 'Rezervacija',
        allDay: true,
      })),
    [bookings]
  );

  // ----- Create booking (minimal: dates only) -----
  const handleCreateBooking = async (form: { start_date: string; end_date: string }) => {
    if (!propertyId) return;

    await createBooking.mutateAsync({
      property_id: propertyId,
      start_date: form.start_date,
      end_date: form.end_date,
      // Use values your DB CHECK allows. Your constraint rejected "Direct".
      // "Airbnb" is already present in your rows, so we use that to satisfy the check.
      channel: 'Airbnb',
      source: 'manual',
      external_uid: null,
    } as any);

    setIsModalOpen(false);
    setSelectedDates(null);
  };

  // If a day has any event, clicking anywhere in the cell will open delete confirm for that event.
  // Otherwise it opens the "new booking" modal.
  const onDateClick = (arg: { dateStr: string }) => {
    const api = calendarRef.current?.getApi();
    const clicked = new Date(arg.dateStr + 'T00:00:00');

    const eventsOnDay =
      api
        ?.getEvents()
        .filter((e) => {
          const start = e.start ? new Date(e.start) : null;
          const end = e.end ? new Date(e.end) : start; // end is already +1 day for inclusive display
          if (!start || !end) return false;
          // inclusive for display: start <= clicked < end
          return start <= clicked && clicked < end;
        }) || [];

    if (eventsOnDay.length > 0) {
      const e = eventsOnDay[0];
      setPendingDelete({
        id: String(e.id),
        start: toYMD(e.start?.toISOString() ?? ''),
        end: toYMD(e.end?.toISOString() ?? ''),
      });
      setConfirmOpen(true);
      return;
    }

    const d = toYMD(arg.dateStr);
    setSelectedDates({ start: d, end: d });
    setIsModalOpen(true);
  };

  // Drag/select (or long-press on mobile) → open modal with range
  const onSelect = (arg: { startStr: string; endStr: string }) => {
    // FullCalendar select endStr is exclusive; use (endStr - 1 day) for check-out semantics
    const s = toYMD(arg.startStr);
    const eExclusive = toYMD(arg.endStr);
    const e = eExclusive ? addDays(eExclusive, -1) : s;
    setSelectedDates({ start: s, end: e });
    setIsModalOpen(true);
  };

  // ----- Delete booking (direct Supabase call, then invalidate cache) -----
  const confirmDelete = async () => {
    if (!pendingDelete || !propertyId) return;

    await supabase
      .from('bookings')
      .delete()
      .eq('id', pendingDelete.id)
      .eq('property_id', propertyId);

    setConfirmOpen(false);
    setPendingDelete(null);
    // Refresh calendar data
    queryClient.invalidateQueries({ queryKey: ['bookings', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
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
      <div className="p-6 text-sm text-gray-600">
        Your account isn’t linked to a client yet. Please contact support.
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
      <div className="b
