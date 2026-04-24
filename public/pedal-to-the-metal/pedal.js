/* ───────────────────────────────────────────────────────────
   PEDAL TO THE METAL · live simulator
   Drives blinking truck lights, load queue, plant scoreboard,
   and map truck-dots from synthetic but SRM-accurate data.
   No dependencies. Pure vanilla JS.
   ─────────────────────────────────────────────────────────── */

/* ── Real SRM fleet, crews, plants, quarries ────────────────── */
const DRIVERS = [
  { truck: "101", name: "CHRIS P",  crew: "DUMP",  home: "CHER" },
  { truck: "102", name: "Tim",      crew: "DUMP",  home: "519"  },
  { truck: "201", name: "Marcus",   crew: "507",   home: "507"  },
  { truck: "202", name: "Brittany", crew: "507",   home: "507"  },
  { truck: "203", name: "Eboni",    crew: "507",   home: "507"  },
  { truck: "204", name: "Deletra",  crew: "507",   home: "507"  },
  { truck: "301", name: "Charlie",  crew: "519",   home: "519"  },
  { truck: "302", name: "Bryant",   crew: "519",   home: "519"  },
  { truck: "303", name: "Jamie",    crew: "519",   home: "519"  },
  { truck: "304", name: "Eddie",    crew: "519",   home: "519"  },
  { truck: "401", name: "Kenny",    crew: "506",   home: "506"  },
  { truck: "402", name: "Jimmy",    crew: "506",   home: "506"  },
  { truck: "403", name: "Roberto",  crew: "506",   home: "506"  },
  { truck: "404", name: "Jonathon", crew: "506",   home: "506"  },
  { truck: "501", name: "Stacey",   crew: "BP",    home: "502"  },
  { truck: "502", name: "Alexis",   crew: "516",   home: "516"  },
  { truck: "525", name: "Curtis",   crew: "MGMT",  home: "525"  },
]

const PLANTS = [
  { code: "506", name: "Decatur",         outside: null,     x: 310, y: 310 },
  { code: "507", name: "Stringfield",     outside: "SAND",   x: 520, y: 150 },
  { code: "508", name: "Nick Fitcheard",  outside: "SAND",   x: 580, y: 180 },
  { code: "511", name: "Palmer",          outside: null,     x: 470, y: 250 },
  { code: "513", name: "Greenbrier",      outside: null,     x: 430, y: 200 },
  { code: "514", name: "Arab",            outside: null,     x: 620, y: 340 },
  { code: "516", name: "Lacey Spring",    outside: "ROCK",   x: 560, y: 290 },
  { code: "518", name: "Scottsboro",      outside: "SAND",   x: 790, y: 240 },
  { code: "519", name: "Muscle Shoals",   outside: null,     x: 190, y: 330 },
  { code: "525", name: "Cullman",         outside: "SAND",   x: 400, y: 420 },
  { code: "907", name: "Palmer Block",    block: true,       x: 485, y: 230 },
  { code: "908", name: "Block Plant",     block: true,       x: 500, y: 245 },
]

const QUARRIES = [
  { code: "591", name: "Mt. Hope",        x: 260, y: 270 },
  { code: "594", name: "Cherokee RQ",     x: 340, y: 170 },
  { code: "502", name: "Bridgeport",      x: 850, y: 190 },
  { code: "POD", name: "Port of Decatur", x: 300, y: 340 },
  { code: "MM",  name: "Martin Marietta", x: 540, y: 170 },
  { code: "RG",  name: "Rogers Group",    x: 565, y: 300 },
]

const MATERIALS = ["67s ROCK", "78s ROCK", "1/4 DOWNS", "PB SAND", "BLOCK SAND", "SCRAP"]

const CREW_COLOR = {
  "DUMP": "#a8a29e",
  "507":  "#6BAED6",
  "519":  "#5ed67a",
  "506":  "#B794D6",
  "BP":   "#ffb627",
  "516":  "#ffb627",
  "MGMT": "#c8102e",
}

/* ── Tiny helpers ─────────────────────────────────────────── */
const $  = (s, r=document) => r.querySelector(s)
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s))
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const pad = (n, w=2) => String(n).padStart(w, "0")

function fmtClock(d=new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function fmtElapsed(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${pad(m)}:${pad(s)}`
}

/* ── Truck state model ────────────────────────────────────── */
// status: idle | loading | rolling | needs
function initTruckState() {
  return DRIVERS.map((d, i) => {
    // stagger initial states for visual richness
    const roll = Math.random()
    let status = "idle"
    if (roll < 0.32) status = "rolling"
    else if (roll < 0.55) status = "loading"
    else if (roll < 0.78) status = "needs"
    const dest = pick(PLANTS.filter(p => !p.block || Math.random() < 0.3))
    const quarry = pick(QUARRIES)
    return {
      ...d,
      status,
      destination: dest.code,
      quarry: quarry.code,
      loadsToday: rnd(2, 9),
      progress: rnd(10, 85),
      mat: pick(MATERIALS),
      eta: rnd(8, 45),
      // map path progress 0..1
      pathT: Math.random(),
      pathDir: Math.random() < 0.5 ? 1 : -1,
      pathFrom: quarry.code,
      pathTo: dest.code,
    }
  })
}

let TRUCKS = initTruckState()
let LOADS = []
let LOAD_ID = 2040
let START_LOADS = rnd(38, 62)

/* ── Fleet grid render ────────────────────────────────────── */
function renderFleet() {
  const grid = $("#fleetGrid")
  if (!grid) return
  grid.innerHTML = TRUCKS.map(t => {
    const statusLbl = { idle: "IDLE", loading: "LOADING", rolling: "ROLLING", needs: "NEEDS LOAD" }[t.status]
    const barPct = t.status === "rolling" ? t.progress : t.status === "loading" ? rnd(20, 80) : 0
    const metaRight = t.status === "rolling"
      ? `ETA ${t.eta}m`
      : t.status === "loading"
        ? `@ ${t.quarry}`
        : t.status === "needs"
          ? `WAITING ${rnd(3, 18)}m`
          : `@ ${t.home}`
    return `
      <article class="truck ${t.status}" data-truck="${t.truck}">
        <div class="truck-top">
          <div>
            <div class="truck-num">#${t.truck}</div>
            <div class="truck-crew">${t.crew === "MGMT" ? "MGMT · 525 COVERAGE" : "CREW " + t.crew}</div>
          </div>
          <span class="truck-status"><span class="dot ${t.status}"></span>${statusLbl}</span>
        </div>
        <div class="truck-driver" style="color:${CREW_COLOR[t.crew] || "#fff"}">${t.name}</div>
        <div class="truck-bar"><i style="width:${barPct}%"></i></div>
        <div class="truck-meta">
          <span><span class="lbl">DEST</span> → ${t.destination}</span>
          <span>${metaRight}</span>
        </div>
        <div class="truck-meta" style="border-top:none; padding-top:0">
          <span><span class="lbl">LOAD</span> ${t.mat}</span>
          <span><span class="lbl">TODAY</span> ${t.loadsToday}</span>
        </div>
      </article>
    `
  }).join("")
}

/* ── Load queue ────────────────────────────────────────────── */
function seedLoads() {
  const seeds = rnd(6, 9)
  for (let i = 0; i < seeds; i++) pushLoad(rnd(20, 900))
}
function pushLoad(ageSec = 0) {
  // ~25% chance block plant, prioritized
  const blockPick = Math.random() < 0.22
  const plant = blockPick
    ? pick(PLANTS.filter(p => p.block))
    : pick(PLANTS.filter(p => !p.block))
  LOADS.push({
    id: ++LOAD_ID,
    plant: plant.code,
    plantName: plant.name,
    block: !!plant.block,
    mat: pick(MATERIALS),
    age: ageSec,
  })
  // Keep block plants at the top
  LOADS.sort((a, b) => (b.block - a.block) || (b.age - a.age))
}
function renderQueue() {
  const root = $("#loadQueue")
  if (!root) return
  if (!LOADS.length) {
    root.innerHTML = `<div class="queue-row" style="justify-content:center; color:var(--text-3)">Queue empty · every load is assigned.</div>`
    return
  }
  root.innerHTML = LOADS.slice(0, 10).map(l => {
    const cls = l.block ? "block" : (l.age > 600 ? "hot" : "")
    const elapsedCls = l.age > 900 ? "crit" : l.age > 480 ? "warn" : ""
    const tag = l.block ? `<span class="q-tag block">BLOCK</span>` : `<span class="q-tag">STANDARD</span>`
    return `
      <div class="queue-row ${cls}">
        <span class="q-id">#${l.id}</span>
        <span class="q-plant">${l.plant}</span>
        <span class="q-mat">${l.mat} · ${l.plantName}</span>
        <span class="q-elapsed ${elapsedCls}">${fmtElapsed(l.age)}</span>
        ${tag}
      </div>
    `
  }).join("")
}

/* ── Plants scoreboard ────────────────────────────────────── */
function renderPlants() {
  const grid = $("#plantsGrid")
  if (!grid) return
  grid.innerHTML = PLANTS.map(p => {
    // derive a status from trucks heading there + random seed
    const incoming = TRUCKS.filter(t => t.destination === p.code).length
    const delivered = rnd(p.block ? 0 : 2, p.block ? 5 : 11)
    let priority = "green"
    if (p.block && delivered === 0) priority = "red"
    else if (delivered <= 2) priority = "yellow"
    else if (delivered <= 4 && !p.outside) priority = "yellow"
    const tag = p.block
      ? "BLOCK · NO OUTSIDE HELP"
      : p.outside
        ? `OUTSIDE ${p.outside}`
        : "SRM FULL SERVICE"
    return `
      <article class="plant ${priority} ${p.block ? "block" : ""}">
        <div class="plant-code">${p.code}</div>
        <div class="plant-name">${p.name}</div>
        <div class="plant-tag">${tag}</div>
        <div class="plant-loads">
          <span>TODAY <span class="n">${delivered}</span></span>
          <span>EN ROUTE <span class="n">${incoming}</span></span>
        </div>
      </article>
    `
  }).join("")
}

/* ── Map ──────────────────────────────────────────────────── */
function renderMap() {
  const plantsG = $("#mapPlants")
  const quarryG = $("#mapQuarries")
  const routesG = $("#mapRoutes")
  if (!plantsG || !quarryG || !routesG) return

  // Routes — draw a dashed line between each active truck's quarry and destination
  const byCode = {}
  PLANTS.forEach(p => byCode[p.code] = p)
  QUARRIES.forEach(q => byCode[q.code] = q)
  const drawn = new Set()
  const routeHTML = TRUCKS.filter(t => t.status === "rolling" || t.status === "loading").map(t => {
    const key = `${t.pathFrom}→${t.pathTo}`
    if (drawn.has(key)) return ""
    drawn.add(key)
    const a = byCode[t.pathFrom], b = byCode[t.pathTo]
    if (!a || !b) return ""
    return `<path class="route" d="M${a.x},${a.y} L${b.x},${b.y}"/>`
  }).join("")
  routesG.innerHTML = routeHTML

  plantsG.innerHTML = PLANTS.map(p => `
    <g class="plant-group">
      <circle class="plant-halo" cx="${p.x}" cy="${p.y}" r="22"/>
      <circle class="plant-node ${p.block ? "block" : ""}" cx="${p.x}" cy="${p.y}" r="${p.block ? 7 : 5}"/>
      <text class="node-label" x="${p.x + 10}" y="${p.y + 4}">${p.code}</text>
    </g>
  `).join("")

  quarryG.innerHTML = QUARRIES.map(q => `
    <g>
      <circle class="quarry-halo" cx="${q.x}" cy="${q.y}" r="26"/>
      <circle class="quarry-node" cx="${q.x}" cy="${q.y}" r="6"/>
      <text class="node-label" x="${q.x + 10}" y="${q.y + 4}">${q.code}</text>
    </g>
  `).join("")
}
function renderMapTrucks() {
  const g = $("#mapTrucks")
  if (!g) return
  const byCode = {}
  PLANTS.forEach(p => byCode[p.code] = p)
  QUARRIES.forEach(q => byCode[q.code] = q)
  g.innerHTML = TRUCKS.filter(t => t.status === "rolling").map(t => {
    const a = byCode[t.pathFrom], b = byCode[t.pathTo]
    if (!a || !b) return ""
    const x = a.x + (b.x - a.x) * t.pathT
    const y = a.y + (b.y - a.y) * t.pathT
    return `<circle class="truck-dot" cx="${x}" cy="${y}" r="4"><title>#${t.truck} · ${t.name}</title></circle>`
  }).join("")
}

/* ── KPIs + ticker ────────────────────────────────────────── */
function renderKPIs() {
  const rolling = TRUCKS.filter(t => t.status === "rolling").length
  const needs   = TRUCKS.filter(t => t.status === "needs").length
  const totalLoadsToday = START_LOADS + TRUCKS.reduce((s, t) => s + t.loadsToday, 0)
  const plantsTouched = new Set(TRUCKS.map(t => t.destination)).size
  const el = (id, v) => { const n = $("#" + id); if (n) n.textContent = v }
  el("kpiTrucks", rolling + needs + TRUCKS.filter(t => t.status === "loading").length)
  el("kpiLoads",  totalLoadsToday)
  el("kpiPlants", plantsTouched)
  el("kpiMissed", 0)
}

const TICKER_MSGS = [
  "BLOCK PLANTS <em>907 / 908</em> — NEVER MISS",
  "NO EMPTY TRUCKS · SCRAP OUT · ROCK BACK",
  "CHRIS P · FIXED ROUTE · CHER → MSAND → APAC → 511 → POD → 519",
  "BP ROTATION · GROUPS A / B / C · FAIR BY DESIGN",
  "TUESDAY & FRIDAY · SPECIAL BLOCK-PLANT SUPPLY RUNS",
  "17 TRUCKS · 12 PLANTS · 6 QUARRIES · ONE DISPATCHER",
  "BUILT IN HAZEL GREEN, ALABAMA · TO THE HOLLINGSHEAD STANDARD",
  "PEDAL <em>/</em> TO <em>/</em> THE <em>/</em> METAL",
]
function buildTicker() {
  const t = $("#ticker")
  if (!t) return
  const twice = TICKER_MSGS.concat(TICKER_MSGS)
  t.innerHTML = twice.map(m => `<span>◆&nbsp;&nbsp;${m}</span>`).join("")
}

/* ── Clock + year ─────────────────────────────────────────── */
function tickClock() {
  const c = $("#heroClock"); if (c) c.textContent = fmtClock()
}
function setYear() {
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear()
}

/* ── Simulators ───────────────────────────────────────────── */
// Every 2.2s: churn a random truck's state (one step forward in its lifecycle)
function churnTrucks() {
  const idx = rnd(0, TRUCKS.length - 1)
  const t = TRUCKS[idx]
  const order = ["idle", "needs", "loading", "rolling"]
  const i = order.indexOf(t.status)
  t.status = order[(i + 1) % order.length]
  if (t.status === "rolling") {
    t.progress = rnd(5, 25)
    t.eta = rnd(10, 45)
    t.pathT = 0.0
    t.pathFrom = pick(QUARRIES).code
    t.pathTo = pick(PLANTS.filter(p => !p.block || Math.random() < 0.4)).code
    t.destination = t.pathTo
    t.mat = pick(MATERIALS)
  } else if (t.status === "loading") {
    t.quarry = pick(QUARRIES).code
    t.mat = pick(MATERIALS)
  } else if (t.status === "needs") {
    // new order just came in for this truck
  } else if (t.status === "idle") {
    t.loadsToday += 1
  }
  renderFleet()
  renderKPIs()
}

// Every 1s: advance progress for rolling trucks
function advanceRolls() {
  let dirty = false
  TRUCKS.forEach(t => {
    if (t.status === "rolling") {
      t.progress = Math.min(100, t.progress + rnd(1, 4))
      t.pathT = Math.min(1, t.pathT + 0.012 + Math.random() * 0.006)
      if (t.pathT >= 1) {
        // arrived — flip to idle momentarily
        t.status = "idle"
        t.loadsToday += 1
      }
      dirty = true
    }
  })
  if (dirty) {
    renderMapTrucks()
  }
}

// Load queue aging + occasional new orders / fulfillment
function ageQueue() {
  LOADS.forEach(l => l.age += 1)
  if (Math.random() < 0.03 && LOADS.length < 14) pushLoad(0)
  if (Math.random() < 0.05 && LOADS.length > 3) {
    // "dispatched" — pop one near the top
    const idx = rnd(0, Math.min(4, LOADS.length - 1))
    LOADS.splice(idx, 1)
  }
  renderQueue()
}

/* ── Boot ─────────────────────────────────────────────────── */
function boot() {
  setYear()
  buildTicker()
  seedLoads()
  renderFleet()
  renderQueue()
  renderPlants()
  renderMap()
  renderMapTrucks()
  renderKPIs()
  tickClock()

  setInterval(tickClock,    1000)
  setInterval(ageQueue,     1000)
  setInterval(advanceRolls, 900)
  setInterval(churnTrucks,  2200)
  setInterval(renderPlants, 5000)
  setInterval(renderMap,    8000)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot)
} else {
  boot()
}
