import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

type WaterActivity = 'Resting' | 'Light' | 'Heavy';
type WaterTemp = 'Cool' | 'Moderate' | 'Hot';
type FoodActivity = 'Sedentary' | 'Moderate' | 'Strenuous';
type DeviceInputType = 'watts' | 'mah';

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onSelect }) => (
  <View style={styles.segmented}>
    {options.map((opt) => (
      <TouchableOpacity
        key={opt}
        style={[styles.segment, selected === opt && styles.segmentActive]}
        onPress={() => onSelect(opt)}
      >
        <Text style={[styles.segmentText, selected === opt && styles.segmentTextActive]}>
          {opt}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Water Calculator ──────────────────────────────────────────────────────────

interface WaterResult {
  gallons: number;
  bottles16oz: number;
  bottles1L: number;
  jugGallon: number;
}

function calcWater(
  people: number,
  days: number,
  activity: WaterActivity,
  temp: WaterTemp
): WaterResult {
  const actMod = { Resting: 1.0, Light: 1.25, Heavy: 1.5 }[activity];
  const tmpMod = { Cool: 1.0, Moderate: 1.25, Hot: 1.5 }[temp];
  const gallons = 0.5 * people * days * actMod * tmpMod;
  return {
    gallons,
    bottles16oz: gallons * 8,
    bottles1L: gallons * 3.785,
    jugGallon: Math.ceil(gallons),
  };
}

const WaterTab: React.FC = () => {
  const [people, setPeople] = useState('2');
  const [days, setDays] = useState('3');
  const [activity, setActivity] = useState<WaterActivity>('Light');
  const [temp, setTemp] = useState<WaterTemp>('Moderate');
  const [result, setResult] = useState<WaterResult | null>(null);

  const calculate = () => {
    const p = Math.max(1, parseInt(people) || 1);
    const d = Math.max(1, parseInt(days) || 1);
    setResult(calcWater(p, d, activity, temp));
  };

  return (
    <View>
      <Text style={styles.label}>Number of People</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={people}
        onChangeText={setPeople}
        placeholderTextColor={Colors.textMuted}
        placeholder="2"
      />
      <Text style={styles.label}>Activity Level</Text>
      <SegmentedControl
        options={['Resting', 'Light', 'Heavy']}
        selected={activity}
        onSelect={(v) => setActivity(v as WaterActivity)}
      />
      <Text style={styles.label}>Temperature</Text>
      <SegmentedControl
        options={['Cool', 'Moderate', 'Hot']}
        selected={temp}
        onSelect={(v) => setTemp(v as WaterTemp)}
      />
      <Text style={styles.label}>Days</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={days}
        onChangeText={setDays}
        placeholderTextColor={Colors.textMuted}
        placeholder="3"
      />
      <TouchableOpacity style={styles.calcButton} onPress={calculate}>
        <Text style={styles.calcButtonText}>CALCULATE</Text>
      </TouchableOpacity>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Water Requirements</Text>
          <ResultRow label="Total Gallons" value={result.gallons.toFixed(2) + ' gal'} />
          <ResultRow label="16 oz Bottles" value={result.bottles16oz.toFixed(0)} />
          <ResultRow label="1 Liter Bottles" value={result.bottles1L.toFixed(1)} />
          <ResultRow label="1-Gallon Jugs" value={result.jugGallon.toString()} />
        </View>
      )}
    </View>
  );
};

// ── Food Calculator ───────────────────────────────────────────────────────────

interface FoodResult {
  totalCal: number;
  weightLbs: number;
}

function calcFood(people: number, days: number, activity: FoodActivity): FoodResult {
  const calPerDay = { Sedentary: 2000, Moderate: 2500, Strenuous: 3000 }[activity];
  const totalCal = calPerDay * people * days;
  const weightLbs = totalCal / 1800;
  return { totalCal, weightLbs };
}

const FOOD_SUGGESTIONS =
  'Mountain House freeze-dried (2650 cal/day) · Cliff Bars (250 cal ea) · Canned beans (300 cal/cup) · Rice (680 cal/cup dry) · Peanut butter (190 cal/2 tbsp) · Instant oats (150 cal/packet)';

const FoodTab: React.FC = () => {
  const [people, setPeople] = useState('2');
  const [days, setDays] = useState('3');
  const [activity, setActivity] = useState<FoodActivity>('Moderate');
  const [result, setResult] = useState<FoodResult | null>(null);

  const calculate = () => {
    const p = Math.max(1, parseInt(people) || 1);
    const d = Math.max(1, parseInt(days) || 1);
    setResult(calcFood(p, d, activity));
  };

  return (
    <View>
      <Text style={styles.label}>Number of People</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={people}
        onChangeText={setPeople}
        placeholderTextColor={Colors.textMuted}
        placeholder="2"
      />
      <Text style={styles.label}>Activity Level</Text>
      <SegmentedControl
        options={['Sedentary', 'Moderate', 'Strenuous']}
        selected={activity}
        onSelect={(v) => setActivity(v as FoodActivity)}
      />
      <Text style={styles.label}>Days</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={days}
        onChangeText={setDays}
        placeholderTextColor={Colors.textMuted}
        placeholder="3"
      />
      <TouchableOpacity style={styles.calcButton} onPress={calculate}>
        <Text style={styles.calcButtonText}>CALCULATE</Text>
      </TouchableOpacity>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Food Requirements</Text>
          <ResultRow label="Total Calories" value={result.totalCal.toLocaleString() + ' cal'} />
          <ResultRow label="Approx Food Weight" value={result.weightLbs.toFixed(1) + ' lbs'} />
          <View style={styles.divider} />
          <Text style={styles.suggestionTitle}>Suggested Sources</Text>
          <Text style={styles.suggestionText}>{FOOD_SUGGESTIONS}</Text>
        </View>
      )}
    </View>
  );
};

// ── Battery Calculator ────────────────────────────────────────────────────────

interface BatteryResult {
  runtimeHours: number;
  days: number;
  efficiency: string;
}

function calcBattery(
  batteryMah: number,
  inputType: DeviceInputType,
  watts: number,
  deviceMah: number,
  numDevices: number,
  hoursPerDay: number,
  voltage: number
): BatteryResult {
  const mahDraw =
    inputType === 'watts' ? (watts * 1000) / voltage : deviceMah;
  const totalMahPerHour = mahDraw * numDevices;
  const runtimeHours = (batteryMah * 0.85) / totalMahPerHour;
  const days = runtimeHours / Math.max(0.1, hoursPerDay);
  const efficiency = `15% inverter/conversion loss applied. Actual runtime may vary with temperature, battery age, and load spikes.`;
  return { runtimeHours, days, efficiency };
}

const BatteryTab: React.FC = () => {
  const [batteryMah, setBatteryMah] = useState('10000');
  const [inputType, setInputType] = useState<DeviceInputType>('watts');
  const [watts, setWatts] = useState('5');
  const [deviceMah, setDeviceMah] = useState('500');
  const [voltage, setVoltage] = useState<'5' | '12'>('5');
  const [numDevices, setNumDevices] = useState('1');
  const [hoursPerDay, setHoursPerDay] = useState('4');
  const [result, setResult] = useState<BatteryResult | null>(null);

  const calculate = () => {
    const bMah = Math.max(1, parseFloat(batteryMah) || 1);
    const w = Math.max(0.1, parseFloat(watts) || 0.1);
    const dMah = Math.max(0.1, parseFloat(deviceMah) || 0.1);
    const nd = Math.max(1, parseInt(numDevices) || 1);
    const hpd = Math.max(0.1, parseFloat(hoursPerDay) || 0.1);
    const v = parseFloat(voltage);
    setResult(calcBattery(bMah, inputType, w, dMah, nd, hpd, v));
  };

  return (
    <View>
      <Text style={styles.label}>Battery Capacity (mAh)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={batteryMah}
        onChangeText={setBatteryMah}
        placeholderTextColor={Colors.textMuted}
        placeholder="10000"
      />
      <Text style={styles.label}>Device Input Type</Text>
      <SegmentedControl
        options={['watts', 'mah']}
        selected={inputType}
        onSelect={(v) => setInputType(v as DeviceInputType)}
      />
      {inputType === 'watts' ? (
        <>
          <Text style={styles.label}>Device Wattage (W)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={watts}
            onChangeText={setWatts}
            placeholderTextColor={Colors.textMuted}
            placeholder="5"
          />
          <Text style={styles.label}>Voltage</Text>
          <SegmentedControl
            options={['5', '12']}
            selected={voltage}
            onSelect={(v) => setVoltage(v as '5' | '12')}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Device Draw (mAh/hr)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={deviceMah}
            onChangeText={setDeviceMah}
            placeholderTextColor={Colors.textMuted}
            placeholder="500"
          />
        </>
      )}
      <Text style={styles.label}>Number of Devices</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={numDevices}
        onChangeText={setNumDevices}
        placeholderTextColor={Colors.textMuted}
        placeholder="1"
      />
      <Text style={styles.label}>Hours Used Per Day</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={hoursPerDay}
        onChangeText={setHoursPerDay}
        placeholderTextColor={Colors.textMuted}
        placeholder="4"
      />
      <TouchableOpacity style={styles.calcButton} onPress={calculate}>
        <Text style={styles.calcButtonText}>CALCULATE</Text>
      </TouchableOpacity>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Battery Runtime</Text>
          <ResultRow label="Total Runtime" value={result.runtimeHours.toFixed(1) + ' hrs'} />
          <ResultRow label="Days at Usage Rate" value={result.days.toFixed(1) + ' days'} />
          <View style={styles.divider} />
          <Text style={styles.suggestionText}>{result.efficiency}</Text>
        </View>
      )}
    </View>
  );
};

// ── Shared result row ─────────────────────────────────────────────────────────

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={styles.resultValue}>{value}</Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

type TabName = 'Water' | 'Food' | 'Battery';
const TABS: TabName[] = ['Water', 'Food', 'Battery'];

export const SurvivalCalculatorScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Water');

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>SURVIVAL CALCULATOR</Text>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Water'   && <WaterTab />}
        {activeTab === 'Food'    && <FoodTab />}
        {activeTab === 'Battery' && <BatteryTab />}
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.primary,
    letterSpacing: 2, margin: 16, marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.surface, borderRadius: 8, padding: 3,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryDim },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // shared input styles
  label: {
    fontSize: 11, color: Colors.textSecondary, letterSpacing: 1.2,
    fontWeight: '600', marginTop: 14, marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 8, padding: 11, color: Colors.textPrimary, fontSize: 15,
  },
  segmented: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  segment: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  segmentActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  segmentText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: Colors.primary },
  calcButton: {
    marginTop: 20, backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  calcButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  // result card
  resultCard: {
    marginTop: 20, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 10, padding: 16,
  },
  resultTitle: {
    color: Colors.primary, fontSize: 12, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  resultLabel: { fontSize: 13, color: Colors.textSecondary },
  resultValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 10 },
  suggestionTitle: {
    fontSize: 11, color: Colors.textSecondary, letterSpacing: 1, fontWeight: '700', marginBottom: 6,
  },
  suggestionText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 19 },
});

export default SurvivalCalculatorScreen;
