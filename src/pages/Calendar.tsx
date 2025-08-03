import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking } from '@/api/dataHooks';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

// CORRECTED: Simplified booking sources with correct colors
const SOURCE_COLORS = {
  airbnb: '#FF5A5F',      // Airbnb red
  'booking.com': '#003580', // Booking.com blue  
  manual: '#F59E0B',      // Yellow for manual bookings
  web: '#F59E0B'          // Yellow for web bookings (same as manual)
};

const Calendar: React.FC = () => {
  const { currentProperty } = useApp();
  const { data: bookings = [] } = useBookings(currentProperty?.id || '');
  const createBooking = useCreateBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  // Transform bookings into calendar events with correct colors
  const events = React.useMemo(() => {
    return bookings.map(booking => {
      const sourceColor = SOURCE_COLORS[booking.source as keyof typeof SOURCE_COLORS] || '#6B7280';
      
      return {
        id: booking.id,
        title: booking.source === 'airbnb' ? 'Airbnb' : 
               booking.source === 'booking.com' ? 'Booking.com' : 'Website',
        start: booking.start_date, // ✅ NO DATE MODIFICATION
        end: booking.end_date,     // ✅ NO DATE MODIFICATION  
        backgroundColor: sourceColor,
        borderColor: sourceColor,
        textColor: '#FFFFFF',
        display: 'block',
        extendedProps: {
          source: booking.source
        }
      };
    });
  }, [bookings]);

  // Check if a date range overlaps with existing bookings
  const isDateRangeBooked = (start: Date, end: Date) => {
    return bookings.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      // Check if the selected range overlaps with any existing booking
      return (start < bookingEnd && end > bookingStart);
    });
  };

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start;
    const end = selectInfo.end; // ✅ FIXED: No day subtraction!
    
    // Check if any part of the selected range is already booked
    if (isDateRangeBooked(start, end)) {
      // Don't open modal if dates are already booked
      return;
    }
    
    setSelectedDates({ start, end });
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentProperty.name}</h1>
        <p className="text-gray-600">Manage your bookings and availability</p>
      </div>

      {/* Simplified Legend with correct colors */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
            <div 
              className="w-4 h-4 rounded-full mr-3 shadow-sm" 
              style={{ backgroundColor: SOURCE_COLORS.airbnb }}
            ></div>
            <span className="text-sm font-medium text-gray-800">Airbnb</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
            <div 
              className="w-4 h-4 rounded-full mr-3 shadow-sm" 
              style={{ backgroundColor: SOURCE_COLORS['booking.com'] }}
            ></div>
            <span className="text-sm font-medium text-gray-800">Booking.com</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
            <div 
              className="w-4 h-4 rounded-full mr-3 shadow-sm" 
              style={{ backgroundColor: SOURCE_COLORS.manual }}
            ></div>
            <span className="text-sm font-medium text-gray-800">Website</span>
          </div>
        </div>
      </div>

      {/* Enhanced Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <style jsx global>{`
          .fc {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          
          .fc-header-toolbar {
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;
          }
          
          .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: #1e293b;
          }
          
          .fc-button {
            border: none !important;
            background: #3b82f6 !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.5rem 1rem !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          }
          
          .fc-button:hover {
            background: #2563eb !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px 0 rgba(59, 130, 246, 0.4) !important;
          }
          
          .fc-button:disabled {
            background: #94a3b8 !important;
            transform: none !important;
            box-shadow: none !important;
          }
          
          .fc-daygrid-day {
            border: 1px solid #f1f5f9 !important;
            transition: background-color 0.2s ease;
          }
          
          .fc-daygrid-day:hover {
            background-color: #f8fafc !important;
          }
          
          .fc-daygrid-day-top {
            padding: 0.5rem;
          }
          
          .fc-day-today {
            background-color: #dbeafe !important;
            border-color: #3b82f6 !important;
          }
          
          .fc-col-header-cell {
            background: #f8fafc;
            border-color: #e2e8f0 !important;
            font-weight: 600;
            color: #475569;
            padding: 0.75rem 0;
          }
          
          .fc-event {
            border-radius: 0.5rem !important;
            border: none !important;
            margin: 2px !important;
            padding: 0.25rem 0.5rem !important;
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }
          
          .fc-event:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15) !important;
          }
          
          .fc-event-title {
            font-weight: 500 !important;
          }
          
          .fc-daygrid-event-harness {
            margin: 1px 2px;
          }
          
          .fc-daygrid-body {
            border-color: #f1f5f9 !important;
          }
          
          .fc-scrollgrid {
            border-color: #e2e8f0 !important;
          }
          
          .fc-daygrid-day-frame {
            min-height: 4rem;
          }
        `}</style>
        
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
            right: '' // Remove the view selector buttons
          }}
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayHeaderFormat={{ weekday: 'short' }}
          buttonText={{
            today: 'Today',
            prev: '',
            next: ''
          }}
          buttonIcons={{
            prev: 'chevron-left',
            next: 'chevron-right'
          }}
          selectConstraint={{
            // This will be handled by our custom logic in handleDateSelect
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