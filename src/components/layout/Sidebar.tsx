import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, Calendar, Settings, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/properties', icon: <Building size={20} />, label: 'Properties' },
    { to: '/locations', icon: <MapPin size={20} />, label: 'Locations' },
    // Add more navigation items as needed
  ];
  
  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { 
      x: '-100%', 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        when: 'afterChildren' 
      } 
    }
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 lg:relative lg:z-0 ${isOpen ? 'block' : 'hidden lg:block'}`}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold">Channel Manager</h2>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-full hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => 
                    `flex items-center p-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center p-3 rounded-xl text-gray-700 hover:bg-gray-100 cursor-pointer">
            <Settings size={20} className="mr-3" />
            <span>Settings</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;