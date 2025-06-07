import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/api/supabaseClient";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  source: string;
}

const CalendarPage: React.FC = () => {
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    supabase
      .from("bookings")
      .select("id,start_date,end_date,source")
      .eq("property_id", propertyId)
      .then(({ data, error }) => {
        if (error) {
          setEvents([]);
        } else if (data) {
          setEvents(
            data.map((b: Booking) => ({
              id: b.id,
              title: b.source,
              start: b.start_date,
              end: b.end_date,
            }))
          );
        }
        setLoading(false);
      });
  }, [propertyId]);

  if (!propertyId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <span className="text-lg text-gray-500 dark:text-gray-300">
          Pick a property first
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay",
          }}
          themeSystem="standard"
        />
      </div>
    </div>
  );
};

export default CalendarPage;