import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useApp } from "@/context/AppContext";

interface PropertyRow {
  id: string;
  name: string;
  location: string;
  airbnb_ical?: string;
  booking_ical?: string;
}

interface PropertyMetrics {
  open_nights_30d: number;
  total_nights_30d: number;
}

const Dashboard: React.FC = () => {
  const { setProperty } = useApp();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [metrics, setMetrics] = useState<Record<string, PropertyMetrics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("id,name,location,airbnb_ical,booking_ical");
      if (!error && data) {
        setProperties(data as PropertyRow[]);
        // Fetch metrics for each property
        const metricsResults = await Promise.all(
          data.map(async (prop: PropertyRow) => {
            const { data: metricData } = await supabase.rpc("fn_property_metrics", { p_property: prop.id });
            return {
              id: prop.id,
              open_nights_30d: metricData?.[0]?.open_nights_30d ?? 0,
              total_nights_30d: metricData?.[0]?.total_nights_30d ?? 30,
            };
          })
        );
        const metricsMap: Record<string, PropertyMetrics> = {};
        metricsResults.forEach((m) => {
          metricsMap[m.id] = {
            open_nights_30d: m.open_nights_30d,
            total_nights_30d: m.total_nights_30d,
          };
        });
        setMetrics(metricsMap);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  return (
    <main className="flex-1 p-8 bg-gray-50 dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Properties</h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col gap-2"
            >
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{prop.name}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                Location: {prop.location}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Airbnb iCal:{" "}
                {prop.airbnb_ical ? (
                  <a
                    href={prop.airbnb_ical}
                    className="underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {prop.airbnb_ical}
                  </a>
                ) : (
                  <span className="italic text-gray-400">None</span>
                )}
                <br />
                Booking.com iCal:{" "}
                {prop.booking_ical ? (
                  <a
                    href={prop.booking_ical}
                    className="underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {prop.booking_ical}
                  </a>
                ) : (
                  <span className="italic text-gray-400">None</span>
                )}
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Open nights (30d):{" "}
                  <span className="font-semibold">
                    {metrics[prop.id]?.open_nights_30d ?? "—"}
                  </span>
                  {" / "}
                  <span className="font-semibold">
                    {metrics[prop.id]?.total_nights_30d ?? "—"}
                  </span>
                </span>
              </div>
              <button
                className="mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                onClick={() => setProperty({ id: prop.id, name: prop.name })}
              >
                View Calendar
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Dashboard;