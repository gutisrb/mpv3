import React from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { Home, Calendar, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  
  // Determine the current page title based on the route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/properties') return 'Properties';
    if (path === '/locations') return 'Locations';
    if (path.startsWith('/locations/')) return 'Location Details';
    if (path.startsWith('/properties/')) return 'Property Details';
    return 'Channel Manager';
  };
  
  return (
    <motion.header 
      className="bg-white shadow-md px-4 py-3 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="flex items-center mr-6">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-800">Channel Manager</h1>
        </Link>
        <nav className="hidden md:flex space-x-2">
          <NavLink
            to="/locations"
            className={({ isActive }) =>
              `px-4 py-2 rounded transition-colors ${
                (isActive || location.pathname.startsWith('/locations/')) 
                  ? 'text-blue-600 font-semibold bg-blue-50' 
                  : 'hover:bg-gray-100'
              }`
            }
          >
            Locations
          </NavLink>
          <NavLink
            to="/properties"
            className={({ isActive }) =>
              `px-4 py-2 rounded transition-colors ${
                isActive ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:bg-gray-100'
              }`
            }
          >
            All Properties
          </NavLink>
        </nav>
      </div>
      
      <div className="flex items-center">
        <h2 className="text-lg font-medium text-gray-600 mr-6 hidden md:block">
          {getPageTitle()}
        </h2>
      </div>
    </motion.header>
  );
};

export default Header