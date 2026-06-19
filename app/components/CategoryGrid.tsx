import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { categoryDescription } from '../utils/helpers';

export const CATEGORIES = [
  'water', 'fire', 'shelter', 'food',
  'medical', 'navigation', 'comms', 'security',
  'tools', 'disaster', 'vehicle', 'homesteading',
];

export const CATEGORY_LABELS: Record<string, string> = {
  water: 'Water',
  fire: 'Fire',
  shelter: 'Shelter',
  food: 'Food',
  medical: 'Medical',
  navigation: 'Navigation',
  comms: 'Comms',
  security: 'Security',
  tools: 'Tools',
  disaster: 'Disaster',
  vehicle: 'Vehicle',
  homesteading: 'Homestead',
};

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IoniconsName> = {
  water: 'water',
  fire: 'flame',
  shelter: 'home',
  food: 'leaf',
  medical: 'medkit',
  navigation: 'compass',
  comms: 'radio',
  security: 'shield',
  tools: 'construct',
  disaster: 'warning',
  vehicle: 'car',
  homesteading: 'nutrition',
};

interface CategoryGridProps {
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  return (
    <FlatList
      data={CATEGORIES}
      keyExtractor={(item) => item}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.cell}
          onPress={() => onSelectCategory(item)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={CATEGORY_ICONS[item] ?? 'apps'}
            size={28}
            color={Colors.primary}
            style={styles.icon}
          />
          <Text style={styles.label}>{CATEGORY_LABELS[item]}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {categoryDescription(item)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    minHeight: 108,
    gap: 6,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
});
