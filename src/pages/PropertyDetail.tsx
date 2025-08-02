// Replace your ENTIRE PropertyDetail.tsx file with this:

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Check, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProperty, useBookings, useCreateBooking, useDeleteBooking } from '../api/dataHooks';
import CalendarView from '../components/calendar/CalendarView';
import BookingModal from '../components/calendar/BookingModal';
import EditPropertyModal from '../components/property/EditPropertyModal';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading: isLoadingProperty } = useProperty(id || '');
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings(id || '');
  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const handleSelectSlot = (start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setIsModalOpen(true);
  };
  
  const handleCreateBooking = async (bookingData: {
    start_date: string;
    end_date: string;
    source: 'airbnb' | 'booking.com' | 'manual' | 'web';
  }) => {
    if (!id) return;
    
    try {
      await createBooking.mutateAsync({
        property_id: id,
        ...bookingData,
      });
    } catch (error) {
      throw error;
    }
  };
  
  const handleSelectEvent = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };
  
  const handleDeleteBooking = async () => {
    if (selectedBookingId) {
      await deleteBooking.mutateAsync(selectedBookingId);
      setSelectedBookingId(null);
    }
  };
  
  const channelLink = property ? `${import.meta.env.VITE_ICS_WEBHOOK_BASE || 'https://hook.eu2.make.com/1p4gelkvs573a5au5sngbc2jtlvmou9d'}?property_id=${property.id}&file=feed.ics` : '';
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(channelLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (isLoadingProperty) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">Property not found</h3>
          <p className="mt-2 text-gray-500">
            The property you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/properties"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            to="/properties"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Properties
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{property.name}</h1>
          <p className="text-gray-600">{property.location}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Edit Property
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Booking
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Channel Manager Integration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Website iCal Feed (Export to Airbnb & Booking.com)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={channelLink}
                readOnly
                className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                title="Copy link"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Copy this link and paste it into:
              <br />• Airbnb: Calendar → Sync → Import calendar
              <br />• Booking.com: Calendar → Sync calendars → Import
            </p>
          </div>
          
          {property?.airbnb_ical && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airbnb iCal URL (Import from Airbnb)
              </label>
              <input
                type="text"
                value={property.airbnb_ical}
                readOnly
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
              />
              <p className="mt-1 text-sm text-gray-500">
                This imports bookings FROM Airbnb TO your website
              </p>
            </div>
          )}
          
          {property?.booking_ical && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking.com iCal URL (Import from Booking.com)
              </label>
              <input
                type="text"
                value={property.booking_ical}
                readOnly
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
              />
              <p className="mt-1 text-sm text-gray-500">
                This imports bookings FROM Booking.com TO your website
              </p>
            </div>
          )}

          {!property?.airbnb_ical && !property?.booking_ical && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Missing iCal URLs:</strong> Click "Edit Property" above to add your Airbnb and Booking.com iCal URLs for automatic booking synchronization.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            Airbnb
          </div>
          <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>
            Booking.com
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg">
            <span className="w-3 h-3 bg-gray-600 rounded-full mr-2"></span>
            Manual
          </div>
          <div className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
            <span className="w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
            Web
          </div>
        </div>
        
        {isLoadingBookings ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <CalendarView 
            bookings={bookings} 
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete this booking?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBookingId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBooking}
        initialStartDate={selectedDates?.start}
        initialEndDate={selectedDates?.end}
      />

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={property}
      />
    </div>
  );
};

export default PropertyDetail;