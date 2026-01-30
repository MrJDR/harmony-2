# AccordPM Design Principles (Masterbook)

This document defines the visual, interaction, and accessibility standards for AccordPM. All features and pages should align with these principles.

---

## 1. Visual

- **Calm & uncluttered**: Information is present but not shouting. Avoid visual noise: dense borders, loud colors, and competing focal points.
- **Design tokens only**: Use CSS variables and Tailwind theme tokens (`--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--destructive`, etc.). No hard-coded hex or RGB values in components.
- **Typography**: Use **Outfit** for headings and titles (`font-[family-name:var(--font-outfit)]` or `font-outfit`). Use **Inter** for body and UI. Consistent hierarchy: one `h1` per page; section titles and labels use appropriate scale.
- **Spacing and rhythm**: Use consistent spacing (e.g. `gap-3`, `p-4`, `space-y-4`). Card-based layout with soft borders (`border-border/80`, `border-border/60`).

---

## 2. Diegetic (Seen, not explained)

- **Show, don’t tell**: Use icons, badges, and layout to convey status and meaning. Rely on visual cues (e.g. completion check, overdue highlight) instead of long explanatory text.
- **Progressive disclosure**: Keep primary content visible; put secondary details in expandable areas, tooltips, or modals when needed.

---

## 3. Ergonomic

- **Focus management**: All interactive elements (buttons, links, inputs) must have visible focus styles. Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent) so keyboard users can see focus.
- **Touch targets**: Buttons and clickable areas should be at least 44×44px where possible, or use adequate padding.
- **Labels and hints**: Use `aria-label` on icon-only buttons and controls. Form fields must have associated labels (visible or `aria-label`).

---

## 4. Accessibility (a11y)

- **One `h1` per page**: Each page has exactly one main heading (`<h1>`). Other headings use `<h2>`, `<h3>`, etc. in order.
- **Semantic structure**: Use `<header>`, `<main>`, `<nav>`, `<section>` where appropriate. Lists use `<ul>`/`<ol>` and `<li>`.
- **Interactive elements**: Buttons and links must be keyboard operable and have clear purpose (text or `aria-label`). Avoid `div`/`span` for primary actions without adding role and keyboard handling.

---

## 5. Shared components

Use these for consistency and alignment with the masterbook:

| Component       | Purpose |
|----------------|---------|
| **PageHeader** | Page title + optional short description. Ensures one `h1` and consistent spacing. |
| **PageSection** | Wraps a section with optional title and calm border/background. |
| **EmptyState** | Empty list or empty filter result: icon + short message + optional primary action. Calm, not loud. |
| **QuietAlert** | Single-line informational or status message. Muted styling; information present but not shouting. |
| **Card**       | Use `Card`, `CardHeader`, `CardContent` from UI library with token-based borders and backgrounds. |

---

## 6. Calm & focus

- **Alerts and toasts**: Prefer **QuietAlert** for inline status. Use toasts sparingly for success/error after mutations.
- **Empty and loading**: Use **EmptyState** for empty content. Loading states should be subtle (skeleton or minimal spinner) and not dominate the layout.
- **Errors**: Surface errors in context (e.g. under a form field or via QuietAlert) rather than only in toasts when possible.

---

## 7. Implementation checklist (per page/feature)

- [ ] One `h1` per page
- [ ] No hard-coded colors; use design tokens only
- [ ] Focus-visible styles on all interactive elements
- [ ] `aria-label` on icon-only buttons and controls
- [ ] PageHeader / PageSection / EmptyState / QuietAlert where appropriate
- [ ] Calm typography (Outfit for titles, Inter for body) and spacing
- [ ] Semantic HTML and keyboard accessibility
