/** WGS84 ↔ DMS / UTM / MGRS conversion. Pure functions, no deps — unit-tested in __tests__/coords.test.ts. */

const PI = Math.PI;

function toRad(deg: number): number { return deg * PI / 180; }

export interface DMS { deg: number; min: number; sec: number; dir: string; }

export function ddToDMS(dd: number, isLat: boolean): DMS {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = (minFull - min) * 60;
  const dir = isLat ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W');
  return { deg, min, sec, dir };
}

export function dmsToDD(deg: number, min: number, sec: number, dir: string): number {
  const abs = deg + min / 60 + sec / 3600;
  return (dir === 'S' || dir === 'W') ? -abs : abs;
}

// UTM zone letter
export function utmZoneLetter(lat: number): string {
  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  if (lat < -80 || lat > 84) return 'Z';
  const idx = Math.floor((lat + 80) / 8);
  return letters[Math.min(idx, 20)];
}

export interface UTMCoord { zone: number; letter: string; easting: number; northing: number; }

export function ddToUTM(lat: number, lon: number): UTMCoord {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = 1 - (b / a) * (b / a);
  const k0 = 0.9996;

  const latRad = toRad(lat);
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = toRad((zone - 1) * 6 - 180 + 3);

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * ((lon * PI / 180) - lon0);
  const ep2 = e2 / (1 - e2);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad)
  );

  const easting =
    k0 * N * (
      A
      + (1 - T + C) * A ** 3 / 6
      + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120
    ) + 500000;

  let northing =
    k0 * (
      M + N * Math.tan(latRad) * (
        A ** 2 / 2
        + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24
        + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720
      )
    );

  if (lat < 0) northing += 10000000;

  return { zone, letter: utmZoneLetter(lat), easting, northing };
}

export function utmToMGRS(utm: UTMCoord): string {
  const { zone, letter, easting, northing } = utm;

  const colSets: Record<number, string> = { 1: 'ABCDEFGH', 2: 'JKLMNPQR', 0: 'STUVWXYZ' };
  const colSet = colSets[zone % 3];
  const colIdx = Math.floor((easting - 100000) / 100000);
  const colLetter = colSet[Math.min(colIdx, colSet.length - 1)] ?? 'A';

  const rowLettersOdd  = 'ABCDEFGHJKLMNPQRSTUV';
  const rowLettersEven = 'FGHJKLMNPQRSTUVABCDE';
  const rowLetters = zone % 2 === 0 ? rowLettersEven : rowLettersOdd;
  const rowIdx = Math.floor((northing % 2000000) / 100000) % 20;
  const rowLetter = rowLetters[rowIdx] ?? 'A';

  const e5 = String(Math.floor(easting % 100000)).padStart(5, '0');
  const n5 = String(Math.floor(northing % 100000)).padStart(5, '0');

  return `${zone}${letter} ${colLetter}${rowLetter} ${e5} ${n5}`;
}

// ── Format parsers ────────────────────────────────────────────────────────────

export type CoordFormat = 'DD' | 'DMS' | 'UTM' | 'MGRS';

export interface AllFormats {
  dd: string;
  dms: string;
  utm: string;
  mgrs: string;
}

export function formatDD(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(6)}° ${lon >= 0 ? 'E' : 'W'}`;
}

export function formatDMS(lat: number, lon: number): string {
  const la = ddToDMS(lat, true);
  const lo = ddToDMS(lon, false);
  return (
    `${la.deg}°${la.min}'${la.sec.toFixed(2)}"${la.dir} ` +
    `${lo.deg}°${lo.min}'${lo.sec.toFixed(2)}"${lo.dir}`
  );
}

export function formatUTM(utm: UTMCoord): string {
  return `${utm.zone}${utm.letter} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
}

export function parseDD(input: string): { lat: number; lon: number } | null {
  const m = input.match(/([\d.]+)\s*°?\s*([NS]),?\s*([\d.]+)\s*°?\s*([EW])/i);
  if (!m) return null;
  const lat = parseFloat(m[1]) * (m[2].toUpperCase() === 'S' ? -1 : 1);
  const lon = parseFloat(m[3]) * (m[4].toUpperCase() === 'W' ? -1 : 1);
  return { lat, lon };
}

export function parseDMS(input: string): { lat: number; lon: number } | null {
  const m = input.match(
    /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/i
  );
  if (!m) return null;
  const lat = dmsToDD(+m[1], +m[2], +m[3], m[4].toUpperCase());
  const lon = dmsToDD(+m[5], +m[6], +m[7], m[8].toUpperCase());
  return { lat, lon };
}

export function parseUTM(input: string): { lat: number; lon: number } | null {
  const m = input.match(/(\d{1,2})([A-Z])\s+(\d+)\s+(\d+)/i);
  if (!m) return null;
  const zone = parseInt(m[1]);
  const bandLetter = m[2].toUpperCase();
  const easting = parseFloat(m[3]);
  const northing = parseFloat(m[4]);
  return utmToDD(zone, bandLetter, easting, northing);
}

export function parseMGRS(input: string): { lat: number; lon: number } | null {
  // Simplified MGRS parse: extract zone + band + two letters + easting + northing
  const m = input.match(/(\d{1,2})([A-Z])\s*([A-Z]{2})\s*(\d{5})\s*(\d{5})/i);
  if (!m) return null;
  const zone = parseInt(m[1]);
  const bandLetter = m[2].toUpperCase();
  const sqLetters = m[3].toUpperCase();

  const colSets: Record<number, string> = { 1: 'ABCDEFGH', 2: 'JKLMNPQR', 0: 'STUVWXYZ' };
  const colSet = colSets[zone % 3];
  const colIdx = colSet.indexOf(sqLetters[0]);

  const rowLettersOdd  = 'ABCDEFGHJKLMNPQRSTUV';
  const rowLettersEven = 'FGHJKLMNPQRSTUVABCDE';
  const rowLetters = zone % 2 === 0 ? rowLettersEven : rowLettersOdd;
  const rowIdx = rowLetters.indexOf(sqLetters[1]);

  if (colIdx < 0 || rowIdx < 0) return null;

  const easting  = (colIdx + 1) * 100000 + parseInt(m[4]);
  const northing = rowIdx * 100000 + parseInt(m[5]);
  return utmToDD(zone, bandLetter, easting, northing);
}

export function utmToDD(zone: number, bandLetter: string, easting: number, northing: number): { lat: number; lon: number } {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = 1 - (b / a) * (b / a);
  const k0 = 0.9996;
  const ep2 = e2 / (1 - e2);

  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  const bandIdx = letters.indexOf(bandLetter);
  const isSouth = bandIdx < letters.indexOf('N');

  const x = easting - 500000;
  const y = isSouth ? northing - 10000000 : northing;

  const lon0 = toRad((zone - 1) * 6 - 180 + 3);

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ep2 * Math.cos(phi1) ** 2;
  const R1 = a * (1 - e2) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D = x / (N1 * k0);

  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
    D ** 2 / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6 / 720
  );

  const lon = lon0 + (
    D
    - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5 / 120
  ) / Math.cos(phi1);

  return { lat: lat * 180 / PI, lon: lon * 180 / PI };
}

export function convertFromInput(raw: string, fmt: CoordFormat): AllFormats | string {
  let latLon: { lat: number; lon: number } | null = null;

  if (fmt === 'DD')   latLon = parseDD(raw);
  if (fmt === 'DMS')  latLon = parseDMS(raw);
  if (fmt === 'UTM')  latLon = parseUTM(raw);
  if (fmt === 'MGRS') latLon = parseMGRS(raw);

  if (!latLon) return 'Could not parse input. Check format and try again.';

  const { lat, lon } = latLon;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return 'Coordinates out of valid range.';

  const utm = ddToUTM(lat, lon);
  return {
    dd:   formatDD(lat, lon),
    dms:  formatDMS(lat, lon),
    utm:  formatUTM(utm),
    mgrs: utmToMGRS(utm),
  };
}
