import { state, goTo } from '../main.js'

export function renderExport() {
  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Export Slide'

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent =
    'Preview of your technology landscape. Download as PowerPoint and paste into your deck.'

  // Slide-proportioned preview
  const preview = document.createElement('div')
  preview.className = 'slide-preview'

  const slideTitle = document.createElement('div')
  slideTitle.className = 'slide-title'
  slideTitle.textContent = 'Logos'

  const previewGrid = document.createElement('div')
  previewGrid.className = 'preview-grid'

  state.processed.forEach((item) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'preview-logo'

    const img = document.createElement('img')
    if (item.useTransparent && item.transparentBlob) {
      img.src = URL.createObjectURL(item.transparentBlob)
    } else {
      img.src = item.logoUrl
      img.addEventListener('error', () => {
        if (img.src !== item.fallbackUrl) img.src = item.fallbackUrl
      })
    }
    img.alt = item.name

    const label = document.createElement('div')
    label.className = 'preview-label'
    label.textContent = item.name

    wrapper.append(img, label)
    previewGrid.appendChild(wrapper)
  })

  preview.append(slideTitle, previewGrid)

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
      await downloadPptx()
    } finally {
      downloadBtn.disabled = false
      downloadBtn.textContent = 'Download PPTX'
    }
  })

  actions.append(backBtn, downloadBtn)
  section.append(h2, hint, preview, actions)
  return section
}

async function downloadPptx() {
  const { default: pptxgen } = await import('pptxgenjs')
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE' // 13.33" x 7.5"

  const slide = pptx.addSlide()

  slide.addText('Logos', {
    x: 0.5,
    y: 0.15,
    w: 12.33,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    fontFace: 'Calibri',
  })

  const logos = state.processed
  const count = logos.length
  if (!count) return

  const cols = Math.min(count, 5)
  const rows = Math.ceil(count / cols)

  const slideW = 13.33
  const slideH = 7.5
  const titleH = 0.85
  const padX = 0.4
  const padY = 0.25

  const availW = slideW - padX * 2
  const availH = slideH - titleH - padY * 2

  const cellW = availW / cols
  const cellH = availH / rows

  const logoW = Math.min(cellW * 0.55, 1.1)
  const logoH = Math.min(cellH * 0.5, 0.7)

  for (let i = 0; i < logos.length; i++) {
    const item = logos[i]
    const col = i % cols
    const row = Math.floor(i / cols)

    // Cell top-left corner
    const cellLeft = padX + col * cellW
    const cellTop = titleH + padY + row * cellH

    const imgData = await fetchAsBase64(item)
    if (imgData) {
      // Measure actual pixel dimensions so we can preserve aspect ratio
      const { w: px, h: py } = await getImageDimensions(imgData)
      const naturalW = px / 96  // pixels → inches (96 DPI)
      const naturalH = py / 96

      // Scale to fit within the cell budget while preserving aspect ratio (max 2× upscale)
      const scale = Math.min(logoW / naturalW, logoH / naturalH, 2)
      const dispW = naturalW * scale
      const dispH = naturalH * scale

      // Centre within the cell
      const imgX = cellLeft + (cellW - dispW) / 2
      const imgY = cellTop + (logoH - dispH) / 2

      slide.addImage({ data: imgData, x: imgX, y: imgY, w: dispW, h: dispH })
    }

    slide.addText(item.name, {
      x: cellLeft,
      y: cellTop + logoH + 0.08,
      w: cellW,
      h: 0.22,
      fontSize: 7,
      color: '6B7280',
      align: 'center',
      fontFace: 'Calibri',
    })
  }

  await pptx.writeFile({ fileName: 'logos.pptx' })
}

// Returns pixel dimensions of a base64 data URL image
function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 100, h: img.naturalHeight || 100 })
    img.onerror = () => resolve({ w: 100, h: 100 })
    img.src = dataUrl
  })
}

async function fetchAsBase64(item) {
  // Use pre-captured blobs from step 3 — no re-fetching needed
  if (item.useTransparent && item.transparentBlob) {
    return blobToBase64(item.transparentBlob)
  }
  if (item.originalBlob) {
    return blobToBase64(item.originalBlob)
  }
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
