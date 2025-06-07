import { createContext, useContext, useState, ReactNode } from 'react';

interface Location {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
}

interface AppContextValue {
  currentLocation: Location | null;
  currentProperty: Property | null;
  setLocation: (loc: Location | null) => void;
  setProperty: (prop: Property | null) => void;
}

const AppContext = createContext<AppContextValue>({
  currentLocation: null,
  currentProperty: null,
  setLocation: () => {},
  setProperty: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);

  return (
    <AppContext.Provider
      value={{
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