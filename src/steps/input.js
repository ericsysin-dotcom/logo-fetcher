import { state, goTo } from '../main.js'

export function renderInput() {
  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Enter Company Names'

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent = 'One company per line. The tool will find the matching domain and logo for each.'

  const textarea = document.createElement('textarea')
  textarea.className = 'lined-textarea'
  textarea.placeholder = 'e.g., Apple\nMicrosoft\nSalesforce\nServiceNow\nSnowflake'
  textarea.value = state.names.join('\n')

  const actions = document.createElement('div')
  actions.className = 'actions'

  const nextBtn = document.createElement('button')
  nextBtn.className = 'btn-primary'
  nextBtn.textContent = 'Find Logos \u2192'
  nextBtn.addEventListener('click', () => {
    const names = textarea.value
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)
    if (!names.length) return
    state.names = names
    state.entries = []
    state.processed = []
    goTo(2)
  })

  actions.appendChild(nextBtn)
  section.append(h2, hint, textarea, actions)
  return section
}
