import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { weatherAPI } from '../services/api';

interface Location {
  lat: number;
  lng: number;
  name?: string;
  region?: string;
  country?: string;
  accuracy?: number;
}

interface LocationContextType {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocationState] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to get location from browser geolocation
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });

        const coords = position.coords;
        const locationData = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy
        };

        // Send coordinates to backend to get location name
        try {
          const response = await weatherAPI.setUserLocation(locationData);
          if (response.data.success) {
            setLocationState({
              ...locationData,
              name: response.data.location.name,
              region: response.data.location.region,
              country: response.data.location.country
            });
            return;
          }
        } catch (backendError) {
          console.warn('Backend location resolution failed, using coordinates only:', backendError);
        }

        // Fallback to coordinates only
        setLocationState(locationData);
      } else {
        throw new Error('Geolocation is not supported by this browser');
      }
    } catch (err) {
      console.error('Location detection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect location');
      
      // Fallback to default location
      setLocationState({
        lat: 41.8781, // Chicago coordinates as fallback
        lng: -87.6298,
        name: 'Chicago, IL, USA'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setLocation = (newLocation: Location) => {
    setLocationState(newLocation);
    setError(null);
  };

  const clearLocation = () => {
    setLocationState(null);
    setError(null);
  };

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    detectLocation,
    setLocation,
    clearLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 