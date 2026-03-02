# CLAUDE.md — logo-tool

## Project Description
A web app that:
1. Accepts a list of company names as input
2. Finds/fetches the correct logo for each company
3. Processes logos to remove/make backgrounds transparent

## Stack
- Vite 5 + vanilla JS (no framework)
- Package manager: npm
- `@imgly/background-removal` — client-side WASM background removal (no API key)
- `pptxgenjs` — in-browser PowerPoint generation
- Clearbit Autocomplete + Logo APIs — no auth required
- Google Favicon API — fallback logo source, no auth required

## Key Commands
- Install deps: `npm install`
- Dev server:   `npm run dev`   → http://localhost:5173
- Build:        `npm run build`
- No test suite yet

## Architecture

### Directory Structure
```
logo-tool/
├── .env.example          # placeholder keys for optional future APIs
├── .gitignore            # includes .env and node_modules
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js           # app state + step router
    ├── style.css
    ├── api/
    │   ├── clearbit.js   # suggestCompany(), clearbitLogoUrl(), fallbackLogoUrl()
    │   └── bgRemoval.js  # removeBackground() — wraps @imgly/background-removal
    └── steps/
        ├── input.js      # Step 1: textarea input
        ├── validate.js   # Step 2: domain validation table
        ├── process.js    # Step 3: logo fetch + bg removal toggle
        └── export.js     # Step 4: slide preview + PPTX download
```

### Credentials & API Keys
- **All secrets go in `.env`** — API keys, tokens, anything sensitive
- `.env` must be listed in `.gitignore` and must never be committed
- `.env.example` is committed with placeholder values (e.g. `REMOVE_BG_API_KEY=your_key_here`) so others know what variables are required
- Access env vars via `import.meta.env.VITE_*` (if using Vite) or `process.env.*` (if using Node/Express backend)
- Prefix browser-exposed vars with `VITE_` (Vite) or equivalent — never expose server-side secrets to the client

### External APIs (candidates)
- Logo sourcing: Clearbit Logo API, Brandfetch, or web scraping
- Background removal: remove.bg API, Clipdrop, or a local ML model (e.g. ONNX rembg)
- All third-party API keys must be stored in `.env`, not hardcoded

## WAT — Workflow, Agents, Tools

### Workflow
1. User pastes or uploads a list of company names
2. App iterates over each name and queries a logo source API
3. Each logo is fetched and passed to a background removal step
4. Processed (transparent-background) logos are displayed and available for download

### Agents
> Update this section if any AI/LLM-assisted steps are added.

- **Logo Matcher** _(planned)_: resolves ambiguous company names to the correct brand (e.g. "Apple" → apple.com vs. Apple Records) — could use an LLM or fuzzy-match heuristic
- **No autonomous agents** in the initial version; all steps are deterministic API calls

### Tools
| Tool | Purpose | Auth |
|---|---|---|
| Clearbit Autocomplete API | Company name → domain + logo | None (free, public) |
| Clearbit Logo API | High-res logo PNG by domain | None (free, public) |
| Google Favicon API | Fallback logo (16–128px) | None (free, public) |
| @imgly/background-removal | Client-side AI background removal | None (WASM, runs in browser) |
| pptxgenjs | Generate .pptx in browser | None (MIT library) |
| _(optional)_ Brandfetch API | Richer company metadata | `VITE_BRANDFETCH_API_KEY` in `.env` |
| _(optional)_ remove.bg API | Higher-quality bg removal | `VITE_REMOVE_BG_API_KEY` in `.env` |

All optional API keys must live in `.env` (never committed). See `.env.example` for variable names.

## Notes
- v1 requires no API keys — all primary tools are auth-free
- Node.js ≥ 18 required to run the dev server
