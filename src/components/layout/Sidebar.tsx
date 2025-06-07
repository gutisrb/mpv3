import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
  { to: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
  { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col fixed lg:relative z-30">
      {/* Top: Brand */}
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <span className="text-2xl mr-2">🏠</span>
        <span className="font-bold text-lg">Channel Manager</span>
      </div>
      {/* Menu */}
      <nav className="flex-1 px-2 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Bottom: Settings */}
      <div className="mt-auto px-2 pb-6">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings size={20} className="mr-3" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;