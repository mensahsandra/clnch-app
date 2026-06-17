# CLNCH Chrome Extension

Manifest V3 companion that connects to the same Supabase project as the CLNCH web app.

## Install (development)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo

## How it works

```
┌─────────────────┐     postMessage      ┌──────────────────┐
│  CLNCH web app  │ ───────────────────► │  content.js      │
│  (auth sync)    │   CLNCH_AUTH_SYNC    │  (all pages)     │
└─────────────────┘                      └────────┬─────────┘
                                                  │
┌─────────────────┐     chrome.storage     ┌──────▼─────────┐
│  Job / apply    │ ◄── floating FAB ────► │  background.js │
│  form page      │     side panel         │  service worker│
└─────────────────┘                        └──────┬─────────┘
                                                  │
                                           ┌──────▼─────────┐
                                           │  Supabase      │
                                           │  (same project)│
                                           └────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| **Floating CL button** | Appears on job/application pages (forms or apply/careers URLs) |
| **Side panel** | Shows the CLNCH opportunity matched to the current page URL |
| **Form detection** | Detects focused fields, extracts labels, 800ms debounce |
| **AI coaching** | Refines raw drafts; shows coached suggestions in the panel |
| **Accept & Fill** | Injects coached text into the active form field |
| **Shared auth** | Web app syncs Supabase session to `chrome.storage.local` — log in once |

## Auth sync

When you use the CLNCH web app, `extensionBridge.ts` posts your Supabase session to the content script. The background worker stores:

- `clnch_supabase_url`
- `clnch_supabase_anon_key`
- `clnch_session` (access + refresh tokens)

Open the web app locally or at clnch.app while the extension is installed to sync.

## Opportunity matching

The background worker queries:

1. `application_sessions.opportunity_link`
2. `opportunities.link`

URLs are normalized (no query params, no trailing slash) and matched with fuzzy hostname/path fallback.

## Messages

### Web app → content script (`window.postMessage`)
- `CLNCH_AUTH_SYNC` — store Supabase credentials + session
- `CLNCH_INJECT_TEXT` — fill active field from chat page
- `CLNCH_ACTIVATE_ON_TAB` — pulse FAB and open panel on apply page

### Content script ↔ background
- `CLNCH_LOOKUP_OPPORTUNITY` — match current URL to Supabase row
- `CLNCH_STORE_AUTH` — persist auth payload
- `CLNCH_FIELD_ACTIVATED` / `CLNCH_DEBOUNCED_INPUT_STABILIZED` — form events
- `CLNCH_REFINEMENT_COMPLETE` — coached text ready
- `CLNCH_INJECT_TEXT` — inject into page field
- `CLNCH_TOGGLE_PANEL` — toolbar icon click

## File layout

```
extension/
├── manifest.json
├── background.js          # Service worker — Supabase, lookup, refinement
├── content.js             # FAB, side panel, form observer, web bridge
├── panel.css              # Panel styles (shadow DOM)
├── config.js              # chrome.storage auth/config helpers
├── lib/
│   ├── supabase-client.js # Supabase JS via esm.sh
│   └── url-utils.js       # URL matching + draft extraction
└── icons/
```

## Refinement API

Tries `POST https://clnch.app/api/refine` first; falls back to local coaching copy and saves to `application_answers` when a session is matched.
