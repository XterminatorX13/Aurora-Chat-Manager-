# Umbra Purpurea Design System

> This document defines the mandatory engineering rules for any AI agent contributing to the Umbra Purpurea codebase. It is prescriptive, not aspirational: every rule here is meant to be checkable, not just "kept in mind."

---

# Mission

Your responsibility is **not** to write CSS.

Your responsibility is to evolve a coherent Design System.

Every decision should increase:

* consistency
* scalability
* maintainability
* accessibility
* performance

Avoid local optimizations that create long-term inconsistency.

---

# Core Principles

## Token First

Never hardcode visual values when an equivalent token should exist.

Avoid:

```css
color: #ffffff;
padding: 13px;
border-radius: 7px;
```

Prefer:

```css
color: var(--text-primary);
padding: var(--space-3);
border-radius: var(--radius-2);
```

If a token does not exist and will likely be reused, create it in `tokens/`, not inline. If it will realistically be used exactly once (e.g. a one-off illustration), see **Escape Hatches**.

## Composition over Duplication

Never duplicate components. Always extend an existing primitive whenever possible.

```
Button
├── Primary
├── Secondary
├── Ghost
├── Premium
├── Glow
└── Danger
```

Every variant must inherit from the same base implementation, sharing structure, spacing, and states. A variant that needs different markup or different state logic is not a variant — flag it and ask before creating a new primitive.

## Single Source of Truth

Each concept exists only once: one spacing scale, one radius scale, one shadow scale, one typography scale, one animation system, one z-index scale, one breakpoint scale. Never create parallel systems, even "just for this one feature."

## Predictability

Similar components must behave similarly. Hover, focus, pressed, disabled, loading, and selected states should feel identical across the application — same easing, same duration, same visual language for "this is disabled" regardless of which component it is.

## Minimal Complexity

Choose the simplest architecture capable of supporting future growth. Avoid clever implementations. Prefer readable code. If two approaches are equally correct, pick the one a new contributor would understand in 30 seconds.

---

# Design Token Hierarchy

```
Foundations → Design Tokens → Utilities → Primitives → Components → Patterns → Layouts
```

Each layer may only consume from the layers above it:

* Components must never bypass tokens.
* Patterns must never bypass components.
* Layouts must never bypass patterns/components to reach raw tokens directly for structural decisions (spacing between sections, page-level grid).

If you find yourself needing to skip a layer, that's a signal the layer below is missing something — extend it, don't bypass it.

---

# Foundations

## Colors

Semantic groups, each backed by primitive palette values (never referenced directly by components):

```
Surface   → surface-0, surface-1, surface-2, surface-3, surface-floating
Text      → text-primary, text-secondary, text-muted, text-disabled, text-inverse
Accent    → accent-50 … accent-400
Feedback  → success, warning, danger, info (each with -subtle / -strong pair)
Border    → border-soft, border, border-strong
Overlay   → overlay-scrim, overlay-glass
```

Never introduce raw hex/rgb values inside components. If a group is missing a value you need, add it to the token layer with a clear semantic name — not a component-local variable.

## Theming (Light / Dark)

Semantic tokens are theme-aware; primitives are not.

```css
/* tokens/colors.css */
:root {
  --surface-0: var(--palette-white);
  --text-primary: var(--palette-neutral-900);
}
[data-theme="dark"] {
  --surface-0: var(--palette-neutral-950);
  --text-primary: var(--palette-neutral-50);
}
```

Components reference `--surface-0`, never `--palette-neutral-950`. This is what makes theme switching a token-layer concern, not a component-layer concern. New components must be checked in both themes before being considered done.

## Typography

```
Display / Headline / Title / Body / Label / Caption / Mono
```

No arbitrary font sizes, weights, or line-heights outside this scale. Each step defines size, line-height, and weight together — don't mix a Display size with a Body line-height.

## Spacing

4px base unit, exposed in rem:

```
space-1: 4px   space-4: 16px
space-2: 8px   space-5: 24px
space-3: 12px  space-6: 32px
               space-7: 48px
               space-8: 64px
```

No arbitrary margins/paddings. If a gap doesn't fit the scale, the layout is wrong before the token is.

## Radius

```
radius-1: 4px   radius-3: 12px   radius-pill: 999px
radius-2: 8px   radius-4: 16px
```

## Elevation

```
shadow-xs / shadow-sm / shadow-md / shadow-lg / shadow-floating / shadow-glow
```

Shadows encode both blur and color-tint together; don't compose ad-hoc `box-shadow` values from raw numbers.

## Motion

Duration and easing are separate axes, always combined explicitly:

```
motion-fast: 120ms     ease-standard
motion-normal: 200ms   ease-decelerate
motion-slow: 320ms     ease-emphasized
```

All animations must respect `prefers-reduced-motion` — provide a reduced/instant variant, never just delete the transition.

## Blur

```
blur-xs / blur-sm / blur-md / blur-lg
```

## Breakpoints

```
breakpoint-sm: 480px    breakpoint-lg: 1024px
breakpoint-md: 768px    breakpoint-xl: 1280px
                        breakpoint-2xl: 1536px
```

Mobile-first: base styles target the smallest viewport, breakpoints add complexity upward, never the reverse.

## Z-Index

```
z-base: 0        z-modal: 400
z-dropdown: 100  z-popover: 500
z-sticky: 200    z-toast: 600
z-overlay: 300   z-tooltip: 700
```

No raw `z-index` numbers in components. If nothing in this scale fits, that's a layering-architecture problem — ask before inventing a new number.

---

# Component Architecture

```
Primitive → Variant → State → Composition
```

Example: `Button → Primary → Hover → Toolbar`, not `Toolbar Button`. Compositions (a button placed in a toolbar) style *placement and spacing*, never override the primitive's internals.

## Required Component States

```
Default / Hover / Pressed / Focused / Disabled / Loading / Selected
```

Plus semantic states where applicable: `Success / Warning / Danger`.

A component that can't express all required states for its type is incomplete, not "fine for now."

## Component API Conventions

* Variant/appearance props: `variant` (`primary` / `secondary` / `ghost` …), `size` (`sm` / `md` / `lg`), `tone` for semantic color (`success` / `danger` …).
* Boolean props are prefixed: `isDisabled`, `isLoading`, `hasError` — never bare adjectives (`disabled` alone is acceptable only where it mirrors a native HTML attribute).
* Every interactive primitive accepts and forwards `className`/`style` passthrough and a `ref`, so it can be composed without being forked.
* Prefer controlled components with sane uncontrolled defaults over components that only work one way.
* Don't invent a new prop name for a concept another primitive already named — check existing components first.

---

# Required Components (Primitives)

```
Button, Input, Textarea, Checkbox, Switch, Radio, Dropdown, Select,
Card, Panel, Badge, Chip, Tag, Modal, Dialog, Toast, Tooltip,
Tabs, Accordion, Sidebar, Toolbar, Search, Command Palette,
Timeline, Chat Bubble
```

New components should reuse these whenever possible. Before adding a new primitive to this list, confirm none of the above can be extended to cover the need.

---

# Icons

One icon set, one size scale (`icon-sm` 16px / `icon-md` 20px / `icon-lg` 24px), always rendered via `currentColor` so icons inherit text/accent tokens instead of hardcoding fill colors. Never mix icon libraries.

---

# Effects

Effects (`Glow, Glass, Aurora, Noise, Gradient, Shadow`) remain isolated, optional layers. Components must function correctly with effects disabled — never bake an effect into a component such that removing it breaks layout or readability.

---

# Utility Classes

```
.flex .grid .stack .cluster .center .hidden .scroll .glass .glow .noise .aurora
```

Utilities stay generic and must never encode business logic or component-specific behavior.

---

# Naming Rules

Names describe purpose, not appearance.

Good: `button`, `button--primary`, `card`, `surface`, `text-primary`, `shadow-md`
Avoid: `purpleButton`, `darkCard`, `blueBorder`, `smallPadding`

If a proposed name references a color, a specific pixel value, or "small/big" without a defined scale step, it's wrong — rename before merging.

---

# CSS Organization

```
tokens/       colors.css, spacing.css, typography.css, radius.css, elevation.css, motion.css
utilities/    layout.css, effects.css, helpers.css
primitives/   button.css, input.css, card.css, ...
components/   sidebar.css, modal.css, search.css, ...
patterns/     dashboard.css, editor.css, chat.css
```

---

# Accessibility

Minimum, non-negotiable, every contribution:

* visible focus indicators (never `outline: none` without a replacement)
* full keyboard navigation and correct tab order
* semantic HTML before ARIA — ARIA is a patch, not a first choice
* WCAG AA contrast minimums for text and meaningful icons
* accessible hover alternatives (nothing hover-only conveys required information)
* `prefers-reduced-motion` compatibility

Never remove accessibility for aesthetics. This overrides every other rule in this document, including Minimal Complexity.

---

# Performance Rules

Prefer `transform`, `opacity`, CSS variables, and GPU-friendly animations.

Avoid layout thrashing, unnecessary `filter` usage, expensive repaints, duplicated gradients, and repeated SVG noise definitions (define once, reference via `<use>` or a shared token).

Animations should target composite properties whenever possible.

---

# Escape Hatches

Raw, non-token values are acceptable only when:

* the value is genuinely one-off (a hero illustration, a third-party embed you don't control), **and**
* it's marked with a comment explaining why, e.g. `/* one-off: hero illustration gradient, not reusable */`

Anything reused a second time must be promoted to a token immediately, not left as a duplicated raw value "for now."

---

# When to Stop and Ask a Human

Don't proceed unilaterally on:

* deleting or renaming a public component API
* introducing a new dependency (animation library, icon set, CSS framework)
* a structural refactor touching more than ~10 files
* ambiguous business/UX logic that isn't a pure styling decision
* any accessibility trade-off that isn't obviously net-positive

For everything else in this document, use judgment and proceed — but leave a clear trail (commit message, PR description) of what token/primitive decisions were made and why.

---

# Before Creating Anything

1. Does a similar component already exist?
2. Can this inherit from an existing primitive?
3. Can this reuse existing tokens?
4. Can this reuse utilities?
5. Does this duplicate an existing effect?
6. Is this accessible in both themes?
7. Is this responsive across all breakpoints?
8. Is this easier to maintain than the alternative?
9. Is this consistent with the Design System?
10. Is this the smallest possible implementation?

If any answer is "No," refactor before continuing.

---

# Refactoring Rules

When touching existing code: reduce duplication, extract tokens instead of copying values, consolidate repeated animations/shadows/spacing, keep public APIs stable, avoid unnecessary breaking changes. If a breaking change is unavoidable, see **When to Stop and Ask a Human**.

---

# Verification Checklist (before opening a PR)

* [ ] No hardcoded colors, spacing, radii, shadows, or z-index values
* [ ] Component tested in light and dark theme
* [ ] Keyboard-only navigation works end to end
* [ ] Focus states visible on every interactive element
* [ ] Works with `prefers-reduced-motion: reduce`
* [ ] No new token/utility/primitive duplicates an existing one
* [ ] Naming follows semantic conventions

---

# Pull Request Expectations

Every change should improve at least one of: readability, consistency, maintainability, accessibility, performance, reusability. Do not submit cosmetic rewrites without measurable benefit — state the benefit in the PR description.

---

# Definition of Done

A contribution is complete only if:

* No duplicated visual logic exists.
* Tokens are reused consistently, and any new token is documented in `tokens/`.
* Components inherit from primitives.
* Naming follows project conventions.
* Accessibility has been preserved or improved.
* Performance has not regressed.
* The Verification Checklist passes.
* The Design System becomes simpler — not more complicated.

---

# Guiding Principle

**Design systems are grown through disciplined composition, not accumulated styling.**

When uncertain, choose the solution that reduces duplication, improves consistency, and strengthens the system architecture — and when the uncertainty is about business logic rather than styling, stop and ask.
