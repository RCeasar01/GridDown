import { ddToUTM, utmToMGRS, utmToDD, convertFromInput, parseDMS, ddToDMS } from '../app/utils/coords';

// Reference values computed with the independent `utm` and `mgrs` Python libraries (2026-10-23).
const RALEIGH = { lat: 35.7796, lon: -78.6382 }; // 17S 713473 3962076 · 17SQV 13473 62076
const REFERENCE = [
  { name: 'Mooresville NC', lat: 35.5849, lon: -80.8101, zone: 17, letter: 'S', e: 517204, n: 3937926, mgrs: '17SNV' },
  { name: 'Denver CO',      lat: 39.7392, lon: -104.9903, zone: 13, letter: 'S', e: 500831, n: 4398812, mgrs: '13SED' },
  { name: 'Sydney AU',      lat: -33.8688, lon: 151.2093, zone: 56, letter: 'H', e: 334369, n: 6250948, mgrs: '56HLH' },
];

describe('coordinate conversion', () => {
  test('DD → UTM zone 17S near Raleigh', () => {
    const utm = ddToUTM(RALEIGH.lat, RALEIGH.lon);
    expect(utm.zone).toBe(17);
    expect(utm.letter).toBe('S');
    expect(Math.abs(utm.easting - 713473)).toBeLessThan(2);
    expect(Math.abs(utm.northing - 3962076)).toBeLessThan(2);
  });

  test.each(REFERENCE)('DD → UTM/MGRS matches reference for $name', ({ lat, lon, zone, letter, e, n, mgrs }) => {
    const utm = ddToUTM(lat, lon);
    expect(utm.zone).toBe(zone);
    expect(utm.letter).toBe(letter);
    expect(Math.abs(utm.easting - e)).toBeLessThan(2);
    expect(Math.abs(utm.northing - n)).toBeLessThan(2);
    expect(utmToMGRS(utm).replace(/\s/g, '').startsWith(mgrs)).toBe(true);
  });

  test('UTM → DD round trip within 1 m', () => {
    const utm = ddToUTM(RALEIGH.lat, RALEIGH.lon);
    const back = utmToDD(utm.zone, utm.letter, utm.easting, utm.northing);
    expect(Math.abs(back.lat - RALEIGH.lat)).toBeLessThan(0.00001);
    expect(Math.abs(back.lon - RALEIGH.lon)).toBeLessThan(0.00001);
  });

  test('MGRS has the 17SQV grid square for Raleigh', () => {
    expect(utmToMGRS(ddToUTM(RALEIGH.lat, RALEIGH.lon)).replace(/\s/g, '')).toMatch(/^17SQV1347362076/);
  });

  test('DMS formatting and parsing agree', () => {
    const d = ddToDMS(RALEIGH.lat, true);
    expect(d.deg).toBe(35);
    expect(d.min).toBe(46);
    expect(d.dir).toBe('N');
    const parsed = parseDMS('35°46\'46.56"N 78°38\'17.52"W');
    expect(parsed).not.toBeNull();
    expect(Math.abs((parsed as { lat: number }).lat - RALEIGH.lat)).toBeLessThan(0.001);
  });

  test('convertFromInput rejects garbage and out-of-range', () => {
    expect(typeof convertFromInput('not a coordinate', 'DD')).toBe('string');
    expect(typeof convertFromInput('95, 10', 'DD')).toBe('string');
  });
});
