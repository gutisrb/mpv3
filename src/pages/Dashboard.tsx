import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useApp } from "@/context/AppContext";
import MetricCard from "@/components/MetricCard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/Header";

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
  const { property: currentProperty } = useApp();
  const [metrics, setMetrics] = useState<PropertyMetrics | null>(null);
  const [gap, setGap] = useState<LargestGap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentProperty) {
        setMetrics(null);
        setGap(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [{ data: metricsData, error: metricsError }, { data: gapData, error: gapError }] =
        await Promise.all([
          supabase.rpc("fn_property_metrics", { property_id: currentProperty }),
          supabase.rpc("fn_largest_gap", { property_id: currentProperty }),
        ]);
      setMetrics(metricsData ? metricsData[0] : null);
      setGap(gapData ? gapData[0] : null);
      setLoading(false);
      if (metricsError) console.error(metricsError);
      if (gapError) console.error(gapError);
    };
    fetchMetrics();
  }, [currentProperty]);

  if (!currentProperty) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <span className="text-lg text-gray-500 dark:text-gray-300">
              Pick a property to see your stats
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
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
      </div>
    </div>
  );
};

export default Dashboard;