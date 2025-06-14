import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

interface Property {
  id: string;
  name: string;
  location: string;
  airbnb_ical?: string;
  booking_ical?: string;
}

const SettingsPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showPropModal, setShowPropModal] = useState(false);

  // Property form
  const [propName, setPropName] = useState('');
  const [propLocation, setPropLocation] = useState('');
  const [airbnbIcal, setAirbnbIcal] = useState('');
  const [bookingIcal, setBookingIcal] = useState('');
  const [propLoading, setPropLoading] = useState(false);

  // Fetch properties
  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id,name,location,airbnb_ical,booking_ical');
    if (!error && data) setProperties(data as Property[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Add Property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim() || !propLocation.trim()) return;
    setPropLoading(true);
    const insertObj: any = {
      name: propName.trim(),
      location: propLocation.trim(),
    };
    if (airbnbIcal.trim()) insertObj.airbnb_ical = airbnbIcal.trim();
    if (bookingIcal.trim()) insertObj.booking_ical = bookingIcal.trim();
    const { error } = await supabase.from('properties').insert(insertObj);
    setPropLoading(false);
    if (!error) {
      setShowPropModal(false);
      setPropName('');
      setPropLocation('');
      setAirbnbIcal('');
      setBookingIcal('');
      fetchProperties();
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
      {/* Properties */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Properties</h2>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            type="button"
            onClick={() => setShowPropModal(true)}
          >
            + Add
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ul className="list-disc pl-6 space-y-1">
            {properties.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400">No properties</li>
            ) : (
              properties.map(prop => (
                <li key={prop.id} className="text-gray-800 dark:text-gray-100">
                  <div className="font-semibold">{prop.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Location: {prop.location}</div>
                  {prop.airbnb_ical && (
                    <div className="text-xs text-blue-700 dark:text-blue-300 break-all">
                      Airbnb iCal: <a href={prop.airbnb_ical} target="_blank" rel="noopener noreferrer" className="underline">{prop.airbnb_ical}</a>
                    </div>
                  )}
                  {prop.booking_ical && (
                    <div className="text-xs text-blue-700 dark:text-blue-300 break-all">
                      Booking.com iCal: <a href={prop.booking_ical} target="_blank" rel="noopener noreferrer" className="underline">{prop.booking_ical}</a>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Add Property Modal */}
      {showPropModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow"
            onSubmit={handleAddProperty}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Property</h3>
            <input
              className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Property name"
              value={propName}
              onChange={e => setPropName(e.target.value)}
              required
              autoFocus
            />
            <input
              className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Location"
              value={propLocation}
              onChange={e => setPropLocation(e.target.value)}
              required
            />
            <input
              className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Airbnb iCal link (optional)"
              value={airbnbIcal}
              onChange={e => setAirbnbIcal(e.target.value)}
              type="url"
            />
            <input
              className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Booking.com iCal link (optional)"
              value={bookingIcal}
              onChange={e => setBookingIcal(e.target.value)}
              type="url"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                onClick={() => setShowPropModal(false)}
                disabled={propLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                disabled={propLoading}
              >
                {propLoading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;