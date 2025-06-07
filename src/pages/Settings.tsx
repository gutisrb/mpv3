import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/layout/Header';

const SettingsPage: React.FC = () => (
  <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
    <Sidebar />
    <main className="flex-1 flex flex-col">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Add / remove properties coming soon.
        </p>
      </div>
    </main>
  </div>
);

export default SettingsPage;