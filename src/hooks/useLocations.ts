import { useState } from "react";
import { locations as staticLocations } from "@/data/locations";
import type { LocationId, LocationData } from "@/data/locations";

/**
 * Mock-mode hook : retourne l'unique adresse "L'Éperon" (Les Jardins Sur Le Toit).
 * Pas de fetch DB pour l'instant — données figées dans `src/data/locations.ts`.
 */
export function useLocations() {
  const [locations] = useState<Record<LocationId, LocationData>>(staticLocations);
  return { locations, loading: false, error: null as string | null };
}
