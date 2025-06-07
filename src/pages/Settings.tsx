import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/api/supabaseClient';

const SettingsPage: React.FC = () => {
  const { locations, properties } = useApp();

  // Modal state
  const [showLocModal, setShowLocModal] = useState(false);
  const [showPropModal, setShowPropModal] = useState(false);

  // Location form
  const [locName, setLocName] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // Property form
  const [propName, setPropName] = useState('');
  const [propLocId, setPropLocId] = useState('');
  const [airbnbIcal, setAirbnbIcal] = useState('');
  const [bookingIcal, setBookingIcal] = useState('');
  const [propLoading, setPropLoading] = useState(false);

  // Refresh helpers
  const refreshLocations = async () => {
    await supabase.from('locations').select('*');
  };
  const refreshProperties = async () => {
    await supabase.from('properties').select('*');
  };

  // Add Location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;
    setLocLoading(true);
    const { error } = await supabase.from('locations').insert({ name: locName.trim() });
    setLocLoading(false);
    if (!error) {
      setShowLocModal(false);
      setLocName('');
      refreshLocations();
    }
  };

  // Add Property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim() || !propLocId) return;
    setPropLoading(true);
    const insertObj: any = {
      name: propName.trim(),
      location_id: propLocId,
    };
    if (airbnbIcal.trim()) insertObj.airbnb_ical = airbnbIcal.trim();
    if (bookingIcal.trim()) insertObj.booking_ical = bookingIcal.trim();
    const { error } = await supabase.from('properties').insert(insertObj);
    setPropLoading(false);
    if (!error) {
      setShowPropModal(false);
      setPropName('');
      setPropLocId('');
      setAirbnbIcal('');
      setBookingIcal('');
      refreshProperties();
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
      {/* Locations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Locations</h2>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            type="button"
            onClick={() => setShowLocModal(true)}
          >
            + Add
          </button>
        </div>
        <ul className="list-disc pl-6 space-y-1">
          {locations.length === 0 ? (
            <li className="text-gray-500 dark:text-gray-400">No locations</li>
          ) : (
            locations.map(loc => (
              <li key={loc.id} className="text-gray-800 dark:text-gray-100">{loc.name}</li>
            ))
          )}
        </ul>
      </div>
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
        <ul className="list-disc pl-6 space-y-1">
          {properties.length === 0 ? (
            <li className="text-gray-500 dark:text-gray-400">No properties</li>
          ) : (
            properties.map(prop => (
              <li key={prop.id} className="text-gray-800 dark:text-gray-100">{prop.name}</li>
            ))
          )}
        </ul>
      </div>

      {/* Add Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-xs shadow"
            onSubmit={handleAddLocation}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Location</h3>
            <input
              className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Location name"
              value={locName}
              onChange={e => setLocName(e.target.value)}
              required
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                onClick={() => setShowLocModal(false)}
                disabled={locLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                disabled={locLoading}
              >
                {locLoading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

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
            <select
              className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              value={propLocId}
              onChange={e => setPropLocId(e.target.value)}
              required
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
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