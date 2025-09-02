import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Plus } from 'lucide-react';
import { useProperties } from '../api/dataHooks';
import { useClientId } from '../api/useClientId';
import AddPropertyModal from '../components/property/AddPropertyModal';

const LocationCard: React.FC<{ location: string; count: number }> = ({ location, count }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      className="w-60 h-32 bg-white rounded-xl shadow-md flex flex-col items-center justify-center text-lg font-semibold hover:shadow-lg cursor-pointer transition-shadow"
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/locations/${encodeURIComponent(location)}`)}
    >
      <div className="flex items-center mb-2">
        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
        <span>{location}</span>
      </div>
      <span className="text-sm text-gray-500">{count} properties</span>
    </motion.div>
  );
};

const Locations: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { data: properties, isLoading } = useProperties();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Group properties by location
  const locationGroups = React.useMemo(() => {
    if (!properties) return {};
    
    return properties.reduce((acc, property) => {
      const location = property.location;
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);
  }, [properties]);
  
  // Show loading state while checking client or loading properties
  if (isLoadingClient || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {isLoadingClient ? 'Checking account...' : 'Loading locations...'}
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
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Setup Required</h3>
          <p className="text-gray-500 mb-4">{clientError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add Property
        </button>
      </div>
      
      {Object.keys(locationGroups).length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Object.entries(locationGroups).map(([location, properties]) => (
            <LocationCard
              key={location}
              location={location}
              count={properties.length}
            />
          ))}
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-md mx-auto">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No locations yet</h3>
          <p className="mt-2 text-gray-500">
            Add some properties to start organizing by location.
          </p>
        </div>
      )}
      
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Locations;