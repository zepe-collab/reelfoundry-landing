# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## ReelFoundry Product Decisions

- Use `reference-option-1.png` as the visual source of truth for the bright Pixel Core hero and ReelFoundry long-form content. Use `../pixel-core-carousel-concept/public/assets/selected-reference-valid.png` as the source of truth for the dark circular product stage.
- This is a vertically scrolling, single-page marketing site for ordinary personal users.
- Studio brand: `Pixel Core`, an independent studio focused on building AI products and Skills.
- The top-level hero introduces Pixel Core with one brand promise and one large image. ReelFoundry remains the first product in the carousel and retains its product promise: `把你的照片和想法，变成一段值得分享的视频。`
- The product is a free local Windows and macOS launcher with a conversational creative agent; users pay official model API usage fees.
- Preserve the bright white hero and long-form content system, generous spacing, warm travel imagery, and the narrative sequence: conversation → creative directions → storyboard → finished video → local launcher → transparent cost explanation → download.
- Use the selected dark circular product stage between the hero and long-form story: one centered active product card, two perspective side cards, clear arrows and dots, and a dark cinematic background. Product selection replaces the complete story below the stage.
- Keep complete story editing for reserved products in the `/#/admin` product section, including conversation prompts, steps, visual and workspace panels, bullets, CTA copy, and both story images. ReelFoundry continues to use the dedicated creative-direction, video, local-workspace, cost/FAQ, and download editors.
- Keep the site expandable into a multi-product catalog. ReelFoundry is the first complete product; preserve at least two clearly labeled reserved product slots that can reuse the same long-form content structure later.
- Place the product catalog directly below the hero scroll cue. Present products as a manually controlled circular carousel: the active image and name are centered, adjacent products sit to the left and right with subtle perspective, and the product description and selling points update with the selection.
- Provide a protected visual management entry at `/#/admin`; the public page remains readable without sign-in, while content edits and image uploads require the single custom administrator username and password. Keep the hash route because the hosted dispatcher redirects `/admin` to `/` before the app loads.
- The administrator can change that username and password inside the backend. Do not expose plaintext credentials in page source or repository files.
- Store editable page content in D1 and uploaded images in R2. A successful save updates the public page immediately without changing its URL.
