import { state, goTo } from '../main.js'

export function renderHelp() {
  const page = document.createElement('div')
  page.className = 'help-page'

  // ── Back button ────────────────────────────────────────────────────────────
  const back = document.createElement('button')
  back.className = 'help-back'
  back.textContent = '\u2190 Back'
  back.addEventListener('click', () => {
    state.page = null
    goTo(state.step)
  })
  page.appendChild(back)

  // ── Page header ────────────────────────────────────────────────────────────
  const header = document.createElement('div')
  header.className = 'help-header'
  header.innerHTML = `
    <h1 class="help-title">How to use Logo Fetcher</h1>
    <p class="help-lead">Everything you need to know to go from a list of company names to polished logos or a landscape slide.</p>
  `
  page.appendChild(header)

  // ── Section 1: User guide ──────────────────────────────────────────────────
  const s1 = document.createElement('section')
  s1.className = 'help-section'
  s1.innerHTML = `
    <h2 class="help-section-title">Workflows</h2>

    <div class="help-workflow">
      <div class="help-workflow-header">
        <span class="help-workflow-badge">Workflow 1</span>
        <span class="help-workflow-name">Find &amp; Download Logos</span>
      </div>
      <p class="help-workflow-desc">Use this when you need a clean set of logo files — for a deck, a doc, or an asset library.</p>
      <ol class="help-steps">
        <li>
          <strong>Enter companies</strong> — Paste one company name per line (e.g. <em>Stripe, Figma, Notion</em>). The tool accepts names, domains, or a mix of both.
        </li>
        <li>
          <strong>Validate</strong> — The tool resolves each name to a real company domain and previews its logo. You can manually correct any mismatches before continuing.
        </li>
        <li>
          <strong>Polish</strong> — Per logo, choose how to remove the background. <em>Transparent (Free)</em> runs an AI model entirely inside your browser — no account needed. <em>Transparent (Premium)</em> uses Clipdrop for sharper results; you supply a free API key (100 removals/day).
        </li>
        <li>
          <strong>Download</strong> — Export all logos as individual PNG files in a ZIP, or as a single grid slide image.
        </li>
      </ol>
    </div>

    <div class="help-workflow">
      <div class="help-workflow-header">
        <span class="help-workflow-badge">Workflow 2</span>
        <span class="help-workflow-name">Build a Landscape Slide</span>
      </div>
      <p class="help-workflow-desc">Use this when you need a categorized market-map or competitive landscape for a presentation.</p>
      <ol class="help-steps">
        <li>
          <strong>Enter companies</strong> — Same as above. The more companies you add, the richer the landscape.
        </li>
        <li>
          <strong>Validate</strong> — Resolve domains and preview logos. Correct any mismatches.
        </li>
        <li>
          <strong>Polish</strong> — Remove logo backgrounds so they sit cleanly on the slide. Use <em>Transparent (Free)</em> for in-browser removal or <em>Transparent (Premium)</em> with your Clipdrop key for higher-quality results.
        </li>
        <li>
          <strong>Arrange</strong> — Drag logos into labeled category cells. You can rename categories, add new ones, and reorder. Hit <em>AI Arrange</em> to let the model suggest groupings automatically based on company type.
        </li>
        <li>
          <strong>Export</strong> — Download a PPTX file with your landscape, ready to drop into any presentation.
        </li>
      </ol>
    </div>

    <div class="help-tips">
      <h3 class="help-tips-title">Tips</h3>
      <ul class="help-tips-list">
        <li>You can go back to any completed step using the step nav at the top.</li>
        <li>If a logo looks wrong in Validate, click the domain to edit it manually.</li>
        <li>The Free background removal runs entirely in your browser — no image data leaves your device.</li>
        <li>For Premium, your API key is saved in your browser only — it is never sent to our servers.</li>
        <li>The AI Arrange feature uses Groq and requires an internet connection.</li>
      </ul>
    </div>
  `
  page.appendChild(s1)

  // ── Divider ────────────────────────────────────────────────────────────────
  const divider = document.createElement('hr')
  divider.className = 'help-divider'
  page.appendChild(divider)

  // ── Section 2: Technical ───────────────────────────────────────────────────
  const s2 = document.createElement('section')
  s2.className = 'help-section'
  s2.innerHTML = `
    <h2 class="help-section-title">Under the Hood</h2>
    <p class="help-section-intro">Logo Fetcher is a fully client-side web app — no backend server processes your data. Here\u2019s what each external service is responsible for.</p>

    <table class="help-tech-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Used for</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="help-tech-name">Clearbit Logo API</span><span class="help-tech-url">logo.clearbit.com</span></td>
          <td>Primary logo source. Returns a clean brand PNG (usually with transparent background) for a given domain.</td>
          <td><span class="help-badge-free">Free</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">Clearbit Autocomplete</span><span class="help-tech-url">autocomplete.clearbit.com</span></td>
          <td>Resolves a company name to its real domain. Powers the search suggestions in the validate step.</td>
          <td><span class="help-badge-free">Free</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">Google Favicon V2</span><span class="help-tech-url">t1.gstatic.com</span></td>
          <td>First fallback logo source when Clearbit has no result. Returns a 256px PNG favicon.</td>
          <td><span class="help-badge-free">Free</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">DuckDuckGo Favicons</span><span class="help-tech-url">icons.duckduckgo.com</span></td>
          <td>Second fallback logo source. Used when both Clearbit and Google favicon return nothing useful.</td>
          <td><span class="help-badge-free">Free</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">@imgly/background-removal</span><span class="help-tech-url">runs in browser (WASM)</span></td>
          <td>Powers <em>Transparent (Free)</em>. The AI model runs entirely inside your browser via WebAssembly — no image data ever leaves your device.</td>
          <td><span class="help-badge-free">Free</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">Clipdrop Remove Background</span><span class="help-tech-url">clipdrop-api.co</span></td>
          <td>Powers <em>Transparent (Premium)</em>. Higher-quality background removal processed server-side. You supply your own free-tier API key — 100 removals/day at no cost. Your key is stored in your browser only.</td>
          <td><span class="help-badge-key">Free tier (own key)</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">Groq — LLaMA 3.3 70B</span><span class="help-tech-url">api.groq.com</span></td>
          <td>Powers the <em>AI Arrange</em> feature in the landscape workflow. Suggests how to group companies into categories based on their industry and type.</td>
          <td><span class="help-badge-free">Free tier</span></td>
        </tr>
        <tr>
          <td><span class="help-tech-name">Supabase Auth</span><span class="help-tech-url">supabase.com</span></td>
          <td>Handles user sign-up and login. Passwords are hashed and never stored in plaintext. Sessions persist across browser refreshes.</td>
          <td><span class="help-badge-free">Free tier</span></td>
        </tr>
      </tbody>
    </table>
  `
  page.appendChild(s2)

  return page
}
