import React from 'react';
import { useApp } from '@/context/AppContext';
import { useClientId } from '@/api/useClientId';
import { ChevronDown, User } from 'lucide-react';

const Header: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const {
    locations,
    properties,
    currentLocation,
    currentProperty,
    setLocation,
    setProperty,
  } = useApp();

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value;
    const location = locations.find(l => l.id === locationId) || null;
    setLocation(location);
    setProperty(null); // Reset property when location changes
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    const property = properties.find(p => p.id === propertyId) || null;
    setProperty(property);
  };

  // Show loading state while checking client
  if (isLoadingClient) {
    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-center px-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </header>
    );
  }

  // Show error state if client lookup fails
  if (clientError) {
    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-red-600 text-sm">{clientError.message}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - empty for now */}
      <div></div>

      {/* Center - Location and Property dropdowns */}
      <div className="flex items-center space-x-4">
        {/* Location Dropdown */}
        <div className="relative">
          <select
            value={currentLocation?.id || ''}
            onChange={handleLocationChange}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Property Dropdown */}
        <div className="relative">
          <select
            value={currentProperty?.id || ''}
            onChange={handlePropertyChange}
            disabled={!currentLocation}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Right side - User avatar */}
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </header>
  );
};

export default Header;