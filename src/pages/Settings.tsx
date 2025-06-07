import React from 'react';
import { useApp } from '@/context/AppContext';

const SettingsPage: React.FC = () => {
  const { locations, properties } = useApp();

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Locations</h2>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            type="button"
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
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Properties</h2>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            type="button"
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
    </div>
  );
};

export default SettingsPage;