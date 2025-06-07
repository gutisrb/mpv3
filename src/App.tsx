import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import PropertyDetail from './pages/PropertyDetail';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

// Create a client
const queryClient = new QueryClient();

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex h-screen">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex flex-col">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/locations/:location" element={<LocationDetail />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </HashRouter>ter>
    </QueryClientProvider>
  );
}

export default App;