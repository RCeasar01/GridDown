import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { CategoryGrid } from '../components/CategoryGrid';
import { LearnStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<LearnStackParamList, 'LearnMain'>;

export function LearnScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Learn</Text>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search bar shortcut */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search guides, topics…</Text>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={styles.sectionTitle}>CATEGORIES</Text>
        <CategoryGrid
          onSelectCategory={(categoryId: string) =>
            navigation.navigate('Category', { categoryId })
          }
        />

        {/* Field Manuals */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>FIELD MANUALS</Text>
        <TouchableOpacity
          style={styles.manualCard}
          onPress={() => navigation.navigate('Category', { categoryId: 'field-manuals' })}
          activeOpacity={0.75}
        >
          <Ionicons name="book" size={22} color={Colors.primary} />
          <View style={styles.manualText}>
            <Text style={styles.manualTitle}>US Army Field Manuals</Text>
            <Text style={styles.manualSub}>Survival, first aid, navigation & more</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Content Packs */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>CONTENT PACKS</Text>
        <TouchableOpacity
          style={styles.manualCard}
          onPress={() => navigation.navigate('ContentPacks')}
          activeOpacity={0.75}
        >
          <Ionicons name="download-outline" size={22} color={Colors.primary} />
          <View style={styles.manualText}>
            <Text style={styles.manualTitle}>Download More Content</Text>
            <Text style={styles.manualSub}>Expand your offline library</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  searchPlaceholder: { color: Colors.textMuted, fontSize: 14 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 1.5,
    marginBottom: 12,
  },
  manualCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 12, padding: 14,
    marginBottom: 10,
  },
  manualText: { flex: 1, gap: 3 },
  manualTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  manualSub: { color: Colors.textSecondary, fontSize: 12 },
});
