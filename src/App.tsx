import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import PropertyDetail from './pages/PropertyDetail';

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
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header toggleSidebar={toggleSidebar} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/locations/:location" element={<LocationDetail />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;