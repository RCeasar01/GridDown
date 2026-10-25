/**
 * Tools — "Grouped" layout (design canvas, Oct 2026).
 *
 * Four named groups of two-column tiles plus a chip row of reference tools, one line-icon
 * language throughout (components/ui/Icon). Emergency Protocols lead a fifth group only when
 * at least one triage tree ships in this build.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { ToolsStackParamList } from '../navigation/AppNavigator';
import { getAvailableTrees } from '../triage/registry';
import { Chip, IconName, SectionHeader, Space, Tile } from '../components/ui';
import { requiredPlanName, FEATURE_TIER, PLAN } from '../config/access';

type Nav = NativeStackNavigationProp<ToolsStackParamList, 'ToolsMain'>;
type Screen = keyof ToolsStackParamList;

interface Tool { icon: IconName; title: string; screen: Screen; tag?: string }
interface Group { title: string; tools: Tool[] }

const hamTag = FEATURE_TIER['tools.hamRepeaters'] === PLAN.FREE ? undefined : requiredPlanName('tools.hamRepeaters').toUpperCase();

const GROUPS: Group[] = [
  ...(getAvailableTrees().length > 0
    ? [{ title: 'EMERGENCY', tools: [
        { icon: 'shield' as IconName, title: 'Emergency Protocols', screen: 'Triage' as Screen },
        { icon: 'medical' as IconName, title: 'Medical Reference', screen: 'MedicalReference' as Screen },
      ] }]
    : []),
  { title: 'FIND YOUR WAY', tools: [
    { icon: 'compass', title: 'Position & Waypoints', screen: 'Map' },
    { icon: 'star', title: 'Star Map', screen: 'StarMap' },
    { icon: 'converter', title: 'Coordinate Converter', screen: 'CoordinateConverter' },
    { icon: 'sun', title: 'Natural Navigation', screen: 'NaturalNavigation' },
  ] },
  { title: 'COMMUNICATE', tools: [
    { icon: 'antenna', title: 'HAM Repeaters', screen: 'HamRadio', tag: hamTag },
    { icon: 'radio', title: 'Radio Frequencies', screen: 'Radio' },
    { icon: 'morse', title: 'Morse Code', screen: 'MorseCode' },
    { icon: 'megaphone', title: 'Signaling', screen: 'Signaling' },
  ] },
  { title: 'PLAN & KIT', tools: [
    { icon: 'backpack', title: 'My Kit', screen: 'MyKit' },
    { icon: 'gear', title: 'Gear Inventory', screen: 'GearInventory' },
    { icon: 'flows', title: 'Real-World Flows', screen: 'Flows' },
    { icon: 'family', title: 'Family Planner', screen: 'FamilyPlanner' },
    { icon: 'vehicle', title: 'Vehicle Kit', screen: 'VehicleKit' },
    { icon: 'advisor', title: 'Field Intelligence', screen: 'Advisor' },
  ] },
];

const REFERENCE: Tool[] = [
  { icon: 'calculator', title: 'Survival Calculator', screen: 'SurvivalCalculator' },
  { icon: 'drop', title: 'Water Purification', screen: 'Water' },
  { icon: 'wheat', title: 'Food Storage', screen: 'FoodStorage' },
  { icon: 'knot', title: 'Knots', screen: 'KnotGuide' },
  { icon: 'globe', title: 'Translator', screen: 'Translator' },
  { icon: 'target', title: 'Readiness Scan', screen: 'ReadinessScan' },
  ...(getAvailableTrees().length > 0 ? [] : [{ icon: 'medical' as IconName, title: 'Medical Reference', screen: 'MedicalReference' as Screen }]),
];

export function ToolsScreen() {
  const navigation = useNavigation<Nav>();
  const go = (screen: Screen) => (navigation as unknown as { navigate: (name: Screen) => void }).navigate(screen);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header} accessibilityRole="header">Tools</Text>
        <Text style={styles.subtitle}>Everything works offline.</Text>

        {GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionHeader title={group.title} tone="accent" />
            <View style={styles.grid}>
              {group.tools.map((tool) => (
                <Tile key={tool.title} icon={tool.icon} label={tool.title} tag={tool.tag} onPress={() => go(tool.screen)} style={styles.tile} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.group}>
          <SectionHeader title="REFERENCE" tone="accent" />
          <View style={styles.chips}>
            {REFERENCE.map((tool) => (
              <Chip key={tool.title} label={tool.title} onPress={() => go(tool.screen)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: 32 },
  header: { color: Colors.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: Space.xl },
  group: { marginBottom: Space.xl + 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm + 2 },
  tile: { width: '48%', flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
