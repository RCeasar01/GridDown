import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'MoreMain'>;

// Items that live inside the More stack
const MORE_ITEMS: Array<{
  label: string;
  icon: string;
  description: string;
  action: 'more';
  screen: keyof MoreStackParamList;
}> = [
  { label: 'Checklists',       icon: 'checkbox-outline',  screen: 'Checklists', action: 'more', description: 'Disaster prep checklists' },
  { label: 'Referral Program', icon: 'people-outline',    screen: 'Referral',   action: 'more', description: 'Earn 20% commission' },
  { label: 'Settings',         icon: 'settings-outline',  screen: 'Settings',   action: 'more', description: 'App settings and preferences' },
  { label: 'About the Founder',icon: 'shield-outline',    screen: 'Founder',    action: 'more', description: '100% Veteran-Owned' },
  { label: 'Community',        icon: 'chatbubbles-outline',screen: 'Community',  action: 'more', description: 'Join the GridDown community' },
];

// Items that live in sibling tabs — navigate cross-tab
type CrossTabItem = {
  label: string;
  icon: string;
  description: string;
  tab: string;
  screen: string;
};

const CROSS_TAB_ITEMS: CrossTabItem[] = [
  { label: 'Quizzes',              icon: 'trophy-outline',     tab: 'Drill',  screen: 'DrillMain',   description: 'Test your survival readiness' },
  { label: 'Offline Translator',   icon: 'language-outline',   tab: 'Tools',  screen: 'Translator',  description: 'Offline 10-language translator' },
  { label: 'HAM Radio Repeaters',  icon: 'radio-outline',      tab: 'Tools',  screen: 'HamRadio',    description: 'US repeater database — all 50 states' },
  { label: 'Morse Code',           icon: 'code-slash-outline', tab: 'Tools',  screen: 'MorseCode',   description: 'Encode, decode, and play Morse' },
  { label: 'Offline Map',          icon: 'map-outline',        tab: 'Tools',  screen: 'Map',         description: 'Topo maps — coming soon' },
  { label: 'Content Packs',        icon: 'download-outline',   tab: 'Learn',  screen: 'ContentPacks',description: 'Download additional guides' },
];

export function MoreScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>More</Text>

        {/* Items in the More stack */}
        {MORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.row}
            onPress={() => navigation.navigate(item.screen as any)}
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

        {/* Divider */}
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>QUICK LINKS</Text>

        {/* Items in other tabs — cross-tab navigation */}
        {CROSS_TAB_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.row}
            onPress={() =>
              navigation.navigate(item.tab as any, { screen: item.screen })
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={22} color={Colors.textSecondary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDesc}>{item.description}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color={Colors.textMuted} />
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
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 6 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 1.5,
    marginBottom: 4,
  },
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
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.primaryDim,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowDesc: { color: Colors.textSecondary, fontSize: 12 },
});
