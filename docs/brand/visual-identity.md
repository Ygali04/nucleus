# Visual Identity

The Nucleus visual system is built around three rules: **clean white
surfaces**, **indigo as the only accent**, and **structure over
decoration**. The system is intentionally minimal so that Nucleus can
embed inside any host product without clashing.

## Color

### Primary palette

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--nucleus-primary` | `#4f46e5` | `239 84% 58%` | Primary actions, links, focus, icons in feature cards |
| `--nucleus-primary-hover` | `#4338ca` | `243 75% 52%` | Hover state for primary actions |
| `--nucleus-primary-soft` | `#eef2ff` | `226 100% 97%` | Pill backgrounds, subtle highlights, card-on-card surfaces |
| `--nucleus-accent` | `#06b6d4` | `189 94% 43%` | Reserved for occasional secondary highlights (data viz, status) |

The primary indigo `#4f46e5` is the same Tailwind `indigo-600` and
the same color used by Linear, Anthropic, and a handful of other
modern dev-tooling brands. It's familiar without being generic, and
it has high contrast against both white and dark surfaces.

### Neutrals (light mode)

| Token | Hex | Use |
|---|---|---|
| `--nucleus-bg` | `#ffffff` | Page background |
| `--nucleus-surface` | `#fafafa` | Subtle alternate background |
| `--nucleus-surface-2` | `#f5f6f8` | Card-on-card surfaces, table headers |
| `--nucleus-border` | `#e6e8ec` | Card borders, subtle dividers |
| `--nucleus-text` | `#0f172a` | Primary text |
| `--nucleus-text-muted` | `#475569` | Secondary text |
| `--nucleus-text-subtle` | `#64748b` | Tertiary text, captions |

### Neutrals (dark mode)

| Token | Hex | Use |
|---|---|---|
| `--nucleus-bg-dark` | `#0b1020` | Page background |
| `--nucleus-surface-dark` | `#11172b` | Card surface |
| `--nucleus-border-dark` | `rgba(255,255,255,0.08)` | Borders and dividers |
| `--nucleus-text-dark` | `#e2e8f0` | Primary text |
| `--nucleus-primary-dark` | `#818cf8` | Primary in dark mode (lighter for contrast) |

Dark mode is a first-class theme. The toggle is in the header.

### What's not in the palette

- **No green, no orange, no red as brand colors.** Status colors
  (success, warning, error) are reserved for status — they are not
  used in marketing or feature surfaces.
- **No gradients except for the hero text gradient.** A subtle
  text-gradient on the hero headline is allowed; gradient buttons,
  gradient cards, and gradient backgrounds are not.
- **No pastels.** The palette is high-contrast.

## Typography

### Type stack

| Role | Family | Weight range | Use |
|---|---|---|---|
| Body | **Inter** | 300–700 | All body copy, UI labels, buttons |
| Headings | Inter (no separate display face) | 700 | All headings; tracking-tight |
| Code | **JetBrains Mono** | 400, 500 | Code blocks, monospace UI |

Inter is the right choice because it pairs cleanly with almost any
host product (it's the default in Linear, Notion, Stripe, and dozens
of other modern tools), and using a single typeface for body and
headings cuts visual noise.

### Type scale (web)

| Token | Size | Line height | Letter spacing | Use |
|---|---|---|---|---|
| `display` | 3rem (48px) | 1.05 | -0.035em | Hero headlines |
| `h1` | 2.6rem (41.6px) | 1.1 | -0.03em | Page titles |
| `h2` | 1.75rem (28px) | 1.25 | -0.022em | Section headings |
| `h3` | 1.25rem (20px) | 1.35 | -0.022em | Subsection headings |
| `h4` | 1.05rem (16.8px) | 1.4 | -0.015em | Component titles |
| `body` | 0.94rem (15px) | 1.7 | 0 | Body copy |
| `small` | 0.84rem (13.5px) | 1.55 | 0 | Captions, footnotes |
| `mono` | 0.88rem (14px) | 1.6 | 0 | Code |

### Headline rules

- All headlines are tracking-tight (`-0.022em` to `-0.035em`)
- All headlines are weight 700
- All headlines are sentence case ("How it works", not "How It Works"
  or "HOW IT WORKS")
- Hero headlines use the `display` size; subsequent page H1s use the
  smaller `h1` token

## Shape

### Border radius scale

| Token | Px | Use |
|---|---|---|
| `--nucleus-radius-sm` | 6px | Inline pills, code chips |
| `--nucleus-radius` | 12px | Buttons, inputs, small cards |
| `--nucleus-radius-lg` | 16px | Feature cards, hero blocks |
| `--nucleus-radius-xl` | 24px | Modal dialogs |

Rounded but not pill-shaped. The 12px / 16px range is the same
range used by Linear, Stripe, and the host product (TruPeer) so the
embed feels native.

### Shadow scale

| Token | Value | Use |
|---|---|---|
| `--nucleus-shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)` | Subtle elevation on hover |
| `--nucleus-shadow-md` | `0 4px 16px rgba(15,23,42,0.06)` | Cards on hover, popovers |
| `--nucleus-shadow-lg` | `0 10px 32px rgba(15,23,42,0.08)` | Modals, dropdowns |

No deep shadows. No colored shadows. No glow effects. The shadow
system is for subtle elevation only.

## Iconography

Material icons (via the Material Design icon font) are the primary
icon source. Two reasons:

1. They cover ~5,000 concepts so we never have to commission custom
   icons for an MVP feature.
2. They render at any size with a single font file.

Custom icons get drawn only for:

- The Nucleus mark (the wordmark + atomic symbol)
- The four archetype icons (demo, marketing, knowledge, education)
- The neural-region indicators in the report viewer (NAcc, mPFC,
  hippocampus, dorsal attention, DMN)

### Icon style rules

- **Stroked, not filled** (Material's "outlined" style)
- **1.5px stroke weight** at 24px size
- **Rounded line caps**
- **Color: indigo or text color**, never multi-colored

## Logo

The Nucleus logo has two parts: a **mark** and a **wordmark**.

### Mark

The mark is an atomic-symbol-derived glyph: a small filled circle
(the nucleus) inside two rotating elliptical orbits. The orbits
suggest the recursive loop without being literal. Drawn at 24px,
32px, and 48px in indigo.

(The first version uses Material's `material/atom-variant` icon as a
placeholder. A custom mark is on the post-launch checklist.)

### Wordmark

`nucleus` set in Inter, weight 700, lowercase, with `-0.022em` letter
spacing. The wordmark sits to the right of the mark with 12px gap.

### Lockup variants

| Variant | Use |
|---|---|
| Mark + wordmark, horizontal | Primary lockup, used in headers and footers |
| Mark only | Favicon, app icons, very small surfaces |
| Wordmark only | Footer attribution, places where the mark would feel like decoration |
| White-on-indigo | Used on indigo backgrounds (rare — most surfaces are white) |

### Clear space

Clear space around the lockup equals the height of the wordmark's
"n" character. Nothing crowds the logo.

## Motion

Animation in Nucleus is **functional, not decorative**. Three rules:

1. **No motion for marketing.** No animated headlines, no parallax,
   no scroll-triggered reveals. The site is static.
2. **Motion only for state changes.** Hover, focus, expand/collapse,
   loading. Each animation is ≤ 300ms.
3. **Reduced-motion mode is honored.** `prefers-reduced-motion: reduce`
   disables all animations except the most essential (e.g., loading
   spinners go from rotating to static, but progress is still
   communicated).

### Animation primitives

| Primitive | Duration | Easing | Use |
|---|---|---|---|
| `fade-in` | 200ms | ease-out | Element appearance |
| `slide-up` | 250ms | ease-out | Modal entry, panel open |
| `lift` | 180ms | ease-out | Card hover (translate -1px + shadow) |
| `pulse` | 1.5s | ease-in-out | Loading state |
| `progress` | 1s | linear | Progress bars |

## Imagery

Nucleus does not use stock photography. The visual system is built
around:

1. **Diagrams** — flowcharts, architecture diagrams, state machines
   in Mermaid
2. **Data visualizations** — attention curves, brain heatmaps,
   iteration histories in D3 or similar
3. **Code blocks** — syntax-highlighted JetBrains Mono on
   `--nucleus-surface-2`
4. **Screenshots** — actual product screenshots, never mockups

If a marketing surface needs imagery and none of the above fit, the
default is **no image at all**, with strong typography filling the
space instead.

## What the visual system is not

- **Not glass morphism.** The first draft of the Nucleus mkdocs site
  used the "Tempered Glass over Warm Light" design system from
  ManimStudio. It was rejected as too experimental for a B2B
  embedded brand. The current system is the corrective.
- **Not heavy on color.** One accent color does almost everything.
- **Not playful.** No mascots. No emoji in product copy. No
  illustrations. The product is technical and the brand reflects
  that.
- **Not "AI-coded."** No purple-pink gradients, no nebula
  backgrounds, no robot iconography. Nucleus is built on a brain
  model, not on "AI as marketing."

## Adapting the system to other surfaces

The Nucleus brand has to live on three surfaces:

1. **The mkdocs concept site (this site)** — fully Nucleus-branded
2. **The in-product Nucleus panel inside a host** — see
   [in-product brand](in-product-brand.md) for the dual-brand pattern
3. **A future standalone marketing site** — uses the system unchanged

The same tokens, same fonts, same icons drive all three. Only the
host-embedded surface adapts color tokens to inherit from the host's
own theme.
