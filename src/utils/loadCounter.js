import { OUTSIDE_SAND, OUTSIDE_ROCK } from '../config/plants.js'

const BLOCK_PLANTS = new Set(["907", "908"])

// Concrete plant codes only (not quarries/sources)
const CONCRETE_PLANTS = new Set([
  "506", "507", "508", "511", "513", "514",
  "516", "518", "519", "525", "907", "908"
])

/**
 * Count estimated loads per plant from all generated routes.
 * Scans shorthand strings for →{code} patterns (delivery stops).
 * @param {string[]} routeStrings - array of shorthand route strings
 * @returns {Object} e.g. { "506": 3, "507": 2, "907": 1 }
 */
export function countLoadsPerPlant(routeStrings) {
  const counts = {}
  CONCRETE_PLANTS.forEach(code => { counts[code] = 0 })

  for (const route of routeStrings) {
    // Split on → and look for plant codes as delivery destinations
    const steps = route.split('\u2192')
    for (const step of steps) {
      const trimmed = step.trim()
      for (const code of CONCRETE_PLANTS) {
        // Match plant code at the start of a step (delivery target)
        // e.g. "506 rock", "907 blocks", "519", "511 Palmer"
        if (trimmed === code || trimmed.startsWith(code + ' ') || trimmed.startsWith(code + '\n')) {
          counts[code]++
        }
      }
    }
  }

  return counts
}

/**
 * Classify plant priority level.
 * CRITICAL = block plant (907, 908) — zero outside help
 * PARTIAL  = gets some outside help (sand or rock, not both)
 * FULL     = full-service SRM plant (no outside help but not block)
 * @param {string} plantCode
 * @returns {"CRITICAL"|"PARTIAL"|"FULL"}
 */
export function getPlantPriority(plantCode) {
  if (BLOCK_PLANTS.has(plantCode)) return "CRITICAL"
  if (OUTSIDE_SAND.has(plantCode) || OUTSIDE_ROCK.has(plantCode)) return "PARTIAL"
  return "FULL"
}

/**
 * Get what SRM must supply to a plant.
 * If plant gets outside sand → SRM supplies rock (not sand).
 * If plant gets outside rock → SRM supplies sand (not rock).
 * Block plants and full-service plants → SRM supplies both.
 * @param {string} plantCode
 * @returns {{ sand: boolean, rock: boolean }}
 */
export function getSRMResponsibility(plantCode) {
  const hasSand = OUTSIDE_SAND.has(plantCode)
  const hasRock = OUTSIDE_ROCK.has(plantCode)
  return {
    sand: !hasSand,
    rock: !hasRock,
  }
}
