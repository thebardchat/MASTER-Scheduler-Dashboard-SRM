import { ALL_PLANTS } from '../config/plants.js'
import { countLoadsPerPlant, getPlantPriority, getSRMResponsibility } from '../utils/loadCounter.js'

// Concrete plants only (exclude quarries, sources, and ALEXIS_SHORT)
const CONCRETE_CODES = new Set([
  "506", "507", "508", "511", "513", "514",
  "516", "518", "519", "525", "907", "908"
])

const PRIORITY_ORDER = { CRITICAL: 0, PARTIAL: 1, FULL: 2 }
const PRIORITY_LABEL = { CRITICAL: 'BLOCK PLANT', PARTIAL: 'PARTIAL HELP', FULL: 'FULL SERVICE' }

export default function PlantDashboard({ T, routeStrings }) {
  const loadCounts = countLoadsPerPlant(routeStrings)

  const plants = ALL_PLANTS
    .filter(p => CONCRETE_CODES.has(p.code))
    .map(p => ({
      ...p,
      priority: getPlantPriority(p.code),
      responsibility: getSRMResponsibility(p.code),
      loads: loadCounts[p.code] || 0,
    }))
    .sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pd !== 0) return pd
      return a.code.localeCompare(b.code)
    })

  function getPriorityColor(priority) {
    if (priority === 'CRITICAL') return T.red
    if (priority === 'PARTIAL') return T.amber
    return T.green
  }

  function getResponsibilityText(resp) {
    if (resp.sand && resp.rock) return 'SAND + ROCK'
    if (resp.sand) return 'SAND ONLY'
    if (resp.rock) return 'ROCK ONLY'
    return 'NONE'
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: T.text3, letterSpacing: '2px', fontWeight: 500 }}>
            PLANT STATUS DASHBOARD
          </div>
          <div style={{ fontSize: '11px', color: T.text3, marginTop: '4px' }}>
            SRM fleet responsibility by plant — loads estimated from today's routes
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[['CRITICAL', T.red], ['PARTIAL', T.amber], ['FULL', T.green]].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '9px', color, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plant Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '10px',
      }}>
        {plants.map(plant => {
          const color = getPriorityColor(plant.priority)
          const isAlert = plant.priority === 'CRITICAL' && plant.loads === 0

          return (
            <div key={plant.code} style={{
              background: isAlert ? 'rgba(212,85,85,0.08)' : T.surface,
              border: `1px solid ${isAlert ? `${T.red}66` : T.border}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: T.r,
              padding: '14px 16px',
              boxShadow: T.shadow,
              animation: isAlert ? 'none' : undefined,
            }}>
              {/* Plant Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, letterSpacing: '0.5px' }}>
                    {plant.code}
                  </div>
                  <div style={{ fontSize: '10px', color: T.text3, marginTop: '2px' }}>
                    {plant.name.replace(plant.code + ' ', '')}
                  </div>
                </div>
                <span style={{
                  fontSize: '8px', fontWeight: 600,
                  background: `${color}15`, border: `1px solid ${color}30`, color,
                  padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                }}>
                  {PRIORITY_LABEL[plant.priority]}
                </span>
              </div>

              {/* SRM Responsibility */}
              <div style={{
                display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '9px', fontWeight: 500, letterSpacing: '0.3px',
                  color: T.text2, background: T.raised,
                  padding: '3px 8px', borderRadius: T.rXs,
                }}>
                  SRM: {getResponsibilityText(plant.responsibility)}
                </span>
              </div>

              {/* Load Count */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', background: T.raised, borderRadius: T.rSm,
                border: `1px solid ${isAlert ? `${T.red}44` : T.border}`,
              }}>
                <span style={{ fontSize: '10px', color: T.text3 }}>
                  EST. LOADS TODAY
                </span>
                <span style={{
                  fontSize: '18px', fontWeight: 700, fontFamily: T.mono,
                  color: isAlert ? T.red : plant.loads > 0 ? T.text : T.text3,
                }}>
                  {plant.loads}
                </span>
              </div>

              {/* Alert Banner */}
              {isAlert && (
                <div style={{
                  marginTop: '8px', padding: '6px 10px',
                  background: 'rgba(212,85,85,0.12)', border: `1px solid ${T.red}44`,
                  borderRadius: T.rXs, textAlign: 'center',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: T.red, letterSpacing: '1px' }}>
                    ALERT — NO LOADS SCHEDULED
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
