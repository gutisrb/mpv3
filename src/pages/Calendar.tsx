import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking } from '@/api/dataHooks';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

const SOURCE_COLORS = {
  airbnb: '#fd5c63',
  'booking.com': '#499FDD', 
  manual: '#38B000',
  web: '#38B000'
};

const Calendar: React.FC = () => {
  const { currentProperty } = useApp();
  const { data: bookings = [] } = useBookings(currentProperty?.id || '');
  const createBooking = useCreateBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  // Transform bookings into calendar events
  const events = React.useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      title: '', // Empty title to avoid repetition
      start: booking.start_date,
      end: booking.end_date,
      backgroundColor: SOURCE_COLORS[booking.source as keyof typeof SOURCE_COLORS] || '#6B7280',
      borderColor: SOURCE_COLORS[booking.source as keyof typeof SOURCE_COLORS] || '#6B7280',
      textColor: 'transparent', // Hide text
      display: 'background', // Fill entire day cell
      extendedProps: {
        source: booking.source
      }
    }));
  }, [bookings]);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDates({
      start: selectInfo.start,
      end: new Date(selectInfo.end.getTime() - 24 * 60 * 60 * 1000) // Adjust end date
    });
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (bookingData: {
    start_date: string;
    end_date: string;
    source: 'airbnb' | 'booking.com' | 'manual' | 'web';
  }) => {
    if (!currentProperty) return;
    
    await createBooking.mutateAsync({
      property_id: currentProperty.id,
      user_id: 'temp-user-id', // This should come from auth
      ...bookingData,
    });
  };

  if (!currentProperty) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
          <p className="text-gray-500">
            Choose a property from the dropdown above to view its calendar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{currentProperty.name}</h1>
        <p className="text-gray-600 mt-1">Booking calendar and availability</p>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SOURCE_COLORS.airbnb }}></div>
            <span className="ml-2 text-sm text-gray-700">Airbnb</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SOURCE_COLORS['booking.com'] }}></div>
            <span className="ml-2 text-sm text-gray-700">Booking.com</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SOURCE_COLORS.manual }}></div>
            <span className="ml-2 text-sm text-gray-700">Manual</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          dayMaxEvents={false}
          moreLinkClick="popover"
          eventDisplay="background"
          dayCellClassNames="border border-gray-200"
          dayHeaderClassNames="bg-gray-50 text-gray-700 font-medium py-2"
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