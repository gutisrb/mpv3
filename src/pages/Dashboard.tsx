import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProperties, useUser } from '../api/dataHooks';
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { supabase } from '../api/supabaseClient';
import AddPropertyModal from '../components/property/AddPropertyModal';

interface Booking {
  start_date: string;
  end_date: string;
  property_id: string;
}

const countBookedNights = async (month: Date, properties: string[]) => {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_date,end_date,property_id')
    .in('property_id', properties)
    .lte('start_date', endDate.toISOString())
    .gte('end_date', startDate.toISOString());
    
  if (!bookings) return 0;
  
  let totalNights = 0;
  
  bookings.forEach((booking: Booking) => {
    const bookingStart = new Date(booking.start_date);
    const bookingEnd = new Date(booking.end_date);
    
    // Get the overlapping interval
    const intervalStart = bookingStart < startDate ? startDate : bookingStart;
    const intervalEnd = bookingEnd > endDate ? endDate : bookingEnd;
    
    // Count days in the interval
    if (intervalStart <= intervalEnd) {
      const daysInInterval = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
      totalNights += daysInInterval.length;
    }
  });
  
  return totalNights;
};

const Dashboard: React.FC = () => {
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthMetrics, setMonthMetrics] = useState({ booked: 0, total: 0, empty: 0, occupancy: 0 });
  
  // Update metrics when month or properties change
  React.useEffect(() => {
    const updateMetrics = async () => {
      if (!properties?.length) {
        setMonthMetrics({ booked: 0, total: 0, empty: 0, occupancy: 0 });
        return;
      }
      
      const daysInMonth = getDaysInMonth(currentMonth);
      const totalNights = properties.length * daysInMonth;
      const propertyIds = properties.map(p => p.id);
      
      const bookedNights = await countBookedNights(currentMonth, propertyIds);
      const emptyNights = totalNights - bookedNights;
      const occupancyRate = Math.round((bookedNights / totalNights) * 100);
      
      setMonthMetrics({
        booked: bookedNights,
        total: totalNights,
        empty: emptyNights,
        occupancy: occupancyRate
      });
    };
    
    updateMetrics();
  }, [properties, currentMonth]);
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  
  // Group properties by location
  const locationGroups = React.useMemo(() => {
    if (!properties) return {};
    
    return properties.reduce((acc, property) => {
      const location = property.location;
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);
  }, [properties]);
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/properties"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Properties
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="flex justify-center items-center gap-4 mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded border hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded border hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Properties</h3>
              <p className="text-2xl font-semibold mt-1">
                {isLoadingProperties ? '...' : properties?.length || 0}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Booked Nights – {format(currentMonth, 'MMM')}</h3>
              <p className="text-2xl font-semibold mt-1">
                {isLoadingProperties ? '...' : `${monthMetrics.booked} / ${monthMetrics.total}`}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-2xl shadow-md p-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Empty Nights – {format(currentMonth, 'MMM')}</h3>
              <p className="text-2xl font-semibold mt-1">
                {isLoadingProperties ? '...' : `${monthMetrics.empty} nights`}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Recent Properties */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Locations</h2>
        <p className="text-sm text-gray-600">Click a location to manage its apartments.</p>
        
        {isLoadingProperties ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading locations...</p>
          </div>
        ) : properties && Object.keys(locationGroups).length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {Object.entries(locationGroups).map(([location, properties]) => (
              <motion.div
                key={location}
                className="w-56 h-28 bg-white rounded-xl shadow-md flex flex-col items-center justify-center hover:shadow-lg cursor-pointer transition-shadow"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/locations/${encodeURIComponent(location)}`)}
                variants={itemVariants}
              >
                <div className="flex items-center mb-2">
                  <Building className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold">{location}</span>
                </div>
                <span className="text-sm text-gray-500">{properties.length} apartments</span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No locations yet</h3>
            <p className="mt-2 text-gray-500">
              Add your first property to start organizing by location.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Property
            </button>
          </div>
        )}
      </div>
      
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;