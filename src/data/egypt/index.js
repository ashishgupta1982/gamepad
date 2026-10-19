import { GEM } from './gem';

// Every Egypt Explorer trip. The game is built around a list so the next one
// (the pyramids, Luxor, a Nile day) is a new data file and one line here, with
// no change to the screens.
export const TRIPS = [GEM];

export const TRIP_BY_ID = Object.fromEntries(TRIPS.map((t) => [t.id, t]));

export function getTrip(id) {
  return TRIP_BY_ID[id] || null;
}

export function getStop(trip, stopId) {
  return trip?.stops.find((s) => s.id === stopId) || null;
}
