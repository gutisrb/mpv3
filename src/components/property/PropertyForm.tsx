import React from 'react';
import { Building2, MapPin } from 'lucide-react';

interface PropertyFormProps {
  onSubmit: (data: {
    name: string;
    location: string;
    airbnb_ical?: string;
    booking_ical?: string;
  }) => void;
  isSubmitting?: boolean;
  submitButtonText?: string; // Add this line
  initialData?: {
    name?: string;
    location?: string;
    airbnb_ical?: string;
    booking_ical?: string;
  };
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Create Property', // Add this line with default
  initialData = {}
}) => {
  const [name, setName] = React.useState(initialData.name || '');
  const [location, setLocation] = React.useState(initialData.location || '');
  const [airbnbIcal, setAirbnbIcal] = React.useState(initialData.airbnb_ical || '');
  const [bookingIcal, setBookingIcal] = React.useState(initialData.booking_ical || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      location,
      airbnb_ical: airbnbIcal,
      booking_ical: bookingIcal
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Property Name*
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location*
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="airbnb-ical" className="block text-sm font-medium text-gray-700 mb-1">
          Airbnb iCal URL
        </label>
        <input
          type="url"
          id="airbnb-ical"
          value={airbnbIcal}
          onChange={(e) => setAirbnbIcal(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://www.airbnb.com/calendar/ical/..."
        />
      </div>

      <div>
        <label htmlFor="booking-ical" className="block text-sm font-medium text-gray-700 mb-1">
          Booking.com iCal URL
        </label>
        <input
          type="url"
          id="booking-ical"
          value={bookingIcal}
          onChange={(e) => setBookingIcal(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://admin.booking.com/calendar.ical?..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Property'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;