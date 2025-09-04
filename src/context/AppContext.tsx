import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useProperties } from '@/api/dataHooks';

interface Location {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
}

interface AppContextValue {
  locations: Location[];
  properties: Property[];
  currentLocation: Location | null;
  currentProperty: Property | null;
  setLocation: (loc: Location | null) => void;
  setProperty: (prop: Property | null) => void;
}

const AppContext = createContext<AppContextValue>({
  locations: [],
  properties: [],
  currentLocation: null,
  currentProperty: null,
  setLocation: () => {},
  setProperty: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: allProperties } = useProperties();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);

  // Listen for auth changes and clear cache + reset state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && session)) {
        // Clear all cached data and reset state
        queryClient.clear();
        setCurrentLocation(null);
        setCurrentProperty(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);
  // Extract unique locations from properties
  const locations = React.useMemo(() => {
    if (!allProperties) return [];
    
    const uniqueLocations = new Set<string>();
    const locationList: Location[] = [];
    
    allProperties.forEach(property => {
      if (!uniqueLocations.has(property.location)) {
        uniqueLocations.add(property.location);
        locationList.push({
          id: property.location,
          name: property.location
        });
      }
    });
    
    return locationList.sort((a, b) => a.name.localeCompare(b.name));
  }, [allProperties]);

  // Filter properties based on current location
  const properties = React.useMemo(() => {
    if (!allProperties) return [];
    if (!currentLocation) return allProperties;
    
    return allProperties.filter(property => property.location === currentLocation.id);
  }, [allProperties, currentLocation]);

  // Reset property when location changes
  useEffect(() => {
    if (currentProperty && currentLocation && currentProperty.location !== currentLocation.id) {
      setCurrentProperty(null);
    }
  }, [currentLocation, currentProperty]);

  // Auto-select first property if none selected and properties are available
  useEffect(() => {
    if (!currentProperty && allProperties && allProperties.length > 0) {
      const firstProperty = allProperties[0];
      setCurrentProperty({
        id: firstProperty.id,
        name: firstProperty.name,
        location: firstProperty.location
      });
    }
  }, [allProperties, currentProperty]);

  return (
    <AppContext.Provider
      value={{
        locations,
        properties,
        currentLocation,
        currentProperty,
        setLocation: setCurrentLocation,
        setProperty: setCurrentProperty,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);