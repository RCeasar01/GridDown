import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// ─── Graceful sensor import ───────────────────────────────────────────────────
let Magnetometer: any = null;
try {
  const sensors = require('expo-sensors');
  Magnetometer = sensors.Magnetometer;
} catch (_) {
  Magnetometer = null;
}

// ─── Graceful location import ─────────────────────────────────────────────────
let Location: any = null;
try {
  Location = require('expo-location');
} catch (_) {
  Location = null;
}

// ─── Star Data ───────────────────────────────────────────────────────────────
interface Star {
  name: string;
  ra: number;   // right ascension in hours
  dec: number;  // declination in degrees
  mag: number;  // apparent magnitude
  navNote: string;
  constellation: string;
}

const STARS: Star[] = [
  { name: 'Polaris',      ra: 2.53,  dec:  89.26, mag:  2.0,   navNote: 'North Star — always points true north',           constellation: 'Ursa Minor' },
  { name: 'Sirius',       ra: 6.75,  dec: -16.72, mag: -1.46,  navNote: 'Brightest star — rises almost due east',          constellation: 'Canis Major' },
  { name: 'Canopus',      ra: 6.40,  dec: -52.70, mag: -0.74,  navNote: 'South reference star',                            constellation: 'Carina' },
  { name: 'Arcturus',     ra: 14.26, dec:  19.18, mag: -0.05,  navNote: 'Follow the arc of Ursa Major handle',             constellation: 'Boötes' },
  { name: 'Vega',         ra: 18.62, dec:  38.78, mag:  0.03,  navNote: 'Summer Triangle anchor',                          constellation: 'Lyra' },
  { name: 'Capella',      ra: 5.28,  dec:  46.00, mag:  0.08,  navNote: 'High northern sky winter',                        constellation: 'Auriga' },
  { name: 'Rigel',        ra: 5.24,  dec:  -8.20, mag:  0.13,  navNote: 'Orion lower-right — rises near east',             constellation: 'Orion' },
  { name: 'Procyon',      ra: 7.66,  dec:   5.23, mag:  0.34,  navNote: 'Winter Triangle star',                            constellation: 'Canis Minor' },
  { name: 'Betelgeuse',   ra: 5.92,  dec:   7.41, mag:  0.45,  navNote: 'Orion upper-left — red giant',                    constellation: 'Orion' },
  { name: 'Achernar',     ra: 1.63,  dec: -57.24, mag:  0.46,  navNote: 'Southern sky south reference',                    constellation: 'Eridanus' },
  { name: 'Hadar',        ra: 14.06, dec: -60.37, mag:  0.61,  navNote: 'Centaurus — Southern Cross pointer',              constellation: 'Centaurus' },
  { name: 'Altair',       ra: 19.85, dec:   8.87, mag:  0.76,  navNote: 'Summer Triangle — rapidly rotating',              constellation: 'Aquila' },
  { name: 'Aldebaran',    ra: 4.60,  dec:  16.51, mag:  0.87,  navNote: 'Eye of Taurus bull — follow Orion belt right',    constellation: 'Taurus' },
  { name: 'Spica',        ra: 13.42, dec: -11.16, mag:  0.98,  navNote: 'Spike of Virgo — ARC to Spica from Arcturus',     constellation: 'Virgo' },
  { name: 'Antares',      ra: 16.49, dec: -26.43, mag:  1.06,  navNote: 'Heart of Scorpius — red rival of Mars',           constellation: 'Scorpius' },
  { name: 'Pollux',       ra: 7.76,  dec:  28.03, mag:  1.14,  navNote: 'Gemini twin (brighter)',                          constellation: 'Gemini' },
  { name: 'Fomalhaut',    ra: 22.96, dec: -29.62, mag:  1.17,  navNote: 'Solitary autumn star low in south',               constellation: 'Piscis Austrinus' },
  { name: 'Deneb',        ra: 20.69, dec:  45.28, mag:  1.25,  navNote: 'Summer Triangle — supergiant',                    constellation: 'Cygnus' },
  { name: 'Mimosa',       ra: 12.80, dec: -59.69, mag:  1.25,  navNote: 'Southern Cross beta',                             constellation: 'Crux' },
  { name: 'Regulus',      ra: 10.14, dec:  11.97, mag:  1.36,  navNote: 'Heart of Leo — nearly on the ecliptic',           constellation: 'Leo' },
  { name: 'Adhara',       ra: 6.98,  dec: -28.97, mag:  1.50,  navNote: 'Second star of Canis Major',                      constellation: 'Canis Major' },
  { name: 'Shaula',       ra: 17.56, dec: -37.10, mag:  1.62,  navNote: 'Scorpius tail sting',                             constellation: 'Scorpius' },
  { name: 'Castor',       ra: 7.58,  dec:  31.89, mag:  1.58,  navNote: 'Gemini twin (dimmer)',                            constellation: 'Gemini' },
  { name: 'Gacrux',       ra: 12.52, dec: -57.11, mag:  1.64,  navNote: 'Southern Cross top',                              constellation: 'Crux' },
  { name: 'Bellatrix',    ra: 5.42,  dec:   6.35, mag:  1.64,  navNote: 'Orion left shoulder',                             constellation: 'Orion' },
  { name: 'Elnath',       ra: 5.44,  dec:  28.61, mag:  1.65,  navNote: 'Taurus horn tip',                                 constellation: 'Taurus' },
  { name: 'Miaplacidus',  ra: 9.22,  dec: -69.72, mag:  1.67,  navNote: 'Carina keel',                                     constellation: 'Carina' },
  { name: 'Alnilam',      ra: 5.60,  dec:  -1.20, mag:  1.70,  navNote: 'Orion belt center',                               constellation: 'Orion' },
  { name: 'Alnitak',      ra: 5.68,  dec:  -1.94, mag:  1.77,  navNote: 'Orion belt eastern',                              constellation: 'Orion' },
  { name: 'Mintaka',      ra: 5.53,  dec:  -0.30, mag:  2.20,  navNote: 'Orion belt western — rises almost exactly east',  constellation: 'Orion' },
  { name: 'Dubhe',        ra: 11.06, dec:  61.75, mag:  1.81,  navNote: 'Ursa Major pointer to Polaris',                   constellation: 'Ursa Major' },
  { name: 'Merak',        ra: 11.03, dec:  56.38, mag:  2.34,  navNote: 'Ursa Major second pointer',                       constellation: 'Ursa Major' },
  { name: 'Phecda',       ra: 11.90, dec:  53.69, mag:  2.44,  navNote: 'Ursa Major bowl',                                 constellation: 'Ursa Major' },
  { name: 'Megrez',       ra: 12.26, dec:  57.03, mag:  3.31,  navNote: 'Ursa Major bowl-handle junction',                 constellation: 'Ursa Major' },
  { name: 'Alioth',       ra: 12.90, dec:  55.96, mag:  1.76,  navNote: 'Ursa Major handle start',                         constellation: 'Ursa Major' },
  { name: 'Mizar',        ra: 13.40, dec:  54.93, mag:  2.23,  navNote: 'Ursa Major handle middle',                        constellation: 'Ursa Major' },
  { name: 'Alkaid',       ra: 13.79, dec:  49.31, mag:  1.85,  navNote: 'Ursa Major handle end',                           constellation: 'Ursa Major' },
  { name: 'Kochab',       ra: 14.85, dec:  74.16, mag:  2.07,  navNote: 'Ursa Minor outer bowl',                           constellation: 'Ursa Minor' },
  { name: 'Pherkad',      ra: 15.35, dec:  71.83, mag:  3.00,  navNote: 'Ursa Minor bowl',                                 constellation: 'Ursa Minor' },
  { name: 'Schedar',      ra: 0.68,  dec:  56.54, mag:  2.23,  navNote: 'Cassiopeia W — west end',                         constellation: 'Cassiopeia' },
  { name: 'Caph',         ra: 0.15,  dec:  59.15, mag:  2.28,  navNote: 'Cassiopeia W — tip',                              constellation: 'Cassiopeia' },
  { name: 'Tsih',         ra: 0.95,  dec:  60.72, mag:  2.47,  navNote: 'Cassiopeia W center',                             constellation: 'Cassiopeia' },
  { name: 'Ruchbah',      ra: 1.43,  dec:  60.24, mag:  2.68,  navNote: 'Cassiopeia W — 4th',                              constellation: 'Cassiopeia' },
  { name: 'Segin',        ra: 1.91,  dec:  63.67, mag:  3.37,  navNote: 'Cassiopeia W — east tip',                         constellation: 'Cassiopeia' },
  { name: 'Becrux',       ra: 12.48, dec: -63.10, mag:  1.25,  navNote: 'Southern Cross vertical arm bottom',              constellation: 'Crux' },
  { name: 'Acrux',        ra: 12.44, dec: -63.10, mag:  0.76,  navNote: 'Southern Cross brightest',                        constellation: 'Crux' },
  { name: 'Alderamin',    ra: 21.31, dec:  62.59, mag:  2.45,  navNote: 'Cepheus — near Polaris',                          constellation: 'Cepheus' },
  { name: 'Sadr',         ra: 20.37, dec:  40.26, mag:  2.23,  navNote: 'Cygnus center cross',                             constellation: 'Cygnus' },
  { name: 'Gienah',       ra: 20.77, dec:  33.97, mag:  2.48,  navNote: 'Cygnus east wing',                                constellation: 'Cygnus' },
  { name: 'Albireo',      ra: 19.51, dec:  27.96, mag:  3.09,  navNote: 'Cygnus beak — colorful double star',              constellation: 'Cygnus' },
];

// ─── Constellation Lines ──────────────────────────────────────────────────────
const CONSTELLATION_LINES: { constellation: string; lines: [string, string][] }[] = [
  {
    constellation: 'Ursa Major',
    lines: [
      ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'],
      ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'],
    ],
  },
  {
    constellation: 'Ursa Minor',
    lines: [['Polaris', 'Kochab'], ['Kochab', 'Pherkad']],
  },
  {
    constellation: 'Cassiopeia',
    lines: [
      ['Caph', 'Schedar'], ['Schedar', 'Tsih'], ['Tsih', 'Ruchbah'], ['Ruchbah', 'Segin'],
    ],
  },
  {
    constellation: 'Orion',
    lines: [
      ['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Elnath'],
      ['Betelgeuse', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Mintaka'],
      ['Alnilam', 'Rigel'],
    ],
  },
  {
    constellation: 'Crux',
    lines: [['Acrux', 'Gacrux'], ['Becrux', 'Mimosa']],
  },
  {
    constellation: 'Cygnus',
    lines: [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Sadr', 'Gienah']],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const MAP_DIAMETER = 300;
const MAP_RADIUS   = MAP_DIAMETER / 2;
const CENTER_X     = MAP_RADIUS;
const CENTER_Y     = MAP_RADIUS;

// ─── Astronomy helpers ────────────────────────────────────────────────────────
function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function calcLST(date: Date, lonDeg: number): number {
  const JD = julianDate(date);
  const T  = (JD - 2451545.0) / 36525;
  let gmst = 6.697374558 + 2400.0513369 * T + 0.0000258622 * T * T - 1.7222e-9 * T * T * T;
  gmst = ((gmst % 24) + 24) % 24;
  const lst = ((gmst + lonDeg / 15) % 24 + 24) % 24;
  return lst;
}

interface AltAz { alt: number; az: number }

function raDecToAltAz(raDeg: number, decDeg: number, latDeg: number, lst: number): AltAz {
  const PI      = Math.PI;
  const toRad   = (d: number) => d * PI / 180;
  const haRad   = toRad((lst - raDeg / 15) * 15);
  const decRad  = toRad(decDeg);
  const latRad  = toRad(latDeg);
  const sinAlt  = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad  = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz   = (Math.sin(decRad) - sinAlt * Math.sin(latRad)) / (Math.cos(altRad) * Math.cos(latRad));
  let   azRad   = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(haRad) > 0) azRad = 2 * PI - azRad;
  return { alt: altRad * 180 / PI, az: azRad * 180 / PI };
}

interface ScreenPos { x: number; y: number; visible: boolean }

function altAzToScreen(altDeg: number, azDeg: number, headingDeg: number): ScreenPos {
  if (altDeg < 0) return { x: 0, y: 0, visible: false };
  const PI     = Math.PI;
  const theta  = ((azDeg - headingDeg) * PI / 180);
  const r      = (1 - altDeg / 90) * MAP_RADIUS;
  return {
    x: CENTER_X + r * Math.sin(theta),
    y: CENTER_Y - r * Math.cos(theta),
    visible: true,
  };
}

// ─── Star dot size by magnitude ───────────────────────────────────────────────
function starDotSize(mag: number): number {
  if (mag < 1.5) return 7;
  if (mag < 2.5) return 5;
  return 3;
}

// ─── Line segment helper (absolute-positioned thin View) ─────────────────────
interface LineProps {
  x1: number; y1: number; x2: number; y2: number; color: string; opacity?: number;
}
const ConstellationLine: React.FC<LineProps> = ({ x1, y1, x2, y2, color, opacity = 0.35 }) => {
  const dx     = x2 - x1;
  const dy     = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
  if (length < 1) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left:   x1,
        top:    y1 - 0.5,
        width:  length,
        height: 1,
        backgroundColor: color,
        opacity,
        transformOrigin: 'left center',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const StarMapScreen: React.FC = () => {
  const [heading,       setHeading]       = useState(0);
  const [compassOk,     setCompassOk]     = useState(false);
  const [userLat,       setUserLat]       = useState(35.0);
  const [userLon,       setUserLon]       = useState(-80.0);
  const [locationLabel, setLocationLabel] = useState('Default (35°N, 80°W)');
  const [now,           setNow]           = useState(new Date());
  const [selectedStar,  setSelectedStar]  = useState<Star | null>(null);
  const [lst,           setLst]           = useState('--:--');

  // ── Clock tick (every 30 s is enough for stars) ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Update LST display ────────────────────────────────────────────────────
  useEffect(() => {
    const h = calcLST(now, userLon);
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    setLst(`${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m`);
  }, [now, userLon]);

  // ── Magnetometer / compass ────────────────────────────────────────────────
  useEffect(() => {
    if (!Magnetometer) return;
    let sub: any;
    try {
      Magnetometer.setUpdateInterval(100);
      sub = Magnetometer.addListener((data: { x: number; y: number }) => {
        const { x, y } = data;
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        setHeading(angle);
        setCompassOk(true);
      });
    } catch (_) {
      setCompassOk(false);
    }
    return () => { try { sub?.remove(); } catch (_) {} };
  }, []);

  // ── Location ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!Location) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy?.Lowest ?? 1 });
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        setLocationLabel(
          `${pos.coords.latitude.toFixed(1)}°${pos.coords.latitude >= 0 ? 'N' : 'S'}, ` +
          `${Math.abs(pos.coords.longitude).toFixed(1)}°${pos.coords.longitude >= 0 ? 'E' : 'W'}`
        );
      } catch (_) {
        // keep defaults
      }
    })();
  }, []);

  // ── Compute projected star positions ─────────────────────────────────────
  const lstHours = calcLST(now, userLon);

  interface PlacedStar extends Star {
    screenX: number;
    screenY: number;
    visible: boolean;
    altDeg: number;
    azDeg: number;
  }

  const placedStars: PlacedStar[] = STARS.map((star) => {
    const { alt, az } = raDecToAltAz(star.ra, star.dec, userLat, lstHours);
    const { x, y, visible } = altAzToScreen(alt, az, heading);
    return { ...star, screenX: x, screenY: y, visible, altDeg: alt, azDeg: az };
  });

  // ── Build lookup map for constellation lines ──────────────────────────────
  const starMap: Record<string, PlacedStar> = {};
  placedStars.forEach((s) => { starMap[s.name] = s; });

  // ── Polaris screen position for FIND NORTH ───────────────────────────────
  const polaris     = starMap['Polaris'];
  const polarisVis  = polaris?.visible ?? false;
  const polarisAngle = polarisVis
    ? Math.atan2(polaris.screenX - CENTER_X, -(polaris.screenY - CENTER_Y)) * 180 / Math.PI
    : null;

  // ── Cardinal-direction labels (rotate with heading) ───────────────────────
  const cardinals = [
    { label: 'N', az: 0 },
    { label: 'E', az: 90 },
    { label: 'S', az: 180 },
    { label: 'W', az: 270 },
  ].map(({ label, az }) => {
    const theta = ((az - heading) * Math.PI) / 180;
    const r     = MAP_RADIUS - 14;
    return {
      label,
      cx: CENTER_X + r * Math.sin(theta),
      cy: CENTER_Y - r * Math.cos(theta),
    };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="star" size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>STAR MAP</Text>
        <Ionicons name="compass-outline" size={20} color={compassOk ? Colors.secondary : Colors.textMuted} />
      </View>

      {!compassOk && (
        <Text style={styles.compassNote}>
          Compass unavailable — showing north-up view
        </Text>
      )}

      {/* Map container */}
      <View style={styles.mapWrapper}>
        {/* Outer ring labels (cardinals) */}
        {cardinals.map(({ label, cx, cy }) => (
          <Text
            key={label}
            style={[
              styles.cardinalLabel,
              {
                position: 'absolute',
                left:  cx - 8 + (MAP_DIAMETER - MAP_DIAMETER) / 2,
                top:   cy - 8,
                color: label === 'N' ? Colors.primary : Colors.textSecondary,
              },
            ]}
          >
            {label}
          </Text>
        ))}

        {/* The actual circular sky map */}
        <View style={styles.mapCircle} pointerEvents="box-none">

          {/* Altitude rings (30°, 60°) */}
          {[30, 60].map((altRing) => {
            const ringR = (1 - altRing / 90) * MAP_RADIUS;
            const ringD = ringR * 2;
            const offset = MAP_RADIUS - ringR;
            return (
              <View
                key={altRing}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left:   offset,
                  top:    offset,
                  width:  ringD,
                  height: ringD,
                  borderRadius: ringR,
                  borderWidth: 0.5,
                  borderColor: '#1E2A1E',
                }}
              />
            );
          })}

          {/* Constellation lines */}
          {CONSTELLATION_LINES.map(({ constellation, lines }) =>
            lines.map(([a, b], idx) => {
              const sa = starMap[a];
              const sb = starMap[b];
              if (!sa?.visible || !sb?.visible) return null;
              return (
                <ConstellationLine
                  key={`${constellation}-${idx}`}
                  x1={sa.screenX} y1={sa.screenY}
                  x2={sb.screenX} y2={sb.screenY}
                  color={Colors.secondary}
                />
              );
            })
          )}

          {/* Stars */}
          {placedStars.map((star) => {
            if (!star.visible) return null;
            const size    = starDotSize(star.mag);
            const isNorth = star.name === 'Polaris';
            const isSel   = selectedStar?.name === star.name;
            const dotColor = star.mag < 0 ? '#FFFFFF' : star.mag < 1.5 ? '#E0E8FF' : '#AABBCC';
            return (
              <TouchableOpacity
                key={star.name}
                onPress={() => setSelectedStar(isSel ? null : star)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  position: 'absolute',
                  left:   star.screenX - size / 2,
                  top:    star.screenY - size / 2,
                }}
              >
                {/* Polaris indicator ring */}
                {isNorth && (
                  <View style={{
                    position: 'absolute',
                    left:   -(size + 4),
                    top:    -(size + 4),
                    width:  size * 3,
                    height: size * 3,
                    borderRadius: size * 1.5,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                    opacity: 0.7,
                  }} />
                )}
                {/* Selected indicator */}
                {isSel && (
                  <View style={{
                    position: 'absolute',
                    left:   -6,
                    top:    -6,
                    width:  size + 12,
                    height: size + 12,
                    borderRadius: (size + 12) / 2,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                  }} />
                )}
                <View style={{
                  width:        size,
                  height:       size,
                  borderRadius: size / 2,
                  backgroundColor: isSel ? Colors.primary : dotColor,
                }} />
              </TouchableOpacity>
            );
          })}

          {/* Star name labels (only for bright mag < 1.5) */}
          {placedStars.map((star) => {
            if (!star.visible || star.mag >= 1.5) return null;
            return (
              <Text
                key={`lbl-${star.name}`}
                style={{
                  position: 'absolute',
                  left: star.screenX + 5,
                  top:  star.screenY - 8,
                  color: '#667788',
                  fontSize: 8,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                }}
              >
                {star.name}
              </Text>
            );
          })}

        </View>{/* end mapCircle */}
      </View>{/* end mapWrapper */}

      {/* FIND NORTH button */}
      <View style={styles.findNorthRow}>
        <TouchableOpacity
          style={styles.findNorthBtn}
          onPress={() => setSelectedStar(starMap['Polaris'] ?? null)}
        >
          <Ionicons name="navigate" size={16} color={Colors.primary} />
          <Text style={styles.findNorthText}>FIND NORTH</Text>
          {polarisAngle !== null && (
            <View style={{
              marginLeft: 8,
              transform: [{ rotate: `${polarisAngle}deg` }],
            }}>
              <Ionicons name="arrow-up" size={16} color={Colors.primary} />
            </View>
          )}
          {polarisAngle === null && (
            <Text style={styles.polarisBelow}>(Polaris below horizon)</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected star info panel */}
      {selectedStar && (
        <View style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <Text style={styles.infoStarName}>{selectedStar.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStar(null)}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoConstellation}>{selectedStar.constellation}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Magnitude</Text>
            <Text style={styles.infoValue}>{selectedStar.mag.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RA / Dec</Text>
            <Text style={styles.infoValue}>{selectedStar.ra.toFixed(2)}h / {selectedStar.dec.toFixed(1)}°</Text>
          </View>
          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.infoLabel}>Nav Note</Text>
            <Text style={[styles.infoValue, { flex: 1, flexWrap: 'wrap' }]}>{selectedStar.navNote}</Text>
          </View>
        </View>
      )}

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.statusText}>LST {lst}</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.statusText}>{locationLabel}</Text>
        </View>
        {compassOk && (
          <View style={styles.statusItem}>
            <Ionicons name="compass" size={12} color={Colors.textMuted} />
            <Text style={styles.statusText}>{Math.round(heading)}°</Text>
          </View>
        )}
      </View>

      {/* Navigation disclaimer */}
      <Text style={styles.disclaimer}>
        For precise navigation, verify with a physical compass.
      </Text>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignSelf: 'stretch',
  },
  headerTitle: {
    flex: 1,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  compassNote: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 6,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  mapWrapper: {
    width:  MAP_DIAMETER + 30,
    height: MAP_DIAMETER + 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
  },
  mapCircle: {
    width:           MAP_DIAMETER,
    height:          MAP_DIAMETER,
    borderRadius:    MAP_RADIUS,
    backgroundColor: '#000000',
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     Colors.cardBorder,
    position:        'absolute',
    left:            15,
    top:             15,
  },
  cardinalLabel: {
    fontSize:   11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    zIndex:     10,
  },
  findNorthRow: {
    marginTop: 14,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  findNorthBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth:     1,
    borderColor:     Colors.primary,
    borderRadius:    4,
  },
  findNorthText: {
    color:      Colors.primary,
    fontSize:   13,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  polarisBelow: {
    color:     Colors.textMuted,
    fontSize:  10,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoPanel: {
    marginTop:        14,
    marginHorizontal: 16,
    backgroundColor:  Colors.surface,
    borderWidth:      1,
    borderColor:      Colors.cardBorder,
    borderRadius:     6,
    padding:          14,
    width:            MAP_DIAMETER + 20,
  },
  infoPanelHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   4,
  },
  infoStarName: {
    color:      Colors.textPrimary,
    fontSize:   17,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  infoConstellation: {
    color:        Colors.secondary,
    fontSize:     11,
    marginBottom: 10,
    fontFamily:   Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   6,
    gap:            10,
  },
  infoLabel: {
    color:     Colors.textMuted,
    fontSize:  11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    width:     72,
  },
  infoValue: {
    color:      Colors.textPrimary,
    fontSize:   11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusBar: {
    flexDirection:    'row',
    justifyContent:   'center',
    gap:              18,
    marginTop:        14,
    paddingHorizontal: 16,
    flexWrap:         'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  statusText: {
    color:     Colors.textMuted,
    fontSize:  10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  disclaimer: {
    color:          Colors.textMuted,
    fontSize:       10,
    textAlign:      'center',
    marginTop:      12,
    paddingHorizontal: 24,
    fontFamily:     Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontStyle:      'italic',
  },
});

export default StarMapScreen;
