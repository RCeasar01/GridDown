import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Switch, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import {
  initFamilyPlannerTables,
  getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember,
  getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
  getRallyPoints, addRallyPoint, updateRallyPoint, deleteRallyPoint,
  getPets, addPet, updatePet, deletePet,
  FamilyMember, EmergencyContact, RallyPoint, Pet,
} from '../db/familyPlanner';

// ─── Optional imports with graceful fallback ─────────────────────────────────
let Print: any = null;
let Sharing: any = null;
try { Print = require('expo-print'); } catch (_) {}
try { Sharing = require('expo-sharing'); } catch (_) {}

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = ['FAMILY', 'CONTACTS', 'RALLY', 'PETS', 'DOCS', 'CARD'] as const;
type Tab = typeof TABS[number];

const RALLY_TYPES = ['Primary', 'Secondary', 'Out-of-Area'];

const DOCS_ITEMS = [
  'Government ID (Driver\'s License / Passport)',
  'Social Security Cards',
  'Birth Certificates',
  'Insurance Cards (Health / Auto / Home)',
  'Medical Records',
  'Prescriptions List',
  'Bank Account Info',
  'Vehicle Titles / Deeds',
  'Will / Power of Attorney',
  'Emergency Cash',
];

const DOCS_STORAGE_KEY = '@griddown_docs_checklist';
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

// ─── Reusable field component ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
}
const Field: React.FC<FieldProps> = ({ label, value, onChangeText, placeholder, multiline, keyboardType }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, multiline && { height: 72, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={Colors.textMuted}
      multiline={multiline}
      keyboardType={keyboardType ?? 'default'}
    />
  </View>
);

// ─── Blood type picker ────────────────────────────────────────────────────────
interface BloodPickerProps { value: string; onChange: (v: string) => void; }
const BloodPicker: React.FC<BloodPickerProps> = ({ value, onChange }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>Blood Type</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {BLOOD_TYPES.map(bt => (
        <TouchableOpacity
          key={bt}
          style={[styles.chip, value === bt && styles.chipActive]}
          onPress={() => onChange(bt)}
        >
          <Text style={[styles.chipText, value === bt && styles.chipTextActive]}>{bt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// ─── Delete confirm helper ────────────────────────────────────────────────────
function confirmDelete(name: string, onConfirm: () => void) {
  Alert.alert('Delete', `Remove "${name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function FamilyPlannerScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('FAMILY');
  const [loading, setLoading] = useState(true);

  // Data state
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [rallies, setRallies] = useState<RallyPoint[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [docsChecked, setDocsChecked] = useState<Record<string, boolean>>({});

  // Modal state
  const [memberModal, setMemberModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [rallyModal, setRallyModal] = useState(false);
  const [petModal, setPetModal] = useState(false);

  // Edit targets
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null);
  const [editRally, setEditRally] = useState<RallyPoint | null>(null);
  const [editPet, setEditPet] = useState<Pet | null>(null);

  // ── Init ──
  useEffect(() => {
    (async () => {
      try {
        await initFamilyPlannerTables();
        await refreshAll();
        const raw = await AsyncStorage.getItem(DOCS_STORAGE_KEY);
        if (raw) setDocsChecked(JSON.parse(raw));
      } catch (e) {
        console.error('FamilyPlanner init error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshAll = useCallback(async () => {
    const [m, c, r, p] = await Promise.all([
      getFamilyMembers(), getEmergencyContacts(), getRallyPoints(), getPets(),
    ]);
    setMembers(m); setContacts(c); setRallies(r); setPets(p);
  }, []);

  const toggleDoc = async (item: string) => {
    const next = { ...docsChecked, [item]: !docsChecked[item] };
    setDocsChecked(next);
    await AsyncStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(next));
  };

  // ── Emergency Card HTML ──
  const buildCardHtml = () => {
    const date = new Date().toLocaleDateString();
    const memberRows = members.map(m =>
      `<tr><td>${m.name}</td><td>${m.blood_type || '—'}</td><td>${m.medications || 'None'}</td></tr>`
    ).join('');
    const contactRows = contacts.map(c =>
      `<tr><td>${c.is_out_of_area ? '⭐ OUT-OF-AREA: ' : ''}${c.name}</td><td>${c.phone}</td><td>${c.relationship || ''}</td></tr>`
    ).join('');
    const rallyRows = RALLY_TYPES.map(t => {
      const rp = rallies.find(r => r.type === t);
      return `<tr><td><b>${t}</b></td><td>${rp ? `${rp.name}${rp.address ? ' — ' + rp.address : ''}` : '—'}</td></tr>`;
    }).join('');
    const petNames = pets.map(p => p.name).join(', ') || 'None';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1 { font-size: 20px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; }
      h2 { font-size: 14px; margin-top: 18px; background: #222; color: #fff; padding: 4px 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
      td { border: 1px solid #ccc; padding: 5px 8px; }
      .footer { margin-top: 24px; font-size: 10px; text-align: center; color: #555; }
    </style></head><body>
    <h1>FAMILY EMERGENCY CARD</h1>
    <p style="text-align:center;font-size:11px;">Generated: ${date}</p>
    <h2>HOUSEHOLD MEMBERS</h2>
    <table><tr><th>Name</th><th>Blood Type</th><th>Critical Medications</th></tr>${memberRows}</table>
    <h2>EMERGENCY CONTACTS</h2>
    <table><tr><th>Name</th><th>Phone</th><th>Relationship</th></tr>${contactRows}</table>
    <h2>RALLY POINTS</h2>
    <table>${rallyRows}</table>
    <h2>PETS</h2>
    <p style="font-size:13px;margin:6px 0;">${petNames}</p>
    <div class="footer">GridDown | BannedProduct Media Inc. | 100% Veteran-Owned</div>
    </body></html>`;
  };

  const handlePrint = async () => {
    if (!Print) {
      Alert.alert('Packages Required', 'Install required packages: npx expo install expo-print expo-sharing');
      return;
    }
    try {
      await Print.printAsync({ html: buildCardHtml() });
    } catch (e: any) {
      Alert.alert('Print Error', e.message);
    }
  };

  const handleShare = async () => {
    if (!Print || !Sharing) {
      Alert.alert('Packages Required', 'Install required packages: npx expo install expo-print expo-sharing');
      return;
    }
    try {
      const { uri } = await Print.printToFileAsync({ html: buildCardHtml() });
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Planner</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Privacy Banner */}
      <View style={styles.privacyBanner}>
        <Ionicons name="lock-closed" size={13} color={Colors.secondary} />
        <Text style={styles.privacyText}> All data stored locally. Never transmitted.</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'FAMILY' && (
          <FamilyTab members={members} onAdd={() => { setEditMember(null); setMemberModal(true); }}
            onEdit={m => { setEditMember(m); setMemberModal(true); }}
            onDelete={m => confirmDelete(m.name, async () => { await deleteFamilyMember(m.id); await refreshAll(); })} />
        )}
        {activeTab === 'CONTACTS' && (
          <ContactsTab contacts={contacts} onAdd={() => { setEditContact(null); setContactModal(true); }}
            onEdit={c => { setEditContact(c); setContactModal(true); }}
            onDelete={c => confirmDelete(c.name, async () => { await deleteEmergencyContact(c.id); await refreshAll(); })} />
        )}
        {activeTab === 'RALLY' && (
          <RallyTab rallies={rallies} onAdd={() => { setEditRally(null); setRallyModal(true); }}
            onEdit={r => { setEditRally(r); setRallyModal(true); }}
            onDelete={r => confirmDelete(r.name, async () => { await deleteRallyPoint(r.id); await refreshAll(); })} />
        )}
        {activeTab === 'PETS' && (
          <PetsTab pets={pets} onAdd={() => { setEditPet(null); setPetModal(true); }}
            onEdit={p => { setEditPet(p); setPetModal(true); }}
            onDelete={p => confirmDelete(p.name, async () => { await deletePet(p.id); await refreshAll(); })} />
        )}
        {activeTab === 'DOCS' && (
          <DocsTab docsChecked={docsChecked} onToggle={toggleDoc} />
        )}
        {activeTab === 'CARD' && (
          <CardTab members={members} contacts={contacts} rallies={rallies} pets={pets}
            onPrint={handlePrint} onShare={handleShare} />
        )}
      </View>

      {/* ── Modals ── */}
      <MemberModal
        visible={memberModal}
        initial={editMember}
        onClose={() => setMemberModal(false)}
        onSave={async (data) => {
          if (editMember) await updateFamilyMember(editMember.id, data);
          else await addFamilyMember(data as any);
          setMemberModal(false);
          await refreshAll();
        }}
      />
      <ContactModal
        visible={contactModal}
        initial={editContact}
        onClose={() => setContactModal(false)}
        onSave={async (data) => {
          if (editContact) await updateEmergencyContact(editContact.id, data);
          else await addEmergencyContact(data as any);
          setContactModal(false);
          await refreshAll();
        }}
      />
      <RallyModal
        visible={rallyModal}
        initial={editRally}
        count={rallies.length}
        onClose={() => setRallyModal(false)}
        onSave={async (data) => {
          if (editRally) await updateRallyPoint(editRally.id, data);
          else await addRallyPoint(data as any);
          setRallyModal(false);
          await refreshAll();
        }}
      />
      <PetModal
        visible={petModal}
        initial={editPet}
        onClose={() => setPetModal(false)}
        onSave={async (data) => {
          if (editPet) await updatePet(editPet.id, data);
          else await addPet(data as any);
          setPetModal(false);
          await refreshAll();
        }}
      />
    </View>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

// FAMILY TAB
interface FamilyTabProps {
  members: FamilyMember[];
  onAdd: () => void;
  onEdit: (m: FamilyMember) => void;
  onDelete: (m: FamilyMember) => void;
}
function FamilyTab({ members, onAdd, onEdit, onDelete }: FamilyTabProps) {
  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Ionicons name="person-add" size={16} color={Colors.textPrimary} />
        <Text style={styles.addBtnText}>Add Family Member</Text>
      </TouchableOpacity>
      <FlatList
        data={members}
        keyExtractor={i => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No family members added yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name={item.is_child ? 'happy' : 'person'} size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.relationship || 'No relationship set'}</Text>
              {item.blood_type ? (
                <View style={styles.badgeRow}>
                  <View style={styles.badge}><Text style={styles.badgeText}>BT: {item.blood_type}</Text></View>
                  {item.allergies ? <View style={[styles.badge, styles.badgeWarn]}><Text style={styles.badgeText}>Allergies</Text></View> : null}
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
              <Ionicons name="trash" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// CONTACTS TAB
interface ContactsTabProps {
  contacts: EmergencyContact[];
  onAdd: () => void;
  onEdit: (c: EmergencyContact) => void;
  onDelete: (c: EmergencyContact) => void;
}
function ContactsTab({ contacts, onAdd, onEdit, onDelete }: ContactsTabProps) {
  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Ionicons name="add-circle" size={16} color={Colors.textPrimary} />
        <Text style={styles.addBtnText}>Add Emergency Contact</Text>
      </TouchableOpacity>
      <FlatList
        data={contacts}
        keyExtractor={i => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No emergency contacts added.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="call" size={24} color={item.is_out_of_area ? Colors.warning : Colors.secondary} />
            </View>
            <View style={styles.cardBody}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.is_out_of_area ? (
                  <View style={[styles.badge, styles.badgeOut]}>
                    <Text style={styles.badgeText}>OUT-OF-AREA</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardSub}>{item.phone}</Text>
              {item.relationship ? <Text style={styles.cardMeta}>{item.relationship}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
              <Ionicons name="trash" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// RALLY TAB
interface RallyTabProps {
  rallies: RallyPoint[];
  onAdd: () => void;
  onEdit: (r: RallyPoint) => void;
  onDelete: (r: RallyPoint) => void;
}
function RallyTab({ rallies, onAdd, onEdit, onDelete }: RallyTabProps) {
  return (
    <View style={styles.tabContent}>
      {rallies.length < 3 && (
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Ionicons name="flag" size={16} color={Colors.textPrimary} />
          <Text style={styles.addBtnText}>Add Rally Point</Text>
        </TouchableOpacity>
      )}
      {rallies.length === 0 && <Text style={styles.empty}>No rally points defined.</Text>}
      {RALLY_TYPES.map(type => {
        const rp = rallies.find(r => r.type === type);
        return (
          <View key={type} style={[styles.card, styles.rallyCard]}>
            <View style={styles.rallyTypeTag}>
              <Text style={styles.rallyTypeText}>{type.toUpperCase()}</Text>
            </View>
            {rp ? (
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{rp.name}</Text>
                {rp.address ? <Text style={styles.cardSub}>{rp.address}</Text> : null}
                {rp.notes ? <Text style={styles.cardMeta}>{rp.notes}</Text> : null}
              </View>
            ) : (
              <View style={styles.cardBody}>
                <Text style={styles.cardMeta}>Not set</Text>
              </View>
            )}
            {rp ? (
              <>
                <TouchableOpacity onPress={() => onEdit(rp)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(rp)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// PETS TAB
interface PetsTabProps {
  pets: Pet[];
  onAdd: () => void;
  onEdit: (p: Pet) => void;
  onDelete: (p: Pet) => void;
}
function PetsTab({ pets, onAdd, onEdit, onDelete }: PetsTabProps) {
  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Ionicons name="paw" size={16} color={Colors.textPrimary} />
        <Text style={styles.addBtnText}>Add Pet</Text>
      </TouchableOpacity>
      <FlatList
        data={pets}
        keyExtractor={i => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No pets added.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="paw" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{[item.species, item.breed].filter(Boolean).join(' · ') || 'No species set'}</Text>
              {item.vet_name ? <Text style={styles.cardMeta}>Vet: {item.vet_name}{item.vet_phone ? ` · ${item.vet_phone}` : ''}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
              <Ionicons name="trash" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// DOCS TAB
interface DocsTabProps {
  docsChecked: Record<string, boolean>;
  onToggle: (item: string) => void;
}
function DocsTab({ docsChecked, onToggle }: DocsTabProps) {
  const checkedCount = Object.values(docsChecked).filter(Boolean).length;
  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.docsHeader}>
        <Text style={styles.docsProgress}>{checkedCount} / {DOCS_ITEMS.length} documents ready</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(checkedCount / DOCS_ITEMS.length) * 100}%` }]} />
        </View>
      </View>
      {DOCS_ITEMS.map(item => (
        <TouchableOpacity key={item} style={styles.docRow} onPress={() => onToggle(item)}>
          <View style={[styles.checkbox, docsChecked[item] && styles.checkboxChecked]}>
            {docsChecked[item] && <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />}
          </View>
          <Text style={[styles.docText, docsChecked[item] && styles.docTextChecked]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// CARD TAB
interface CardTabProps {
  members: FamilyMember[];
  contacts: EmergencyContact[];
  rallies: RallyPoint[];
  pets: Pet[];
  onPrint: () => void;
  onShare: () => void;
}
function CardTab({ members, contacts, rallies, pets, onPrint, onShare }: CardTabProps) {
  const date = new Date().toLocaleDateString();
  const outOfArea = contacts.filter(c => c.is_out_of_area);
  const inArea = contacts.filter(c => !c.is_out_of_area);
  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.emergencyCard}>
        <Text style={styles.ecTitle}>FAMILY EMERGENCY CARD</Text>
        <Text style={styles.ecDate}>Generated: {date}</Text>
        <View style={styles.ecDivider} />
        <Text style={styles.ecSection}>HOUSEHOLD MEMBERS:</Text>
        {members.length === 0 && <Text style={styles.ecRow}>None added</Text>}
        {members.map(m => (
          <Text key={m.id} style={styles.ecRow}>
            {m.name}{m.blood_type ? ` | ${m.blood_type}` : ''}{m.medications ? ` | ${m.medications}` : ' | None'}
          </Text>
        ))}
        <View style={styles.ecDivider} />
        <Text style={styles.ecSection}>EMERGENCY CONTACTS:</Text>
        {inArea.map(c => (
          <Text key={c.id} style={styles.ecRow}>{c.name} | {c.phone}{c.relationship ? ` | ${c.relationship}` : ''}</Text>
        ))}
        {outOfArea.map(c => (
          <Text key={c.id} style={[styles.ecRow, { color: Colors.warning }]}>OUT-OF-AREA: {c.name} | {c.phone}</Text>
        ))}
        {contacts.length === 0 && <Text style={styles.ecRow}>None added</Text>}
        <View style={styles.ecDivider} />
        <Text style={styles.ecSection}>RALLY POINTS:</Text>
        {RALLY_TYPES.map(type => {
          const rp = rallies.find(r => r.type === type);
          return (
            <Text key={type} style={styles.ecRow}>
              {type}: {rp ? `${rp.name}${rp.address ? ' / ' + rp.address : ''}` : '—'}
            </Text>
          );
        })}
        <View style={styles.ecDivider} />
        <Text style={styles.ecSection}>PETS:</Text>
        <Text style={styles.ecRow}>{pets.length > 0 ? pets.map(p => p.name).join(', ') : 'None'}</Text>
        <View style={styles.ecDivider} />
        <Text style={styles.ecFooter}>GridDown | BannedProduct Media Inc. | 100% Veteran-Owned</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onPrint}>
          <Ionicons name="print" size={18} color={Colors.textPrimary} />
          <Text style={styles.actionBtnText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={onShare}>
          <Ionicons name="share-social" size={18} color={Colors.textPrimary} />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
      {(!Print || !Sharing) && (
        <Text style={styles.packageHint}>
          To enable Print/Share: npx expo install expo-print expo-sharing
        </Text>
      )}
    </ScrollView>
  );
}

// ─── Modal: Family Member ─────────────────────────────────────────────────────
interface MemberModalProps {
  visible: boolean;
  initial: FamilyMember | null;
  onClose: () => void;
  onSave: (data: Partial<FamilyMember>) => Promise<void>;
}
function MemberModal({ visible, initial, onClose, onSave }: MemberModalProps) {
  const blank = { name: '', relationship: '', phone: '', blood_type: '', allergies: '', medications: '', medical_conditions: '', is_child: 0, photo_uri: '' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(initial ? { ...blank, ...initial } : blank);
  }, [initial, visible]);

  const set = (k: keyof typeof blank) => (v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    await onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initial ? 'Edit Member' : 'Add Member'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Field label="Full Name *" value={form.name} onChangeText={set('name')} />
            <Field label="Relationship" value={form.relationship} onChangeText={set('relationship')} placeholder="e.g. Spouse, Child" />
            <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <BloodPicker value={form.blood_type} onChange={set('blood_type') as (v: string) => void} />
            <Field label="Allergies" value={form.allergies} onChangeText={set('allergies')} multiline />
            <Field label="Medications" value={form.medications} onChangeText={set('medications')} multiline />
            <Field label="Medical Conditions" value={form.medical_conditions} onChangeText={set('medical_conditions')} multiline />
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Is Child</Text>
              <Switch value={!!form.is_child} onValueChange={v => set('is_child')(v ? 1 : 0)}
                trackColor={{ true: Colors.primary, false: Colors.surfaceElevated }}
                thumbColor={Colors.textPrimary} />
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Member</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal: Emergency Contact ─────────────────────────────────────────────────
interface ContactModalProps {
  visible: boolean;
  initial: EmergencyContact | null;
  onClose: () => void;
  onSave: (data: Partial<EmergencyContact>) => Promise<void>;
}
function ContactModal({ visible, initial, onClose, onSave }: ContactModalProps) {
  const blank = { name: '', phone: '', relationship: '', is_out_of_area: 0, notes: '' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(initial ? { ...blank, ...initial } : blank);
  }, [initial, visible]);

  const set = (k: keyof typeof blank) => (v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) { Alert.alert('Name and phone required'); return; }
    await onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initial ? 'Edit Contact' : 'Add Contact'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Field label="Full Name *" value={form.name} onChangeText={set('name')} />
            <Field label="Phone *" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Field label="Relationship" value={form.relationship} onChangeText={set('relationship')} />
            <Field label="Notes" value={form.notes} onChangeText={set('notes')} multiline />
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Out-of-Area Contact</Text>
              <Switch value={!!form.is_out_of_area} onValueChange={v => set('is_out_of_area')(v ? 1 : 0)}
                trackColor={{ true: Colors.warning, false: Colors.surfaceElevated }}
                thumbColor={Colors.textPrimary} />
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal: Rally Point ───────────────────────────────────────────────────────
interface RallyModalProps {
  visible: boolean;
  initial: RallyPoint | null;
  count: number;
  onClose: () => void;
  onSave: (data: Partial<RallyPoint>) => Promise<void>;
}
function RallyModal({ visible, initial, count, onClose, onSave }: RallyModalProps) {
  const defaultType = RALLY_TYPES[Math.min(count, 2)];
  const blank = { name: '', address: '', lat: null as number | null, lon: null as number | null, notes: '', type: defaultType };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(initial ? { ...blank, ...initial } : { ...blank, type: defaultType });
  }, [initial, visible, defaultType]);

  const set = (k: keyof typeof blank) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    await onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initial ? 'Edit Rally Point' : 'Add Rally Point'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {RALLY_TYPES.map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, form.type === t && styles.chipActive]}
                    onPress={() => setForm(f => ({ ...f, type: t }))}>
                    <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Field label="Name / Description *" value={form.name} onChangeText={set('name')} />
            <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
            <Field label="Notes" value={form.notes} onChangeText={set('notes')} multiline />
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Rally Point</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal: Pet ───────────────────────────────────────────────────────────────
interface PetModalProps {
  visible: boolean;
  initial: Pet | null;
  onClose: () => void;
  onSave: (data: Partial<Pet>) => Promise<void>;
}
function PetModal({ visible, initial, onClose, onSave }: PetModalProps) {
  const blank = { name: '', species: '', breed: '', medications: '', vet_name: '', vet_phone: '', notes: '' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(initial ? { ...blank, ...initial } : blank);
  }, [initial, visible]);

  const set = (k: keyof typeof blank) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Pet name required'); return; }
    await onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initial ? 'Edit Pet' : 'Add Pet'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Field label="Pet Name *" value={form.name} onChangeText={set('name')} />
            <Field label="Species" value={form.species} onChangeText={set('species')} placeholder="Dog, Cat, Bird…" />
            <Field label="Breed" value={form.breed} onChangeText={set('breed')} />
            <Field label="Medications" value={form.medications} onChangeText={set('medications')} multiline />
            <Field label="Vet Name" value={form.vet_name} onChangeText={set('vet_name')} />
            <Field label="Vet Phone" value={form.vet_phone} onChangeText={set('vet_phone')} keyboardType="phone-pad" />
            <Field label="Emergency Notes" value={form.notes} onChangeText={set('notes')} multiline />
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Pet</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  ...StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' as const, justifyContent: 'center' as const },

    // Header
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: Colors.surface },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: 1 },

    // Privacy banner
    privacyBanner: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      backgroundColor: '#0A1A0F', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
    privacyText: { fontSize: 11, color: Colors.secondary, fontWeight: '600' as const },

    // Tab bar
    tabBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, maxHeight: 48 },
    tabBarContent: { paddingHorizontal: 8, alignItems: 'center' as const },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 12 },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    tabText: { fontSize: 11, fontWeight: '700' as const, color: Colors.textMuted, letterSpacing: 0.8 },
    tabTextActive: { color: Colors.primary },

    // Content area
    content: { flex: 1 },
    tabContent: { flex: 1, padding: 12 },

    // Add button
    addBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, backgroundColor: Colors.primaryDim,
      borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, alignSelf: 'flex-start' as const },
    addBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' as const },

    // Cards
    card: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.surface,
      borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 8, padding: 12 },
    cardIcon: { width: 40, alignItems: 'center' as const },
    cardBody: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.textPrimary },
    cardSub: { fontSize: 12, color: Colors.textSecondary },
    cardMeta: { fontSize: 11, color: Colors.textMuted },
    iconBtn: { padding: 8 },

    // Rally card
    rallyCard: { paddingVertical: 14 },
    rallyTypeTag: { backgroundColor: Colors.primaryDim, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 10 },
    rallyTypeText: { fontSize: 10, fontWeight: '800' as const, color: Colors.primary, letterSpacing: 1 },

    // Badges
    badgeRow: { flexDirection: 'row' as const, gap: 6, marginTop: 3 },
    badge: { backgroundColor: '#1E3040', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    badgeWarn: { backgroundColor: '#3A2A00' },
    badgeOut: { backgroundColor: '#3A2A00' },
    badgeText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' as const },

    // Empty state
    empty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' as const, marginTop: 32, fontStyle: 'italic' as const },

    // Docs tab
    docsHeader: { marginBottom: 12 },
    docsProgress: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
    progressBar: { height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2 },
    progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
    docRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.divider },
    checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.textMuted,
      alignItems: 'center' as const, justifyContent: 'center' as const },
    checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    docText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
    docTextChecked: { color: Colors.textMuted, textDecorationLine: 'line-through' as const },
  }),
  ...StyleSheet.create({
    // Emergency card
    emergencyCard: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1,
      borderColor: Colors.primary, padding: 18, marginBottom: 16 },
    ecTitle: { fontSize: 16, fontWeight: '900' as const, color: Colors.primary, textAlign: 'center' as const,
      letterSpacing: 2, marginBottom: 4 },
    ecDate: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' as const, marginBottom: 10 },
    ecDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 10 },
    ecSection: { fontSize: 11, fontWeight: '800' as const, color: Colors.textSecondary, letterSpacing: 1.2,
      marginBottom: 4 },
    ecRow: { fontSize: 12, color: Colors.textPrimary, marginBottom: 2 },
    ecFooter: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' as const, marginTop: 4, fontStyle: 'italic' as const },

    // Card actions
    cardActions: { flexDirection: 'row' as const, gap: 12, marginBottom: 12 },
    actionBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      gap: 8, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 12 },
    actionBtnText: { color: Colors.textPrimary, fontWeight: '700' as const, fontSize: 14 },
    packageHint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' as const, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    // Field
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' as const, marginBottom: 4, letterSpacing: 0.5 },
    fieldInput: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, borderWidth: 1,
      borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 14, color: Colors.textPrimary, height: 44 },

    // Blood type chips
    chip: { borderRadius: 6, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 10,
      paddingVertical: 6, marginRight: 6 },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' as const },
    chipTextActive: { color: Colors.textPrimary },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
    modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '90%' as const },
    modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
    modalTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.textPrimary },
    modalBody: { padding: 16, paddingBottom: 8 },
    saveBtn: { backgroundColor: Colors.primary, margin: 16, borderRadius: 10, paddingVertical: 14, alignItems: 'center' as const },
    saveBtnText: { color: Colors.textPrimary, fontWeight: '800' as const, fontSize: 15, letterSpacing: 0.5 },
  }),
};
