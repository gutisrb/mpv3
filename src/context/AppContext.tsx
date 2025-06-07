import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/api/supabaseClient';

interface Location {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  location_id: string;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);

  // Fetch all locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error && data) setLocations(data as Location[]);
    };
    fetchLocations();
  }, []);

  // Fetch properties for current location
  useEffect(() => {
    if (!currentLocation) {
      setProperties([]);
      setCurrentProperty(null);
      return;
    }
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('location_id', currentLocation.id);
      if (!error && data) setProperties(data as Property[]);
    };
    fetchProperties();
    setCurrentProperty(null);
  }, [currentLocation]);

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