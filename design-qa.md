# Pixel Core product carousel design QA

## Current selected direction — dark product stage

This section supersedes the earlier white-carousel comparison notes below. The public visitor page now keeps the bright Pixel Core hero and long-form ReelFoundry story, while the product catalog uses the selected dark circular stage from `../pixel-core-carousel-concept/public/assets/selected-reference-valid.png`.

- The stage uses one centered active card, two perspective side cards, visible arrows and progress dots, a cinematic dark background, and explicit launched/coming-soon status labels.
- ReelFoundry remains the only launched product. Product concepts 02 and 03 are marked `即将推出 · 概念占位` and do not claim real features or availability.
- Selecting a reserved product now replaces the complete content below the stage with its own conversation, three-step flow, visual story, workspace section, and coming-soon action area.
- Legacy saved image paths are normalized to the selected Pixel Core assets while custom uploaded media remains untouched.
- `npm run build`: passed on 2026-08-24.
- `npm run test:sites`: 13 passed, 0 failed on 2026-08-24.
- Local preview: `http://127.0.0.1:4174/` returned HTTP 200. Final production publication must target the existing `reelfoundry.roypt111.chatgpt.site` Site rather than creating a second Site.

### Admin story editor extension

- Reserved products now expose complete story editors under `产品展示`: opening copy, two conversation prompts, three workflow steps, the visual panel, the workspace panel, three bullets, CTA copy, and two uploaded images.
- ReelFoundry keeps one source of truth through the existing dedicated sections instead of exposing a duplicate nested story form.
- Story merge coverage was added to the Sites worker test file. `npm run build` passed and `npm run test:sites` completed with 14 passed, 0 failed on 2026-08-24.

### Remember this device

- The admin login now includes a default-enabled “在此设备保持登录” option. When selected, the server issues an opaque 30-day HttpOnly, SameSite=Strict, Secure cookie; the password is never written to browser storage.
- When the option is cleared, the cookie is browser-session-only while the corresponding server-side session retains its normal seven-day upper bound.
- `npm run build` passed and `npm run test:sites` completed with 15 passed, 0 failed on 2026-08-24.

## Comparison target

- Source visual truth: `F:\projects\产品前端网页\reelfoundry-landing\reference-option-1.png` for the established bright-white Pixel Core/ReelFoundry design language, plus the user's circular-carousel interaction specification and the structural reference at `C:\Users\hp\AppData\Local\Temp\codex-clipboard-653af1ca-feb1-4028-b9a6-b497a41de147.png`.
- Primary implementation capture: `F:\projects\产品前端网页\reelfoundry-landing\qa-product-carousel-desktop.png`.
- Focused implementation captures: `qa-product-carousel-detail.png`, `qa-product-dynamic-desktop.png`, and `qa-product-carousel-mobile.png` in the project root.
- Combined visual evidence: `F:\projects\产品前端网页\reelfoundry-landing\qa-product-carousel-comparison.png`.
- Route and state: local `/#products`; Pixel Core hero followed by the product carousel. ReelFoundry is active in the primary capture; the dynamic captures show product position 02 selected.

## Viewport and normalization

- Source raster: 725 × 2167 px. The top 725 × 516 px source region was used for the design-language comparison.
- Desktop viewport override: 1440 × 1024 CSS px at device scale 1. Browser content capture: 1425 × 1013 px after native scrollbar/chrome exclusion.
- Mobile viewport override: 390 × 844 CSS px at device scale 1. Browser content capture: 375 × 811 px after native scrollbar/chrome exclusion.
- The source crop and desktop implementation were independently resized to 720 × 512 px without aspect-ratio distortion, then placed side by side in the comparison artifact.

## Full-view comparison

The implementation preserves the source's white canvas, blue accent, strong black Chinese display type, restrained borders, warm travel imagery, generous spacing, sticky navigation, and rounded primary actions. The new product carousel reads as part of the same site rather than a separate catalog template. The center image is dominant, while adjacent images remain visibly selectable with controlled perspective and reduced contrast.

## Focused region comparison

- Product controls and summary: `qa-product-carousel-detail.png` confirms that arrows, progress markers, product name, status, three selling points, and the active-product action remain aligned and readable.
- Dynamic product content: `qa-product-dynamic-desktop.png` confirms that choosing product position 02 replaces the ReelFoundry long-form sections with that product's own image, description, selling points, and navigation state.
- Mobile: `qa-product-carousel-mobile.png` confirms the circular hierarchy survives at 390 px, the selected product's introduction replaces ReelFoundry content, tap targets remain usable, and there is no horizontal page overflow.

## Required fidelity surfaces

- Fonts and typography: passed. Existing system font stack, heavy display weights, compact tracking, and body line heights are preserved. Chinese headings wrap without clipping on desktop and mobile.
- Spacing and layout rhythm: passed. Hero-to-carousel sequence is immediate and clear; center/side image spacing, controls, detail divider, and mobile stacking are consistent. No horizontal overflow was observed.
- Colors and visual tokens: passed. Existing `--blue`, ink, muted gray, divider, and white-surface tokens are reused. Perspective states rely on scale, depth, opacity, and saturation rather than introducing a new palette.
- Image quality and asset fidelity: passed. All visible carousel and product-introduction visuals use the existing real ReelFoundry assets; no CSS drawings, placeholder geometry, or fabricated SVG imagery replace source assets.
- Copy and content: passed. Pixel Core is now the parent studio brand; ReelFoundry retains its original product promise. Reserved products are explicitly labeled and do not claim unavailable functionality.
- Icons and controls: passed. Existing Phosphor icons are used consistently. Left/right arrows, image-edge hit areas, dots, and keyboard controls all update the active product.
- Accessibility and responsiveness: passed. Buttons have accessible names, the active product uses `aria-current`, details update through an `aria-live` region, arrow keys work, reduced-motion rules are preserved, and mobile tap targets remain at least 44 px.

## Findings

- No actionable P0, P1, or P2 findings remain.

## Comparison history

1. Initial carousel pass: the product carousel worked, but the page still presented ReelFoundry as the top-level brand. This conflicted with the clarified studio hierarchy. Fixed by restoring the original hero structure with Pixel Core as the parent brand and ReelFoundry as the first product. Post-fix evidence: `qa-pixel-core-hero.png` and `qa-product-carousel-comparison.png`.
2. Dynamic-content pass: only the short selling-point block changed while the ReelFoundry long-form story remained below for reserved products. Fixed by lifting the product selection into the page, conditionally rendering the full ReelFoundry narrative only for product 01, and rendering the selected product's own introduction for other positions. Post-fix evidence: `qa-product-dynamic-desktop.png` and `qa-product-carousel-mobile.png`.
3. Interaction pass: exposed side images needed a reliable click target independent of 3D overlap. Fixed with labeled image-edge hit areas that rotate left or right while preserving the visual stacking order. Post-fix browser evidence: selecting the right-side image changed the active product to `下一款产品`, mounted one dynamic introduction, and removed the ReelFoundry conversation section.

## Primary interactions tested

- Hero “向下探索” navigation to the product carousel.
- Previous/next arrows, progress dots, keyboard left/right arrows, and left/right image-edge selection.
- Active image, name, status, description, selling points, CTA/status note, and page navigation updating together.
- ReelFoundry long-form content restored when product 01 is selected.
- Alternate product introduction shown and ReelFoundry sections removed when product 02 is selected.
- Desktop and mobile layouts; browser console checked with no errors or warnings in the final run.
- Production build and Sites worker tests verified separately.

## Follow-up polish

- P3: replace the two reserved-product images and generic copy when their real products are defined; the admin now exposes each product's image and three selling-point fields.

final result: passed
