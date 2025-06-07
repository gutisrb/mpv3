import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/Header";
import MetricCard from "@/components/MetricCard";
import { useApp } from "@/context/AppContext";

const AnalyticsPage: React.FC = () => {
  const { location, property } = useApp();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <TopBar />
        <div className="p-6 flex-1 flex flex-col">
          {!location ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-lg text-gray-500 dark:text-gray-300">
                Pick a location to view analytics
              </span>
            </div>
          ) : !property ? (
            <div className="max-w-xs mx-auto mt-12">
              <MetricCard title="Total bookings" value="—" />
            </div>
          ) : (
            <div className="max-w-xs mx-auto mt-12">
              <MetricCard title="Property bookings" value="—" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;