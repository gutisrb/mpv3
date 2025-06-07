import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProperties } from '../api/dataHooks';
import AddPropertyModal from '../components/property/AddPropertyModal';
import PropertyTable from '../components/property/PropertyTable';
import PropertyCard from '../components/property/PropertyCard';

const Properties: React.FC = () => {
  const { data: properties, isLoading } = useProperties();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Group and sort properties by location
  const groupedProperties = useMemo(() => {
    if (!properties) return {};
    
    // First sort by location, then by name
    const sorted = [...properties].sort((a, b) => {
      const locationCompare = a.location.localeCompare(b.location);
      if (locationCompare !== 0) return locationCompare;
      return a.name.localeCompare(b.name);
    });
    
    // Group by location
    const groups: Record<string, typeof properties> = {};
    sorted.forEach(property => {
      if (!groups[property.location]) {
        groups[property.location] = [];
      }
      groups[property.location].push(property);
    });
    
    return groups;
  }, [properties]);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Properties</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Add Property
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'table' 
                  ? 'bg-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      ) : properties && Object.keys(groupedProperties).length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'table' ? (
            <PropertyTable properties={properties} gapCounts={{}} />
          ) : (
            <div>
              {Object.entries(groupedProperties).map(([location, locationProperties]) => (
                <div key={location}>
                  <h3 className="text-xl font-semibold mt-6 sticky top-0 bg-gray-50 py-3 px-4 rounded-lg z-10">
                    {location}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {locationProperties.map(property => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        gapCount={0}
                        nightsBooked={0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus size={24} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No properties yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by adding your first property to manage.
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Property
          </button>
        </div>
      )}
      
      <AddPropertyModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Properties;