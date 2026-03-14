This project operates under the [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).
# CLAUDE.md — MASTER-Scheduler-Dashboard-SRM
### Claude Code Context File · thebardchat/MASTER-Scheduler-Dashboard-SRM · v1.0
### Last Session: 2026-03-14

---

## What This Repo Is

Master monorepo combining SRM Concrete's dispatch routing engine, management dashboard, SOPs, and scheduling tools into a single deployable system. Replaces scattered repos (`srm-dispatch`, `srm-management-os`) with one source of truth.

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
2. Plants with partial outside help — fill gaps outside haulers miss (rock to sand-covered plants, sand to rock-covered plants)
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
| Jamie | 05:00 | C |
| Eddie | 05:00 | C |

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
| Alexis | 07:00 | 516 base, dual-round RG/MM routes |

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

### Shorthand System (`src/utils/shorthand.js`)
Generates text-based route cards per driver. Core functions:
- `buildShorthand(name, options)` — master route builder
- `p(code, down, subMap)` — plant substitution when a plant is down
- `after514(homePlant, down, subMap)` — 514 chain rule (sand→514→scrap→LQ→RG rock→home)
- `endOfShift519()` — time-aware route shortening near quarry close
- `bpFirstRock()` — rotating BP first-rock delivery plant
- `check518()` — call Shane/Anthony before sending to 518

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
| Deploy | GitHub Pages (`thebardchat.github.io/srm-dispatch`) |
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

## Repo Structure (Target)

```
MASTER-Scheduler-Dashboard-SRM/
├── CLAUDE.md                    ← you are here
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── App.jsx                  ← main dispatch UI
│   ├── config/
│   │   ├── crew.js              ← drivers, BP groups, rotations
│   │   ├── plants.js            ← plant codes, outside help sets, subs
│   │   └── distances.js         ← drive time matrix
│   ├── utils/
│   │   ├── shorthand.js         ← route generation engine
│   │   └── rotation.js          ← rotation assignment logic
│   └── components/              ← UI components (build out)
├── SOPs/
│   ├── service-efficiency.html
│   ├── cleanliness-standards.html
│   └── ...
├── dashboard.html               ← management OS entry
├── scripts/                     ← coaching tools, training
├── personnel/                   ← performance tracking
├── affirmations/                ← morning fire
└── docs/
    └── master-plan.md           ← mega dashboard roadmap
```

---

## Session Log — Update This Every Session

### 2026-03-14 — Session 1: Repo Bootstrap
- [x] Created CLAUDE.md and README.md
- [x] Defined load maximization strategy
- [x] Mapped outside help vs block plant supply chain
- [x] Migrate srm-dispatch source into this repo
- [x] Migrate srm-management-os content (SOPs, personnel, scripts, affirmations, dashboard.html)
- [x] Add 908 block plant to plant config (ALL_PLANTS + SUBS)
- [x] Update package.json (name, homepage) and vite.config.js (base path)
- [x] Created docs/master-plan.md with phased roadmap
- [x] npm install && npm run build — passes clean
- [ ] Build load priority engine (block plants first)
- [ ] Integrate SAMSARA data feeds
- [ ] Build weekly load report (loads per plant, SRM vs outside)

### Next Session Priorities
1. Add load counting/tracking per plant
2. Build dashboard view showing which plants need SRM attention today
3. Update srm-dispatch-router skill with new outside help logic
4. Build load priority engine (block plants → partial-help gaps → full-service)

---

## Constitutional Alignment

Governed by [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).

Ship checklist:
- [ ] Works offline on Pi
- [ ] One-action UX (no multi-step friction)
- [ ] Printable output option
- [ ] Fairness logic intact
- [ ] Block plants never starved

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

*Last updated: 2026-03-14 · Session 1 · thebardchat/MASTER-Scheduler-Dashboard-SRM*
