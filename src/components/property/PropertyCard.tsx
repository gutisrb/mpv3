import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Property } from '../../api/dataHooks';

interface PropertyCardProps {
  property: Property;
  gapCount: number;
  nightsBooked: number;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, gapCount, nightsBooked }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">{property.name}</h3>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin size={16} className="mr-1" />
                <span className="text-sm">{property.location}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 p-3 rounded-xl">
            <div className="text-sm text-gray-500">Nights Booked (30d)</div>
            <div className="text-xl font-semibold mt-1">{nightsBooked}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <div className="text-sm text-gray-500">Open Gaps (30d)</div>
            <div className="text-xl font-semibold mt-1">{gapCount}</div>
          </div>
        </div>
        
        <Link
          to={`/properties/${property.id}`}
          className="mt-6 block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
        >
          View Calendar
        </Link>
      </div>
    </motion.div>
  );
};

export default PropertyCard;