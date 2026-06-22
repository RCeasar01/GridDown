import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { ToolsStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ToolsStackParamList, 'ToolsMain'>;

type ToolCard = {
  emoji: string;
  title: string;
  screen: keyof ToolsStackParamList;
};

const TOOLS: ToolCard[] = [
  { emoji: '📡', title: 'HAM Radio Repeaters', screen: 'HamRadio' },
  { emoji: '🔤', title: 'Morse Code', screen: 'MorseCode' },
  { emoji: '🗺️', title: 'Offline Map', screen: 'Map' },
  { emoji: '🌐', title: 'Offline Translator', screen: 'Translator' },
  { emoji: '🎒', title: 'My Kit', screen: 'MyKit' },
  { emoji: '🌊', title: 'Real-World Flows', screen: 'Flows' },
  { emoji: '🤖', title: 'Field Intelligence', screen: 'Advisor' },
  { emoji: '🧮', title: 'Survival Calculator', screen: 'SurvivalCalculator' },
  { emoji: '⭐', title: 'Star Map', screen: 'StarMap' },
  { emoji: '🎯', title: 'Readiness Scan', screen: 'ReadinessScan' },
  { emoji: '🎽', title: 'Gear Inventory', screen: 'GearInventory' },
  { emoji: '👨‍👩‍👧', title: 'Family Planner', screen: 'FamilyPlanner' },
  { emoji: '📍', title: 'Coordinate Converter', screen: 'CoordinateConverter' },
  { emoji: '🪢', title: 'Knot Guide', screen: 'KnotGuide' },
  { emoji: '📻', title: 'Radio Frequencies', screen: 'Radio' },
  { emoji: '💧', title: 'Water Purification', screen: 'Water' },
  { emoji: '🚗', title: 'Vehicle Emergency Kit', screen: 'VehicleKit' },
  { emoji: '📣', title: 'Signaling & Comms', screen: 'Signaling' },
  { emoji: '🧭', title: 'Natural Navigation', screen: 'NaturalNavigation' },
  { emoji: '🌾', title: 'Food Storage Calc', screen: 'FoodStorage' },
  { emoji: '🩺', title: 'Medical Reference', screen: 'MedicalReference' },
];

export function ToolsScreen() {
  const navigation = useNavigation<Nav>();

  const handlePress = (tool: ToolCard) => {
    navigation.navigate(tool.screen as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Tools</Text>
        <Text style={styles.subtitle}>Offline survival tools & resources</Text>

        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.title}
              style={styles.card}
              onPress={() => handlePress(tool)}
              activeOpacity={0.75}
            >
              <Text style={styles.cardEmoji}>{tool.emoji}</Text>
              <Text style={styles.cardTitle}>{tool.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary, fontSize: 14, marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: { fontSize: 24 },
  cardTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
});
