import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProperties } from '../api/dataHooks';
import { useClientId } from '../api/useClientId';
import PropertyTable from '../components/property/PropertyTable';

const LocationDetail: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { location } = useParams<{ location: string }>();
  const { data: allProperties, isLoading } = useProperties();
  
  // Filter properties for this location
  const properties = React.useMemo(() => {
    if (!allProperties || !location) return [];
    return allProperties.filter(p => p.location === decodeURIComponent(location));
  }, [allProperties, location]);
  
  // Calculate gap counts (placeholder implementation)
  const gapCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(property => {
      counts[property.id] = 0; // This would be calculated properly in a real implementation
    });
    return counts;
  }, [properties]);
  
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
            <ArrowLeft className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Setup Required</h3>
          <p className="text-gray-500 mb-4">{clientError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          to="/locations"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Locations
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Properties in {decodeURIComponent(location || '')}
        </h1>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PropertyTable properties={properties} gapCounts={gapCounts} />
      </motion.div>
    </div>
  );
};

export default LocationDetail;