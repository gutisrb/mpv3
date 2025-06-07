import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, X } from 'lucide-react';
import { useCreateProperty } from '../../api/dataHooks';
import PropertyForm from './PropertyForm';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const createProperty = useCreateProperty();
  
  const handleSubmit = async (data: {
    name: string;
    location: string;
    airbnb_ical?: string;
    booking_ical?: string;
  }) => {
    setError(null);

    try {
      await createProperty.mutateAsync(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-96"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Add New Property</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <PropertyForm
                  onSubmit={handleSubmit}
                  isSubmitting={createProperty.isPending}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddPropertyModal;