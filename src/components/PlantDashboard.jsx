import { useState, useMemo } from 'react'
import { buildPlantReport, PRIORITY, BLOCK_PLANTS } from '../utils/loadCounter.js'

const PLANT_NAMES = {
  "506": "Decatur", "507": "Stringfield", "508": "Nick Fitcheard",
  "511": "Palmer", "513": "Greenbrier", "514": "Arab",
  "516": "Lacey Spring", "518": "Scottsboro", "519": "Muscle Shoals",
  "525": "Cullman", "907": "Palmer Block", "908": "Block Plant",
}

const PRIORITY_COLORS = {
  RED:    { bg: 'rgba(212,85,85,0.08)', border: '#D45555', text: '#D45555', badge: '#D45555' },
  YELLOW: { bg: 'rgba(212,160,60,0.08)', border: '#D4A03C', text: '#D4A03C', badge: '#D4A03C' },
  GREEN:  { bg: 'rgba(91,166,110,0.08)', border: '#5BA66E', text: '#5BA66E', badge: '#5BA66E' },
}

const T = {
  bg:      '#161311',
  surface: '#1E1A17',
  raised:  '#262220',
  border:  '#302B27',
  divider: '#252119',
  text:    '#EDEBE8',
  text2:   '#B0AAA2',
  text3:   '#7A746E',
  text4:   '#4A4541',
  brand:   '#D4745F',
  brandBg: 'rgba(212,116,95,0.10)',
  font:    'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  mono:    '"SF Mono","Fira Code",Menlo,Consolas,monospace',
  r:       '12px',
  rSm:     '8px',
}

export default function PlantDashboard({ routes, dateStr }) {
  const [filter, setFilter] = useState('ALL')

  const report = useMemo(() => buildPlantReport(routes), [routes])

  const filtered = filter === 'ALL'
    ? report
    : report.filter(p => p.priority === filter)

  const counts = useMemo(() => ({
    RED:    report.filter(p => p.priority === PRIORITY.RED).length,
    YELLOW: report.filter(p => p.priority === PRIORITY.YELLOW).length,
    GREEN:  report.filter(p => p.priority === PRIORITY.GREEN).length,
  }), [report])

  const totalLoads = report.reduce((sum, p) => sum + p.loads, 0)
  const blockLoads = report.filter(p => BLOCK_PLANTS.has(p.code)).reduce((sum, p) => sum + p.loads, 0)

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Summary Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px', marginBottom: '20px',
      }}>
        {[
          { label: 'TOTAL SRM LOADS', value: totalLoads, color: T.brand },
          { label: 'BLOCK PLANT LOADS', value: blockLoads, color: blockLoads === 0 ? '#D45555' : '#5BA66E' },
          { label: 'CRITICAL', value: counts.RED, color: '#D45555' },
          { label: 'WATCH', value: counts.YELLOW, color: '#D4A03C' },
          { label: 'GOOD', value: counts.GREEN, color: '#5BA66E' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm,
            padding: '14px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
            <div style={{ fontSize: '9px', color: T.text3, letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Block Plant Alert */}
      {counts.RED > 0 && (
        <div style={{
          background: 'rgba(212,85,85,0.06)', border: '1px solid rgba(212,85,85,0.3)',
          borderRadius: T.rSm, padding: '12px 16px', marginBottom: '16px',
          fontSize: '12px', color: '#D45555', fontWeight: 500,
        }}>
          {'\u26A0'} {counts.RED} plant{counts.RED > 1 ? 's' : ''} at CRITICAL — zero SRM loads scheduled.
          {report.filter(p => p.priority === PRIORITY.RED && BLOCK_PLANTS.has(p.code)).length > 0 &&
            ' Block plants have NO outside help — they MUST get SRM loads.'}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '16px',
        borderBottom: `1px solid ${T.border}`, paddingBottom: '10px',
      }}>
        {[
          { key: 'ALL', label: `ALL (${report.length})`, color: T.brand },
          { key: 'RED', label: `CRITICAL (${counts.RED})`, color: '#D45555' },
          { key: 'YELLOW', label: `WATCH (${counts.YELLOW})`, color: '#D4A03C' },
          { key: 'GREEN', label: `GOOD (${counts.GREEN})`, color: '#5BA66E' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            background: filter === key ? `${color}15` : 'transparent',
            border: 'none',
            borderBottom: filter === key ? `2px solid ${color}` : '2px solid transparent',
            color: filter === key ? color : T.text3,
            padding: '6px 14px', fontSize: '10px', letterSpacing: '0.5px',
            fontFamily: T.font, fontWeight: filter === key ? 600 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Plant Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '10px',
      }}>
        {filtered.map(plant => {
          const pc = PRIORITY_COLORS[plant.priority]
          const isBlock = BLOCK_PLANTS.has(plant.code)

          return (
            <div key={plant.code} style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${pc.border}`,
              borderRadius: T.r,
              overflow: 'hidden',
            }}>
              {/* Card Header */}
              <div style={{
                padding: '12px 14px 8px',
                borderBottom: `1px solid ${T.divider}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>
                      {plant.code}
                    </span>
                    <span style={{ fontSize: '12px', color: T.text2 }}>
                      {PLANT_NAMES[plant.code] || plant.code}
                    </span>
                    {isBlock && (
                      <span style={{
                        fontSize: '8px', fontWeight: 600, letterSpacing: '0.3px',
                        background: 'rgba(212,85,85,0.15)', border: '1px solid rgba(212,85,85,0.3)',
                        color: '#D45555', padding: '2px 8px', borderRadius: '99px',
                      }}>BLOCK PLANT</span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: T.text3 }}>
                    {plant.outsideHelp !== 'NONE' && plant.outsideHelp !== 'N/A'
                      ? plant.outsideHelp
                      : isBlock ? 'No outside help \u2014 SRM only' : 'Full SRM service'
                    }
                  </div>
                </div>
                {/* Priority Badge */}
                <div style={{
                  background: pc.bg, border: `1px solid ${pc.border}40`,
                  borderRadius: '99px', padding: '4px 12px',
                  fontSize: '10px', fontWeight: 700, color: pc.text, letterSpacing: '0.5px',
                }}>
                  {plant.priority === 'RED' ? '\u{1F534} CRITICAL' :
                   plant.priority === 'YELLOW' ? '\u{1F7E1} WATCH' : '\u{1F7E2} GOOD'}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: T.text3, letterSpacing: '0.5px' }}>SRM LOADS TODAY</span>
                  <span style={{
                    fontSize: '20px', fontWeight: 700,
                    color: plant.loads === 0 ? '#D45555' : pc.text,
                    fontFamily: T.mono,
                  }}>{plant.loads}</span>
                </div>

                {/* SRM Responsibility */}
                <div style={{
                  fontSize: '10px', color: T.text2,
                  background: T.raised, padding: '6px 10px', borderRadius: T.rSm,
                  marginBottom: '8px',
                }}>
                  {plant.label}
                </div>

                {/* Assigned Drivers */}
                {plant.drivers.length > 0 ? (
                  <div style={{ fontSize: '10px', color: T.text3 }}>
                    <span style={{ color: T.text4, marginRight: '6px' }}>DRIVERS:</span>
                    {plant.drivers.join(', ')}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#D45555', fontWeight: 500 }}>
                    No drivers assigned
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px', padding: '14px 16px',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm,
        fontSize: '10px', color: T.text3, lineHeight: '2',
      }}>
        <span style={{ fontWeight: 600, color: T.text2, letterSpacing: '1px' }}>PRIORITY RULES: </span>
        Block plants (907, 908) = RED if 0 loads, always first priority {'\u00b7 '}
        Full-service plants = RED if 0 loads {'\u00b7 '}
        Partial-help plants = YELLOW if 0 SRM loads (outside covers some material) {'\u00b7 '}
        Loads counted from generated route stops
      </div>
    </div>
  )
}
