import { GEM } from './gem';
import { GIZA } from './giza';

// Every Egypt Explorer trip, in the order the trip picker shows them. A new one
// (Luxor, a Nile day) is a new data file and one line here, with no change to
// the screens. Each keeps its own progress, stamps and passport.
export const TRIPS = [GEM, GIZA];

export const TRIP_BY_ID = Object.fromEntries(TRIPS.map((t) => [t.id, t]));

export function getTrip(id) {
  return TRIP_BY_ID[id] || null;
}

export function getStop(trip, stopId) {
  return trip?.stops.find((s) => s.id === stopId) || null;
}
