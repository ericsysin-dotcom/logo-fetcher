import { state, goTo } from '../main.js'
import { logoUrlCandidates } from '../api/clearbit.js'
import { removeBackground } from '../api/bgRemoval.js'
import {
  getClipdropKey, setClipdropKey,
  getCachedCredits, removeBackgroundClipdrop,
} from '../api/clipdrop.js'

export function renderProcess() {
  state.processed = state.entries.map((e) => ({
    ...e,
    originalBlob: null,
    transparentBlob: null,
    useTransparent: false,
  }))

  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Choose Logo Style'

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent =
    'Free removes the background in-browser \u2014 no account needed. Premium uses Clipdrop for sharper results and requires a free API key.'

  const grid = document.createElement('div')
  grid.className = 'process-grid'

  state.processed.forEach((item, i) => {
    grid.appendChild(createLogoCard(item, i))
  })

  const actions = document.createElement('div')
  actions.className = 'actions'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn-secondary'
  backBtn.textContent = '\u2190 Back'
  backBtn.addEventListener('click', () => goTo(2))

  const nextBtn = document.createElement('button')
  nextBtn.className = 'btn-primary'
  nextBtn.textContent = state.mode === 'logos' ? 'Preview & Download \u2192' : 'Arrange Logos \u2192'

  nextBtn.addEventListener('click', async () => {
    nextBtn.disabled = true
    nextBtn.textContent = 'Preparing\u2026'

    // Capture each displayed logo as a PNG blob before navigating
    const cards = grid.querySelectorAll('.logo-card')
    await Promise.all(
      state.processed.map(async (item, i) => {
        if (item.useTransparent && item.transparentBlob) return // already captured
        if (item.originalBlob) return // placeholder already set
        const imgEl = cards[i]?.querySelector('.logo-img')
        if (!imgEl) return
        try {
          state.processed[i].originalBlob = await imgToBlob(imgEl)
        } catch {
          // logo didn't load and no placeholder was set — will be filtered out
        }
      })
    )

    // Drop items with no usable logo (no blob captured, no transparent blob)
    state.processed = state.processed.filter(
      (item) => (item.useTransparent && item.transparentBlob) || item.originalBlob
    )

    goTo(state.mode === 'logos' ? 5 : 6)
  })

  actions.append(backBtn, nextBtn)
  section.append(h2, hint, grid, actions)
  return section
}

// Load img trying each candidate URL in order; calls onAllFailed() if every source fails,
// onLoaded(idx) when a source loads successfully.
// Treats images ≤16px as failed (generic globe placeholder returned by favicon APIs).
function loadImgWithFallback(img, domain, onAllFailed, onLoaded) {
  const urls = logoUrlCandidates(domain)
  let i = 0
  const tryNext = () => {
    i++
    if (i < urls.length) {
      img.src = urls[i]
    } else if (onAllFailed) {
      onAllFailed()
    }
  }
  img.onerror = tryNext
  img.onload = () => {
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      tryNext()
    } else if (onLoaded) {
      onLoaded(i)
    }
  }
  img.src = urls[i]
}

// Convert a loaded <img> element to a PNG Blob via canvas
function imgToBlob(imgEl) {
  if (!imgEl.complete || imgEl.naturalWidth === 0) {
    return Promise.reject(new Error('Image not loaded'))
  }
  const w = imgEl.naturalWidth
  const h = imgEl.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(imgEl, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  )
}

function generatePlaceholderBlob() {
  const canvas = document.createElement('canvas')
  canvas.width = 80
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#F3F4F6'
  ctx.fillRect(0, 0, 80, 80)
  ctx.strokeStyle = '#D1D5DB'
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, 78, 78)
  ctx.fillStyle = '#9CA3AF'
  ctx.font = 'bold 32px system-ui, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', 40, 40)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  )
}

function makeTransparentBtn(label, extraClass) {
  const btn = document.createElement('button')
  btn.className = 'btn-transparent' + (extraClass ? ' ' + extraClass : '')
  const dot = document.createElement('span')
  dot.className = 'btn-dot'
  const lbl = document.createElement('span')
  lbl.className = 'btn-label'
  lbl.textContent = label
  btn.append(dot, lbl)
  return btn
}

function createLogoCard(item, index) {
  const card = document.createElement('div')
  card.className = 'logo-card'

  const displayBox = document.createElement('div')
  displayBox.className = 'logo-display'

  const img = document.createElement('img')
  img.className = 'logo-img'
  img.alt = item.name

  const info = document.createElement('div')
  info.className = 'logo-info'
  info.innerHTML = `<div class="logo-name">${item.name}</div><div class="logo-domain">${item.domain}</div>`

  const controls = document.createElement('div')
  controls.className = 'logo-controls'

  // ── Two transparent buttons ─────────────────────────────────────────────
  const btnRow = document.createElement('div')
  btnRow.className = 'transparent-btn-row'

  const freeBtn = makeTransparentBtn('Transparent (Free)', 'free')
  const premBtn = makeTransparentBtn('Transparent (Premium)', 'premium')
  const premLabel = premBtn.querySelector('.btn-label')

  function refreshPremBtn() {
    const key     = getClipdropKey()
    const credits = getCachedCredits()
    premBtn.classList.remove('low')
    if (key && credits !== null && credits <= 0) {
      premLabel.textContent = 'Transparent (Premium \u00b7 0 left)'
      premBtn.disabled = true
    } else if (key && credits !== null) {
      premLabel.textContent = `Transparent (Premium \u00b7 ${credits} left)`
      if (credits < 20) premBtn.classList.add('low')
      premBtn.disabled = false
    } else {
      premLabel.textContent = 'Transparent (Premium)'
      premBtn.disabled = false
    }
  }
  refreshPremBtn()

  const statusMsg = document.createElement('div')
  statusMsg.className = 'transparent-status'

  // 'none' | 'free' | 'premium'
  let activeMode = 'none'

  function revert() {
    activeMode = 'none'
    freeBtn.classList.remove('active')
    premBtn.classList.remove('active')
    statusMsg.textContent = ''
    state.processed[index].useTransparent = false
    loadImgWithFallback(img, item.domain)
  }

  freeBtn.addEventListener('click', async () => {
    if (activeMode === 'free') { revert(); return }
    premBtn.classList.remove('active')

    if (state.processed[index].freeBlob) {
      activeMode = 'free'
      freeBtn.classList.add('active')
      img.src = URL.createObjectURL(state.processed[index].freeBlob)
      state.processed[index].transparentBlob = state.processed[index].freeBlob
      state.processed[index].useTransparent = true
      return
    }

    activeMode = 'free'
    freeBtn.classList.add('active')
    freeBtn.disabled = true
    statusMsg.textContent = 'Removing background\u2026'

    try {
      const imageBlob = await imgToBlob(img)
      const blob = await removeBackground(imageBlob)
      state.processed[index].freeBlob = blob
      state.processed[index].transparentBlob = blob
      state.processed[index].useTransparent = true
      img.src = URL.createObjectURL(blob)
      statusMsg.textContent = ''
    } catch (err) {
      console.error('Background removal failed:', err)
      statusMsg.textContent = 'Removal failed \u2014 check domain'
      freeBtn.classList.remove('active')
      activeMode = 'none'
      state.processed[index].useTransparent = false
    } finally {
      freeBtn.disabled = false
    }
  })

  premBtn.addEventListener('click', () => {
    if (activeMode === 'premium') { revert(); return }
    showPremiumModal((key) => runClipdrop(key), refreshPremBtn)
  })

  async function runClipdrop(key) {
    activeMode = 'premium'
    premBtn.classList.add('active')
    freeBtn.classList.remove('active')
    premBtn.disabled = true
    statusMsg.textContent = 'Removing with Clipdrop\u2026'

    try {
      const imageBlob = await getOriginalBlob()
      const { blob } = await removeBackgroundClipdrop(imageBlob, key)
      state.processed[index].premiumBlob = blob
      state.processed[index].transparentBlob = blob
      state.processed[index].useTransparent = true
      img.src = URL.createObjectURL(blob)
      statusMsg.textContent = ''
    } catch (err) {
      statusMsg.textContent = err.message || 'Clipdrop failed'
      premBtn.classList.remove('active')
      activeMode = 'none'
      state.processed[index].useTransparent = false
      setTimeout(() => { statusMsg.textContent = '' }, 4000)
    } finally {
      refreshPremBtn()
    }
  }

  // Load a fresh copy of the original logo for Clipdrop
  // (img element may already be showing a transparent result)
  function getOriginalBlob() {
    return new Promise((resolve, reject) => {
      const tmp = new Image()
      tmp.crossOrigin = 'anonymous'
      const urls = logoUrlCandidates(item.domain)
      let i = 0
      const tryNext = () => {
        i++
        if (i < urls.length) { tmp.src = urls[i] } else { reject(new Error('No logo to process')) }
      }
      tmp.onerror = tryNext
      tmp.onload = async () => {
        if (tmp.naturalWidth <= 16 && tmp.naturalHeight <= 16) { tryNext(); return }
        try { resolve(await imgToBlob(tmp)) } catch (e) { reject(e) }
      }
      tmp.src = urls[i]
    })
  }

  // ── Logo loading ───────────────────────────────────────────────────────
  loadImgWithFallback(img, item.domain, async () => {
    img.remove()
    freeBtn.disabled = true
    premBtn.disabled = true

    const noLogoLabel = document.createElement('div')
    noLogoLabel.className = 'no-logo-placeholder'
    noLogoLabel.textContent = 'Generating placeholder\u2026'
    displayBox.appendChild(noLogoLabel)

    try {
      const blob = await generatePlaceholderBlob()
      state.processed[index].originalBlob = blob
      const placeholderImg = document.createElement('img')
      placeholderImg.className = 'logo-img'
      placeholderImg.src = URL.createObjectURL(blob)
      placeholderImg.alt = item.name
      displayBox.insertBefore(placeholderImg, noLogoLabel)
      noLogoLabel.textContent = 'No logo \u2014 \u201C?\u201D placeholder used'
    } catch {
      noLogoLabel.textContent = 'No logo found'
    }
  })

  displayBox.appendChild(img)

  btnRow.append(freeBtn, premBtn)
  controls.append(btnRow, statusMsg)
  card.append(displayBox, info, controls)
  return card
}

// ── Clipdrop premium modal ────────────────────────────────────────────────────
function showPremiumModal(onApply, onRefresh) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'

  function close() {
    overlay.remove()
    document.removeEventListener('keydown', onEsc)
  }
  const onEsc = (e) => { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', onEsc)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })

  const modal = document.createElement('div')
  modal.className = 'modal-card'

  // Header
  const hdr = document.createElement('div')
  hdr.className = 'modal-header'
  const badge = document.createElement('span')
  badge.className = 'modal-badge'
  badge.textContent = '\u2736 Clipdrop Premium'
  const closeBtn = document.createElement('button')
  closeBtn.className = 'modal-close'
  closeBtn.textContent = '\u00d7'
  closeBtn.addEventListener('click', close)
  hdr.append(badge, closeBtn)

  // Description
  const desc = document.createElement('p')
  desc.className = 'modal-desc'
  const descText = document.createTextNode('100 free removals/day. ')
  const descLink = document.createElement('a')
  descLink.className = 'modal-link'
  descLink.href = 'https://clipdrop.co/apis'
  descLink.target = '_blank'
  descLink.rel = 'noopener'
  descLink.textContent = 'Get a free API key \u2192'
  desc.append(descText, descLink)

  // Body — re-rendered based on key state
  const body = document.createElement('div')
  body.className = 'modal-body'

  function renderBody(changing = false) {
    body.innerHTML = ''
    const key = getClipdropKey()

    if (key && !changing) {
      // ── Saved key state ──────────────────────────────────────────────
      const savedRow = document.createElement('div')
      savedRow.className = 'modal-saved-row'

      const savedLabel = document.createElement('span')
      savedLabel.className = 'modal-saved-label'
      const credits = getCachedCredits()
      savedLabel.innerHTML = `Key saved <span class="modal-checkmark">\u2713</span>${credits !== null ? ` \u00b7 ${credits} left` : ''}`

      const changeLink = document.createElement('button')
      changeLink.className = 'modal-change-link'
      changeLink.textContent = 'Change key'
      changeLink.addEventListener('click', () => renderBody(true))

      savedRow.append(savedLabel, changeLink)

      const applyBtn = document.createElement('button')
      applyBtn.className = 'btn-primary modal-apply-btn'
      applyBtn.textContent = 'Apply \u2192'
      applyBtn.addEventListener('click', () => { close(); onApply(key) })

      body.append(savedRow, applyBtn)
    } else {
      // ── Key input state ──────────────────────────────────────────────
      const lbl = document.createElement('label')
      lbl.className = 'modal-label'
      lbl.textContent = 'Clipdrop API key'

      const inp = document.createElement('input')
      inp.type = 'password'
      inp.placeholder = 'Paste key\u2026'
      inp.className = 'modal-input'
      if (key && changing) inp.value = key

      // Submit on Enter
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click()
      })

      const choices = document.createElement('div')
      choices.className = 'modal-choices'

      function makeChoice(title, desc, onClick) {
        const btn = document.createElement('button')
        btn.className = 'modal-choice'
        const t = document.createElement('div')
        t.className = 'modal-choice-title'
        t.textContent = title
        const d = document.createElement('div')
        d.className = 'modal-choice-desc'
        d.textContent = desc
        btn.append(t, d)
        btn.addEventListener('click', onClick)
        return btn
      }

      choices.append(
        makeChoice(
          'Use for this logo only',
          'Key is not saved — enter it again next time',
          () => {
            const k = inp.value.trim()
            if (!k) { inp.focus(); return }
            close()
            onApply(k)
          }
        ),
        makeChoice(
          'Save key & apply \u2192',
          'Remembered in your browser for all future logos',
          () => {
            const k = inp.value.trim()
            if (!k) { inp.focus(); return }
            setClipdropKey(k)
            if (onRefresh) onRefresh()
            close()
            onApply(k)
          }
        )
      )

      body.append(lbl, inp, choices)
      requestAnimationFrame(() => inp.focus())
    }
  }

  renderBody()

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'modal-cancel-btn'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', close)

  modal.append(hdr, desc, body, cancelBtn)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}
