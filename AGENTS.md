## Commands

- Dev server: `astro dev --background` — manage with `astro dev stop`, `astro dev status`, `astro dev logs`
- Build (verify after changes): `npm run build`
- No lint or typecheck scripts defined — `npm run build` is the only verification

Requires Node ≥ 22.12.0. Uses npm (not bun/pnpm).

## Path Aliases

Defined in `tsconfig.json`: `@components/*`, `@assets/*`, `@sections/*`, `@layouts/*`, `@constants/*`, `@styles/*`, `@animations/*`.

## Architecture

Single-page Astro 7 site (`src/pages/index.astro`). Tailwind CSS 4 via Vite plugin (no `tailwind.config` — theme tokens live in `src/styles/global.css` under `@theme`). GSAP 3 with ScrollSmoother, ScrollTrigger, and SplitText plugins (registered in `src/animations/index.ts`).

Page order: Hero → WhyUs → RecentProjects → CtaSection → Services → Faq.

## GSAP / ScrollSmoother Gotchas

- `#smooth-wrapper` is `position: fixed; inset: 0; overflow: hidden; z-index: 20` (in `global.css`). Any absolutely-positioned overlay that extends outside its pinned parent will be **clipped** by this wrapper. This is the root cause of most WhyUs animation bugs.
- Sections go full-width using the breakout pattern: `w-screen left-1/2 -translate-x-1/2`. This makes the section a transform ancestor, so ScrollTrigger pins via transforms (not `position: fixed`).
- Z-index stack: sweep strip `z-10`, smooth-wrapper `z-20`, header `z-40`. The `z-30` on WhyUs places it between wrapper and header.
- `prefers-reduced-motion` is checked both in CSS (`global.css` resets smooth-wrapper to `position: static; overflow: visible`) and in each animation module (they return early).
- GSAP `pinSpacing` can cause layout jumps when overlapping pins exist. The WhyUs section has two sequential pins.

## Animation Files

All in `src/animations/`, imported from `index.ts`:

- **sweep.ts** — Cursor-following blue strip that inverts text and clips borders as it passes over elements.
- **whyus.ts** — Two pinned ScrollTriggers: paragraph section (3000px scroll) splits text to blue-50; cards section (2000px scroll) fills 4 card borders sequentially via 5-point polygon clip-path. Uses `data-why-us-reveal`, `data-why-us-cards`, `data-border-fill`, `data-border-overlay`.
- **recentProjects.ts** — Cards stack with peek offset; text fades to grey as next card enters.
- **marquee.ts**, **pill.ts** — Supporting animations.

## FeatureCard Border Fill System

Each card has two overlapping divs (both `absolute inset-0`): `data-border-overlay` (always-visible blue-400 border) and `data-border-fill` (blue-50 fill, clipped to 5-point polygon, animated by whyus.ts). Column 1 cards get `border-l-transparent`; column 4 gets `border-r-transparent` — applied in `features.ts` and handled in `FeatureCard.astro`.

## Section Component

`src/components/Section.astro` accepts `id`, `className`, and `style` props. Full-width sections use `className="relative z-30 left-1/2 w-screen -translate-x-1/2"`.

## Gotchas

- No CI, no pre-commit hooks, no formatter config — keep changes manually clean.
- GSAP SplitText is a premium plugin imported from `gsap/SplitText`.
- The `whyus.ts` two-pin layout measures element positions at init — resize and load events should re-measure if the layout shifts.
