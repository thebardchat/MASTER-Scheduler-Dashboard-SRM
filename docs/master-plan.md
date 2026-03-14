# Master Plan — MASTER-Scheduler-Dashboard-SRM

## Vision

Unified dispatch routing, scheduling, and management system for SRM Concrete's North Alabama fleet. Maximizes loads to plants. Keeps block plants fed. Zero empty trucks.

## Phases

### Phase 1 — Monorepo Bootstrap (Current)
- [x] Create CLAUDE.md and README.md
- [x] Merge srm-dispatch source into monorepo
- [x] Merge SB-Management-OS content into monorepo
- [x] Add 908 block plant to plant config
- [ ] Verify build and deploy pipeline

### Phase 2 — Load Priority Engine
- [ ] Build load priority scoring (block plants first)
- [ ] Plant needs dashboard (what each plant needs today)
- [ ] Load counter (SRM loads vs outside loads per plant)
- [ ] Weekly load report

### Phase 3 — Fleet Intelligence
- [ ] SAMSARA GPS integration
- [ ] Real-time truck position overlay
- [ ] Automated ETA calculations
- [ ] Weekly fairness report (zone rotation, BP rotation)

### Phase 4 — Communication
- [ ] Talk-to-text order entry
- [ ] Automated phone dispatch
- [ ] Driver mobile app (route viewer)

## Architecture

```
MASTER-Scheduler-Dashboard-SRM
  ├── Dispatch Router (daily routes, load maximization)
  ├── Management OS (SOPs, personnel, coaching)
  ├── Scheduling Dashboard (driver clock-in, assignments)
  └── Future: SAMSARA integration, Angel Cloud ops layer
```

## Constraints

- Must run offline on Pi 5 (16GB RAM)
- ADHD-aware UX: one screen, next action obvious
- Mobile-first: used in the yard on a phone
- No backend dependencies — client-side only
- Print-friendly route sheets for drivers

---

*Governed by the [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md)*
