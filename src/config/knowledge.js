// ═══════════════════════════════════════════════════════════════
// SRM Dispatch Knowledge Base — Editable Proximity & Routing Rules
// This file is the single source of truth for route optimization.
// All values are editable from the dashboard Settings panel.
// ═══════════════════════════════════════════════════════════════

import { getDriveTime } from './distances.js'

// ── Quarry Hub Assignments ──
// Which quarry hub does each crew use for scrap pickup?
export const CREW_QUARRY = {
  "519": "594",   // Muscle Shoals → Cherokee RQ
  "507": "591",   // HSV/Stringfield → Mt. Hope
  "506": "591",   // Decatur → Mt. Hope
}

// ── Rock Source per Hub ──
// After scrap pickup, where does the crew get 67s rock?
export const HUB_ROCK_SOURCE = {
  "594": "594",   // Cherokee crew gets 67s AT Cherokee
  "591": "591",   // MH crew gets 67s AT MH
}

// ── Delivery Plants ──
// Plants that receive rock/sand deliveries (excludes quarries, BP, POD, etc.)
export const DELIVERY_PLANTS = ["506", "507", "508", "511", "513", "514", "516", "519", "525"]

// ── Plants each crew can deliver to (by proximity from their hub) ──
// Auto-generated from distances but editable. Sorted nearest-first.
export function getProximityRanking(hub) {
  return DELIVERY_PLANTS
    .map(code => ({ code, time: getDriveTime(hub, code) }))
    .sort((a, b) => a.time - b.time)
}

// ── Crew-specific delivery plant pools ──
// These define which plants each crew spreads rock to.
// Ordered by proximity from their quarry hub. Editable.
export const CREW_DELIVERY_POOLS = {
  // 519 crew delivers rock FROM Cherokee (594) to these plants, nearest first
  // Cherokee→519: 30, Cherokee→506: 55, Cherokee→513: 65, Cherokee→511: 75, Cherokee→507: 95
  "519": ["519", "506", "513", "511", "507"],

  // 507 crew delivers rock FROM MH (591) to these plants, nearest first
  // MH→519: 20, MH→506: 30, MH→513: 35, MH→511: 40, MH→525: 45, MH→507: 70
  "507": ["519", "506", "513", "511", "525", "507"],

  // 506 crew delivers rock FROM MH (591), same hub but 2-round pattern
  // Focuses on closer plants for efficiency
  "506": ["506", "513", "511", "519", "525", "507"],
}

// ── Route Templates ──
// Defines the structure of a standard route for each crew type.
// {scrap} = scrap pickup, {hub} = quarry hub, {rock} = 67s source,
// {plant} = rotated delivery plant, {POD} = sand, {home} = home plant
export const ROUTE_TEMPLATES = {
  "519_standard":  "Scrap→{rock} 67s→{plant} rock→POD sand→home",
  "519_swap":      "Scrap→{rock} 67s→{plant} rock→{scrap}→{plant2} rock→loop",
  "507_standard":  "Scrap→{rock} 67s→{plant} rock→POD sand→home",
  "506_standard":  "R1: Scrap→{rock} 67s→{plant1} rock→POD sand / R2: {plant2}→{rock} 67s→{plant3} rock→POD sand→home",
  "bp_standard":   "Scrap→{rock} 67s→{firstRock} rock→518 check→502 BP 1/4 downs→907 blocks→post-BP",
}

// ── Spreading Strategy ──
// How materials get distributed across plants. Controls the optimizer.
export const SPREAD_RULES = {
  // Maximum times the same plant appears in a single day's routes
  maxSamePlantPerDay: 3,
  // Prefer plants that haven't been served recently
  fairnessWeight: 0.3,
  // Proximity weight (higher = stick closer to hub)
  proximityWeight: 0.7,
  // Whether to allow cross-crew plant assignments
  allowCrossCrew: false,
}

// ── Block Plants — MUST SUPPLY (zero outside help) ──
export const BLOCK_PLANTS = new Set(["907", "908"])

// ── Auto-Plan: Compute optimal plant assignments for a full day ──
// Returns { driverName: [plant1, plant2, ...] } based on proximity + fairness
// Block plants (907, 908) get priority — they're scored with a bonus so they
// always get served first before full-service or partial-help plants.
export function autoPlanDay(drivers, crewQuarry, pools, cycleDay, recentHistory = {}) {
  const assignments = {}
  const plantLoadCount = {}  // track how many times each plant is assigned today

  DELIVERY_PLANTS.forEach(p => { plantLoadCount[p] = 0 })

  // Ensure block plants are in every crew's pool for auto-plan consideration
  const expandedPools = {}
  for (const [crew, pool] of Object.entries(pools)) {
    const expanded = [...pool]
    BLOCK_PLANTS.forEach(bp => {
      if (!expanded.includes(bp)) expanded.push(bp)
    })
    expandedPools[crew] = expanded
  }

  drivers.forEach((driver, driverIdx) => {
    const crew = driver.crew
    if (crew === "DUMP" || crew === "516") return  // skip fixed routes
    const pool = expandedPools[crew] || expandedPools["507"]  // fallback
    const hub = crewQuarry[crew] || "591"

    // Score each plant: lower = better
    const scored = pool.map(code => {
      const proximity = getDriveTime(hub, code)
      const loadPenalty = plantLoadCount[code] * 30  // 30min penalty per existing assignment
      const recentPenalty = (recentHistory[code] || 0) * 15  // recent service penalty
      const rotationOffset = ((driverIdx + cycleDay) % pool.length) * 5  // spread drivers

      // Block plant bonus: reduce score by 40 if block plant has 0 loads today
      // This ensures 907/908 get served before other plants starve
      const blockBonus = BLOCK_PLANTS.has(code) && plantLoadCount[code] === 0 ? -40 : 0

      return {
        code,
        score: (proximity * SPREAD_RULES.proximityWeight)
             + (loadPenalty * SPREAD_RULES.fairnessWeight)
             + recentPenalty
             + rotationOffset
             + blockBonus,
      }
    })

    scored.sort((a, b) => a.score - b.score)

    // Pick top plant(s) based on crew pattern
    const numPlants = crew === "506" ? 3 : 1  // 506 does 2 rounds = 3 plants
    const picks = scored
      .filter(s => plantLoadCount[s.code] < SPREAD_RULES.maxSamePlantPerDay)
      .slice(0, numPlants)
      .map(s => s.code)

    picks.forEach(p => { plantLoadCount[p] = (plantLoadCount[p] || 0) + 1 })
    assignments[driver.name] = picks
  })

  return assignments
}

// ── Persistence helpers ──
// Save/load knowledge edits to localStorage
const STORAGE_KEY = "srm-knowledge-v1"

export function saveKnowledge(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) { /* storage full or unavailable */ }
}

export function loadKnowledge() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

export function clearKnowledge() {
  try { localStorage.removeItem(STORAGE_KEY) } catch (e) { /* */ }
}
