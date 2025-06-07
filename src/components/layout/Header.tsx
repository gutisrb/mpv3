import React, { useState, useEffect } from 'react';
import { useApp } from "@/context/AppContext";

const LOCATIONS = [
  { name: 'Belgrade', properties: ['Knez Mihailova', 'Dorcol Loft'] },
  { name: 'Novi Sad', properties: ['Petrovaradin Flat', 'City Center Studio'] },
  { name: 'Zlatibor', properties: ['Mountain View'] },
];

const AVATAR_PLACEHOLDER =
  'https://ui-avatars.com/api/?name=User&background=64748b&color=fff&rounded=true';

const Header: React.FC = () => {
  const { location: contextLocation, property: contextProperty, setLocation, setProperty } = useApp();

  // Local state to avoid controlled/uncontrolled warning if context is async
  const [selectedLocation, setSelectedLocation] = useState(contextLocation || LOCATIONS[0].name);
  const [selectedProperty, setSelectedProperty] = useState(contextProperty || '');

  // Sync with context
  useEffect(() => {
    setSelectedLocation(contextLocation || LOCATIONS[0].name);
  }, [contextLocation]);
  useEffect(() => {
    setSelectedProperty(contextProperty || '');
  }, [contextProperty]);

  // Get properties for selected location
  const properties =
    LOCATIONS.find((loc) => loc.name === selectedLocation)?.properties || [];

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    setSelectedLocation(loc);
    setLocation(loc);
    // If current property not in new location, clear property
    if (!LOCATIONS.find((l) => l.name === loc)?.properties.includes(selectedProperty)) {
      setSelectedProperty('');
      setProperty('');
    }
  };

  // Handle property change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prop = e.target.value;
    setSelectedProperty(prop);
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
            {LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
          {/* Property Picker */}
          <select
            className="rounded px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none"
            value={selectedProperty}
            onChange={handlePropertyChange}
          >
            <option value="">Select property</option>
            {properties.map((prop) => (
              <option key={prop} value={prop}>
                {prop}
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