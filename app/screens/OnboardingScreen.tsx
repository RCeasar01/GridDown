import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';

// ─── Data ──────────────────────────────────────────────────────────────────────

interface ProfileOption {
  id: string;
  icon: string;
  label: string;
  sub: string;
}

interface RegionOption {
  id: string;
  label: string;
  note?: string;
}

const PROFILES: ProfileOption[] = [
  { id: 'urban',   icon: '🏙',  label: 'Urban / Civil Unrest',   sub: 'City-grid preparedness' },
  { id: 'rural',   icon: '🌲',  label: 'Rural Homestead',         sub: 'Off-grid self-reliance' },
  { id: 'vehicle', icon: '🚗',  label: 'Vehicle / Travel',        sub: 'Mobile survival' },
  { id: 'medic',   icon: '🩺',  label: 'Medic-Minded / TCCC',     sub: 'Trauma & field medicine' },
  { id: 'comms',   icon: '📡',  label: 'HAM & Comms',             sub: 'Radio & communication' },
  { id: 'disaster',icon: '🌀',  label: 'Natural Disaster',        sub: 'Storm & event response' },
];

const REGIONS: RegionOption[] = [
  { id: 'northeast',    label: 'Northeast US',           note: 'Blizzards, nor\'easters' },
  { id: 'southeast',    label: 'Southeast US',           note: 'Hurricanes, floods' },
  { id: 'midwest',      label: 'Midwest US',             note: 'Tornadoes, ice storms' },
  { id: 'southwest',    label: 'Southwest US',           note: 'Wildfires, earthquakes' },
  { id: 'northwest',    label: 'Northwest US',           note: 'Earthquakes, tsunamis' },
  { id: 'alaska',       label: 'Alaska',                 note: 'Extreme cold, quakes' },
  { id: 'hawaii',       label: 'Hawaii',                 note: 'Hurricanes, tsunamis' },
  { id: 'international',label: 'International / Other',  note: 'General preparedness' },
];

const PROFILE_LABELS: Record<string, string> = {
  urban: 'Urban / Civil Unrest',
  rural: 'Rural Homestead',
  vehicle: 'Vehicle / Travel',
  medic: 'Medic-Minded / TCCC',
  comms: 'HAM & Comms',
  disaster: 'Natural Disaster',
};

const REGION_LABELS: Record<string, string> = {
  northeast: 'Northeast US',
  southeast: 'Southeast US',
  midwest: 'Midwest US',
  southwest: 'Southwest US',
  northwest: 'Northwest US',
  alaska: 'Alaska',
  hawaii: 'Hawaii',
  international: 'International / Other',
};

// ─── Screens ───────────────────────────────────────────────────────────────────

function Screen1({ onSkip, onNext }: { onSkip: () => void; onNext: () => void }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.screen1Center}>
        <View style={styles.veteranBadge}>
          <Text style={styles.veteranBadgeText}>🎖️  100% VETERAN-OWNED</Text>
        </View>

        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconPlaceholderText}>⚡</Text>
        </View>

        <Text style={styles.appTitle}>GRIDDOWN</Text>
        <Text style={styles.appTagline}>When help is not coming.</Text>
      </View>

      <View style={styles.screen1Buttons}>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>SKIP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>GET STARTED →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Screen2({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>SELECT YOUR PRIMARY PROFILE</Text>
        <Text style={styles.screenSubtitle}>We'll personalize your experience.</Text>

        <View style={styles.profileGrid}>
          {PROFILES.map((p) => {
            const isSelected = selected === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.profileCard, isSelected && styles.profileCardSelected]}
                onPress={() => onSelect(p.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.profileIcon}>{p.icon}</Text>
                <Text style={[styles.profileLabel, isSelected && styles.profileLabelSelected]}>
                  {p.label}
                </Text>
                <Text style={styles.profileSub}>{p.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
          disabled={!selected}
        >
          <Text style={styles.primaryBtnText}>NEXT →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Screen3({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>YOUR REGION</Text>
        <Text style={styles.screenSubtitle}>We'll pin relevant disaster types.</Text>

        <View style={styles.regionList}>
          {REGIONS.map((r) => {
            const isSelected = selected === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.regionCard, isSelected && styles.regionCardSelected]}
                onPress={() => onSelect(r.id)}
                activeOpacity={0.7}
              >
                <View style={styles.regionCardInner}>
                  <Text style={[styles.regionLabel, isSelected && styles.regionLabelSelected]}>
                    {r.label}
                  </Text>
                  {r.note ? (
                    <Text style={styles.regionNote}>{r.note}</Text>
                  ) : null}
                </View>
                {isSelected && <Text style={styles.regionCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
          disabled={!selected}
        >
          <Text style={styles.primaryBtnText}>NEXT →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Screen4({
  profile,
  region,
  onStart,
}: {
  profile: string;
  region: string;
  onStart: () => void;
}) {
  const profileLabel = PROFILE_LABELS[profile] ?? profile;
  const regionLabel = REGION_LABELS[region] ?? region;

  const bullets = [
    `📌 ${profileLabel} categories pinned to top`,
    `🌀 ${regionLabel} disaster guides highlighted`,
    `🎯 Daily Drills tailored to ${profileLabel}`,
  ];

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screen4Center}>
        <Text style={styles.readyCheckmark}>✓</Text>
        <Text style={styles.screenTitle}>YOU'RE SET UP</Text>
        <Text style={styles.screenSubtitle}>
          Personalized for {profileLabel} · {regionLabel}
        </Text>

        <View style={styles.bulletList}>
          {bullets.map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.startBtnContainer}>
        <TouchableOpacity onPress={onStart} style={styles.startBtn}>
          <Text style={styles.startBtnText}>START USING GRIDDOWN →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const { completeOnboarding } = useAppStore();
  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1);
  const [profile, setProfile] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  const statusBarHeight =
    Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

  async function handleStart() {
    if (profile && region) {
      await completeOnboarding(profile, region);
    }
  }

  function handleSkip() {
    // Skip sets sensible defaults
    const defaultProfile = 'urban';
    const defaultRegion = 'northeast';
    setProfile(defaultProfile);
    setRegion(defaultRegion);
    void completeOnboarding(defaultProfile, defaultRegion);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: statusBarHeight }]}>
      {screen === 1 && (
        <Screen1
          onSkip={handleSkip}
          onNext={() => setScreen(2)}
        />
      )}
      {screen === 2 && (
        <Screen2
          selected={profile}
          onSelect={setProfile}
          onBack={() => setScreen(1)}
          onNext={() => setScreen(3)}
        />
      )}
      {screen === 3 && (
        <Screen3
          selected={region}
          onSelect={setRegion}
          onBack={() => setScreen(2)}
          onNext={() => setScreen(4)}
        />
      )}
      {screen === 4 && profile && region && (
        <Screen4
          profile={profile}
          region={region}
          onStart={() => void handleStart()}
        />
      )}

      {/* Dot indicator */}
      <View style={styles.dotRow}>
        {([1, 2, 3, 4] as const).map((n) => (
          <View key={n} style={[styles.dot, screen === n && styles.dotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Screen 1
  screen1Center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  veteranBadge: {
    backgroundColor: '#0A2A0A',
    borderColor: '#1A5A1A',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  veteranBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholderText: {
    fontSize: 48,
  },
  appTitle: {
    fontSize: 36,
    color: '#8B9E67',
    fontWeight: '900',
    letterSpacing: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#888',
    fontWeight: '400',
  },
  screen1Buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 16,
  },

  // Common nav
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 12,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  primaryBtn: {
    backgroundColor: '#8B9E67',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryBtnDisabled: {
    backgroundColor: '#3A2A1A',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Screen titles
  screenTitle: {
    fontSize: 20,
    color: '#F0F0F0',
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 20,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Profile cards
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileCard: {
    width: '47%',
    minHeight: 130,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'flex-start',
  },
  profileCardSelected: {
    borderColor: '#8B9E67',
    backgroundColor: '#1A0800',
  },
  profileIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 13,
    color: '#F0F0F0',
    fontWeight: '700',
    marginBottom: 4,
  },
  profileLabelSelected: {
    color: '#8B9E67',
  },
  profileSub: {
    fontSize: 11,
    color: '#666',
  },

  // Region cards
  regionList: {
    gap: 8,
  },
  regionCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionCardSelected: {
    borderColor: '#8B9E67',
    backgroundColor: '#1A0800',
  },
  regionCardInner: {
    flex: 1,
  },
  regionLabel: {
    fontSize: 15,
    color: '#F0F0F0',
    fontWeight: '700',
  },
  regionLabelSelected: {
    color: '#8B9E67',
  },
  regionNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  regionCheck: {
    fontSize: 18,
    color: '#8B9E67',
    fontWeight: '700',
    marginLeft: 12,
  },

  // Screen 4
  screen4Center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  readyCheckmark: {
    fontSize: 56,
    color: '#4CAF50',
    marginBottom: 12,
  },
  bulletList: {
    alignSelf: 'stretch',
    marginTop: 32,
    gap: 12,
  },
  bulletRow: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
  },
  bulletText: {
    fontSize: 14,
    color: '#F0F0F0',
    lineHeight: 20,
  },
  startBtnContainer: {
    paddingBottom: 24,
    paddingTop: 12,
  },
  startBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Dots
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#8B9E67',
    width: 20,
  },
});
