This project operates under the [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).
# CLAUDE.md — MASTER-Scheduler-Dashboard-SRM
### Claude Code Context File · thebardchat/MASTER-Scheduler-Dashboard-SRM · v1.1
### Last Session: 2026-03-14 (Session 1 COMPLETE)

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
Marcus 05:00 A · Brittany 05:00 A · Eboni 05:00 B · Deletra 04:00 B

### Crew 519 (Muscle Shoals/Central)
Charlie 04:15 A · Bryant 04:30 B · Jamie 04:30 C · Eddie 04:00 C

### Crew 506 (Decatur/West-Central)
Kenny 05:00 A · Jimmy 05:00 B · Roberto 04:00 C · Jonathon 04:15 C

### Fixed Bridgeport
Stacey 04:00 (always BP) · Alexis 08:00 (516 base, dual-round, short day)

### Dispatch Manager
Curtis — Office/dispatch, drives 525 coverage when needed

---

## Plant & Location Reference

### Concrete Plants
| Code | Name | Zone | Outside Help |
|------|------|------|-------------|
| 506 | Decatur | Central | None |
| 507 | Stringfield | North | Outside SAND |
| 508 | Nick Fitcheard | North | Outside SAND |
| 511 | Palmer | North | None |
| 513 | Greenbrier | North | None |
| 514 | Arab | East-Central | None |
| 516 | Lacey Spring | East-Central | Outside ROCK |
| 518 | Scottsboro | Far East | Outside SAND |
| 519 | Muscle Shoals | Central | None |
| 525 | Cullman | South | Outside SAND |
| 907 | Palmer Block | North | **NONE — MUST SUPPLY** |
| 908 | Block Plant | North | **NONE — MUST SUPPLY** |

### Quarries & Sources
591 Mt. Hope (MH) · 594 Cherokee RQ · 502 Bridgeport (BP) · POD Port of Decatur
MM Martin Marietta · RG Rogers Group · APAC Tremont · MSAND Monteagle Sand

---

## Route Logic Engine

### Key Files
- `src/utils/shorthand.js` — route generation (buildShorthand, p, after514, endOfShift519, bpFirstRock, check518)
- `src/utils/rotation.js` — BP cycling, calendar, cycle day
- `src/config/crew.js` — 16 drivers, BP groups A/B/C, rotations, tabs
- `src/config/plants.js` — 19 locations, OUTSIDE_SAND/ROCK sets, SUBS map
- `src/config/distances.js` — drive time matrix, quarry close logic (960 min = 4PM)

### Key Config Sets
- `OUTSIDE_SAND`: `["507","508","525","518"]`
- `OUTSIDE_ROCK`: `["516"]`
- `SAND_TARGETS`: `["519","506","511","513","514","516"]`
- `SUBS`: fallback map when plant DOWN (907/908 have NO subs — alert Shane)

---

## Tech Stack
React 18 + Vite 5 · Vanilla CSS · Client-side only · PWA (offline) · GitHub Pages + Pi 5 LAN

## Hardware
Pi 5 16GB (`10.0.0.42` / `100.67.120.6`) · Pironman 5-MAX RAID 1 · Pulsar0100 (`100.81.70.117`) · SAMSARA incoming

**Project Path:** `/mnt/shanebrain-raid/shanebrain-core/MASTER-Scheduler-Dashboard-SRM/`

---

## Business Rules — Do Not Break

- Block plants (907, 908) supplied FIRST — zero outside help
- No empty trucks — every leg carries material
- CHRIS P route FIXED — never touch
- Dump trailer drivers never do scrap runs
- BP rotation fair — groups A/B/C, Stacey+Alexis fixed
- 514 chain rule — sand→514→scrap→LQ→RG rock→home
- Tuesday/Friday overrides — special BP+block supply runs
- Check 518 before sending — call Shane/Anthony
- Quarry close 4PM enforced — routes shorten near end of shift
- No same zone >2 consecutive days

---

## Session Log

### Session 1: Repo Bootstrap ✅ COMPLETE (2026-03-14)
- [x] CLAUDE.md + README.md
- [x] Load maximization strategy defined
- [x] srm-dispatch source merged
- [x] SB-Management-OS content merged
- [x] 908 added to plants.js
- [x] package.json + vite.config.js updated
- [x] docs/master-plan.md created
- [x] Build passes clean

### Session 2 Priorities (NEXT)
1. Create root `styles.css` (SOP pages reference it, missing)
2. Build PlantDashboard.jsx — per-plant priority view (RED/YELLOW/GREEN)
3. Build loadCounter.js — count route stops per plant
4. Wire Plant Dashboard as "PLANTS" tab in App.jsx
5. Nav links between dispatch UI ↔ management OS
6. Update srm-dispatch-router skill

### Session 3 (FUTURE)
- Load priority scoring engine
- Route optimization suggestions
- Weekly load report
- Print-friendly route sheet

### Backlog
- SAMSARA GPS · Talk-to-text · Automated phone dispatch · Driver mobile app · Real-time truck overlay

---

## Constitutional Alignment
Governed by [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).

- [x] Works offline on Pi
- [x] One-action UX
- [ ] Printable output
- [x] Fairness logic intact
- [ ] Block plants never starved (Session 2)

---

*Last updated: 2026-03-14 · Session 1 Complete · v1.1*
