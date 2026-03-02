// Canvas-based background removal — no model download, works fully offline.
// Samples the four corners to detect background colour, then removes pixels
// within a colour-distance tolerance. Works well for logos on white, light-grey,
// or solid-colour backgrounds (covers ~95% of corporate tech logos).
export async function removeBackground(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        reject(new Error('Image has no dimensions'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, w, h)
      const d = imageData.data

      // Estimate background colour from the four corners
      let bgR = 0, bgG = 0, bgB = 0, count = 0
      const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
      for (const [x, y] of corners) {
        const i = (y * w + x) * 4
        if (d[i + 3] > 128) { // ignore already-transparent corners
          bgR += d[i]; bgG += d[i + 1]; bgB += d[i + 2]; count++
        }
      }
      if (count === 0) { bgR = bgG = bgB = 255 } // default: white
      else { bgR /= count; bgG /= count; bgB /= count }

      const tolerance = 40 // colour-distance threshold (0–255 scale)

      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 10) continue // already transparent
        const dist = Math.sqrt(
          (d[i] - bgR) ** 2 + (d[i + 1] - bgG) ** 2 + (d[i + 2] - bgB) ** 2
        )
        if (dist < tolerance) d[i + 3] = 0
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/png'
      )

      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Failed to load image for bg removal'))
    img.src = URL.createObjectURL(imageBlob)
  })
}
