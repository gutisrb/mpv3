import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header  from '@/components/layout/Header';

import Dashboard from '@/pages/Dashboard';
import Calendar  from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import Settings  from '@/pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar"  element={<Calendar  />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings"  element={<Settings />} />
              <Route path="*"          element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}