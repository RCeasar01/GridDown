import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

interface MedCondition {
  id: string;
  name: string;
  icon: string;
  severity: 'critical' | 'urgent' | 'moderate';
  recognize: string[];
  doSteps: string[];
  dontSteps?: string[];
  note?: string;
}

const CONDITIONS: MedCondition[] = [
  {
    id: 'shock',
    name: 'Shock (Circulatory)',
    icon: '🩸',
    severity: 'critical',
    recognize: [
      'Pale, cold, clammy skin',
      'Rapid, weak pulse (>100 bpm)',
      'Rapid, shallow breathing',
      'Confusion, anxiety, or unresponsiveness',
      'Nausea or vomiting',
      'Thirst',
    ],
    doSteps: [
      'Call 911 immediately if possible.',
      'Lay the person flat on their back.',
      'Elevate legs 12 inches (30 cm) UNLESS head/neck/spine injury is suspected.',
      'Keep warm — cover with blanket. Maintain body temperature.',
      'Control any visible bleeding with direct pressure.',
      'Do NOT give food or water — they may need surgery.',
      'Monitor breathing and pulse. Begin CPR if breathing stops.',
      'Loosen tight clothing (collar, belt).',
    ],
    dontSteps: ['Do NOT move if spinal injury suspected', 'Do NOT leave alone', 'Do NOT give food/water/medications'],
    note: 'Shock is life-threatening. Causes include severe blood loss, allergic reaction, heart attack, severe infection, spinal injury.',
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis (Severe Allergic Reaction)',
    icon: '🐝',
    severity: 'critical',
    recognize: [
      'Sudden skin rash, hives, or flushing within seconds to minutes of exposure',
      'Throat tightness, difficulty swallowing, hoarse voice',
      'Difficulty breathing, wheezing',
      'Rapid pulse, drop in blood pressure',
      'Dizziness, fainting, loss of consciousness',
      'Nausea, vomiting, stomach cramps',
    ],
    doSteps: [
      'Use epinephrine auto-injector (EpiPen) IMMEDIATELY — inject into outer thigh. Can inject through clothing.',
      'Call 911 immediately after injection.',
      'Lay person flat with legs elevated UNLESS breathing is easier sitting up.',
      'Administer second EpiPen dose after 5–15 minutes if symptoms persist.',
      'If person stops breathing, begin CPR.',
      'Stay until EMS arrives — symptoms can return (biphasic reaction) 1–8 hours later.',
    ],
    dontSteps: ['Do NOT wait to see if symptoms improve before using EpiPen', 'Do NOT have person stand or walk — can be fatal if upright'],
    note: 'Epinephrine is the ONLY first-line treatment. Antihistamines (Benadryl) are NOT fast enough for anaphylaxis. Without EpiPen, position patient for comfort, maintain airway, and get to ER immediately.',
  },
  {
    id: 'diabetic',
    name: 'Diabetic Emergency',
    icon: '🍬',
    severity: 'urgent',
    recognize: [
      'LOW BLOOD SUGAR (Hypoglycemia): shaking, sweating, rapid heartbeat, confusion, pale skin, hunger, seizure',
      'HIGH BLOOD SUGAR (Hyperglycemia): fruity breath, extreme thirst, frequent urination, fatigue, nausea — develops over hours/days',
    ],
    doSteps: [
      'If person is conscious and can swallow: give 15–20g fast-acting carbs — 4 glucose tablets, 4 oz juice, 4 oz regular soda, or 1 tbsp sugar/honey.',
      'Wait 15 minutes. Recheck — repeat carbs if still symptomatic.',
      'Once feeling better, give a snack with protein (crackers + peanut butter).',
      'If unconscious or unable to swallow: call 911. Place on side (recovery position). Do NOT give food/drink.',
      'For high blood sugar: cannot be treated in the field — call 911 if person is unresponsive or vomiting.',
    ],
    note: 'When in doubt, give sugar — hypoglycemia kills faster than hyperglycemia. If person carries a glucagon kit, use per instructions.',
  },
  {
    id: 'seizure',
    name: 'Seizure',
    icon: '⚡',
    severity: 'urgent',
    recognize: [
      'Sudden stiffening of body, then rhythmic shaking (tonic-clonic)',
      'Brief blank stare or lip-smacking (absence or focal seizure)',
      'Loss of consciousness, falling',
      'Clenched teeth, may bite tongue',
      'Loss of bladder/bowel control',
      'Confusion ("postictal state") after seizure ends',
    ],
    doSteps: [
      'Keep calm. Time the seizure.',
      'Clear hard or sharp objects away from person.',
      'Cushion head with something soft.',
      'Turn person on their side (recovery position) to prevent choking on saliva.',
      'Stay with person until fully conscious.',
      'Call 911 if: seizure lasts >5 minutes, person does not recover consciousness, person has another seizure, person is injured, pregnant, or diabetic, or first-ever seizure.',
    ],
    dontSteps: [
      'Do NOT hold person down or restrain movements',
      'Do NOT put anything in their mouth — the "swallowing tongue" myth is false; restraining the jaw causes broken teeth/jaw',
      'Do NOT give food/water until fully alert',
    ],
    note: 'Most seizures stop on their own within 1–3 minutes. The recovery period (confusion, fatigue) is normal and lasts 5–30 minutes.',
  },
  {
    id: 'choking-adult',
    name: 'Choking — Adult / Child (>1 year)',
    icon: '😮',
    severity: 'critical',
    recognize: [
      'Cannot speak, cough, or breathe',
      'Hands clutched to throat (universal choking sign)',
      'High-pitched or no sound while trying to breathe',
      'Bluish skin (cyanosis) around lips/fingertips',
    ],
    doSteps: [
      '1. Ask "Are you choking?" — If yes or they cannot respond, act immediately.',
      '2. Perform Heimlich Maneuver: Stand behind person. Make a fist; place thumb side against abdomen just above navel and below ribcage. Cover fist with other hand.',
      '3. Give firm upward abdominal thrusts. Repeat until object is expelled or person loses consciousness.',
      '4. If person loses consciousness: lower to ground, call 911, begin CPR. Before each breath, look in mouth for object — remove if visible.',
      'SELF-HEIMLICH: Make a fist, press into upper abdomen, thrust upward. Or thrust upper abdomen against a hard edge (chair back, countertop).',
    ],
    note: 'For a conscious choking person who is very obese or in late pregnancy: use chest thrusts instead of abdominal thrusts.',
  },
  {
    id: 'choking-infant',
    name: 'Choking — Infant (< 1 year)',
    icon: '👶',
    severity: 'critical',
    recognize: [
      'Cannot cry, cough, or breathe effectively',
      'Bluish skin tone',
      'Weak, ineffective cough',
    ],
    doSteps: [
      '1. Support infant face-down on your forearm, head lower than chest.',
      '2. Give 5 firm back blows between shoulder blades with heel of hand.',
      '3. Turn infant face-up on your forearm. Give 5 chest thrusts: two fingers on center of chest, just below nipple line.',
      '4. Alternate 5 back blows and 5 chest thrusts until object is expelled or infant becomes unconscious.',
      '5. If unconscious: begin infant CPR. Before each breath attempt, look in mouth — remove object only if visible.',
      '6. Call 911 immediately.',
    ],
    note: 'NEVER perform abdominal thrusts on an infant. Never perform blind finger sweeps.',
  },
  {
    id: 'burns',
    name: 'Burns',
    icon: '🔥',
    severity: 'urgent',
    recognize: [
      '1st degree: Red, dry skin, pain — like a sunburn. Only outer layer.',
      '2nd degree: Blisters, wet/shiny skin, intense pain. Partial thickness.',
      '3rd degree: White, brown, or black skin, no pain (nerve damage), dry/leathery. Full thickness.',
    ],
    doSteps: [
      'COOL THE BURN: Run cool (not cold) water over the burn for 10–20 minutes. Remove jewelry/clothing from the area.',
      'Cover loosely with a clean, non-fluffy bandage (cling film works well as a first layer).',
      'Take over-the-counter pain relief (ibuprofen or acetaminophen).',
      'Do NOT break blisters — they protect against infection.',
      'Call 911 or go to ER for: burns on face/hands/feet/genitals/joints, any 3rd degree burn, burns >3 inches (7.5 cm), burns from electricity or chemicals, inhalation injury.',
    ],
    dontSteps: [
      'Do NOT use ice — causes additional tissue damage',
      'Do NOT apply butter, toothpaste, or any home remedies',
      'Do NOT use fluffy cotton on burns — fibers stick to wound',
    ],
  },
  {
    id: 'fracture',
    name: 'Fracture / Suspected Broken Bone',
    icon: '🦴',
    severity: 'urgent',
    recognize: [
      'Intense localized pain',
      'Swelling, bruising, or deformity',
      'Inability to move or bear weight',
      'Grating sensation (crepitus) — do not intentionally produce this',
      'Open fracture: bone visible through skin (medical emergency)',
    ],
    doSteps: [
      'SPLINT IN PLACE: Immobilize the limb in the position found. Do NOT try to straighten.',
      'Improvised splint: use rigid material (stick, board, rolled newspaper) with padding between splint and skin.',
      'Extend splint beyond the joints above and below the fracture.',
      'Secure with bandages, strips of clothing, or tape — not too tight (check circulation).',
      'Elevate if possible; apply ice pack (20 min on, 20 off) wrapped in cloth.',
      'For open fracture: cover wound with clean cloth; do NOT push bone back in. Control bleeding with gentle pressure around (not on) the wound.',
      'Monitor circulation: check pulse, warmth, and sensation below the injury every 15 minutes.',
    ],
    note: 'Femur (thigh) fractures can cause life-threatening blood loss internally — treat for shock and get emergency help immediately.',
  },
  {
    id: 'hypothermia',
    name: 'Hypothermia',
    icon: '🧊',
    severity: 'critical',
    recognize: [
      'MILD (core temp 90–95°F / 32–35°C): Shivering, slurred speech, impaired coordination',
      'MODERATE (82–90°F / 28–32°C): Shivering stops (bad sign), confusion, sluggish pulse',
      'SEVERE (<82°F / <28°C): Unconsciousness, no shivering, very slow/absent pulse',
    ],
    doSteps: [
      'Move to warm, dry shelter. Remove wet clothing.',
      'Cover with blankets; focus on core: chest, groin, armpits, head.',
      'Apply warm compresses to neck, armpits, and groin if available.',
      'Give warm (not hot) beverages IF person is fully conscious and can swallow.',
      'For severe hypothermia: handle VERY gently — cold heart is susceptible to ventricular fibrillation from jostling.',
      'If no pulse: begin CPR. Hypothermic patients have been resuscitated after prolonged cardiac arrest.',
      'Call 911 — all but mild hypothermia requires hospital rewarming.',
    ],
    dontSteps: [
      'Do NOT give alcohol — causes peripheral vasodilation and increases heat loss',
      'Do NOT rub limbs vigorously — can cause cold blood to rush to core',
      'Do NOT assume death — "not dead until warm and dead"',
    ],
  },
  {
    id: 'heat-stroke',
    name: 'Heat Stroke',
    icon: '☀️',
    severity: 'critical',
    recognize: [
      'Core temperature >104°F (40°C)',
      'Hot, dry skin (in classic heat stroke) OR sweating in exertional heat stroke',
      'Confusion, agitation, slurred speech, seizure, unconsciousness',
      'Rapid, strong pulse',
      'Headache, nausea',
    ],
    doSteps: [
      'Call 911 IMMEDIATELY — heat stroke is a medical emergency.',
      'Move to cool environment (shade, air conditioning).',
      'COOL AGGRESSIVELY: Remove excess clothing. Apply ice packs to neck, armpits, and groin. Spray with cool water and fan. Immerse in cool water if available.',
      'Do not stop cooling until person cools or EMS arrives.',
      'If conscious and not vomiting: give cool fluids slowly.',
      'Place in recovery position if unconscious.',
    ],
    dontSteps: [
      'Do NOT give aspirin or acetaminophen — they will not lower heat stroke fever',
      'Do NOT give large amounts of water rapidly — can cause hyponatremia',
    ],
    note: 'Heat exhaustion (heavy sweating, dizziness, cool/pale skin) is the precursor — treat with rest, shade, fluids, cooling. If not improving in 30 minutes, suspect heat stroke.',
  },
];

const SEVERITY_COLORS: Record<MedCondition['severity'], string> = {
  critical: Colors.danger,
  urgent:   Colors.warning,
  moderate: Colors.info,
};

const SEVERITY_LABELS: Record<MedCondition['severity'], string> = {
  critical: 'CRITICAL',
  urgent:   'URGENT',
  moderate: 'MODERATE',
};

export function MedicalReferenceScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | MedCondition['severity']>('all');

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = filter === 'all' ? CONDITIONS : CONDITIONS.filter((c) => c.severity === filter);

  return (
    <SafeAreaView style={md.safe}>
      {/* Disclaimer */}
      <View style={md.disclaimer}>
        <Text style={md.disclaimerText}>⚕️ This reference is for civilian emergencies when professional medical care is unavailable. It does not replace training or professional care. Learn CPR and take a first aid course.</Text>
      </View>

      {/* Filter */}
      <View style={md.filterRow}>
        {(['all', 'critical', 'urgent', 'moderate'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              md.filterBtn,
              filter === f && { backgroundColor: (SEVERITY_COLORS[f as MedCondition['severity']] ?? Colors.primary) + '33', borderColor: SEVERITY_COLORS[f as MedCondition['severity']] ?? Colors.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[md.filterLabel, filter === f && { color: SEVERITY_COLORS[f as MedCondition['severity']] ?? Colors.primary }]}>
              {f === 'all' ? 'All' : SEVERITY_LABELS[f as MedCondition['severity']]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={md.content} showsVerticalScrollIndicator={false}>
        {filtered.map((cond) => (
          <TouchableOpacity
            key={cond.id}
            style={[md.card, { borderLeftColor: SEVERITY_COLORS[cond.severity] }]}
            onPress={() => toggle(cond.id)}
            activeOpacity={0.8}
          >
            <View style={md.cardHeader}>
              <Text style={md.cardIcon}>{cond.icon}</Text>
              <View style={md.cardHeaderText}>
                <Text style={md.cardTitle}>{cond.name}</Text>
                <View style={[md.sevBadge, { backgroundColor: SEVERITY_COLORS[cond.severity] + '22' }]}>
                  <Text style={[md.sevBadgeText, { color: SEVERITY_COLORS[cond.severity] }]}>
                    {SEVERITY_LABELS[cond.severity]}
                  </Text>
                </View>
              </View>
              <Text style={md.chevron}>{expanded === cond.id ? '▲' : '▼'}</Text>
            </View>

            {expanded === cond.id && (
              <View style={md.cardBody}>
                <Text style={md.sectionLabel}>Recognize</Text>
                {cond.recognize.map((r, i) => <Text key={i} style={md.bullet}>• {r}</Text>)}

                <Text style={md.sectionLabel}>What To Do</Text>
                {cond.doSteps.map((s, i) => <Text key={i} style={md.step}>{s}</Text>)}

                {cond.dontSteps && cond.dontSteps.length > 0 && (
                  <>
                    <Text style={md.sectionLabelDanger}>Do NOT</Text>
                    {cond.dontSteps.map((s, i) => <Text key={i} style={md.dontStep}>✗ {s}</Text>)}
                  </>
                )}

                {cond.note && (
                  <View style={md.noteBox}>
                    <Text style={md.noteText}>ℹ️ {cond.note}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={md.footerCard}>
          <Text style={md.footerTitle}>Training Resources</Text>
          <Text style={md.footerText}>
            {'• American Red Cross First Aid courses: redcross.org\n• Stop the Bleed training (hemorrhage control): stopthebleed.org\n• CPR/AED: American Heart Association heartcpr.org\n• Wilderness First Aid / WFR: NOLS, SOLO, Wilderness Medical Associates'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const md = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  disclaimer: { margin: 12, backgroundColor: Colors.dangerBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.danger },
  disclaimerText: { color: Colors.danger, fontSize: 12, lineHeight: 17 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 4 },
  filterBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  filterLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  content: { padding: 12, gap: 10, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 24 },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  sevBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  chevron: { color: Colors.textMuted, fontSize: 14, alignSelf: 'flex-start' },
  cardBody: { marginTop: 12, gap: 4 },
  sectionLabel: { color: Colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  sectionLabelDanger: { color: Colors.danger, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  bullet: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  step: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20 },
  dontStep: { color: Colors.danger, fontSize: 13, lineHeight: 18 },
  noteBox: { backgroundColor: Colors.infoBg, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: Colors.info, marginTop: 8 },
  noteText: { color: Colors.info, fontSize: 12, lineHeight: 17 },
  footerCard: { backgroundColor: Colors.primaryDim, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.primary },
  footerTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  footerText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
