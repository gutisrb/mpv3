import React, { useState, useEffect } from 'react';
import { useApp } from "@/context/AppContext";

const AVATAR_PLACEHOLDER =
  'https://ui-avatars.com/api/?name=User&background=64748b&color=fff&rounded=true';

const Header: React.FC = () => {
  const {
    locations,
    properties,
    currentLocation,
    currentProperty,
    setLocation,
    setProperty,
  } = useApp();

  // Local state to avoid controlled/uncontrolled warning if context is async
  const [selectedLocation, setSelectedLocation] = useState(currentLocation?.id || '');
  const [selectedProperty, setSelectedProperty] = useState(currentProperty?.id || '');

  // Sync with context
  useEffect(() => {
    setSelectedLocation(currentLocation?.id || '');
  }, [currentLocation]);
  useEffect(() => {
    setSelectedProperty(currentProperty?.id || '');
  }, [currentProperty]);

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = locations.find(l => l.id === e.target.value) || null;
    setSelectedLocation(loc?.id || '');
    setLocation(loc);
    setProperty(null); // Reset property when location changes
  };

  // Handle property change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prop = properties.find(p => p.id === e.target.value) || null;
    setSelectedProperty(prop?.id || '');
    setProperty(prop);
  };

  return (
    <header className="sticky top-0 z-30 h-12 bg-white dark:bg-slate-800 shadow flex items-center px-4">
      {/* Left: Brand */}
      <div className="flex items-center min-w-[180px]">
        <span className="text-2xl mr-2">🏠</span>
        <span className="font-bold text-lg text-gray-800 dark:text-white">Channel Manager</span>
      </div>

      {/* Center: Pickers */}
      <div className="flex-1 flex justify-center">
        <div className="flex gap-4">
          {/* Location Picker */}
          <select
            className="rounded px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none"
            value={selectedLocation}
            onChange={handleLocationChange}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          {/* Property Picker */}
          <select
            className="rounded px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none"
            value={selectedProperty}
            onChange={handlePropertyChange}
            disabled={!currentLocation}
          >
            <option value="">Select property</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Avatar */}
      <div className="flex items-center min-w-[48px] justify-end">
        <img
          src={AVATAR_PLACEHOLDER}
          alt="User avatar"
          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700"
        />
      </div>
    </header>
  );
};

export default Header;