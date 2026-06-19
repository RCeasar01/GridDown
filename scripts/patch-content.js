/**
 * Phase 9: Content completeness patch
 * - Adds requiresMedicalDisclaimer: true to all medical guides
 * - Expands medical-001 (adds step 4)
 * - Expands comms-004 (adds step 4)
 * - Adds security-004 "Rally Point and Lost Person Protocol"
 * - Adds disaster-007 "Civil Unrest and Grid-Down Social Breakdown"
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'app', 'assets', 'content');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(CONTENT_DIR, file), JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ Wrote ${file}`);
}

// ─── 1. medical.json ─────────────────────────────────────────────────────────
console.log('\nPatching medical.json...');
const medical = readJSON('medical.json');
const medGuides = medical.guides || medical;

medGuides.forEach(g => {
  g.requiresMedicalDisclaimer = true;
});

// Expand medical-001: add step 4 — MARCH rapid recap card
const med001 = medGuides.find(g => g.id === 'medical-001');
if (med001 && med001.steps.length < 4) {
  med001.steps.push({
    step: 4,
    title: 'MARCH Rapid Reference — Field Card',
    body: "Commit this to memory or laminate a wallet card.\n\nM — Massive hemorrhage: tourniquet, wound packing, junctional pressure.\nA — Airway: chin lift, jaw thrust, NPA if available, recovery position.\nR — Respiration: chest seal (both sides) for penetrating chest trauma; needle decompression for tension pneumo.\nC — Circulation: establish IV/IO if trained; administer TXA within 3 hours of injury if available; treat hypothermia.\nH — Hypothermia/head trauma: get casualty off cold ground; use space blanket; monitor neurological status.\n\nCritical timelines: tourniquet within 60 seconds of arterial bleed; TXA within 180 minutes of injury; TACEVAC within the 'platinum hour' for penetrating trauma."
  });
  console.log('  ✓ medical-001: added step 4');
}

if (medical.guides) medical.guides = medGuides;
writeJSON('medical.json', medical.guides ? medical : medGuides);

// ─── 2. comms.json ───────────────────────────────────────────────────────────
console.log('\nPatching comms.json...');
const comms = readJSON('comms.json');
const commsGuides = comms.guides || comms;

const comms004 = commsGuides.find(g => g.id === 'comms-004');
if (comms004 && comms004.steps.length < 4) {
  comms004.steps.push({
    step: 4,
    title: 'Mirror signaling and pyrotechnics',
    body: "A signal mirror can be seen for 10+ miles on a clear day — far beyond any whistle. Aim reflected sunlight at an aircraft by looking through the sighting hole (military mirror) or holding the mirror at eye level and tilting toward the sun until you see the flash. Practice this skill before you need it.\n\nPyrotechnics: if you have flares, use them only when you see or hear a rescue asset — a flare burns for 15–60 seconds and should not be wasted. Day/night flares differ: smoke is more visible by day, flame by night. Orange smoke is the universal aircraft-to-ground distress color.\n\nCell phone screens flashed in a pattern can also attract night searches. Three short, three long, three short (SOS in light) is visible hundreds of yards away in darkness."
  });
  console.log('  ✓ comms-004: added step 4');
}

if (comms.guides) comms.guides = commsGuides;
writeJSON('comms.json', comms.guides ? comms : commsGuides);

// ─── 3. security.json — add security-004 ─────────────────────────────────────
console.log('\nPatching security.json...');
const security = readJSON('security.json');
const secGuides = security.guides || security;

if (!secGuides.find(g => g.id === 'security-004')) {
  secGuides.push({
    id: 'security-004',
    category: 'security',
    title: 'Rally Points and Lost Person Protocol',
    priority: 'critical',
    tags: ['security', 'rally point', 'lost person', 'communication', 'group'],
    summary: 'Pre-establish rally points and lost-person protocols before any operation so that separation does not become catastrophe.',
    steps: [
      {
        step: 1,
        title: 'Designate rally points before departure',
        body: "A rally point (RP) is a pre-designated location where group members regroup if separated. Establish at least two before any movement: an Immediate Rally Point (IRP) — a prominent landmark within sight of the route, usable if separation happens within the first mile; and a Distant Rally Point (DRP) — a well-known, unambiguous location (your campsite, a road intersection, a bridge) to be used if the IRP is compromised or you cannot reach it. Everyone in the group must know both locations, their grid coordinates or compass bearing, and the time window for waiting: typically 30 minutes at the IRP, 4–6 hours at the DRP."
      },
      {
        step: 2,
        title: 'Establish lost-person communication plan',
        body: "Before separating from a group, agree on: (1) Radio channel and check-in schedule — e.g., channel 3, check-in every hour on the hour. (2) A code word signaling genuine distress versus routine position updates. (3) What to do if radio contact is not re-established within two check-in periods — go to IRP, then DRP, then signal. (4) Who holds the map and compass for the group, and who has the backup. Write the plan on paper. Do not rely on memory under stress."
      },
      {
        step: 3,
        title: 'Immediate action on separation',
        body: "If you realize you are separated: STOP. Stop moving. Think. Observe. Plan. Panic drives people to walk in circles. Your instinct to keep moving is usually wrong — stay put and signal. Call out verbally. Use your whistle (3 blasts). If you have a radio, call on the agreed channel. Make yourself visible at a clearing or high ground. Do not attempt to retrace your route unless you can clearly identify your back-trail — a wrong guess compounds the problem. Wait at the IRP for the agreed time, then move to the DRP."
      },
      {
        step: 4,
        title: 'Searching for a separated group member',
        body: "If someone is missing: Do not immediately scatter to search — that creates more missing persons. Designate one person as search coordinator. Send at least two people together in each search direction; no one searches alone. Establish a 'hasty search' — cover the most likely routes quickly before conducting a systematic grid search. Use sound: shout, whistle, use vehicle horns. At night, use flashlights and wait for return signals before moving toward them. Contact SAR (search and rescue) early — the first six hours are the highest-probability window for a positive outcome."
      }
    ],
    warnings: [
      'A rally point is useless if not everyone knows it. Brief all group members — including children — before departure, not after separation occurs.',
      'Searching for a lost person at night without a plan creates multiple casualties. Secure your own group before committing to a hasty search in darkness.'
    ],
    proTips: [
      'Use a distinctive landmark for your IRP, not just "the big tree" — in a forest, there are thousands. Use a creek bend, a rock formation, or a junction visible on a map.',
      'The STOP acronym (Stop, Think, Observe, Plan) was developed by the US Forest Service for lost-hiker protocols. It is the single most effective behavior change to prevent a bad situation from becoming fatal.'
    ],
    relatedGuides: ['sec-001', 'sec-003']
  });
  console.log('  ✓ security-004: added');
}

if (security.guides) security.guides = secGuides;
writeJSON('security.json', security.guides ? security : secGuides);

// ─── 4. disaster.json — add disaster-007 ─────────────────────────────────────
console.log('\nPatching disaster.json...');
const disaster = readJSON('disaster.json');
const disGuides = disaster.guides || disaster;

if (!disGuides.find(g => g.id === 'disaster-007')) {
  disGuides.push({
    id: 'disaster-007',
    category: 'disaster',
    title: 'Civil Unrest and Grid-Down Social Breakdown',
    priority: 'advanced',
    tags: ['civil unrest', 'social breakdown', 'security', 'grid-down', 'looting', 'riots'],
    summary: 'Recognize the stages of social breakdown in a grid-down event and adapt your security posture, movement, and resource management accordingly.',
    steps: [
      {
        step: 1,
        title: 'Recognize the breakdown timeline',
        body: "Civil unrest follows a predictable arc after infrastructure collapse. Hours 0–24: most people comply, wait, assume government restoration. Stores sell out. Hours 24–72: frustration rises, opportunistic crime begins, shelves bare. Panic buying turns to conflict. Day 3–7: organized looting, breakdown of civil authority in dense urban areas, hospital and emergency services overwhelmed. Week 2+: resource scarcity drives territorial behavior; group dynamics become survival-critical. Understanding this timeline lets you act proactively — not reactively — at each stage. Decisions made in hour 6 are far less costly than decisions made in day 4."
      },
      {
        step: 2,
        title: 'Low profile and information security',
        body: "During social breakdown, visible wealth and resources become targets. Actions: Do not display food, weapons, generators, or fuel. Cover windows with opaque materials if lights must be used at night — visible light signals habitation and resources. Do not discuss your supplies with neighbors beyond your trusted group. Move at dawn or dusk to avoid peak-activity periods. Use plain, worn clothing; avoid tactical or military gear that marks you as a high-value target or draws law-enforcement attention. Reduce vehicle movement — fuel exhaustion during an unrest scenario can strand you in a dangerous location."
      },
      {
        step: 3,
        title: 'Group dynamics and threat identification',
        body: "A lone individual is a target. A cohesive group with clear roles is significantly safer. Establish a watch rotation — no single person can maintain alertness for more than 4–6 hours. Define group roles: communications, security, medical, logistics. Identify who makes decisions in an emergency. Establish a code word for 'threat imminent — execute plan' that can be spoken calmly without alerting outsiders. Threat identification: most people during breakdown are desperate, not predatory. Distinguish between someone begging for food (manageable, address with minimal resource exposure) and organized groups conducting systematic looting (avoid, do not engage)."
      },
      {
        step: 4,
        title: 'Shelter-in-place vs. evacuation decision matrix',
        body: "The decision to stay or go is the most consequential you will make. Default to shelter-in-place if: your home is defensible, you have 14+ days of supplies, the threat is generalized urban unrest at a distance. Move if: direct threat to your location is imminent, authorities have issued evacuation orders for your specific area, your supply chain is compromised and resupply is impossible. If you move: move before the mass of people do — roads become impassable and dangerous at peak exodus. Have three routes planned to your destination. Carry only what you can move quickly. Leave no indication of your destination."
      },
      {
        step: 5,
        title: 'Communication and intelligence gathering',
        body: "In a grid-down civil unrest scenario, information asymmetry is a force multiplier. Maintain radio monitoring (NOAA weather radio, local emergency services if scanners are available, shortwave for regional and national updates). Establish a neighborhood intelligence network — agree with two or three trusted neighbors to share information on a scheduled basis. Use a runner (person on foot) for short-distance communication when radio silence is preferred. Do not spread unverified information — panic is contagious and false threat reports drive poor decisions. Treat information as a resource: collect it deliberately, verify when possible, distribute selectively."
      }
    ],
    warnings: [
      'Engaging in armed conflict against looters carries serious legal risk even during a declared emergency. Know your jurisdiction\'s laws regarding use of force in property defense. In most states, lethal force is not legal to defend property — only to defend life.',
      'Hoarding a visible resource surplus while neighbors starve creates enemies. Managing community perception of your preparedness level is a security strategy, not deception.'
    ],
    proTips: [
      'The "gray man" concept from security professionals: dress, behave, and present yourself in a way that draws zero attention. Be forgettable. Average clothing, average pace, no tactical gear in public.',
      'Historical case studies from Sarajevo 1992–95 and New Orleans 2005 post-Katrina show that neighborhood-level mutual aid networks dramatically outperformed isolated individual preppers in medium-to-long duration breakdown scenarios.'
    ],
    relatedGuides: ['sec-001', 'sec-002', 'sec-003', 'dis-005']
  });
  console.log('  ✓ disaster-007: added');
}

if (disaster.guides) disaster.guides = disGuides;
writeJSON('disaster.json', disaster.guides ? disaster : disGuides);

console.log('\n✅ Content patch complete.\n');
