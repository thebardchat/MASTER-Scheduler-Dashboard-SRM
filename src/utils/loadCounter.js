/**
 * loadCounter.js — Plant Load Tracking & Priority Scoring
 *
 * Counts SRM fleet loads per plant from generated routes,
 * factors in outside hauler help, and scores priority.
 * Block plants (907, 908) always RED until they have loads.
 */
import { OUTSIDE_SAND, OUTSIDE_ROCK } from '../config/plants.js'

// Plants that get ZERO outside help — SRM must supply 100%
export const BLOCK_PLANTS = new Set(["907", "908"])

// Plants that get partial outside help
export const PARTIAL_HELP = {
  "507": { outsideMaterial: "sand", srmSupplies: "rock" },
  "508": { outsideMaterial: "sand", srmSupplies: "rock" },
  "518": { outsideMaterial: "sand", srmSupplies: "rock + BP 1/4 downs" },
  "525": { outsideMaterial: "sand", srmSupplies: "rock" },
  "516": { outsideMaterial: "rock", srmSupplies: "sand + scrap backhaul" },
}

// Full-service plants — SRM supplies everything, no outside help
export const FULL_SERVICE = new Set(["506", "511", "513", "514", "519"])

/**
 * Extract plant codes mentioned in a route string.
 * Matches 3-digit codes (506-525, 907, 908) and named locations.
 */
export function extractPlantStops(routeText) {
  const stops = {}
  // Match plant codes: 506, 507, 508, 511, 513, 514, 516, 518, 519, 525, 907, 908
  const codePattern = /\b(50[678]|51[13469]|518|519|525|907|908)\b/g
  let match
  while ((match = codePattern.exec(routeText)) !== null) {
    const code = match[1]
    stops[code] = (stops[code] || 0) + 1
  }
  // POD counts as sand sourcing, not a plant delivery
  // BP (502) counts as sourcing for 1/4 downs
  return stops
}

/**
 * Count loads per plant across all driver routes.
 * @param {Object[]} routes - Array of { name, route } from buildShorthand
 * @returns {Object} { plantCode: { loads, drivers[] } }
 */
export function countLoadsPerPlant(routes) {
  const counts = {}
  for (const { name, route } of routes) {
    const stops = extractPlantStops(route)
    for (const [code, count] of Object.entries(stops)) {
      if (!counts[code]) counts[code] = { loads: 0, drivers: [] }
      counts[code].loads += count
      if (!counts[code].drivers.includes(name)) {
        counts[code].drivers.push(name)
      }
    }
  }
  return counts
}

/**
 * Priority levels: RED (critical), YELLOW (watch), GREEN (good)
 */
export const PRIORITY = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
}

/**
 * Get priority status for a plant based on load count and help type.
 *
 * Block plants: RED if 0 loads, YELLOW if 1-2, GREEN if 3+
 * Full service:  RED if 0 loads, YELLOW if 1, GREEN if 2+
 * Partial help:  YELLOW if 0 SRM loads (outside covers some), GREEN if 1+
 */
export function getPlantPriority(plantCode, loadCount) {
  if (BLOCK_PLANTS.has(plantCode)) {
    if (loadCount === 0) return PRIORITY.RED
    if (loadCount <= 2)  return PRIORITY.YELLOW
    return PRIORITY.GREEN
  }
  if (FULL_SERVICE.has(plantCode)) {
    if (loadCount === 0) return PRIORITY.RED
    if (loadCount <= 1)  return PRIORITY.YELLOW
    return PRIORITY.GREEN
  }
  // Partial help — outside haulers cover one material type
  if (PARTIAL_HELP[plantCode]) {
    if (loadCount === 0) return PRIORITY.YELLOW  // outside covers something
    return PRIORITY.GREEN
  }
  return PRIORITY.GREEN
}

/**
 * Get what SRM is responsible for at each plant.
 */
export function getSRMResponsibility(plantCode) {
  if (BLOCK_PLANTS.has(plantCode)) {
    return { type: 'block', label: 'MUST SUPPLY 100%', outsideHelp: 'NONE' }
  }
  if (PARTIAL_HELP[plantCode]) {
    const info = PARTIAL_HELP[plantCode]
    return {
      type: 'partial',
      label: `SRM: ${info.srmSupplies}`,
      outsideHelp: `Outside: ${info.outsideMaterial}`,
    }
  }
  if (FULL_SERVICE.has(plantCode)) {
    return { type: 'full', label: 'Full service', outsideHelp: 'NONE' }
  }
  // Quarries and sources
  return { type: 'source', label: 'Source/Quarry', outsideHelp: 'N/A' }
}

/**
 * Build full plant status report.
 * @param {Object[]} routes - Array of { name, route }
 * @returns {Object[]} Sorted by priority (RED first)
 */
export function buildPlantReport(routes) {
  const counts = countLoadsPerPlant(routes)

  // All delivery plants (not quarries/sources)
  const DELIVERY_PLANTS = [
    "907", "908",  // Block plants first
    "506", "507", "508", "511", "513", "514", "516", "518", "519", "525",
  ]

  const report = DELIVERY_PLANTS.map(code => {
    const loadData = counts[code] || { loads: 0, drivers: [] }
    const priority = getPlantPriority(code, loadData.loads)
    const responsibility = getSRMResponsibility(code)
    return {
      code,
      loads: loadData.loads,
      drivers: loadData.drivers,
      priority,
      ...responsibility,
    }
  })

  // Sort: RED first, then YELLOW, then GREEN
  const order = { RED: 0, YELLOW: 1, GREEN: 2 }
  report.sort((a, b) => order[a.priority] - order[b.priority])

  return report
}
