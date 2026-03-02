import { goTo } from '../main.js'

export function renderChoose() {
  const section = document.createElement('div')
  section.className = 'step-content'

  const h2 = document.createElement('h2')
  h2.textContent = 'Choose Export Type'

  const hint = document.createElement('p')
  hint.className = 'hint'
  hint.textContent = 'How would you like to export your logos?'

  const options = document.createElement('div')
  options.className = 'choose-options'

  const card1 = document.createElement('button')
  card1.className = 'choose-card'
  card1.innerHTML = `
    <div class="choose-card-title">Logo Grid</div>
    <div class="choose-card-desc">Export all logos in a clean grid layout. Best for quick reference slides.</div>
    <div class="choose-card-action">Export \u2192 logos.pptx</div>
  `
  card1.addEventListener('click', () => goTo(5))

  const card2 = document.createElement('button')
  card2.className = 'choose-card'
  card2.innerHTML = `
    <div class="choose-card-title">Landscape Builder</div>
    <div class="choose-card-desc">Organize logos into labeled category cells. Best for M&amp;A tech landscape slides.</div>
    <div class="choose-card-action">Build \u2192 logo-landscape.pptx</div>
  `
  card2.addEventListener('click', () => goTo(6))

  options.append(card1, card2)

  const actions = document.createElement('div')
  actions.className = 'actions'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn-secondary'
  backBtn.textContent = '\u2190 Back'
  backBtn.addEventListener('click', () => goTo(3))

  actions.appendChild(backBtn)
  section.append(h2, hint, options, actions)
  return section
}
