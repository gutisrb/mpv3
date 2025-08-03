import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '@/context/AppContext';
import { useBookings, useCreateBooking } from '@/api/dataHooks';
import BookingModal from '@/components/calendar/BookingModal';
import { Plus } from 'lucide-react';

const Calendar: React.FC = () => {
  const { currentProperty } = useApp();
  const { data: bookings = [] } = useBookings(currentProperty?.id || '');
  const createBooking = useCreateBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  const getBookingDetails = (source: any) => {
    const cleanSource = String(source || '').toLowerCase().trim();
    
    if (cleanSource === 'airbnb') {
      return { color: '#FF5A5F', title: 'Airbnb' };
    }
    
    if (cleanSource === 'booking.com') {
      return { color: '#003580', title: 'Booking.com' };
    }
    
    if (cleanSource === 'manual' || cleanSource === 'web' || cleanSource === 'website') {
      return { color: '#F59E0B', title: 'Website' };
    }
    
    return { color: '#6B7280', title: `${cleanSource || 'Unknown'}` };
  };

  const events = React.useMemo(() => {
    return bookings.map((booking) => {
      const details = getBookingDetails(booking.source);
      
      // Add one day to end for FullCalendar
      const endDate = new Date(booking.end_date);
      endDate.setDate(endDate.getDate() + 1);
      
      return {
        id: booking.id,
        title: details.title,
        start: booking.start_date,
        end: endDate.toISOString().split('T')[0],
        backgroundColor: details.color,
        borderColor: details.color,
        textColor: '#FFFFFF',
        display: 'background',
        extendedProps: {
          source: booking.source
        }
      };
    });
  }, [bookings]);

  const isDateRangeBooked = (start: Date, end: Date) => {
    return bookings.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return (start < bookingEnd && end > bookingStart);
    });
  };

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start;
    const end = selectInfo.end;
    
    if (isDateRangeBooked(start, end)) {
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
    
    // TEMPORARY FIX: Use a hardcoded UUID that exists in your database
    // Replace this with your actual user UUID from the clients table
    const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'; // Update this to a real UUID from your clients table
    
    try {
      await createBooking.mutateAsync({
        property_id: currentProperty.id,
        user_id: TEMP_USER_ID,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        source: 'manual'
      });
    } catch (error) {
      console.error('Booking creation failed:', error);
      // Try without user_id as fallback
      await createBooking.mutateAsync({
        property_id: currentProperty.id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        source: 'manual'
      });
    }
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

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#FF5A5F' }}></div>
            <span className="text-sm font-medium text-gray-800">Airbnb</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#003580' }}></div>
            <span className="text-sm font-medium text-gray-800">Booking.com</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-sm font-medium text-gray-800">Website</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
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
          
          .fc-daygrid-day {
            border: 1px solid #f1f5f9 !important;
            transition: background-color 0.2s ease;
            position: relative;
          }
          
          .fc-daygrid-day-number {
            position: relative !important;
            z-index: 3 !important;
            color: #1f2937 !important;
            font-weight: 600 !important;
            text-shadow: 0 0 3px rgba(255, 255, 255, 0.8) !important;
          }
          
          .fc-bg-event {
            opacity: 0.8 !important;
            border: none !important;
          }
          
          .fc-event-title {
            position: absolute !important;
            bottom: 2px !important;
            left: 2px !important;
            right: 2px !important;
            font-size: 0.7rem !important;
            font-weight: 600 !important;
            text-align: center !important;
            color: white !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
            z-index: 4 !important;
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
            right: ''
          }}
          dayMaxEvents={false}
          moreLinkClick="popover"
          eventDisplay="background"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayHeaderFormat={{ weekday: 'short' }}
          buttonText={{
            today: 'Today'
          }}
          buttonIcons={{
            prev: 'chevron-left',
            next: 'chevron-right'
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