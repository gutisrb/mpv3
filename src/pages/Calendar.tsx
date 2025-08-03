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

  // SUPER DEFENSIVE COLOR AND TITLE MAPPING
  const getBookingDetails = (source: any) => {
    console.log('=== DEBUGGING BOOKING SOURCE ===');
    console.log('Raw source value:', source);
    console.log('Source type:', typeof source);
    console.log('Source length:', source?.length);
    console.log('Source JSON:', JSON.stringify(source));
    
    // Clean the source string
    const cleanSource = String(source || '').toLowerCase().trim();
    console.log('Cleaned source:', cleanSource);
    
    // Try multiple variations
    if (cleanSource === 'airbnb' || cleanSource === 'Airbnb' || cleanSource === 'AIRBNB') {
      console.log('✅ MATCHED AIRBNB - returning red');
      return { color: '#FF5A5F', title: 'Airbnb' };
    }
    
    if (cleanSource === 'booking.com' || cleanSource === 'Booking.com' || cleanSource === 'BOOKING.COM') {
      console.log('✅ MATCHED BOOKING.COM - returning blue');
      return { color: '#003580', title: 'Booking.com' };
    }
    
    if (cleanSource === 'manual' || cleanSource === 'Manual' || cleanSource === 'MANUAL' || 
        cleanSource === 'web' || cleanSource === 'Web' || cleanSource === 'WEB' ||
        cleanSource === 'website' || cleanSource === 'Website') {
      console.log('✅ MATCHED MANUAL/WEB - returning yellow');
      return { color: '#F59E0B', title: 'Website' };
    }
    
    console.log('❌ NO MATCH FOUND - returning gray');
    console.log('Available options to match: airbnb, booking.com, manual, web');
    return { color: '#6B7280', title: `Unknown (${cleanSource})` };
  };

  const events = React.useMemo(() => {
    console.log('=== PROCESSING ALL BOOKINGS ===');
    console.log('Total bookings:', bookings.length);
    
    // First, let's see ALL the raw data
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking.id,
        source: booking.source,
        start_date: booking.start_date,
        end_date: booking.end_date,
        all_fields: booking
      });
    });
    
    return bookings.map((booking, index) => {
      console.log(`\n--- Processing booking ${index + 1} (${booking.id}) ---`);
      
      const details = getBookingDetails(booking.source);
      
      // Add one day to end for FullCalendar
      const endDate = new Date(booking.end_date);
      endDate.setDate(endDate.getDate() + 1);
      
      const event = {
        id: booking.id,
        title: details.title,
        start: booking.start_date,
        end: endDate.toISOString().split('T')[0],
        backgroundColor: details.color,
        borderColor: details.color,
        textColor: '#FFFFFF',
        display: 'background',
        extendedProps: {
          source: booking.source,
          originalSource: booking.source
        }
      };
      
      console.log('Created event:', event);
      console.log('Applied color:', details.color);
      console.log('Applied title:', details.title);
      
      return event;
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
    
    await createBooking.mutateAsync({
      property_id: currentProperty.id,
      user_id: 'temp-user-id',
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      source: 'manual'
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

      {/* Debug info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">Debug Info (Check Console for Details)</h4>
        <p className="text-sm text-yellow-700">
          Total bookings: {bookings.length} | 
          Open browser console (F12) to see detailed source analysis
        </p>
        {bookings.length > 0 && (
          <div className="mt-2 text-xs text-yellow-600">
            Raw sources: {bookings.map(b => `"${b.source}"`).join(', ')}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#FF5A5F' }}></div>
            <span className="text-sm font-medium text-gray-800">Airbnb (#FF5A5F)</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#003580' }}></div>
            <span className="text-sm font-medium text-gray-800">Booking.com (#003580)</span>
          </div>
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-sm font-medium text-gray-800">Website (#F59E0B)</span>
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