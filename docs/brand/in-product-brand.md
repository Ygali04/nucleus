# In-Product Brand

Nucleus runs inside a host product. The brand has to coexist with the
host's brand without screaming for attention or feeling like a foreign
object embedded in someone else's UI. This page describes the dual-
brand pattern, the visual rules for the embedded surface, and the
naming convention for the entry point.

## The dual-brand pattern

Nucleus uses a **co-brand pattern** inspired by how Stripe Atlas, Notion
AI, and Linear's third-party integrations show up inside other
products. The pattern has three rules:

1. **The host's brand owns the chrome.** Header, sidebar, navigation,
   color tokens — all from the host. Nucleus inherits the host's
   theme via CSS variables and never injects its own background or
   font.
2. **Nucleus's brand owns its content area.** Inside the panel that
   the host opens for Nucleus, Nucleus uses its own component
   library (cards, buttons, tables, dialogs). The content area is
   recognizably Nucleus, just not loud about it.
3. **The entry point is host-named, not Nucleus-named.** The button
   the user clicks to open the Nucleus panel is **"Multiply"**, not
   "Nucleus" or "Open Nucleus." Multiply is the host's verb for
   "fan this asset out into N variants." Nucleus is the engine; the
   user-facing surface is a feature inside the host.

## Why this pattern

Three reasons.

### 1. The user is mid-flow inside the host

A user clicking Multiply on a recording is in the middle of using
the host product. Throwing up a "Welcome to Nucleus" screen would
break their flow. Better to load Nucleus's content into a panel that
feels like a continuation of the host UI.

### 2. The host owns the customer relationship

Billing, support, account management, success — all the host's
responsibility. Naming the feature with the host's vocabulary
reinforces that the host is the customer's relationship manager,
even though Nucleus is the engine doing the work.

### 3. Nucleus brand recognition still happens — in the right places

Nucleus shows up explicitly in:

- The **Powered by Nucleus** footer of the variant viewer (small,
  link to nucleus.ai)
- The **neural report PDF** (Nucleus header on every page, citation
  in the footer)
- The **GTM strategy guide PDF** (same)
- A **dedicated about page** inside the panel ("How Nucleus works")

Users who care can find out what Nucleus is in 15 seconds. Users who
don't care never have to.

## The Multiply button

The entry point is a single button on every recording in the host's
library:

```
[ ⚡ Multiply ]
```

Hover state shows a tooltip: *"Generate persona-targeted variants from
this recording."*

The button is host-styled (host's primary color, host's typography,
host's button radius). The lightning-bolt icon is the only Nucleus
visual element on the host's recording page.

## The panel

Clicking Multiply opens a panel inside the host's existing layout.
The panel is full-height, half-width on desktop, full-screen on
mobile.

### Panel layout

```
┌─────────────────────────────────────┐
│  Multiply: Acme Demo v3        [×]  │  ← Host header
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Brief                       │  │
│  │  ICPs · Languages · ...      │  │  ← Nucleus content
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Variants in flight (4)      │  │
│  │  ...                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Delivered variants (12)     │  │
│  │  ...                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│  Powered by Nucleus · About · Help  │  ← Nucleus footer
└─────────────────────────────────────┘
```

The header bar comes from the host. Everything below is Nucleus's
content area. The footer is small, low-key, and links to the Nucleus
about page + the host's help center.

### Theme inheritance

The Nucleus content area reads CSS variables from the host's root
theme:

```css
.nucleus-panel {
  --nucleus-primary: var(--host-primary-color, #4f46e5);
  --nucleus-text: var(--host-text-color, #0f172a);
  --nucleus-bg: var(--host-bg-color, #ffffff);
  --nucleus-radius: var(--host-radius, 12px);
  --nucleus-font: var(--host-font-family, Inter);
}
```

If the host doesn't expose theme variables, the Nucleus defaults
kick in. Either way, the panel feels native.

### What stays Nucleus-branded inside the panel

| Element | Why |
|---|---|
| Card structure (rounded corners, soft shadows) | The Nucleus card system is the visual signature of "feature surface" inside the panel |
| Iconography (Material icons in indigo) | Distinguishes Nucleus features from host actions |
| Neural report viz | The brain heatmap and attention curve visualizations are unmistakably Nucleus |
| Iteration history timeline | The iteration timeline UI is a Nucleus signature |
| GTM strategy guide rendering | Nucleus header on every page |
| The "Powered by Nucleus" footer | One link, low-key |

### What inherits from the host

| Element | Why |
|---|---|
| Color palette (with Nucleus indigo as fallback) | So the panel doesn't fight the host theme |
| Typography (with Inter as fallback) | Same |
| Button shape and radius | So buttons match the host's CTA pattern |
| Modal dialog chrome | So a modal feels like the host's modals |
| Loading spinner style | Same |
| Toast notifications | Same |
| The header bar above the panel | The host owns this |

## Nucleus mentions inside the panel

The Nucleus brand appears explicitly in five places inside the panel:

1. **Footer text:** "Powered by Nucleus · About · Help"
2. **About page:** A single-screen explainer of what Nucleus is and
   how it works. Linked from the footer.
3. **Neural report PDF header:** "Nucleus Neural Report — Generated
   for [tenant] on [date]"
4. **GTM strategy guide PDF header:** "Nucleus GTM Guide — [tenant]
   — [date]"
5. **Help links:** Deep links to the public Nucleus docs site for
   technical readers who want more.

That's it. No other Nucleus branding inside the host. The product
disappears into the host's flow.

## When the host doesn't have a brand system

For host products without an established brand system or theme
variables, Nucleus falls back to its own visual identity in full:
white background, indigo accent, Inter typography, the works. The
panel becomes a clean Nucleus surface inside whatever the host
provides.

## When Nucleus is the front-end

If Nucleus ever ships as a standalone product (the post-extraction
path described in [integration → extraction path](../integration.md#extraction-path-post-v2)),
the brand surface flips. Nucleus owns everything: the marketing
site, the chrome, the panel. The visual identity is the same; the
sizing and prominence change.

## Anti-patterns

Things the brand explicitly does not do inside a host product:

| Anti-pattern | Why not |
|---|---|
| Splash screen on first open | Breaks user flow |
| Nucleus logo in the header | Competes with host brand |
| Custom font loaded inside the panel | Breaks visual cohesion with host |
| "Try the new Nucleus features!" upsell modals | Patronizing |
| Marketing copy in the panel | The panel is functional, not promotional |
| Color flood (Nucleus indigo as panel background) | Too aggressive; breaks host theme |
| Animations on element appearance | Breaks the "this is part of the host" illusion |

## Cross-host consistency

If Nucleus eventually serves multiple host products, the dual-brand
pattern stays the same. Each host gets its own theme inheritance.
The Nucleus content area looks slightly different in each (different
color, different button shape) but the underlying structure and
component library are identical, so a Nucleus user moving between
hosts recognizes the experience.
