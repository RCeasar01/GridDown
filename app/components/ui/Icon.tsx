/**
 * Icon — GridDown's own line-icon set, drawn as SVG strokes so every phone renders the same
 * glyph (emoji differ per vendor and look like a text message). 24-unit grid, 1.8 stroke,
 * round caps. Add a name here rather than reaching for an emoji anywhere in the app.
 */
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '../../theme/colors';

export type IconName =
  | 'alert' | 'search' | 'moon' | 'moonFilled' | 'chevronRight' | 'target' | 'checkCircle'
  | 'compass' | 'star' | 'converter' | 'sun'
  | 'antenna' | 'radio' | 'morse' | 'megaphone'
  | 'backpack' | 'flows' | 'family' | 'vehicle' | 'gear'
  | 'calculator' | 'drop' | 'knot' | 'globe' | 'medical' | 'advisor' | 'shield' | 'wheat' | 'clock';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = Colors.primary, strokeWidth = 1.8 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {glyph(name, p, color)}
    </Svg>
  );
}

type P = { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: string };

function glyph(name: IconName, p: P, color: string): React.ReactNode {
  switch (name) {
    case 'alert':
      return <><Path d="M12 3L2 20h20L12 3z" {...p} /><Path d="M12 10v4" {...p} /><Path d="M12 17h.01" {...p} strokeWidth={p.strokeWidth + 0.6} /></>;
    case 'search':
      return <><Circle cx={11} cy={11} r={7} {...p} /><Path d="M20 20l-3.5-3.5" {...p} /></>;
    case 'moon':
      return <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...p} />;
    case 'moonFilled':
      return <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...p} fill={color} />;
    case 'chevronRight':
      return <Path d="M9 6l6 6-6 6" {...p} strokeWidth={2} />;
    case 'target':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Circle cx={12} cy={12} r={4} {...p} /></>;
    case 'checkCircle':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M8 12.5l2.5 2.5L16 10" {...p} /></>;
    case 'compass':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} /></>;
    case 'star':
      return <Path d="M12 3l2.4 5.2 5.6.6-4.2 3.9 1.2 5.6L12 15.5l-5 2.8 1.2-5.6L4 8.8l5.6-.6z" {...p} />;
    case 'converter':
      return <><Path d="M4 18h16" {...p} /><Path d="M6 18V9l6-4 6 4v9" {...p} /><Path d="M12 5v13" {...p} /></>;
    case 'sun':
      return <><Circle cx={12} cy={12} r={4} {...p} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" {...p} /></>;
    case 'antenna':
      return <><Path d="M12 20V10" {...p} /><Path d="M8 14a6 6 0 0 1 8 0" {...p} /><Path d="M5 11a10 10 0 0 1 14 0" {...p} /><Circle cx={12} cy={20} r={1} {...p} fill={color} /></>;
    case 'radio':
      return <><Rect x={3} y={8} width={18} height={12} rx={2} {...p} /><Path d="M7 8l9-4" {...p} /><Circle cx={8} cy={14} r={2} {...p} /><Path d="M13 13h5M13 16h5" {...p} /></>;
    case 'morse':
      return <><Path d="M3 12h.01M7 12h.01" {...p} strokeWidth={2.6} /><Path d="M11 12h4" {...p} strokeWidth={2.6} /><Path d="M19 12h2" {...p} strokeWidth={2.6} /></>;
    case 'megaphone':
      return <><Path d="M4 10v4l10 4V6z" {...p} /><Path d="M17 9a4 4 0 0 1 0 6" {...p} /></>;
    case 'backpack':
      return <><Path d="M6 8h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" {...p} /><Path d="M9 8V6a3 3 0 0 1 6 0v2" {...p} /><Path d="M8 14h8" {...p} /></>;
    case 'flows':
      return <><Path d="M4 6h16M4 12h10M4 18h7" {...p} /><Path d="M17 15l2 2 4-4" {...p} /></>;
    case 'family':
      return <><Circle cx={9} cy={8} r={3} {...p} /><Circle cx={17} cy={9} r={2.4} {...p} /><Path d="M3 20a6 6 0 0 1 12 0" {...p} /><Path d="M15 20a5 5 0 0 1 6-4.8" {...p} /></>;
    case 'vehicle':
      return <><Path d="M5 17h14l-1.5-6h-11z" {...p} /><Path d="M7 11l1.5-4h7L17 11" {...p} /><Circle cx={7.5} cy={17} r={1.5} {...p} /><Circle cx={16.5} cy={17} r={1.5} {...p} /></>;
    case 'gear':
      return <><Rect x={4} y={7} width={16} height={13} rx={2} {...p} /><Path d="M9 7V5h6v2" {...p} /><Path d="M4 12h16" {...p} /><Path d="M12 11v3" {...p} /></>;
    case 'calculator':
      return <><Rect x={5} y={3} width={14} height={18} rx={2} {...p} /><Path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3" {...p} /></>;
    case 'drop':
      return <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...p} />;
    case 'knot':
      return <><Path d="M5 12c0-3 2-5 4.5-5S14 9 14 12s-2 5-4.5 5S5 15 5 12z" {...p} /><Path d="M10 12c0-3 2-5 4.5-5S19 9 19 12s-2 5-4.5 5S10 15 10 12z" {...p} /></>;
    case 'globe':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M3 12h18" {...p} /><Path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...p} /></>;
    case 'medical':
      return <><Rect x={3} y={6} width={18} height={14} rx={2} {...p} /><Path d="M9 6V4h6v2" {...p} /><Path d="M12 10v6M9 13h6" {...p} /></>;
    case 'advisor':
      return <><Rect x={4} y={5} width={16} height={12} rx={3} {...p} /><Path d="M9 11h.01M15 11h.01" {...p} strokeWidth={2.4} /><Path d="M12 17v3" {...p} /><Path d="M8 20h8" {...p} /></>;
    case 'shield':
      return <><Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...p} /><Path d="M12 8v6M9 11h6" {...p} /></>;
    case 'wheat':
      return <><Path d="M12 21V9" {...p} /><Path d="M12 9c-3 0-5-2-5-5 3 0 5 2 5 5zM12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 9c3 0 5-2 5-5-3 0-5 2-5 5zM12 13c3 0 5-2 5-5-3 0-5 2-5 5z" {...p} /></>;
    case 'clock':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7v5l3 2" {...p} /></>;
    default:
      return null;
  }
}
