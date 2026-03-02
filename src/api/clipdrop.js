// ── Clipdrop background-removal API ───────────────────────────────────────
// Key is stored in localStorage per-user (100 free calls/day on free tier)
// Get a free key at https://clipdrop.co/apis

const KEY_STORAGE     = 'clipdrop_api_key'
const CREDITS_STORAGE = 'clipdrop_credits'

export function getClipdropKey()         { return localStorage.getItem(KEY_STORAGE) || '' }
export function setClipdropKey(key)      { localStorage.setItem(KEY_STORAGE, key.trim()) }
export function clearClipdropKey()       { localStorage.removeItem(KEY_STORAGE) }

export function getCachedCredits() {
  const v = localStorage.getItem(CREDITS_STORAGE)
  return v !== null ? parseInt(v, 10) : null
}

function setCachedCredits(n) {
  localStorage.setItem(CREDITS_STORAGE, String(n))
}

// POST imageBlob to Clipdrop remove-background endpoint.
// Pass keyOverride to use a one-time key without saving it to localStorage.
// Returns { blob: Blob, remaining: number|null }
export async function removeBackgroundClipdrop(imageBlob, keyOverride) {
  const key = keyOverride || getClipdropKey()
  if (!key) throw new Error('No Clipdrop API key set')

  const form = new FormData()
  form.append('image_file', imageBlob, 'image.png')

  const res = await fetch('/clipdrop-proxy/remove-background/v1', {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: form,
  })

  const remaining = res.headers.get('x-remaining-credits')
  if (remaining !== null) setCachedCredits(parseInt(remaining, 10))

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Clipdrop error ${res.status}`)
  }

  const blob = await res.blob()
  return { blob, remaining: remaining !== null ? parseInt(remaining, 10) : null }
}
