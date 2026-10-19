import { describe, it, expect } from 'vitest';
import { TRIPS } from './index';
import { PHOTOS } from './photos';
import { RANKS } from '@/lib/egypt/progress';

// Every trip's data, checked the way the screens and the AI routes use it, so a
// typo in a photo key or an answer index fails here rather than on a phone in
// the desert.
const KINDS = [undefined, 'cartouche', 'scale', 'builder'];
const isHieroglyph = (s) => [...s].length === 1 && s.codePointAt(0) >= 0x13000 && s.codePointAt(0) <= 0x1342f;

describe.each(TRIPS.map((t) => [t.id, t]))('trip %s', (_, trip) => {
  it('has what the picker, the trip screen and the guide need', () => {
    for (const field of ['name', 'shortName', 'place', 'tagline', 'description', 'intro', 'setting', 'around']) {
      expect(typeof trip[field], field).toBe('string');
      expect(trip[field].length, field).toBeGreaterThan(0);
    }
    expect(trip.ready.title).toBeTruthy();
    expect(trip.ready.todo).toBeTruthy();
    expect(PHOTOS[trip.cover], 'cover').toBeTruthy();
  });

  it('has enough stops to reach the top rank', () => {
    expect(trip.stops.length).toBeGreaterThanOrEqual(RANKS[RANKS.length - 1].stamps);
  });

  it('has unique stop ids and stamps', () => {
    const ids = trip.stops.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const stamps = trip.stops.map((s) => s.stamp);
    expect(new Set(stamps).size).toBe(stamps.length);
  });

  it.each(trip.stops.map((s) => [s.id, s]))('stop %s is complete', (__, stop) => {
    expect(isHieroglyph(stop.stamp), 'stamp is one Egyptian hieroglyph').toBe(true);
    expect(KINDS).toContain(stop.kind);
    for (const field of ['title', 'where', 'intro', 'guide']) expect(stop[field], field).toBeTruthy();
    expect(stop.story.length).toBeGreaterThan(0);
    expect(stop.lookFor.length).toBeGreaterThan(0);
    expect(stop.facts.length).toBeGreaterThan(0);
    expect(stop.photos.length).toBeGreaterThan(0);
    for (const id of stop.photos) expect(PHOTOS[id], `photo ${id}`).toBeTruthy();
    for (const field of ['title', 'ask', 'hint', 'target']) expect(stop.quest[field], `quest.${field}`).toBeTruthy();

    expect(stop.quiz.length).toBeGreaterThan(0);
    for (const q of stop.quiz) {
      expect(q.options.length, q.q).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size, q.q).toBe(q.options.length);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.q).toBe(true);
      expect(q.why, q.q).toBeTruthy();
      if (q.photo) expect(PHOTOS[q.photo], `quiz photo ${q.photo}`).toBeTruthy();
    }
  });

  it('pins every stop on its map, if it has one', () => {
    if (!trip.map) return;
    expect(Object.keys(trip.map.pins).sort()).toEqual(trip.stops.map((s) => s.id).sort());
    const [minX, minY, w, h] = trip.map.view;
    for (const [id, [x, y]] of Object.entries(trip.map.pins)) {
      expect(x >= minX && x <= minX + w && y >= minY && y <= minY + h, `pin ${id} inside the map`).toBe(true);
    }
  });
});

describe('photos', () => {
  it('all come from Wikimedia, which the CSP and the service worker allow', () => {
    for (const [id, p] of Object.entries(PHOTOS)) {
      expect(new URL(p.src).host, id).toMatch(/^(thumb|upload)\.wikimedia\.org$/);
      expect(p.w > 0 && p.h > 0, id).toBe(true);
      expect(p.caption && p.credit && p.page, id).toBeTruthy();
    }
  });
});
