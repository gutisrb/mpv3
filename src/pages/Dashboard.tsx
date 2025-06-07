import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useApp } from "@/context/AppContext";
import MetricCard from "@/components/MetricCard";

interface PropertyMetrics {
  open_nights_30d: number;
  upcoming_checkins_7d: number;
  conflicts: number;
}

interface LargestGap {
  nights: number;
  start_date: string;
  end_date: string;
}

const Dashboard: React.FC = () => {
  const { currentProperty } = useApp();
  const propertyId = currentProperty?.id;
  const [metrics, setMetrics] = useState<PropertyMetrics | null>(null);
  const [gap, setGap] = useState<LargestGap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    Promise.all([
      supabase.rpc("fn_property_metrics", { p_property: propertyId }),
      supabase.rpc("fn_largest_gap", { p_property: propertyId }),
    ]).then(([metricsRes, gapRes]) => {
      setMetrics(metricsRes.data ? metricsRes.data[0] : null);
      setGap(gapRes.data ? gapRes.data[0] : null);
      setLoading(false);
      if (metricsRes.error) console.error(metricsRes.error);
      if (gapRes.error) console.error(gapRes.error);
    });
  }, [propertyId]);

  return (
    <main className="flex-1 p-8 bg-gray-50 dark:bg-slate-900">
      {metrics && metrics.conflicts > 0 && (
        <div className="mb-6 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg px-4 py-3 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>⚠️ {metrics.conflicts} conflicts</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <MetricCard
          title="Open Nights (30d)"
          value={metrics ? metrics.open_nights_30d?.toString() ?? "0" : "0"}
          loading={loading}
        />
        <MetricCard
          title="Upcoming Check-ins (7d)"
          value={metrics ? metrics.upcoming_checkins_7d?.toString() ?? "0" : "0"}
          loading={loading}
        />
        <MetricCard
          title="Biggest Gap"
          value={
            gap
              ? `${gap.nights ?? 0} nights\n${gap.start_date ? new Date(gap.start_date).toLocaleDateString() : ""} - ${gap.end_date ? new Date(gap.end_date).toLocaleDateString() : ""}`
              : "0 nights"
          }
          loading={loading}
        />
      </div>
    </main>
  );
};

export default Dashboard;