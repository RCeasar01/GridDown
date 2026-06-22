import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Ellipse } from 'react-native-svg';
import { Colors } from '../theme/colors';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type FilterMode = 'All' | Difficulty;

interface KnotData {
  id: string;
  name: string;
  difficulty: Difficulty;
  use: string;
  steps: string[];
  mistake: string;
}

const KNOTS: KnotData[] = [
  {
    id: 'bowline', name: 'Bowline', difficulty: 'Medium',
    use: 'Rescue and securing loads — creates a fixed loop that won\'t slip or tighten.',
    steps: [
      'Form a small loop in the standing part.',
      'Pass the working end up through the loop from below.',
      'Go around the standing part (outside to inside).',
      'Pass back down through the small loop.',
      'Tighten by pulling standing part and loop.',
    ],
    mistake: 'Loop formed backwards — verify working end comes up from below the loop.',
  },
  {
    id: 'figure8', name: 'Figure-8', difficulty: 'Easy',
    use: 'Stopper knot preventing rope from running through a block or device.',
    steps: [
      'Make an overhand loop.',
      'Pass the working end behind the standing part.',
      'Feed the end through the first loop from front to back.',
      'Tighten.',
    ],
    mistake: 'Confusing with overhand knot — figure-8 adds one extra twist.',
  },
  {
    id: 'figure8ft', name: 'Figure-8 Follow Through', difficulty: 'Medium',
    use: 'Anchor to harness or fixed point — creates a secure fixed loop.',
    steps: [
      'Tie a figure-8 ~18" from working end.',
      'Thread working end through the anchor or harness.',
      'Rethread the working end through the figure-8 following the original path exactly.',
      'Tighten — final knot should be a clean figure-8 with parallel strands.',
    ],
    mistake: 'Crossing strands during rethreading — strands must run parallel throughout.',
  },
  {
    id: 'clovehitch', name: 'Clove Hitch', difficulty: 'Easy',
    use: 'Quick attachment to poles, posts, or carabiners — adjustable but not load-bearing alone.',
    steps: [
      'Pass rope over the object.',
      'Cross over the standing part, wrap around again.',
      'Tuck under the last wrap.',
      'Tighten both ends.',
    ],
    mistake: 'Using as the only attachment — always backup with a second hitch or stopper.',
  },
  {
    id: 'tautline', name: 'Taut Line Hitch', difficulty: 'Medium',
    use: 'Adjustable tension on tent lines, tarps, and clotheslines.',
    steps: [
      'Pass rope around the anchor (stake/tree).',
      'Make two loops around the standing part moving toward the anchor.',
      'Make one final loop outside (away from anchor).',
      'Tighten — the hitch should slide when pushed, lock under tension.',
    ],
    mistake: 'Wrapping in wrong direction — test that hitch locks under load and slides when slack.',
  },
  {
    id: 'truckers', name: 'Truckers Hitch', difficulty: 'Hard',
    use: 'Mechanical advantage for securing loads — creates a 3:1 mechanical advantage for tensioning.',
    steps: [
      'Tie a slippery half hitch mid-rope to create a loop.',
      'Pass the working end around the lower anchor point.',
      'Feed through the mid-rope loop.',
      'Pull down for tension (3:1 advantage).',
      'Secure with two half hitches.',
    ],
    mistake: 'Using an overhand knot instead of slippery half hitch — creates a jam knot that\'s impossible to untie under load.',
  },
  {
    id: 'squareknot', name: 'Square Knot', difficulty: 'Easy',
    use: 'Bandaging and joining two ropes of equal diameter.',
    steps: [
      'Cross right over left, wrap under.',
      'Cross left over right, wrap under.',
      'Pull both ends to tighten.',
      'Remember: right over left, left over right.',
    ],
    mistake: 'Tying a granny knot (right over left, right over left) — looks similar but slips under load.',
  },
  {
    id: 'sheetbend', name: 'Sheet Bend', difficulty: 'Easy',
    use: 'Joining two ropes of different diameters.',
    steps: [
      'Form a bight in the larger/stiffer rope.',
      'Pass the smaller rope through the bight from below.',
      'Wrap around both parts of the bight.',
      'Tuck under its own standing part.',
      'Tighten.',
    ],
    mistake: 'Passing the tail through the wrong side of the bight — both tails must exit on the same side.',
  },
  {
    id: 'prusik', name: 'Prusik', difficulty: 'Medium',
    use: 'Ascending a fixed rope — grips when weighted, slides when unweighted.',
    steps: [
      'Create a loop with the Prusik cord (smaller diameter than main rope).',
      'Wrap the loop around the main rope 3 times.',
      'Feed the loop ends through the Prusik loop and dress (align the wraps).',
      'Weight to test — wraps should grip; release weight and slide to reposition.',
    ],
    mistake: 'Using cord same diameter as main rope — Prusik requires 60–80% of main rope diameter to function.',
  },
  {
    id: 'blakes', name: "Blake's Hitch", difficulty: 'Hard',
    use: 'Descending a fixed rope — more easily adjustable than Prusik for controlled descent.',
    steps: [
      'Wrap the working end around the main rope 4 times moving upward.',
      'Bring the working end down and behind the standing rope.',
      'Pass through the middle of the wraps.',
      'Clip working end to harness or hand loop.',
    ],
    mistake: 'Insufficient wraps — 4 wraps minimum for reliable friction.',
  },
  {
    id: 'timber', name: 'Timber Hitch', difficulty: 'Easy',
    use: 'Dragging logs or securing cylindrical loads.',
    steps: [
      'Wrap rope around the log.',
      'Pass the working end around the standing part.',
      'Wrap the working end around itself 3 times in the direction of pull.',
      'Load the rope — wraps tighten against themselves.',
    ],
    mistake: 'Too few self-wraps — always 3+ or knot unravels under vibration/bouncing load.',
  },
  {
    id: 'constrictor', name: 'Constrictor Knot', difficulty: 'Medium',
    use: 'Semi-permanent whipping and binding — extremely difficult to untie when loaded.',
    steps: [
      'Make two turns around the object, crossing one turn over the other.',
      'Tuck the working end under the crossed section.',
      'Tighten by pulling both ends simultaneously.',
    ],
    mistake: 'Attempting to untie under load — the constrictor is designed to cinch permanently; plan to cut it off.',
  },
  {
    id: 'waterknot', name: 'Water Knot', difficulty: 'Easy',
    use: 'Joining webbing or slings — the only reliable flat-material joining knot.',
    steps: [
      'Tie an overhand knot in one piece of webbing.',
      'Feed the second piece through the knot following the original path exactly in reverse.',
      'Ensure the webbing lies flat throughout (no twists).',
      'Leave 3+ inch tails on both sides.',
    ],
    mistake: 'Allowing webbing to twist through the knot — must lie perfectly flat.',
  },
  {
    id: 'munter', name: 'Munter Hitch', difficulty: 'Hard',
    use: 'Belay and rappel without a belay device — emergency technique.',
    steps: [
      'Form a loop and clip to carabiner with rope running through.',
      'Twist the loop and clip both sides of the rope through the carabiner.',
      'The knot should be able to flip from belay to rappel mode.',
    ],
    mistake: 'Using non-locking carabiner — Munter Hitch REQUIRES a locking HMS carabiner. Non-locking carabiners will gate-load and fail.',
  },
  {
    id: 'doublefisherman', name: "Double Fisherman's", difficulty: 'Hard',
    use: 'Joining two climbing ropes and creating Prusik loops — extremely secure.',
    steps: [
      'Lay both ropes parallel.',
      'On the left rope: wrap the right rope\'s end around the left rope twice, pass through both loops.',
      'On the right rope: repeat step 2 with the left rope\'s end.',
      'Pull both standing parts — the two knots should slide together and lock.',
    ],
    mistake: 'Tying identical knots instead of mirror-image — each knot must be tied in opposite direction to lock against each other.',
  },
];

// ── SVG Diagrams ──────────────────────────────────────────────────────────────

const R = Colors.primary;   // rope color
const A = Colors.secondary; // accent color
const BG = Colors.surface;

const KnotSVG: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'bowline':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          {/* standing part */}
          <Line x1="100" y1="10" x2="100" y2="60" stroke={R} strokeWidth="4" strokeLinecap="round" />
          {/* small loop */}
          <Ellipse cx="100" cy="72" rx="14" ry="10" fill="none" stroke={R} strokeWidth="4" />
          {/* working end up through loop */}
          <Path d="M 86 90 Q 70 120 70 145" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* main loop */}
          <Ellipse cx="100" cy="120" rx="30" ry="22" fill="none" stroke={A} strokeWidth="3" />
          {/* around standing part */}
          <Path d="M 114 72 Q 130 80 130 60 Q 130 40 100 35" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 114 72 Q 114 90 100 90" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'figure8':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="100" y1="10" x2="100" y2="45" stroke={R} strokeWidth="4" strokeLinecap="round" />
          <Ellipse cx="100" cy="65" rx="22" ry="18" fill="none" stroke={R} strokeWidth="4" />
          <Ellipse cx="100" cy="108" rx="28" ry="22" fill="none" stroke={A} strokeWidth="4" />
          <Line x1="100" y1="130" x2="100" y2="150" stroke={R} strokeWidth="4" strokeLinecap="round" />
        </Svg>
      );
    case 'figure8ft':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="60" y1="10" x2="60" y2="45" stroke={R} strokeWidth="4" strokeLinecap="round" />
          <Ellipse cx="80" cy="62" rx="22" ry="16" fill="none" stroke={R} strokeWidth="4" />
          <Ellipse cx="80" cy="100" rx="28" ry="20" fill="none" stroke={A} strokeWidth="4" />
          <Path d="M 108 62 Q 140 80 140 110 Q 140 130 108 130 Q 80 130 80 120" stroke={R} strokeWidth="3" fill="none" strokeDasharray="5,3" strokeLinecap="round" />
          <Circle cx="60" cy="10" r="5" fill={A} />
        </Svg>
      );
    case 'clovehitch':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          {/* vertical pole */}
          <Rect x="88" y="10" width="24" height="140" fill="#333" rx="4" />
          {/* first wrap */}
          <Path d="M 30 55 Q 88 55 88 55 L 112 55 Q 160 55 160 70 Q 160 85 112 85 L 88 85 Q 88 85 88 70" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* second wrap */}
          <Path d="M 88 85 Q 30 85 30 100 Q 30 115 88 115 L 112 115 Q 160 115 160 100" stroke={A} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Line x1="160" y1="100" x2="190" y2="85" stroke={A} strokeWidth="4" strokeLinecap="round" />
        </Svg>
      );
    case 'tautline':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Circle cx="20" cy="80" r="10" fill="#333" stroke={A} strokeWidth="2" />
          <Line x1="30" y1="80" x2="80" y2="80" stroke={R} strokeWidth="4" strokeLinecap="round" />
          <Path d="M 80 80 Q 100 60 120 80 Q 140 100 120 80 Q 100 60 120 80" stroke={R} strokeWidth="4" fill="none" />
          <Path d="M 120 80 Q 140 65 155 80 Q 170 95 155 80" stroke={A} strokeWidth="4" fill="none" />
          <Line x1="155" y1="80" x2="190" y2="80" stroke={R} strokeWidth="4" strokeLinecap="round" />
        </Svg>
      );
    case 'truckers':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="20" y1="30" x2="180" y2="30" stroke={R} strokeWidth="4" strokeLinecap="round" />
          <Path d="M 100 30 Q 100 50 85 60 Q 70 70 85 80 Q 100 90 100 30" stroke={R} strokeWidth="3" fill="none" />
          <Line x1="20" y1="130" x2="85" y2="80" stroke={A} strokeWidth="4" strokeLinecap="round" />
          <Path d="M 85 80 L 85 60 Q 95 55 95 70 Q 95 85 85 80" stroke={A} strokeWidth="3" fill="none" />
          <Line x1="85" y1="80" x2="180" y2="130" stroke={A} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'squareknot':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Path d="M 10 70 Q 50 70 60 80 Q 70 90 90 80 Q 110 70 120 80 Q 130 90 150 80 Q 170 70 190 70" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 10 90 Q 50 90 60 80 Q 70 70 90 80 Q 110 90 120 80 Q 130 70 150 80 Q 170 90 190 90" stroke={A} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Line x1="10" y1="70" x2="10" y2="90" stroke={R} strokeWidth="3" strokeLinecap="round" />
          <Line x1="190" y1="70" x2="190" y2="90" stroke={A} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'sheetbend':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          {/* bight in thick rope */}
          <Path d="M 30 60 Q 100 40 170 60 Q 170 100 100 100 Q 30 100 30 60" stroke={R} strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* thin rope through */}
          <Path d="M 20 130 Q 100 90 130 75 Q 170 55 175 55" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6,2" />
          <Path d="M 130 75 Q 130 110 100 110 Q 70 110 60 100" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'prusik':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="100" y1="5" x2="100" y2="155" stroke={R} strokeWidth="6" strokeLinecap="round" />
          <Path d="M 60 60 Q 100 50 140 60 Q 140 70 100 70 Q 60 70 60 80 Q 60 90 100 90 Q 140 90 140 100 Q 140 110 100 110 Q 60 110 60 60" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M 60 60 L 60 130 Q 80 145 100 140 Q 120 135 140 130 L 140 100" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'blakes':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="100" y1="5" x2="100" y2="155" stroke={R} strokeWidth="6" strokeLinecap="round" />
          {[40, 60, 80, 100].map((y, i) => (
            <Path key={i} d={`M 65 ${y} Q 100 ${y - 8} 135 ${y} Q 135 ${y + 10} 100 ${y + 10} Q 65 ${y + 10} 65 ${y}`} stroke={A} strokeWidth="3" fill="none" />
          ))}
          <Path d="M 65 40 L 65 100 Q 65 120 80 130 L 130 150" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'timber':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Rect x="30" y="60" width="140" height="40" fill="#3A2A1A" rx="8" />
          <Path d="M 60 60 Q 60 30 80 30 Q 100 30 100 60" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 100 60 Q 110 50 110 40 Q 110 30 100 30" stroke={R} strokeWidth="3" fill="none" />
          <Path d="M 100 30 Q 90 30 90 40 Q 90 50 95 55" stroke={R} strokeWidth="3" fill="none" />
          <Line x1="60" y1="100" x2="10" y2="120" stroke={R} strokeWidth="4" strokeLinecap="round" />
        </Svg>
      );
    case 'constrictor':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Rect x="30" y="55" width="140" height="50" fill="#333" rx="6" />
          <Path d="M 10 75 Q 50 65 100 65 Q 150 65 190 75" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 190 75 Q 150 90 100 90 Q 50 90 10 100" stroke={A} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 10 100 Q 50 65 100 65" stroke={A} strokeWidth="3" fill="none" strokeDasharray="4,2" strokeLinecap="round" />
        </Svg>
      );
    case 'waterknot':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Path d="M 10 70 Q 60 70 80 80 Q 100 90 100 80 Q 100 70 120 65 Q 140 60 190 65" stroke={R} strokeWidth="6" fill="none" strokeLinecap="round" />
          <Path d="M 10 90 Q 60 90 80 80 Q 100 70 100 80 Q 100 90 120 95 Q 140 100 190 95" stroke={A} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="8,2" />
        </Svg>
      );
    case 'munter':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Ellipse cx="100" cy="80" rx="22" ry="30" fill="none" stroke="#555" strokeWidth="6" />
          <Circle cx="100" cy="80" r="8" fill="none" stroke="#777" strokeWidth="3" />
          <Path d="M 10 50 Q 70 50 78 65 Q 86 80 78 95 Q 70 110 78 125 Q 86 140 130 140" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 130 40 Q 122 55 122 80 Q 122 105 130 120" stroke={A} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'doublefisherman':
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Line x1="10" y1="70" x2="190" y2="70" stroke={R} strokeWidth="4" strokeLinecap="round" />
          <Line x1="10" y1="90" x2="190" y2="90" stroke={A} strokeWidth="4" strokeLinecap="round" />
          <Path d="M 55 60 Q 55 70 65 70 Q 75 70 75 60 Q 75 50 65 50 Q 55 50 55 60" stroke={R} strokeWidth="3" fill="none" />
          <Path d="M 65 50 Q 70 35 80 55 Q 90 70 80 90" stroke={R} strokeWidth="3" fill="none" />
          <Path d="M 125 100 Q 125 90 135 90 Q 145 90 145 100 Q 145 110 135 110 Q 125 110 125 100" stroke={A} strokeWidth="3" fill="none" />
          <Path d="M 135 110 Q 140 125 150 105 Q 160 90 150 70" stroke={A} strokeWidth="3" fill="none" />
        </Svg>
      );
    default:
      return (
        <Svg width="200" height="160" viewBox="0 0 200 160">
          <Rect width="200" height="160" fill={BG} rx="6" />
          <Path d="M 40 80 Q 80 40 120 80 Q 160 120 160 80" stroke={R} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
      );
  }
};

// ── Knot Card ─────────────────────────────────────────────────────────────────

const difficultyColor: Record<Difficulty, string> = {
  Easy: Colors.secondary,
  Medium: Colors.warning,
  Hard: Colors.danger,
};

interface KnotCardProps { knot: KnotData; }

const KnotCard: React.FC<KnotCardProps> = ({ knot }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded((e) => !e)} activeOpacity={0.75}>
        <View style={styles.cardHeader}>
          <Text style={styles.knotName}>{knot.name}</Text>
          <View style={[styles.diffBadge, { backgroundColor: difficultyColor[knot.difficulty] + '33' }]}>
            <Text style={[styles.diffText, { color: difficultyColor[knot.difficulty] }]}>
              {knot.difficulty}
            </Text>
          </View>
        </View>
        <Text style={styles.knotUse}>{knot.use}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.svgContainer}>
            <KnotSVG id={knot.id} />
          </View>
          <Text style={styles.sectionLabel}>Steps</Text>
          {knot.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <View style={styles.mistakeBox}>
            <Text style={styles.mistakeLabel}>⚠ Common Mistake</Text>
            <Text style={styles.mistakeText}>{knot.mistake}</Text>
          </View>
          <View style={styles.animatedKnotBox}>
            <Text style={styles.animatedKnotText}>
              🎯 For animated visual guides, search{' '}
              <Text style={styles.animatedKnotLink}>"animated knot {knot.name}"</Text>
              {' '}on animatedknots.com — free, step-by-step animations.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export const KnotGuideScreen: React.FC = () => {
  const [filter, setFilter] = useState<FilterMode>('All');
  const [search, setSearch] = useState('');

  const filtered = KNOTS.filter((k) => {
    const matchesDiff = filter === 'All' || k.difficulty === filter;
    const matchesSearch = k.name.toLowerCase().includes(search.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  const FILTERS: FilterMode[] = ['All', 'Easy', 'Medium', 'Hard'];
  const filterColor: Record<FilterMode, string> = {
    All: Colors.primary,
    Easy: Colors.secondary,
    Medium: Colors.warning,
    Hard: Colors.danger,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>KNOT GUIDE</Text>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search knots..."
        placeholderTextColor={Colors.textMuted}
        autoCorrect={false}
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: filterColor[f] + '22', borderColor: filterColor[f] },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: filterColor[f] }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => <KnotCard knot={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 16 },
  screenTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.primary,
    letterSpacing: 2, marginHorizontal: 16, marginBottom: 14,
  },
  searchInput: {
    marginHorizontal: 16, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8,
    padding: 11, color: Colors.textPrimary, fontSize: 14, marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  knotName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  diffBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  knotUse: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  expandedContent: { marginTop: 14 },
  svgContainer: { alignItems: 'center', marginBottom: 14 },
  sectionLabel: {
    fontSize: 10, color: Colors.textSecondary, letterSpacing: 1.5,
    fontWeight: '700', marginBottom: 8,
  },
  stepRow: { flexDirection: 'row', marginBottom: 8 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primaryDim,
    color: Colors.primary, fontSize: 11, fontWeight: '700',
    textAlign: 'center', lineHeight: 22, marginRight: 10, marginTop: 1,
  },
  stepText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },
  mistakeBox: {
    backgroundColor: Colors.danger + '15', borderLeftWidth: 3, borderLeftColor: Colors.danger,
    borderRadius: 6, padding: 12, marginTop: 10,
  },
  mistakeLabel: { fontSize: 11, color: Colors.danger, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  mistakeText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  animatedKnotBox: {
    backgroundColor: Colors.primaryDim, borderRadius: 6, padding: 10,
    marginTop: 10, borderWidth: 1, borderColor: Colors.primary,
  },
  animatedKnotText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  animatedKnotLink: { color: Colors.primary, fontWeight: '700' },
});

export default KnotGuideScreen;
