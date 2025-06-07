import React, { useEffect, useState } from "react";
import MetricCard from "@/components/MetricCard";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/api/supabaseClient";

interface PropertyMetrics {
  conflicts: number;
}

const AnalyticsPage: React.FC = () => {
  const { currentLocation, currentProperty } = useApp();
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLocation) return;
      setLoading(true);

      // Count bookings for the location (all properties in location)
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("location_id", currentLocation.id);

      setTotalBookings(typeof count === "number" ? count : 0);

      // If a property is selected, fetch conflicts for that property
      if (currentProperty) {
        const { data, error: err2 } = await supabase.rpc("fn_property_metrics", {
          p_property: currentProperty.id,
        });
        setConflicts(data && data[0] ? data[0].conflicts : 0);
      } else {
        setConflicts(null);
      }

      setLoading(false);
    };

    fetchData();
  }, [currentLocation, currentProperty]);

  if (!currentLocation) {
    return (
      <div className="p-6 flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-1 items-center justify-center">
          <span className="text-lg text-gray-500 dark:text-gray-300">
            Pick a location to view analytics
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
      <div className="max-w-xs mx-auto mt-12 flex flex-col gap-6">
        <MetricCard
          title={
            currentProperty
              ? "Property bookings (all time)"
              : "Total bookings (all properties)"
          }
          value={
            totalBookings !== null
              ? totalBookings.toString()
              : "—"
          }
          loading={loading}
        />
        {currentProperty && (
          <MetricCard
            title="Conflicts"
            value={conflicts !== null ? conflicts.toString() : "—"}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;