This project operates under the [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).

# CLAUDE.md — MASTER-Scheduler-Dashboard-SRM
### Claude Code Context File · thebardchat/MASTER-Scheduler-Dashboard-SRM · v1.2
### Last Session: 2026-03-14 (Session 2 COMPLETE)

---

## What This Repo Is

Master monorepo combining SRM Concrete's dispatch routing engine, management dashboard, SOPs, and scheduling tools into a single deployable system. Replaces scattered repos (`srm-dispatch`, `SB-Management-OS`) with one source of truth.

**Primary goal:** Maximize aggregate loads delivered to plants by SRM fleet trucks, accounting for which plants receive outside hauler help and which (block plants) must be supplied exclusively by SRM drivers.

---

## Operator Context

- **Dispatcher:** Shane — sole dispatcher, sole provider, ADHD brain, Hazel Green AL
- **Dispatch Manager:** Curtis (promoted from driver — NOT in active route pool, occasionally drives 525 coverage)
- **Fleet:** 16 active drivers + Curtis backup = 17 total
- **Order System:** AUJS Classic (scale sync issues with new AU system — Classic stays)
- **Comms:** Text message dispatch to drivers
- **Hardware:** Pi 5 (16GB) local + Pulsar0100 dev workstation + future SAMSARA integration

---

## The Strategy — Load Maximization

### Outside Help Matrix

Plants that receive aggregate deliveries from **outside haulers** (not SRM fleet):

| Plant | Outside Material | What SRM Still Supplies |
|-------|-----------------|------------------------|
| 507 Stringfield | Sand | Rock (67s, 78s) |
| 508 Nick Fitcheard | Sand | Rock |
| 518 Scottsboro | Sand | Rock (MM 78s), 1/4 downs from BP |
| 525 Cullman | Sand | Rock |
| 516 Lacey Spring | Rock | Sand (POD), scrap backhaul rock |

### Block Plants — NO Outside Help (SRM Must Supply 100%)

| Plant | Materials Needed | Supply Chain |
|-------|-----------------|-------------|
| 907 Palmer Block | 1/4 downs, blocks, sand, specific aggregates | BP runs, CHRIS P route (APAC Tremont sand) |
| 908 Block Plant | Same as 907 | Must be covered by SRM fleet |

### Routing Priority Order
1. Block plants (907, 908) — zero outside help, SRM fleet is their only source
2. Plants with partial outside help — fill gaps outside haulers miss
3. Full-service plants (506, 511, 513, 514, 519) — SRM supplies everything
4. Scrap runs every morning — generates backhaul rock, cleans yards
5. No empty trucks — every leg carries material

---

## Fleet Reference

### Dump Trailer Drivers (EXEMPT from scrap runs)
| Driver | Home | Start | Notes |
|--------|------|-------|-------|
| CHRIS P | CHER | 04:00 | **FIXED ROUTE — never modify.** CHER→MSAND→Tupelo Block→APAC Tremont→511→POD→519→PRELOAD |
| Tim | 519 | 05:00 | Dump trailer breaks often → runs triaxle as backup |

### Crew 507 (Huntsville/North)
| Driver | Start | BP Group |
|--------|-------|----------|
| Marcus | 05:00 | A |
| Brittany | 05:00 | A |
| Eboni | 05:00 | B |
| Deletra | 04:00 | B |

### Crew 519 (Muscle Shoals/Central)
| Driver | Start | BP Group |
|--------|-------|----------|
| Charlie | 04:15 | A |
| Bryant | 04:30 | B |
| Jamie | 04:30 | C |
| Eddie | 04:00 | C |

### Crew 506 (Decatur/West-Central)
| Driver | Start | BP Group |
|--------|-------|----------|
| Kenny | 05:00 | A |
| Jimmy | 05:00 | B |
| Roberto | 04:00 | C |
| Jonathon | 04:15 | C |

### Fixed Bridgeport
| Driver | Start | Notes |
|--------|-------|-------|
| Stacey | 04:00 | Always on BP rotation |
| Alexis | 08:00 | 516 base, dual-round RG/MM routes, short day |

### Dispatch Manager
| Name | Role |
|------|------|
| Curtis | Office/dispatch, drives 525 coverage when needed |

---

## Plant & Location Reference

### Concrete Plants
| Code | Name | Zone | Outside Help |
|------|------|------|-------------|
| 506 | Decatur | Central | None — SRM full service |
| 507 | Stringfield | North | Outside SAND |
| 508 | Nick Fitcheard | North | Outside SAND |
| 511 | Palmer | North | None — SRM full service |
| 513 | Greenbrier | North | None — SRM full service |
| 514 | Arab | East-Central | None — SRM full service |
| 516 | Lacey Spring | East-Central | Outside ROCK |
| 518 | Scottsboro | Far East | Outside SAND |
| 519 | Muscle Shoals | Central | None — SRM full service |
| 525 | Cullman | South | Outside SAND |
| 907 | Palmer Block | North | **NONE — MUST SUPPLY** |
| 908 | Block Plant | North | **NONE — MUST SUPPLY** |

### Quarries & Sources
| Code | Name | Materials |
|------|------|-----------|
| 591 | Mt. Hope (MH) | 67s rock, scrap drop |
| 594 | Cherokee RQ (CHER) | 67s rock, scrap drop (good/bad piles) |
| 502 | Bridgeport (BP) | 1/4 downs for block plants |
| POD | Port of Decatur | Pine Bluff Sand |
| MM | Martin Marietta | 78s rock (Huntsville) |
| RG | Rogers Group | 67s rock (near Lacey Spring) |
| APAC | APAC Tremont | Sand for block plants (CHRIS P route) |
| MSAND | Monteagle Sand | Long haul north (CHRIS P route) |

---

## Drive Time Matrix (minutes, one-way loaded)

Key routes for load planning:
```
MH→506: 30    MH→511: 40    MH→513: 35    MH→507: 70    MH→519: 20
MH→525: 45    MH→907: 45    MH→594: 40    MH→514: 80    MH→516: 80
POD→506: 10   POD→511: 20   POD→513: 15   POD→507: 75   POD→519: 55
BP→518: 25    BP→907: 200   BP→511: 200
516→RG: 1     507→MM: 1     514→RG: 20    RG→507: 25
```

---

## Route Logic Engine

### Key Files
- `src/utils/shorthand.js` — route generation (`buildShorthand`, `p`, `after514`, `endOfShift519`, `bpFirstRock`, `check518`)
- `src/utils/rotation.js` — BP cycling, calendar, cycle day
- `src/utils/loadCounter.js` — plant load counting, priority scoring (RED/YELLOW/GREEN), outside help awareness
- `src/config/crew.js` — 16 drivers, BP groups A/B/C, rotations, tabs
- `src/config/plants.js` — 19 locations, OUTSIDE_SAND/ROCK sets, SUBS map
- `src/config/distances.js` — drive time matrix, quarry close logic (960 min = 4PM)
- `src/components/PlantDashboard.jsx` — per-plant priority grid with load counts, block plant alerts

### Key Config Sets
- `OUTSIDE_SAND`: ["507","508","525","518"]
- `OUTSIDE_ROCK`: ["516"]
- `SAND_TARGETS`: ["519","506","511","513","514","516"]
- `BLOCK_PLANTS`: ["907","908"] — zero outside help, RED priority if 0 loads
- `SUBS`: fallback map when plant DOWN (907/908 have NO subs — alert Shane)

### Rotation System (`src/config/crew.js`)
- **BP Groups A/B/C** rotate on `cycleDay % 3`
- **507 Rota:** `["506","511","513","507","514"]`
- **506 Rota:** `["511","513","514","506"]`
- **Tuesday/Friday overrides:** Special BP + block plant supply runs

### Plant Substitution (`src/config/plants.js`)
When a plant is DOWN, `SUBS` map provides fallback:
```
506→[511,513,508]  507→[508,511,513]  511→[513,506,507]
513→[511,506,507]  514→[516,519,513]  516→[514,519,513]
519→[514,516,511]  525→[514,516,519]  591→[594]  594→[591]
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite 5 |
| UI | Vanilla CSS, mobile-first |
| State | Client-side only |
| PWA | vite-plugin-pwa, offline-capable |
| Deploy | GitHub Pages (`thebardchat.github.io/MASTER-Scheduler-Dashboard-SRM`) |
| Local | Pi 5 at `http://10.0.0.42:3031` |

---

## Hardware Context

| Device | Role | Address |
|--------|------|---------|
| Raspberry Pi 5 (16GB) | Local dev + LAN hosting | `100.67.120.6` Tailscale / `10.0.0.42` LAN |
| Pironman 5-MAX | NVMe RAID 1 chassis | 2× WD Blue SN5000 2TB |
| Pulsar0100 | N8N bridge / dev workstation | `100.81.70.117` |
| SAMSARA (incoming) | GPS/telematics on all trucks | Integration TBD |

**Project Path:** `/mnt/shanebrain-raid/shanebrain-core/MASTER-Scheduler-Dashboard-SRM/`

---

## Business Rules — Do Not Break

| Rule | Why |
|------|-----|
| Block plants (907, 908) get supplied FIRST | Zero outside help — they starve without SRM fleet |
| No empty trucks | Every leg carries material — scrap out, rock back |
| CHRIS P route is FIXED | Never touch: CHER→MSAND→Tupelo→APAC→511→POD→519→PRELOAD |
| Dump trailer drivers (Chris P, Tim) NEVER do scrap runs | Equipment incompatibility |
| Bridgeport rotation is FAIR | Max 1x/week per driver, groups A/B/C rotate, Stacey+Alexis fixed |
| 514 chain rule | Delivering to 514 triggers scrap→LQ→RG rock→home chain |
| Tuesday/Friday overrides | Special BP+block supply runs for 507 and 519 crews |
| Check 518 before sending material | Call Shane (256-402-5176) or Anthony (256-924-4328) |
| Quarry close time enforced | End-of-shift routes shorten when time is tight |
| Zone rotation — no same zone >2 days | Prevents driver burnout |

---

## Design Constraints

- **ADHD-aware:** One screen, next action always obvious
- **Mobile-first:** Shane uses phone in the yard
- **Offline-capable:** Must work on Pi LAN with no internet
- **Print-friendly:** Drivers need physical route sheets
- **Copy-to-clipboard:** Tap route card → copies text for SMS dispatch

---

## Repo Structure (Session 2 Complete)

```
MASTER-Scheduler-Dashboard-SRM/
├── CLAUDE.md                        ← Claude Code context (v1.2)
├── README.md
├── styles.css                       ← root stylesheet for SOP/management pages
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx                      ← dispatch UI + PLANTS tab + nav footer
│   ├── components/
│   │   └── PlantDashboard.jsx       ← plant priority grid with load counts
│   ├── config/
│   │   ├── crew.js                  ← drivers, BP groups, rotations
│   │   ├── plants.js                ← plant codes, outside help sets, subs
│   │   └── distances.js             ← drive time matrix
│   └── utils/
│       ├── shorthand.js             ← route generation engine
│       ├── rotation.js              ← rotation assignment logic
│       └── loadCounter.js           ← load counting + priority scoring
├── SOPs/
│   ├── service-efficiency.html
│   ├── cleanliness-standards.html
│   └── ...
├── dashboard.html                   ← management OS entry
├── dashboard-styles.css
├── scripts/                         ← coaching tools, training
├── personnel/                       ← performance tracking
├── affirmations/                    ← morning fire
└── docs/
    └── master-plan.md               ← mega dashboard roadmap
```

---

## Session Log — Update This Every Session

### Session 1: Repo Bootstrap — COMPLETE (2026-03-14)
- [x] Created CLAUDE.md and README.md
- [x] Defined load maximization strategy
- [x] Mapped outside help vs block plant supply chain
- [x] Migrate srm-dispatch source into this repo
- [x] Migrate srm-management-os content (SOPs, personnel, scripts, affirmations, dashboard.html)
- [x] Add 908 block plant to plant config (ALL_PLANTS + SUBS)
- [x] Update package.json (name, homepage) and vite.config.js (base path)
- [x] Created docs/master-plan.md with phased roadmap
- [x] npm install && npm run build — passes clean

### Session 2: Plant Dashboard + Load Counter — COMPLETE (2026-03-14)
- [x] Created root styles.css (SOP/script/personnel/affirmation pages now load correctly)
- [x] Built src/utils/loadCounter.js — extractPlantStops, countLoadsPerPlant, getPlantPriority, getSRMResponsibility, buildPlantReport
- [x] Built src/components/PlantDashboard.jsx — RED/YELLOW/GREEN priority grid, block plant alerts, filter tabs, load summary
- [x] Wired PlantDashboard as "PLANTS" pill in App.jsx header controls
- [x] Added nav link: dispatch footer → dashboard.html (Management OS)
- [x] Added nav link: dashboard.html footer → index.html (Dispatch Router)
- [x] Updated srm-dispatch-router skill with outside help logic, corrected plant codes, updated driver info
- [x] Route data generated from ALL_DRIVERS + buildShorthand, passed to PlantDashboard via useMemo
- [x] npm run build passes clean

### Session 3 Priorities (NEXT)
1. Load priority scoring engine — weighted scoring based on plant type + time of day + loads already delivered
2. Route optimization suggestions — "Driver X could add a stop at 907 on the way back"
3. Weekly load report — aggregate loads per plant Mon-Fri
4. Print-friendly route sheet — one page per driver, clean layout

### Session 4 (FUTURE)
- SAMSARA GPS integration
- Real-time truck position overlay
- Automated ETA calculations
- Weekly fairness report

### Backlog
- Talk-to-text order entry
- Automated phone dispatch
- Driver mobile app
- Real-time truck overlay

---

## Constitutional Alignment

Governed by [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).

Ship checklist:
- [x] Works offline on Pi
- [x] One-action UX (no multi-step friction)
- [ ] Printable output option (Session 3)
- [x] Fairness logic intact
- [x] Block plants never starved — PlantDashboard shows RED alert when 0 loads

---

## Ecosystem Position

```
MASTER-Scheduler-Dashboard-SRM
  ├── Dispatch Router (daily routes, load maximization)
  ├── Management OS (SOPs, personnel, coaching)
  ├── Scheduling Dashboard (driver clock-in, assignments)
  └── Future: SAMSARA integration, Angel Cloud ops layer
```

---

*Last updated: 2026-03-14 · Session 2 Complete · v1.2 · thebardchat/MASTER-Scheduler-Dashboard-SRM*

## Claude Code Rules
- Commit and push directly to `main`. Do NOT create branches.
- Run build/test commands before committing.
- Update CLAUDE.md session log before final commit.
