import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import Calendar from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Properties from '@/pages/Properties';
import PropertyDetail from '@/pages/PropertyDetail';
import Locations from '@/pages/Locations';
import LocationDetail from '@/pages/LocationDetail';
import { AppProvider } from '@/context/AppContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <HashRouter>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/locations/:location" element={<LocationDetail />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}