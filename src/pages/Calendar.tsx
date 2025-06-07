import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/Header";
import { useApp } from "@/context/AppContext";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const LOCATIONS = [
  { name: "Belgrade", properties: ["Knez Mihailova", "Dorcol Loft"] },
  { name: "Novi Sad", properties: ["Petrovaradin Flat", "City Center Studio"] },
  { name: "Zlatibor", properties: ["Mountain View"] },
];

const CalendarPage: React.FC = () => {
  const { location, setLocation, property, setProperty } = useApp();

  const selectedLocation = location || LOCATIONS[0].name;
  const properties =
    LOCATIONS.find((loc) => loc.name === selectedLocation)?.properties || [];
  const selectedProperty = property || "";

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    setLocation(loc);
    if (!LOCATIONS.find((l) => l.name === loc)?.properties.includes(selectedProperty)) {
      setProperty("");
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProperty(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <TopBar />
        <div className="container mx-auto p-6 flex-1 flex flex-col">
          {!selectedProperty ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-lg text-gray-500 dark:text-gray-300">
                Pick a property first
              </span>
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-6">
                <select
                  className="rounded px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none"
                  value={selectedLocation}
                  onChange={handleLocationChange}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none"
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                >
                  <option value="">Select property</option>
                  {properties.map((prop) => (
                    <option key={prop} value={prop}>
                      {prop}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  height="auto"
                  events={[]}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,dayGridWeek,dayGridDay",
                  }}
                  themeSystem="standard"
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;