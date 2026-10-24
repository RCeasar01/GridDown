# Triage Trees

Deterministic, branching emergency protocols. The AI advisor routes users **into** these;
it never generates content inside them. Same input, same answer, every phone, no model needed.

| File | Protocol | Status |
|---|---|---|
| `severe-bleeding.json` | Tourniquet / packing / pressure, shock care | draft |
| `unresponsive-cpr.json` | Responsiveness, breathing, CPR (adult/child/infant), AED | draft |
| `hypothermia.json` | Mild vs severe, rewarming, hand-off to CPR | draft |
| `heat-illness.json` | Heat exhaustion vs heat stroke, cooling | draft |
| `snakebite.json` | North American pit vipers / coral snakes | draft |

## Release gate (important)

- `reviewStatus: "draft"` trees show **only in development builds** (`__DEV__`).
- Release builds show a tree only after it is set to `"reviewed"` with `reviewedBy` and `reviewedOn`.
- With zero reviewed trees, release builds hide the Emergency Protocols tile and Advisor cards entirely.

## Clinical review process

1. Export the tree for the reviewer (print the JSON, or walk it in a dev build).
2. Reviewer must be qualified: Paramedic, RN, PA, MD/DO, or Wilderness First Responder instructor.
3. Apply their edits, bump `version` (e.g. `0.1.0` -> `1.0.0`).
4. Set `reviewStatus: "reviewed"`, `reviewedBy: "Name, credential"`, `reviewedOn: "YYYY-MM-DD"`.
5. Run `npm test` - the validator rejects reviewed trees without reviewer details.
6. Re-review yearly, or when the source guidelines update (AHA updates every ~5 years).

## Writing rules

- One decision per question. Plain words. Readable by a panicked person.
- Action steps are imperative, one action per line, most important first.
- Every path must end at an `end` node (the validator enforces this).
- `sources` must name public guidance. Do not paste copyrighted text; write in your own words.
- Link `guideId` only to guides that exist (tested).

## Adding a tree

1. Create `<id>.json` here following `app/triage/types.ts`.
2. Import it in `app/triage/registry.ts` (`ALL_TREES`).
3. Add router patterns in `app/triage/router.ts` and positive/negative phrases in `__tests__/triage.test.ts`.
4. `npm test`.
