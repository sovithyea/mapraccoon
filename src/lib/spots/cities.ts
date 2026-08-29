import type { CityId } from "@/lib/spots/schema";

export type City = {
  id: CityId;
  name: string;
  /** One line for the city tab and city page. */
  tagline: string;
  /** [longitude, latitude] */
  center: [number, number];
  zoom: number;
  /** CSS custom property holding this city's accent. Semantic, not decorative:
   *  a city keeps the same colour on the tab, the pin and the card. */
  color: string;
};

export const cities: readonly City[] = [
  {
    id: "phnom-penh",
    name: "Phnom Penh",
    tagline: "The capital, and the day trips nobody books",
    center: [104.9218, 11.5564],
    zoom: 11.5,
    color: "var(--city-phnom-penh)",
  },
  {
    id: "siem-reap",
    name: "Siem Reap",
    tagline: "Angkor — and the temples past the circuit",
    center: [103.8595, 13.3622],
    zoom: 11,
    color: "var(--city-siem-reap)",
  },
  {
    id: "kampot-kep",
    name: "Kampot & Kep",
    tagline: "Pepper, crab, karst caves and mangrove",
    center: [104.2, 10.6],
    zoom: 10.5,
    color: "var(--city-kampot-kep)",
  },
  {
    id: "battambang",
    name: "Battambang",
    tagline: "Colonial timber, hilltop temples, an arts school",
    center: [103.1968, 13.0957],
    zoom: 11,
    color: "var(--city-battambang)",
  },
];

const cityById = new Map(cities.map((city) => [city.id, city]));

export function getCity(id: CityId): City {
  const city = cityById.get(id);
  if (!city) throw new Error(`Unknown city: ${id}`);
  return city;
}

/** Frames all four cities, used when no city filter is active. */
export const CAMBODIA_VIEW = {
  longitude: 104.5,
  latitude: 12.2,
  zoom: 6.6,
} as const;
