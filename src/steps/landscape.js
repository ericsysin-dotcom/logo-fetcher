import { state, goTo } from '../main.js'

export function renderLandscape() {
  let rows = 2
  let cols = 2
  let cellLabels = Array.from({ length: 4 }, (_, i) => `Category ${i + 1}`)
  let cellContents = Array.from({ length: 4 }, () => [])
  let unassigned = state.processed.map((_, li) => li)

  let setRowsDisplay = () => {}
  let setColsDisplay = () => {}

  const logoSrcs = state.processed.map((item) => {
    if (item.useTransparent && item.transparentBlob) return URL.createObjectURL(item.transparentBlob)
    if (item.originalBlob) return URL.createObjectURL(item.originalBlob)
    return item.logoUrl
  })

  // ── Grid helpers ────────────────────────────────────────────────────────────

  function onGridChange() {
    const newCount = rows * cols
    const prev = cellLabels.slice()
    cellLabels = Array.from({ length: newCount }, (_, i) => prev[i] ?? `Category ${i + 1}`)
    for (let ci = newCount; ci < cellContents.length; ci++) {
      unassigned = [...unassigned, ...cellContents[ci]]
    }
    cellContents = Array.from({ length: newCount }, (_, ci) =>
      ci < cellContents.length ? cellContents[ci] : []
    )
    rebuildGrid()
  }

  function moveLogo(li, targetCi, beforeLi) {
    for (let ci = 0; ci < cellContents.length; ci++) {
      cellContents[ci] = cellContents[ci].filter((x) => x !== li)
    }
    unassigned = unassigned.filter((x) => x !== li)
    const arr = targetCi === -1 ? unassigned : cellContents[targetCi]
    if (beforeLi !== undefined) {
      const idx = arr.indexOf(beforeLi)
      if (idx !== -1) arr.splice(idx, 0, li)
      else arr.push(li)
    } else {
      arr.push(li)
    }
  }

  function rebuildGrid() {
    assignArea.innerHTML = ''
    const cellGrid = document.createElement('div')
    cellGrid.className = 'assign-grid'
    cellGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`

    for (let ci = 0; ci < rows * cols; ci++) {
      const cell = document.createElement('div')
      cell.className = 'assign-cell'
      const header = document.createElement('div')
      header.className = 'assign-cell-header'
      const inp = document.createElement('input')
      inp.type = 'text'
      inp.className = 'domain-input assign-cell-input'
      inp.value = cellLabels[ci]
      inp.placeholder = `Category ${ci + 1}`
      inp.addEventListener('input', () => { cellLabels[ci] = inp.value })
      header.appendChild(inp)
      const body = document.createElement('div')
      body.className = 'assign-cell-body'
      setupDropZone(body, ci)
      cellContents[ci].forEach((li) => body.appendChild(makeLogoChip(state.processed[li], li)))
      cell.append(header, body)
      cellGrid.appendChild(cell)
    }

    const poolSection = document.createElement('div')
    poolSection.className = 'logo-pool-section'
    const poolLabelEl = document.createElement('div')
    poolLabelEl.className = 'pool-label'
    poolLabelEl.textContent = 'Unassigned \u2014 drag logos into cells above'
    const pool = document.createElement('div')
    pool.className = 'logo-pool'
    setupDropZone(pool, -1)
    unassigned.forEach((li) => pool.appendChild(makeLogoChip(state.processed[li], li)))
    poolSection.append(poolLabelEl, pool)
    assignArea.append(cellGrid, poolSection)
  }

  function setupDropZone(zone, ci) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over') })
    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over')
    })
    zone.addEventListener('drop', (e) => {
      e.preventDefault()
      zone.classList.remove('drag-over')
      const li = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (isNaN(li)) return
      let beforeLi
      const overChip = e.target.closest('.logo-chip')
      if (overChip) {
        const chipLi = parseInt(overChip.dataset.li, 10)
        if (chipLi !== li) {
          const rect = overChip.getBoundingClientRect()
          if (e.clientX <= rect.left + rect.width / 2) {
            beforeLi = chipLi
          } else {
            const next = overChip.nextElementSibling
            if (next && next.classList.contains('logo-chip')) beforeLi = parseInt(next.dataset.li, 10)
          }
        }
      }
      moveLogo(li, ci, beforeLi)
      rebuildGrid()
    })
  }

  function makeLogoChip(item, li) {
    const chip = document.createElement('div')
    chip.className = 'logo-chip'
    chip.draggable = true
    chip.dataset.li = String(li)
    const img = document.createElement('img')
    img.className = 'logo-chip-img'
    img.src = logoSrcs[li]
    img.alt = item.name
    const nameEl = document.createElement('span')
    nameEl.className = 'logo-chip-name'
    nameEl.textContent = item.name
    chip.append(img, nameEl)
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(li))
      e.dataTransfer.effectAllowed = 'move'
      const ghost = chip.cloneNode(true)
      ghost.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2)
      setTimeout(() => document.body.removeChild(ghost), 0)
      requestAnimationFrame(() => chip.classList.add('dragging'))
    })
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'))
    return chip
  }

  // ── DOM ────────────────────────────────────────────────────────────────────

  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Build Landscape Slide'

  // ── Mode selection ─────────────────────────────────────────────────────────

  const modeSelect = document.createElement('div')
  modeSelect.className = 'mode-select'

  const manualCard = document.createElement('button')
  manualCard.className = 'mode-card'
  manualCard.innerHTML = `
    <div class="mode-card-title">Build Manually</div>
    <div class="mode-card-desc">Set up your category grid and drag logos into cells yourself.</div>
  `

  const aiCard = document.createElement('button')
  aiCard.className = 'mode-card'
  aiCard.innerHTML = `
    <div class="mode-card-title">Auto-arrange with AI \u2192</div>
    <div class="mode-card-desc">Describe your landscape and the model will suggest categories and arrange logos \u2014 you refine by dragging.</div>
  `

  modeSelect.append(manualCard, aiCard)

  // ── Grid section ───────────────────────────────────────────────────────────

  const gridSection = document.createElement('div')
  gridSection.style.display = 'none'

  // ── AI panel ───────────────────────────────────────────────────────────────

  const aiPanel = document.createElement('div')
  aiPanel.className = 'ai-panel'
  aiPanel.style.display = 'none'

  // Warning (privacy only)
  const aiWarning = document.createElement('div')
  aiWarning.className = 'ai-warning'
  aiWarning.innerHTML = `
    <strong>\u26a0\ufe0f Privacy &amp; accuracy note</strong> &mdash;
    This sends your company names to
    <a href="https://groq.com" target="_blank" rel="noopener">Groq&rsquo;s servers</a>
    (model: <code>llama-3.3-70b-versatile</code>) in plain text.
    <strong>Do not use with confidential deal targets or NDA-covered names.</strong>
    For sensitive work or higher accuracy,
    <button class="ai-manual-switch">switch to Build Manually \u2192</button>
    <br>Uses a shared free-tier API, so if Generate Layout stops responding we\u2019ve probably hit the daily quota \u{1F605}
  `
  aiWarning.querySelector('.ai-manual-switch').addEventListener('click', () => {
    aiPanel.style.display = 'none'
  })

  const companyList = state.processed.map((p) => p.name).join(', ')

  // One-shot prompt area
  const aiPromptArea = document.createElement('div')
  aiPromptArea.className = 'ai-prompt-area'

  const aiLabel = document.createElement('div')
  aiLabel.className = 'ai-prompt-label'
  aiLabel.textContent = 'Describe your landscape'

  const aiTextarea = document.createElement('textarea')
  aiTextarea.className = 'ai-prompt-field'
  aiTextarea.placeholder = 'e.g. \u201CCybersecurity: endpoint, identity, network security, cloud\u201D \u2014 or just describe the theme and the AI will suggest categories.'
  aiTextarea.rows = 3

  const aiActionRow = document.createElement('div')
  aiActionRow.className = 'ai-action-row'

  const aiBtn = document.createElement('button')
  aiBtn.className = 'btn-primary'
  aiBtn.textContent = 'Generate Layout \u2192'

  const aiStatus = document.createElement('span')
  aiStatus.className = 'ai-status'

  aiActionRow.append(aiBtn, aiStatus)
  aiPromptArea.append(aiLabel, aiTextarea, aiActionRow)
  aiPanel.append(aiWarning, aiPromptArea)

  aiBtn.addEventListener('click', async () => {
    const userText = aiTextarea.value.trim()
    if (!userText || aiBtn.disabled) return

    aiBtn.disabled = true
    aiBtn.textContent = 'Thinking\u2026'
    aiStatus.textContent = ''

    try {
      const messages = buildMessages(companyList, userText)
      const fullText = await callGroq(messages, null)
      const parsed = parseAssignments(fullText)
      if (parsed) {
        applyAssignments(parsed)
        aiStatus.textContent = '\u2713 Grid updated \u2014 drag logos to refine manually.'
        aiTextarea.disabled = true
        aiBtn.textContent = 'Generated'
      } else {
        aiStatus.textContent = 'Couldn\u2019t parse categories \u2014 try rephrasing.'
        aiBtn.disabled = false
        aiBtn.textContent = 'Generate Layout \u2192'
      }
    } catch (err) {
      aiStatus.textContent = `Error: ${err.message}`
      aiBtn.disabled = false
      aiBtn.textContent = 'Generate Layout \u2192'
    }
  })

  function applyAssignments(parsed) {
    const { categories, assignments } = parsed
    if (!categories?.length || !assignments) return

    const { newRows, newCols } = bestGridSize(categories.length)
    rows = newRows
    cols = newCols
    setRowsDisplay(newRows)
    setColsDisplay(newCols)
    cellLabels = [...categories]
    while (cellLabels.length < newRows * newCols) cellLabels.push(`Category ${cellLabels.length + 1}`)
    cellContents = Array.from({ length: newRows * newCols }, () => [])
    unassigned = []

    state.processed.forEach((item, li) => {
      const cat = assignments[item.name]
      const ci = categories.findIndex((c) => c.toLowerCase() === cat?.toLowerCase())
      if (ci !== -1) cellContents[ci].push(li)
      else unassigned.push(li)
    })

    rebuildGrid()
  }

  // ── Config row ─────────────────────────────────────────────────────────────

  const configRow = document.createElement('div')
  configRow.className = 'grid-config-row'

  function makeCounter(label, initial, min, max, onChange) {
    const wrap = document.createElement('div')
    wrap.className = 'grid-counter'
    const lbl = document.createElement('span')
    lbl.className = 'grid-counter-label'
    lbl.textContent = label
    const dec = document.createElement('button')
    dec.type = 'button'; dec.className = 'counter-btn'; dec.textContent = '\u2212'
    dec.disabled = initial <= min
    const val = document.createElement('span')
    val.className = 'counter-val'; val.textContent = String(initial)
    const inc = document.createElement('button')
    inc.type = 'button'; inc.className = 'counter-btn'; inc.textContent = '+'
    inc.disabled = initial >= max
    let current = initial
    const update = (n) => {
      current = Math.max(min, Math.min(max, n))
      val.textContent = String(current)
      dec.disabled = current <= min
      inc.disabled = current >= max
      onChange(current)
    }
    const setValue = (n) => {
      current = Math.max(min, Math.min(max, n))
      val.textContent = String(current)
      dec.disabled = current <= min
      inc.disabled = current >= max
    }
    dec.addEventListener('click', () => update(current - 1))
    inc.addEventListener('click', () => update(current + 1))
    wrap.append(lbl, dec, val, inc)
    return { el: wrap, setValue }
  }

  const rowCounter = makeCounter('Rows', rows, 1, 4, (n) => { rows = n; onGridChange() })
  const colCounter = makeCounter('Cols', cols, 1, 4, (n) => { cols = n; onGridChange() })
  setRowsDisplay = rowCounter.setValue
  setColsDisplay = colCounter.setValue

  const nameSep = document.createElement('div')
  nameSep.className = 'grid-config-sep'
  const nameToggle = document.createElement('label')
  nameToggle.className = 'toggle-label'
  const nameInput = document.createElement('input')
  nameInput.type = 'checkbox'; nameInput.checked = true
  const nameSlider = document.createElement('span')
  nameSlider.className = 'toggle-slider'
  const nameText = document.createElement('span')
  nameText.textContent = 'Include names in PPTX export'
  nameToggle.append(nameInput, nameSlider, nameText)
  configRow.append(rowCounter.el, colCounter.el, nameSep, nameToggle)

  const assignArea = document.createElement('div')
  assignArea.className = 'landscape-assign-area'

  // ── Actions ────────────────────────────────────────────────────────────────

  const actions = document.createElement('div')
  actions.className = 'actions'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn-secondary'
  backBtn.textContent = '\u2190 Back'
  backBtn.addEventListener('click', () => goTo(3))

  const downloadBtn = document.createElement('button')
  downloadBtn.className = 'btn-primary'
  downloadBtn.textContent = 'Download PPTX'
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true
    downloadBtn.textContent = 'Generating\u2026'
    try {
      await downloadLandscapePptx(rows, cols, cellLabels, cellContents, nameInput.checked)
    } finally {
      downloadBtn.disabled = false
      downloadBtn.textContent = 'Download PPTX'
    }
  })

  actions.append(backBtn, downloadBtn)
  gridSection.append(aiPanel, configRow, assignArea, actions)

  // ── Mode handlers ──────────────────────────────────────────────────────────

  manualCard.addEventListener('click', () => {
    modeSelect.style.display = 'none'
    gridSection.style.display = ''
    rebuildGrid()
  })

  aiCard.addEventListener('click', () => {
    modeSelect.style.display = 'none'
    aiPanel.style.display = ''
    gridSection.style.display = ''
    rebuildGrid()
  })

  section.append(h2, modeSelect, gridSection)
  return section
}

// ── Groq API ───────────────────────────────────────────────────────────────

function buildMessages(companyList, userMessage) {
  const system = `You are an expert at organizing technology landscapes for M&A and investment decks. The companies in this landscape are: ${companyList}. When the user asks you to categorize or organize, first briefly explain your reasoning (2–3 sentences), then output a JSON code block with this exact structure:\n\`\`\`json\n{"categories": ["Cat 1", "Cat 2"], "assignments": {"Company A": "Cat 1", "Company B": "Cat 2"}}\n\`\`\`\nEvery company must be assigned. Keep category names concise (2–4 words).`
  return [
    { role: 'system', content: system },
    { role: 'user', content: userMessage },
  ]
}

const DEFAULT_GROQ_TOKEN = import.meta.env.VITE_GROQ_TOKEN || null

async function callGroq(messages, userToken) {
  const token = userToken || DEFAULT_GROQ_TOKEN
  if (!token) throw new Error('No Groq API token configured. Click \u201CUse your own token\u201D to add one.')

  let res
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.4,
        max_tokens: 1200,
      }),
    })
  } catch (err) {
    throw new Error(`Network error: ${err.message}`)
  }

  if (res.status === 429) throw new Error('Rate limit hit \u2014 wait a moment and try again, or add your own Groq token.')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error?.message || `Groq returned HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content ?? ''
}


function parseAssignments(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  const raw = match[1].trim()
  // Try as-is first, then repair common truncation (missing closing braces)
  for (const suffix of ['', '}', '}}']) {
    try {
      const parsed = JSON.parse(raw + suffix)
      if (parsed.categories && parsed.assignments) return parsed
    } catch { /* keep trying */ }
  }
  return null
}

function bestGridSize(n) {
  if (n <= 2) return { newRows: 1, newCols: n }
  if (n <= 4) return { newRows: 2, newCols: 2 }
  if (n <= 6) return { newRows: 2, newCols: 3 }
  if (n <= 8) return { newRows: 2, newCols: 4 }
  if (n <= 9) return { newRows: 3, newCols: 3 }
  if (n <= 12) return { newRows: 3, newCols: 4 }
  return { newRows: 4, newCols: 4 }
}

// ── PPTX generation ────────────────────────────────────────────────────────

async function downloadLandscapePptx(rows, cols, cellLabels, cellContents, showNames) {
  const { default: pptxgen } = await import('pptxgenjs')
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'

  const slide = pptx.addSlide()
  slide.addText('Draft landscape template', {
    x: 0.55, y: 0.12, w: 12.0, h: 0.6,
    fontSize: 24, bold: true, color: '111827', fontFace: 'Calibri',
  })

  const gridX = 0.55, gridY = 1.5, gridW = 12.0, gridH = 5.0
  const cellGap = 0.07, innerPad = 0.1, labelH = 0.28
  const cellW = (gridW - cellGap * (cols - 1)) / cols
  const cellH = (gridH - cellGap * (rows - 1)) / rows

  for (let ci = 0; ci < rows * cols; ci++) {
    const col = ci % cols
    const row = Math.floor(ci / cols)
    const cellX = gridX + col * (cellW + cellGap)
    const cellY = gridY + row * (cellH + cellGap)

    slide.addShape(pptx.ShapeType.rect, {
      x: cellX, y: cellY, w: cellW, h: cellH,
      line: { color: 'D1D5DB', width: 0.75 }, fill: { color: 'FAFAFA' },
    })
    slide.addText(cellLabels[ci] || `Category ${ci + 1}`, {
      x: cellX + innerPad, y: cellY + 0.05, w: cellW - innerPad * 2, h: labelH,
      fontSize: 8, bold: true, color: '374151', fontFace: 'Calibri',
    })
    slide.addShape(pptx.ShapeType.line, {
      x: cellX + innerPad, y: cellY + labelH + 0.07, w: cellW - innerPad * 2, h: 0,
      line: { color: 'E5E7EB', width: 0.5 },
    })

    const assignedItems = (cellContents[ci] || []).map((li) => state.processed[li])
    if (!assignedItems.length) continue

    const logoAreaY = cellY + labelH + 0.14
    const logoAreaH = cellH - labelH - 0.14 - innerPad
    const logoAreaW = cellW - innerPad * 2
    const n = assignedItems.length
    const maxLogoW = Math.min((logoAreaW / n) * 0.72, 1.0)
    const maxLogoH = Math.min(logoAreaH * 0.6, 0.55)

    const scaledLogos = (
      await Promise.all(
        assignedItems.map(async (item) => {
          const data = await fetchAsBase64(item)
          if (!data) return null
          const { w: px, h: py } = await getImageDimensions(data)
          const natW = px / 96, natH = py / 96
          const scale = Math.min(maxLogoW / natW, maxLogoH / natH, 1.5)
          return { data, dispW: natW * scale, dispH: natH * scale, item }
        })
      )
    ).filter(Boolean)

    if (!scaledLogos.length) continue

    const slotW = logoAreaW / scaledLogos.length
    for (let si = 0; si < scaledLogos.length; si++) {
      const s = scaledLogos[si]
      const slotX = cellX + innerPad + si * slotW
      const imgX = slotX + (slotW - s.dispW) / 2
      const nameH = showNames ? 0.18 : 0
      const imgY = logoAreaY + (logoAreaH - s.dispH - nameH) / 2
      slide.addImage({ data: s.data, x: imgX, y: imgY, w: s.dispW, h: s.dispH })
      if (showNames) {
        slide.addText(s.item.name, {
          x: slotX, y: imgY + s.dispH + 0.02, w: slotW, h: nameH,
          fontSize: 5, color: '6B7280', align: 'center', fontFace: 'Calibri',
        })
      }
    }
  }

  await pptx.writeFile({ fileName: 'logo-landscape.pptx' })
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 100, h: img.naturalHeight || 100 })
    img.onerror = () => resolve({ w: 100, h: 100 })
    img.src = dataUrl
  })
}

async function fetchAsBase64(item) {
  if (item.useTransparent && item.transparentBlob) return blobToBase64(item.transparentBlob)
  if (item.originalBlob) return blobToBase64(item.originalBlob)
  return null
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
