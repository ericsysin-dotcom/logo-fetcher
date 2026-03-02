import './style.css'
import { renderGoal }      from './steps/goal.js'
import { renderInput }     from './steps/input.js'
import { renderValidate }  from './steps/validate.js'
import { renderProcess }   from './steps/process.js'
import { renderChoose }    from './steps/choose.js'
import { renderExport }    from './steps/export.js'
import { renderLandscape } from './steps/landscape.js'
import { renderHelp }      from './steps/help.js'
import { renderAuth, getSession, clearSession } from './auth.js'

export const state = {
  step: 0,           // 0 = goal screen
  mode: null,        // 'logos' | 'landscape' — set on goal screen
  user: null,        // set from localStorage session on init
  home: true,        // true = show landing page; false = inside app
  page: null,        // 'help' | null
  names: [],
  entries: [],
  processed: [],
}

export function goTo(step) {
  state.page = null
  state.step = step
  render()
}

export function goToHelp() {
  state.page = 'help'
  render()
}

export async function logout() {
  await clearSession()
  Object.assign(state, {
    user: null, mode: null, step: 0, home: true,
    names: [], entries: [], processed: [],
  })
  render()
}

// ── Icons (lucide style, 15×15) ────────────────────────────────────────────
const ICONS = {
  edit:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 2 2L11 14l-3 1 1-3 9.5-9.5z"/></svg>`,
  search:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  image:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  layout:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  check:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
}

// ── Nav config per mode ────────────────────────────────────────────────────
const NAV_CONFIG = {
  logos: {
    steps:   [
      { label: 'Companies', icon: ICONS.edit     },
      { label: 'Validate',  icon: ICONS.search   },
      { label: 'Polish',    icon: ICONS.image    },
      { label: 'Download',  icon: ICONS.download },
    ],
    targets: [1, 2, 3, 5],               // goTo target for each nav step
    toNavStep: (s) => s === 5 ? 4 : s,   // app step → nav step (1-4)
  },
  landscape: {
    steps:   [
      { label: 'Companies', icon: ICONS.edit   },
      { label: 'Validate',  icon: ICONS.search },
      { label: 'Polish',    icon: ICONS.image  },
      { label: 'Arrange',   icon: ICONS.layout },
    ],
    targets: [1, 2, 3, 6],
    toNavStep: (s) => s === 6 ? 4 : s,
  },
}

function renderStepNav() {
  const config  = NAV_CONFIG[state.mode]
  const navStep = config.toNavStep(state.step)

  const nav = document.createElement('nav')
  nav.className = 'step-nav'

  const backLink = document.createElement('div')
  backLink.className = 'step-nav-back'
  backLink.textContent = '\u2190 Change workflow'
  backLink.addEventListener('click', () => {
    state.mode = null
    goTo(0)
  })
  nav.appendChild(backLink)

  const inner = document.createElement('div')
  inner.className = 'step-nav-inner'

  config.steps.forEach(({ label, icon }, i) => {
    const stepNum  = i + 1
    const isDone   = stepNum < navStep
    const isActive = stepNum === navStep

    const el = document.createElement('div')
    el.className = [
      'step-indicator',
      isActive ? 'active'    : '',
      isDone   ? 'done'      : '',
      isDone   ? 'clickable' : '',
    ].filter(Boolean).join(' ')

    if (isDone) {
      el.title = `Go back to ${label}`
      el.addEventListener('click', () => goTo(config.targets[i]))
    }

    const iconEl = document.createElement('span')
    iconEl.className = 'step-icon'
    iconEl.innerHTML = isDone ? ICONS.check : icon

    const lbl = document.createElement('span')
    lbl.className = 'step-label'
    lbl.textContent = label

    el.append(iconEl, lbl)
    inner.appendChild(el)

    if (i < config.steps.length - 1) {
      const sep = document.createElement('div')
      sep.className = 'step-sep'
      inner.appendChild(sep)
    }
  })

  nav.appendChild(inner)
  return nav
}

// ── Vortex cleanup handle (auth page only) ─────────────────────────────────
let _vortexCleanup = null

function render() {
  // Stop vortex from previous auth render
  if (_vortexCleanup) { _vortexCleanup(); _vortexCleanup = null }

  const app = document.getElementById('app')
  app.innerHTML = ''

  // ── Landing page (always shown until user clicks "Enter tool") ───────────
  if (state.home) {
    const authEl = renderAuth({
      user: state.user,
      onLogin:  (user) => { state.user = user; render() },
      onEnter:  ()     => { state.home = false; state.step = 0; render() },
      onLogout: async () => { await clearSession(); state.user = null; render() },
    })
    app.appendChild(authEl)
    _vortexCleanup = authEl._cleanup || null
    return
  }

  // ── Help page ─────────────────────────────────────────────────────────────
  if (state.page === 'help') {
    app.appendChild(renderHelp())
    return
  }

  // ── Normal app shell ──────────────────────────────────────────────────────
  const header = document.createElement('header')
  const modeBadge = state.mode
    ? `<span class="header-mode-badge">${state.mode === 'logos' ? 'Find Logos' : 'Build Landscape'}</span>`
    : ''
  header.innerHTML =
    `<h1>Logo Fetcher</h1>${modeBadge}<p>Build a company landscape slide in minutes</p>` +
    `<button class="header-help-btn" id="header-help-btn">How it works</button>`
  app.appendChild(header)
  document.getElementById('header-help-btn').addEventListener('click', goToHelp)

  // Goal screen — no nav, no main wrapper
  if (state.step === 0) {
    app.appendChild(renderGoal())
    return
  }

  app.appendChild(renderStepNav())

  const main = document.createElement('main')
  switch (state.step) {
    case 1: main.appendChild(renderInput());     break
    case 2: main.appendChild(renderValidate());  break
    case 3: main.appendChild(renderProcess());   break
    case 4: main.appendChild(renderChoose());    break
    case 5: main.appendChild(renderExport());    break
    case 6: main.appendChild(renderLandscape()); break
  }
  app.appendChild(main)
}

async function init() {
  const session = await getSession()
  if (session) state.user = session
  render()
}

init()
