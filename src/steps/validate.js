import { state, goTo } from '../main.js'
import { suggestCompany, clearbitLogoUrl, fallbackLogoUrl, logoUrlCandidates } from '../api/clearbit.js'

// Strip protocol, www, and path — "https://halon.com/foo" → "halon.com"
function sanitizeDomain(value) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()
}

// Try each candidate URL in order until one loads; calls onAllFailed() if every source fails.
// Treats images ≤16px as failed (generic globe placeholder returned by favicon APIs).
function loadImgWithFallback(img, domain, onAllFailed) {
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
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) tryNext()
  }
  img.src = urls[i]
}

export function renderValidate() {
  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Validate Company Matches'

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent =
    'Review the suggested domain for each company. Edit inline if the match is wrong, then uncheck any you want to skip. Companies included without a logo will show a \u201C?\u201D placeholder in the export.'

  const tableContainer = document.createElement('div')
  tableContainer.id = 'validate-table-container'

  const loading = document.createElement('div')
  loading.className = 'loading'
  loading.textContent = 'Looking up companies\u2026'
  tableContainer.appendChild(loading)

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.style.display = 'none'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn-secondary'
  backBtn.textContent = '\u2190 Back'
  backBtn.addEventListener('click', () => goTo(1))

  const nextBtn = document.createElement('button')
  nextBtn.className = 'btn-primary'
  nextBtn.textContent = 'Fetch Logos \u2192'

  actions.append(backBtn, nextBtn)
  section.append(h2, hint, tableContainer, actions)

  lookupAll(state.names).then((entries) => {
    state.entries = entries
    renderTable(tableContainer, entries)
    actions.style.display = 'flex'

    nextBtn.addEventListener('click', () => {
      const rows = tableContainer.querySelectorAll('.validate-row')
      rows.forEach((row, i) => {
        const domain = sanitizeDomain(row.querySelector('.domain-input').value)
        state.entries[i].domain = domain
        state.entries[i].logoUrl = clearbitLogoUrl(domain)
        state.entries[i].fallbackUrl = fallbackLogoUrl(domain)
        state.entries[i].confirmed = row.querySelector('.confirm-checkbox').checked
      })
      state.entries = state.entries.filter((e) => e.confirmed && e.domain)
      state.processed = []
      goTo(3)
    })
  })

  return section
}

async function lookupAll(names) {
  return Promise.all(
    names.map(async (name) => {
      const trimmed = name.trim()
      // If the user pasted a URL, we already have the domain — skip Clearbit entirely
      if (/^https?:\/\//i.test(trimmed)) {
        const domain = sanitizeDomain(trimmed).replace(/^www\./, '')
        return {
          name: domain,
          domain,
          logoUrl: clearbitLogoUrl(domain),
          fallbackUrl: fallbackLogoUrl(domain),
          confirmed: true,
        }
      }
      const match = await suggestCompany(trimmed).catch(() => null)
      return {
        name: trimmed,
        domain: match?.domain ?? '',
        logoUrl: match ? clearbitLogoUrl(match.domain) : '',
        fallbackUrl: match ? fallbackLogoUrl(match.domain) : '',
        confirmed: !!match,
      }
    })
  )
}

function renderTable(container, entries) {
  container.innerHTML = ''

  const table = document.createElement('table')
  table.className = 'validate-table'

  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <th>Include</th>
      <th>Company Name</th>
      <th>Matched Domain</th>
      <th>Logo Preview</th>
    </tr>
  `
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  entries.forEach((entry, i) => {
    const tr = document.createElement('tr')
    tr.className = 'validate-row'
    tr.dataset.index = i

    const checkTd = document.createElement('td')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'confirm-checkbox'
    checkbox.checked = entry.confirmed
    checkTd.appendChild(checkbox)

    const nameTd = document.createElement('td')
    nameTd.className = 'company-name'
    nameTd.textContent = entry.name

    const domainTd = document.createElement('td')
    const domainInput = document.createElement('input')
    domainInput.type = 'text'
    domainInput.className = 'domain-input'
    domainInput.value = entry.domain
    domainInput.placeholder = 'e.g. apple.com'
    domainTd.appendChild(domainInput)

    const logoTd = document.createElement('td')
    logoTd.className = 'logo-cell'

    const img = document.createElement('img')
    img.className = 'logo-preview'
    img.alt = entry.name

    const noLogo = document.createElement('span')
    noLogo.className = 'no-logo'
    noLogo.textContent = 'No logo found \u2014 edit domain to retry, or a \u201C?\u201D placeholder will be used'

    const showNoLogo = () => {
      img.remove()
      if (!noLogo.parentNode) logoTd.appendChild(noLogo)
    }

    if (entry.domain) {
      loadImgWithFallback(img, entry.domain, showNoLogo)
      logoTd.appendChild(img)
    } else {
      logoTd.appendChild(noLogo)
    }

    // Refresh logo preview when domain changes
    domainInput.addEventListener('change', () => {
      const domain = sanitizeDomain(domainInput.value)
      if (!domain) return
      if (!img.parentNode) {
        noLogo.remove()
        logoTd.appendChild(img)
      }
      loadImgWithFallback(img, domain, showNoLogo)
    })

    tr.append(checkTd, nameTd, domainTd, logoTd)
    tbody.appendChild(tr)
  })

  table.appendChild(tbody)
  container.appendChild(table)
}
