import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';

const MORE_ITEMS = [
  { label: 'Checklists', icon: 'checkbox-outline', screen: 'Checklists', description: 'Disaster prep checklists' },
  { label: 'Offline Map', icon: 'map-outline', screen: 'Map', description: 'Topo maps — coming soon' },
  { label: 'Content Packs', icon: 'download-outline', screen: 'ContentPacks', description: 'Download additional guides' },
  { label: 'Referral Program', icon: 'people-outline', screen: 'Referral', description: 'Earn 20% commission' },
  { label: 'Settings', icon: 'settings-outline', screen: 'Settings', description: 'App settings and preferences' },
  { label: 'About the Founder', icon: 'shield-outline', screen: 'Founder', description: '100% Veteran-Owned' },
];

export function MoreScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>More</Text>
        {MORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.row}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 10 },
  header: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 14,
    minHeight: 64,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowDesc: { color: Colors.textSecondary, fontSize: 12 },
});
