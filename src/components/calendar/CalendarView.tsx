import React, { useState, useMemo } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { motion } from 'framer-motion';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Booking } from '../../api/dataHooks';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface CalendarViewProps {
  bookings: Booking[];
  onSelectSlot: (start: Date, end: Date) => void;
  onSelectEvent?: (bookingId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onSelectSlot, onSelectEvent }) => {
  const [view, setView] = useState(Views.MONTH);
  
  // Transform bookings into events for the calendar
  const events = useMemo(() => {
    return bookings.map(booking => {
      // Determine color based on booking source
      let backgroundColor;
      switch (booking.source) {
        case 'airbnb':
          backgroundColor = '#3182ce'; // blue
          break;
        case 'booking.com':
          backgroundColor = '#38a169'; // green
          break;
        case 'manual':
          backgroundColor = '#718096'; // gray
          break;
        case 'web':
          backgroundColor = '#ed8936'; // orange
          break;
        default:
          backgroundColor = '#718096'; // default gray
      }
      
      return {
        id: booking.id,
        title: `${booking.source.charAt(0).toUpperCase() + booking.source.slice(1)}`,
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        backgroundColor,
        source: booking.source,
      };
    });
  }, [bookings]);
  
  // Custom event styling
  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block',
      },
    };
  };
  
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    onSelectSlot(start, end);
  };
  
  const handleSelectEvent = (event: any) => {
    if (onSelectEvent) {
      onSelectEvent(event.id);
    }
  };
  
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-md p-4 h-[600px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        defaultView={Views.MONTH}
        view={view}
        onView={setView}
        eventPropGetter={eventStyleGetter}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        popup
        components={{
          toolbar: CustomToolbar,
        }}
      />
    </motion.div>
  );
};

// Custom toolbar component
const CustomToolbar = (props: any) => {
  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    props.onNavigate(action);
  };
  
  const viewNames = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
  };
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <button
          type="button"
          onClick={() => navigate('TODAY')}
          className="px-4 py-2 mr-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => navigate('PREV')}
          className="px-3 py-2 mr-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={() => navigate('NEXT')}
          className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          &gt;
        </button>
      </div>
      
      <span className="text-xl font-semibold">
        {format(props.date, 'MMMM yyyy')}
      </span>
      
      <div className="flex space-x-2">
        {Object.entries(viewNames).map(([viewName, label]) => (
          <button
            key={viewName}
            type="button"
            onClick={() => props.onView(viewName)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              props.view === viewName
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;