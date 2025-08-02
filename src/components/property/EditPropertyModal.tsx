// Create this as src/components/property/EditPropertyModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUpdateProperty } from '../../api/dataHooks';
import PropertyForm from './PropertyForm';
import type { Property } from '../../api/dataHooks';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ 
  isOpen, 
  onClose, 
  property 
}) => {
  const [error, setError] = useState<string | null>(null);
  const updateProperty = useUpdateProperty();
  
  const handleSubmit = async (data: {
    name: string;
    location: string;
    airbnb_ical?: string;
    booking_ical?: string;
  }) => {
    setError(null);

    try {
      await updateProperty.mutateAsync({
        propertyId: property.id,
        updates: {
          name: data.name,
          location: data.location,
          airbnb_ical: data.airbnb_ical || null,
          booking_ical: data.booking_ical || null,
        }
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Edit Property</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <PropertyForm
                  onSubmit={handleSubmit}
                  isSubmitting={updateProperty.isPending}
                  initialData={{
                    name: property.name,
                    location: property.location,
                    airbnb_ical: property.airbnb_ical || '',
                    booking_ical: property.booking_ical || '',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPropertyModal;