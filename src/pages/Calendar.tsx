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

const SOURCE_COLORS: Record<string, string> = {
  airbnb: "#FF5A5F",
  booking: "#003580",
  direct: "#22c55e",
};

function getSourceColor(source: string) {
  if (!source) return "#64748b";
  const key = source.toLowerCase();
  if (key.includes("airbnb")) return SOURCE_COLORS.airbnb;
  if (key.includes("booking")) return SOURCE_COLORS.booking;
  if (key.includes("direct")) return SOURCE_COLORS.direct;
  return "#64748b";
}

const CalendarPage: React.FC = () => {
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("bookings")
      .select("id,start_date,end_date,source")
      .eq("property_id", propertyId)
      .then(({ data, error }) => {
        if (error || !data) {
          setEvents([]);
        } else {
          setEvents(
            data.map((b: Booking) => ({
              id: b.id,
              title: b.source,
              start: b.start_date,
              end: b.end_date,
              backgroundColor: getSourceColor(b.source),
              borderColor: getSourceColor(b.source),
              textColor: "#fff",
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
          Please select a property to view its calendar.
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