// ── Auth page — login / sign-up with vortex canvas background ─────────────

import { supabase } from './supabase.js'

// { user, onLogin, onEnter, onLogout, onRename }
// user     — current user object or null
// onLogin  — called with user after successful sign-in/up (landing stays visible)
// onEnter  — called when user clicks "Enter tool" (navigates into the app)
// onLogout — called when user clicks "Sign out"
// onRename — called with newName after display name is changed
export function renderAuth({ user, onLogin, onEnter, onLogout, onRename }) {
  const screen = document.createElement('div')
  screen.className = 'auth-screen'

  // Background video — place the file in public/ to activate
  const video = document.createElement('video')
  video.className = 'auth-video'
  video.autoplay = true
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.src = '/Logo site backdrop.mp4'
  screen.appendChild(video)

  // Canvas vortex (mix-blend-mode: screen — glows over video, transparent in dark areas)
  const canvas = document.createElement('canvas')
  canvas.className = 'auth-canvas'
  screen.appendChild(canvas)
  screen._cleanup = startVortex(canvas)

  // Radial vignette overlay
  const overlay = document.createElement('div')
  overlay.className = 'auth-overlay'
  screen.appendChild(overlay)

  // Glassmorphism card
  const card = document.createElement('div')
  card.className = 'auth-card'
  screen.appendChild(card)

  if (user) {
    // ── Welcome state (logged in) ───────────────────────────────────────────
    drawWelcome(card, user, onEnter, onLogout, onRename)
  } else {
    // ── Login / sign-up form ────────────────────────────────────────────────
    let mode = 'login'
    function draw() {
      card.innerHTML = ''

      const brand = document.createElement('div')
      brand.className = 'auth-brand'
      brand.innerHTML =
        `<span class="auth-brand-icon">\u25c8</span>` +
        `<span class="auth-brand-name">Logo Fetcher</span>`

      const title = document.createElement('h2')
      title.className = 'auth-title'
      title.textContent = mode === 'login' ? 'Welcome back' : 'Create account'

      const sub = document.createElement('p')
      sub.className = 'auth-subtitle'
      sub.textContent = mode === 'login'
        ? 'Sign in to your workspace'
        : 'Get started \u2014 it\u2019s free'

      const form = document.createElement('form')
      form.className = 'auth-form'
      form.noValidate = true

      if (mode === 'signup') {
        form.appendChild(makeField('text', 'Full name', 'name', 'name'))
      }
      form.appendChild(makeField('email',    'Email address', 'email',    'email'))
      form.appendChild(makeField('password', 'Password',      'password', 'current-password'))

      const errMsg = document.createElement('div')
      errMsg.className = 'auth-error'

      const submitBtn = document.createElement('button')
      submitBtn.type = 'submit'
      submitBtn.className = 'btn-primary auth-submit'
      submitBtn.textContent = mode === 'login' ? 'Sign in \u2192' : 'Create account \u2192'

      form.appendChild(errMsg)
      form.appendChild(submitBtn)

      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        errMsg.style.color = ''
        errMsg.textContent = ''
        submitBtn.disabled = true

        const email    = (form.querySelector('[name="email"]')?.value    ?? '').trim()
        const password =  form.querySelector('[name="password"]')?.value ?? ''

        if (!email || !password) {
          errMsg.textContent = 'Please fill in all fields.'
          submitBtn.disabled = false
          return
        }

        if (mode === 'signup') {
          const name = (form.querySelector('[name="name"]')?.value ?? '').trim()
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          })
          if (error) {
            errMsg.textContent = error.message
            submitBtn.disabled = false
            return
          }
          if (!data.session) {
            // Email confirmation required
            errMsg.style.color = 'var(--success)'
            errMsg.textContent = 'Check your email for a confirmation link.'
            submitBtn.disabled = false
            return
          }
          onLogin({ name, email })
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) {
            errMsg.textContent = error.message
            submitBtn.disabled = false
            return
          }
          const name = data.user.user_metadata?.name || ''
          onLogin({ name, email })
        }
      })

      const switchRow = document.createElement('p')
      switchRow.className = 'auth-switch'
      const switchLink = document.createElement('span')
      switchLink.className = 'auth-switch-link'
      if (mode === 'login') {
        switchRow.textContent = 'Don\u2019t have an account?\u00a0'
        switchLink.textContent = 'Sign up'
      } else {
        switchRow.textContent = 'Already have an account?\u00a0'
        switchLink.textContent = 'Sign in'
      }
      switchLink.addEventListener('click', () => { mode = mode === 'login' ? 'signup' : 'login'; draw() })
      switchRow.appendChild(switchLink)

      card.append(brand, title, sub, form, switchRow)
    }
    draw()
  }

  return screen
}

// ── Welcome card (logged-in state) ─────────────────────────────────────────
function drawWelcome(card, user, onEnter, onLogout, onRename) {
  const displayName = user.name || user.email.split('@')[0]

  const brand = document.createElement('div')
  brand.className = 'auth-brand'
  brand.innerHTML =
    `<span class="auth-brand-icon">\u25c8</span>` +
    `<span class="auth-brand-name">Logo Fetcher</span>`

  const greeting = document.createElement('p')
  greeting.className = 'auth-subtitle'
  greeting.style.marginBottom = '0.25rem'
  greeting.textContent = 'Welcome back,'

  // ── Name row (name + edit button) ────────────────────────────────────────
  const nameRow = document.createElement('div')
  nameRow.className = 'auth-name-row'

  const nameEl = document.createElement('h2')
  nameEl.className = 'auth-welcome-name'
  nameEl.textContent = displayName

  const editBtn = document.createElement('button')
  editBtn.className = 'auth-name-edit-btn'
  editBtn.title = 'Edit display name'
  editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 2 2L11 14l-3 1 1-3 9.5-9.5z"/></svg>`

  nameRow.append(nameEl, editBtn)

  // ── Inline edit form (hidden initially) ──────────────────────────────────
  const nameEditRow = document.createElement('div')
  nameEditRow.className = 'auth-name-edit-row'
  nameEditRow.style.display = 'none'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.className = 'auth-name-input'
  nameInput.value = displayName

  const saveBtn = document.createElement('button')
  saveBtn.className = 'btn-primary auth-name-save-btn'
  saveBtn.textContent = 'Save'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'auth-name-cancel-btn'
  cancelBtn.textContent = 'Cancel'

  const nameBtnRow = document.createElement('div')
  nameBtnRow.className = 'auth-name-btn-row'
  nameBtnRow.append(saveBtn, cancelBtn)

  nameEditRow.append(nameInput, nameBtnRow)

  editBtn.addEventListener('click', () => {
    nameRow.style.display = 'none'
    nameEditRow.style.display = 'flex'
    nameInput.focus()
    nameInput.select()
  })

  cancelBtn.addEventListener('click', () => {
    nameEditRow.style.display = 'none'
    nameRow.style.display = 'flex'
  })

  const saveErr = document.createElement('div')
  saveErr.className = 'auth-name-save-err'
  nameEditRow.appendChild(saveErr)

  const doSave = async () => {
    const newName = nameInput.value.trim()
    if (!newName) { nameInput.focus(); return }
    if (newName === (user.name || user.email.split('@')[0])) { cancelBtn.click(); return }
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving\u2026'
    saveErr.textContent = ''
    const { error } = await supabase.auth.updateUser({ data: { name: newName } })
    saveBtn.disabled = false
    saveBtn.textContent = 'Save'
    if (!error) {
      user.name = newName
      nameEl.textContent = newName
      if (onRename) onRename(newName)
      nameEditRow.style.display = 'none'
      nameRow.style.display = 'flex'
    } else {
      saveErr.textContent = error.message || 'Save failed'
    }
  }

  saveBtn.addEventListener('click', doSave)
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSave()
    if (e.key === 'Escape') cancelBtn.click()
  })

  // ─────────────────────────────────────────────────────────────────────────
  const tagline = document.createElement('p')
  tagline.className = 'auth-subtitle'
  tagline.textContent = 'Ready to build your next landscape?'

  const enterBtn = document.createElement('button')
  enterBtn.className = 'btn-primary auth-submit'
  enterBtn.textContent = 'Enter tool \u2192'
  enterBtn.addEventListener('click', onEnter)

  const signOutRow = document.createElement('p')
  signOutRow.className = 'auth-switch'
  const signOutLink = document.createElement('span')
  signOutLink.className = 'auth-switch-link'
  signOutLink.textContent = 'Sign out'
  signOutLink.addEventListener('click', onLogout)
  signOutRow.appendChild(signOutLink)

  card.append(brand, greeting, nameRow, nameEditRow, tagline, enterBtn, signOutRow)
}

// ── Canvas vortex animation ────────────────────────────────────────────────
function startVortex(canvas) {
  const ctx = canvas.getContext('2d')
  let animId
  let W, H, cx, cy

  const COUNT = 700
  const particles = Array.from({ length: COUNT }, () => ({}))

  function resize() {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    cx = W / 2
    cy = H / 2
  }

  function spawn(p) {
    const angle = Math.random() * Math.PI * 2
    const r     = (Math.random() * 0.45 + 0.03) * Math.min(W, H)
    p.x     = cx + Math.cos(angle) * r
    p.y     = cy + Math.sin(angle) * r
    p.size  = Math.random() * 1.7 + 0.3
    p.life  = Math.random() * 0.5 + 0.5
    p.decay = Math.random() * 0.003 + 0.0008
    p.speed = Math.random() * 1.0  + 0.25
    p.theta = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4
    p.hue   = 215 + Math.random() * 85   // indigo → violet
    p.sat   = 75  + Math.random() * 20
    return p
  }

  resize()
  particles.forEach((p) => { spawn(p); p.life = Math.random() })
  ctx.fillStyle = '#07070e'
  ctx.fillRect(0, 0, W || 1, H || 1)

  function frame() {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
    ctx.fillRect(0, 0, W, H)

    ctx.globalCompositeOperation = 'lighter'

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i]
      p.life -= p.decay
      if (p.life <= 0) { spawn(p); continue }

      const dx   = p.x - cx
      const dy   = p.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const swirl = Math.min(4, 90 / dist)

      p.theta += swirl * 0.016 * p.speed
      p.x += Math.cos(p.theta) * p.speed - dx * 0.0015
      p.y += Math.sin(p.theta) * p.speed - dy * 0.0015

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, 68%, ${p.life * 0.85})`
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'source-over'
    animId = requestAnimationFrame(frame)
  }

  frame()

  const handleResize = () => resize()
  window.addEventListener('resize', handleResize)

  return function cleanup() {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', handleResize)
  }
}

// ── Form field helper ──────────────────────────────────────────────────────
function makeField(type, placeholder, name, autocomplete) {
  const wrap  = document.createElement('div')
  wrap.className = 'auth-field'
  const input = document.createElement('input')
  input.type         = type
  input.placeholder  = placeholder
  input.name         = name
  input.className    = 'auth-input'
  input.autocomplete = autocomplete
  wrap.appendChild(input)
  return wrap
}

// ── Supabase session helpers ───────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return {
    name:  session.user.user_metadata?.name || '',
    email: session.user.email,
  }
}

export async function clearSession() {
  await supabase.auth.signOut()
}
