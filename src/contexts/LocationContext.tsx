import React, { createContext, useContext, useState } from "react";
import { LocationId, LocationData, isOpenNow, formatHoursSummary } from "@/data/locations";
import { useLocations } from "@/hooks/useLocations";

interface LocationContextType {
  locationId: LocationId;
  location: LocationData;
  locations: Record<LocationId, LocationData>;
  setLocationId: (id: LocationId) => void;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationId, setLocationId] = useState<LocationId>("eperon");
  const { locations, loading } = useLocations();

  if (loading || !locations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg font-display">Chargement…</div>
      </div>
    );
  }

  return (
    <LocationContext.Provider value={{ locationId, location: locations[locationId], locations, setLocationId, loading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};
