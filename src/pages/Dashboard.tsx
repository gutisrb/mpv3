import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProperties, useBookings } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import { useApp } from '@/context/AppContext';

const PropertyCard: React.FC<{ property: any }> = ({ property }) => {
  const navigate = useNavigate();
  const { setLocation, setProperty } = useApp();
  const { data: bookings = [] } = useBookings(property.id);

  // Calculate active bookings in next 30 days
  const activeBookings = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return bookings.filter(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      return startDate <= thirtyDaysFromNow && endDate >= now;
    }).length;
  }, [bookings]);

  const handleViewCalendar = () => {
    // Set the location and property in context
    setLocation({ id: property.location, name: property.location });
    setProperty({ id: property.id, name: property.name, location: property.location });
    navigate('/calendar');
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
            <div className="flex items-center text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Airbnb</span>
          <div className="flex items-center">
            {property.airbnb_ical ? (
              <>
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-400">Not Connected</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Booking.com</span>
          <div className="flex items-center">
            {property.booking_ical ? (
              <>
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-400">Not Connected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Bookings */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Active Bookings (30d)</span>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-lg font-semibold text-gray-900">{activeBookings}</span>
          </div>
        </div>
      </div>

      {/* View Calendar Button */}
      <button
        onClick={handleViewCalendar}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        View Calendar
      </button>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { data: properties = [], isLoading } = useProperties();
  const { currentLocation } = useApp();

  // Filter properties by current location if one is selected
  const filteredProperties = React.useMemo(() => {
    if (!currentLocation) return properties;
    return properties.filter(property => property.location === currentLocation.id);
  }, [properties, currentLocation]);

  // Show loading state while checking client or loading properties
  if (isLoadingClient || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {isLoadingClient ? 'Checking account...' : 'Loading properties...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if client lookup fails
  if (clientError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Setup Required</h3>
          <p className="text-gray-500 mb-4">{clientError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentLocation ? `Properties in ${currentLocation.name}` : 'All Properties'}
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your property portfolio and bookings
        </p>
      </div>

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentLocation ? 'No properties in this location' : 'No properties yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {currentLocation 
              ? 'Try selecting a different location or add a new property.'
              : 'Get started by adding your first property to manage.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;