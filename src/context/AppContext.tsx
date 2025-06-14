import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const { data: allProperties } = useProperties();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);

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