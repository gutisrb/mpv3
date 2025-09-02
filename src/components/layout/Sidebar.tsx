import React from 'react';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded-md ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`;

const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 border-r bg-white p-4 space-y-2">
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to="/calendar"  className={linkClass}>Calendar</NavLink>
      <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
      <NavLink to="/settings"  className={linkClass}>Settings</NavLink>
    </aside>
  );
};

export default Sidebar;
