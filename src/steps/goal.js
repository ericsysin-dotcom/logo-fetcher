import { state, goTo, goToHelp } from '../main.js'

const ICON_DOWNLOAD = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`

const ICON_GRID = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`

export function renderGoal() {
  const screen = document.createElement('div')
  screen.className = 'goal-screen'

  // ── Background video slot ───────────────────────────────────────────────
  // Drop a looping video at /bg-video.mp4 to activate the hero background
  const video = document.createElement('video')
  video.className = 'goal-video'
  video.autoplay = true
  video.loop = true
  video.muted = true
  video.playsInline = true
  // video.src = '/bg-video.mp4'
  screen.appendChild(video)

  // Dark radial vignette overlay
  const overlay = document.createElement('div')
  overlay.className = 'goal-overlay'
  screen.appendChild(overlay)

  // ── Content ─────────────────────────────────────────────────────────────
  const content = document.createElement('div')
  content.className = 'goal-content'

  const eyebrow = document.createElement('p')
  eyebrow.className = 'goal-eyebrow'
  eyebrow.textContent = 'Logo Fetcher'

  const title = document.createElement('h1')
  title.className = 'goal-title'
  title.textContent = 'What are you building?'

  const subtitle = document.createElement('p')
  subtitle.className = 'goal-subtitle'
  subtitle.textContent = 'Choose a workflow and we\u2019ll guide you step by step.'

  const cards = document.createElement('div')
  cards.className = 'goal-cards'

  cards.append(
    makeCard({
      icon: ICON_DOWNLOAD,
      title: 'Find & Download Logos',
      desc: 'Paste a list of companies, match their domains, clean up logos, and export them \u2014 individually or as a simple grid slide.',
      cta: 'Find Logos',
      mode: 'logos',
    }),
    makeCard({
      icon: ICON_GRID,
      title: 'Build a Landscape Slide',
      desc: 'Finds and cleans up logos for your company list, then lets you drag them into labeled category cells and export a polished landscape PPTX.',
      cta: 'Build Landscape',
      mode: 'landscape',
    })
  )

  const howLink = document.createElement('p')
  howLink.className = 'goal-how-link'
  howLink.innerHTML = `<span>How does it work?</span>`
  howLink.addEventListener('click', goToHelp)

  content.append(eyebrow, title, subtitle, cards, howLink)
  screen.appendChild(content)
  return screen
}

function makeCard({ icon, title, desc, cta, mode }) {
  const card = document.createElement('button')
  card.className = 'goal-card'
  card.innerHTML = `
    <div class="goal-card-icon">${icon}</div>
    <div class="goal-card-title">${title}</div>
    <div class="goal-card-desc">${desc}</div>
    <div class="goal-card-cta">${cta} <span class="goal-card-arrow">\u2192</span></div>
  `
  card.addEventListener('click', () => {
    state.mode = mode
    goTo(1)
  })
  return card
}
