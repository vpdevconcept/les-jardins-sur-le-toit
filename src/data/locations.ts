export type LocationId = "eperon";

export type DayId = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";

export const dayLabels: Record<DayId, string> = {
  lun: "Lundi",
  mar: "Mardi",
  mer: "Mercredi",
  jeu: "Jeudi",
  ven: "Vendredi",
  sam: "Samedi",
  dim: "Dimanche",
};

/** "HH:MM-HH:MM" or "fermé" */
export type DayHours = string;

export interface LocationData {
  id: LocationId;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  whatsapp: string;
  hours: Record<DayId, DayHours>;
  coordinates: { lat: number; lng: number };
  deliveryEnabled?: boolean;
  deliveryRadius?: number; // km
}

/** Check if open now (Réunion timezone UTC+4). Handles overnight hours (e.g., 18:00-00:00). */
export function isOpenNow(location: LocationData): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Indian/Reunion" }));
  const jsDay = now.getDay();
  const dayMap: DayId[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  const today = dayMap[jsDay];
  const todayHours = location.hours[today];

  if (!todayHours || todayHours === "fermé") return false;

  const match = todayHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return false;

  const [, oh, om, ch, cm] = match.map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + om;
  let close = ch * 60 + cm;
  if (close === 0) close = 24 * 60; // minuit
  return minutesNow >= open && minutesNow < close;
}

/** Format hours for compact display */
export function formatHoursSummary(location: LocationData): string {
  return "Mar–Sam : 18h–00h · Fermé Dim & Lun";
}

export const locations: Record<LocationId, LocationData> = {
  eperon: {
    id: "eperon",
    name: "Les Jardins sur le Toit",
    address: "Bâtiment Ze Buro, 2 rue Terrain l'avion",
    postalCode: "97435",
    city: "Saint-Paul",
    phone: "0262 00 00 00",
    whatsapp: "262692000000",
    hours: {
      lun: "fermé",
      mar: "18:00-00:00",
      mer: "18:00-00:00",
      jeu: "18:00-00:00",
      ven: "18:00-00:00",
      sam: "18:00-00:00",
      dim: "fermé",
    },
    coordinates: { lat: -21.0412343, lng: 55.2516114 },
    deliveryEnabled: false,
  },
};
