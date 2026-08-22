# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## ReelFoundry Product Decisions

- Implement the selected first ideation image in `reference-option-1.png` as the visual source of truth.
- This is a vertically scrolling, single-page marketing site for ordinary personal users.
- Brand: `ReelFoundry`.
- Primary promise: `把你的照片和想法，变成一段值得分享的视频。`
- The product is a free local Windows and macOS launcher with a conversational creative agent; users pay official model API usage fees.
- Preserve the bright white visual system, generous spacing, warm travel imagery, and the narrative sequence: conversation → creative directions → storyboard → finished video → local launcher → transparent cost explanation → download.
- Keep the site expandable into a multi-product catalog. ReelFoundry is the first complete product; preserve at least two clearly labeled reserved product slots that can reuse the same long-form content structure later.
- Provide a protected visual management entry at `/#/admin`; the public page remains readable without sign-in, while content edits and image uploads require the single custom administrator username and password. Keep the hash route because the hosted dispatcher redirects `/admin` to `/` before the app loads.
- The administrator can change that username and password inside the backend. Do not expose plaintext credentials in page source or repository files.
- Store editable page content in D1 and uploaded images in R2. A successful save updates the public page immediately without changing its URL.
