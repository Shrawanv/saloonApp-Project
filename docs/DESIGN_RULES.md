# Frontend Design Rules

> This file is the authoritative design reference for all frontend work.  
> **Every new page, component, or feature MUST follow these rules.**

---

## 1. Color & Theme

All colors come from CSS variables defined in `frontend/src/styles/index.css`. **Never hardcode hex values** — always reference variables.

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#a855f7` (violet) | Buttons, active tabs, focus rings, badges |
| `--color-primary-dark` | `#7c3aed` | Hover states, dark accents |
| `--color-primary-light` | `#e9d5ff` | Hover backgrounds, highlights |
| `--color-accent` | `#1e1b4b` | Sidebar, dark text |
| `--color-bg` | `#faf5ff` | Page background |
| `--color-card` | `#ffffff` | Card backgrounds |
| `--color-text` | `#1e1b4b` | Body text |
| `--color-text-muted` | `#6b7280` | Labels, subtitles, hints |
| `--color-success` | `#10b981` | Success states |
| `--color-warning` | `#f59e0b` | Warnings |
| `--color-error` | `#ef4444` | Errors |

### Status Badge Colors (always use these — not ad-hoc colors)
- **Active / Success**: background `#dcfce7`, color `#15803d`
- **Inactive / Cancelled**: background `#fee2e2`, color `#dc2626`
- **Pending / Warning**: background `#fef9c3`, color `#92400e`

---

## 2. Typography — Heading Scale

**Font family**: `'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif`

Use ONLY the exact sizes below. Never use a heading size not in this table.

| Element | Size | Weight | Usage |
|---|---|---|---|
| `h1` / `.page-header h1` | `1.5rem` | `700` | Page title — one per page |
| `h2` / profile name | `1.75rem` | `700` | Profile header names only |
| `h3` / `.section-header h3` | `1.1rem` | `700` | Section titles inside cards |
| `h4` / stat labels | `0.82rem` | `700` | Stat card labels (uppercase) |
| Label / caption | `0.72rem` | `700` | Detail grid labels (uppercase, `letter-spacing: 0.06em`) |
| Body / value | `1rem` | `600` | Data values, card body text |
| Muted / hint | `0.9rem` | `400` | Subtitles, helper text |
| Small | `0.82rem` | `400` | Badges, timestamps, meta |

> **Rule:** Never create a heading that doesn't match the table above. If an element needs emphasis, use `font-weight: 700` on the existing body size — do NOT bump the `font-size` outside the scale.

---

## 3. Spacing, Layout & Card Sizing

### Page Max-Width (per page type)

Every page MUST use one of these patterns. **Never use an ad-hoc `max-width`.**

| Page Type | Max-width | Examples |
|---|---|---|
| Profile / form pages | `600px` on the page root | VendorProfile, CustomerProfile, Login |
| Vendor management pages | **none** — fills `vendor-content` (sidebar layout already adds 2rem padding) | Home, BookingQueue, PaymentBilling, Gallery, Reports |
| Customer listing pages | `.container` (1200px global) | SalonSelect, CustomerDashboard |
| Modals | `440px` on `.modal-content` | Password modal, QR modal |

### Page Padding
```css
/* Vendor pages (sidebar layout — content area handles this) */
.vendor-content { padding: 2rem; }

/* Customer pages (top-nav layout) */
.customer-main { padding: 2rem 0; }

/* Inside pages use .container for horizontal centering */
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
```

### Card Sizing Rules

| Rule | Value |
|---|---|
| Card padding | `1.5rem` (global `.card`) — do NOT override |
| Gap between stacked cards | `1.25rem` |
| Gap between inline cards (stat grid) | `1.25rem` |
| Section gap inside a card | `1.75rem` |
| Form field gap | `1.25rem` |

### Flexbox & Grid Sizing Reference

Use **only** these patterns. Never create one-off flex/grid rules that don't map to one of these.

| Pattern | CSS | Use case |
|---|---|---|
| **Full-width 4-col stats** | `grid-template-columns: repeat(4, 1fr)` | Vendor Dashboard stat cards |
| **Auto-fit details grid** | `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` | Read-only profile detail grids |
| **2-col form row** | `grid-template-columns: 1fr 1fr; gap: 1.25rem` | Paired form fields |
| **Gallery grid** | `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))` | Media/gallery pages |
| **Flex row with gap** | `display: flex; gap: 1rem; flex-wrap: wrap` | Action button rows, button groups |
| **Flex col with gap** | `display: flex; flex-direction: column; gap: 1.25rem` | Form fields, stacked content |

> **Rule:** A card must always take the **full width** of its grid column. Never set a `max-width` on an individual card inside a grid — set it on the grid's container instead.

---

## 4. Cards

Use the global `.card` class for all content containers. Do NOT create custom card styles unless adding specific overrides.

```css
/* Already defined globally */
.card {
  background: var(--color-card);
  border-radius: var(--radius);       /* 12px */
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  transition: box-shadow 0.3s, transform 0.3s;
}
```

- Cards should **lift on hover** (`translateY(-2px)` + `shadow-hover`) for interactive items
- Non-interactive content cards should NOT have hover transforms (remove `.card:hover` for static cards by adding `pointer-events: none` or a specific selector)

---

## 5. Buttons

Use only the pre-defined button classes. Never style one-off buttons inline.

| Class | Purpose |
|---|---|
| `.btn .btn-primary` | Primary action (violet fill) |
| `.btn .btn-outline` | Secondary action (violet border) |
| `.btn .btn-secondary` | Neutral action (auto-styled) |
| `.btn .btn-ghost` | Tertiary / text-like action |
| `.btn .btn-sm` | Small variant — add to any btn class |

All `.btn` elements already handle hover lift and transition from the global stylesheet.

---

## 6. Tabs (Navigation Between Sections)

Use the **segmented pill style** — the same pattern used in `VendorProfile.jsx`.

```css
.tabs-bar {
  display: flex;
  gap: 0.5rem;
  background: var(--color-bg);
  border-radius: var(--radius);
  padding: 0.35rem;
  border: 1px solid #e2e8f0;
}

.tab-item {
  flex: 1;
  padding: 0.6rem 1.2rem;
  border-radius: calc(var(--radius) - 2px);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.35);
}

.tab-item:not(.active):hover {
  background: rgba(168, 85, 247, 0.06);
  color: var(--color-primary);
}
```

---

## 7. Section Headers (Inside Cards / Tabs)

Every tab content section that has an action button uses:

```jsx
<div className="section-header">
  <h3>Section Title <span className="count-badge">N</span></h3>
  <button className="btn btn-secondary btn-sm">Action</button>
</div>
```

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
}
```

---

## 8. Dashboard Stat Cards

Used on both Vendor Dashboard and Customer-facing pages. **Both dashboards use the same stat card layout.**

```jsx
<div className="stats-grid">
  <div className="stat-card card">
    <h4>Queue Length</h4>
    <p className="stat-value">5</p>
  </div>
  ...
</div>
```

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card h4 {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}
```

---

## 9. Profile Headers (User / Vendor)

Both Customer Profile and Vendor Profile use a **centered header card** at the top:

- Circular image (110–120px) OR placeholder with dashed border + emoji
- Large bold name (`1.75rem`)
- Muted `@username` subtitle
- Optional action button (e.g. "Update Password")

```jsx
<div className="profile-header card">
  <div className="profile-avatar-container">
    <img className="profile-avatar-img" ... />
    <MediaUploader onUpload={...} label="Change Photo" />
  </div>
  <h2>Name</h2>
  <p className="profile-email">@username</p>
</div>
```

---

## 10. Forms (Edit Mode)

Forms in profile pages use a **light gray card** pattern (NOT the global white `.card`):

```css
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
  padding: 1.75rem;
  border-radius: var(--radius);
  border: 1px solid #e2e8f0;
}
```

- Use `form-row` (two-column grid) for paired fields (e.g. First/Last name, Open/Close time)
- Show Cancel + Save at the bottom inside `.form-actions` (flex, `justify-content: flex-end`)
- Cancel = `.btn .btn-ghost`, Save = `.btn .btn-primary`

---

## 11. Read-Only Details Grid

Profile pages show data in a `details-grid` when not in edit mode:

```css
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.75rem 2rem;
}

.detail-item .label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: var(--color-text-muted);
}

.detail-item .value {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}
```

---

## 12. Feedback / Banner Messages

Always use these two patterns. Never use `alert()` or `window.confirm()` in production UI.

```jsx
{error && <div className="error-message">{error}</div>}
{success && <div className="success-message">{success}</div>}
```

```css
.error-message  { background: #fee2e2; color: #dc2626; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid #fecaca; }
.success-message{ background: #dcfce7; color: #15803d; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid #bbf7d0; }
```

---

## 13. Modals

Use the blur-overlay + slide-up pattern for all dialogs:

```jsx
{showModal && (
  <div className="modal-overlay" onClick={closeModal}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h3>Title</h3>
      ...
      <div className="modal-actions">
        <button className="btn btn-ghost">Cancel</button>
        <button className="btn btn-primary">Confirm</button>
      </div>
    </div>
  </div>
)}
```

- Overlay: `backdrop-filter: blur(4px)`, `background: rgba(0,0,0,0.4)`, `z-index: 1000`
- Modal: `max-width: 440–500px`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-xl)`, slide-up animation

---

## 14. Empty States

Always show a friendly empty state — never a blank section:

```jsx
<div className="empty-state">
  <p>✂️ No services yet. Add your first service above!</p>
</div>
```

```css
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  background: #f8fafc;
  border-radius: var(--radius);
  border: 1px dashed #cbd5e1;
}
```

---

## 15. Responsive Breakpoints

| Breakpoint | Width | Rule |
|---|---|---|
| Desktop | > 768px | Multi-column layouts |
| Tablet | ≤ 768px | Reduce padding; simplify layouts |
| Mobile | ≤ 640px | Single-column forms and grids |
| Small mobile | ≤ 400px | Full single-column everything |

Always use `@media (max-width: 640px)` as the primary mobile breakpoint.

---

## 16. Animations

Use only these named easing functions (defined in `:root`):

| Variable | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Most hover/transition effects |
| `--ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce effects (dropdowns, popovers) |
| `--transition-fast` | `0.2s var(--ease-out-expo)` | Hover states |
| `--transition-smooth` | `0.3s var(--ease-out-expo)` | Cards, menus |
| `--transition-bounce` | `0.35s var(--ease-out-back)` | Spring effects |

Modal entrance: `fadeIn` (opacity 0→1, 0.15s) + `slideUp` (translateY 14px→0, 0.25s).

---

## 17. DO NOT

- Do NOT hardcode colors (use CSS variables)
- Do NOT use `alert()` or `window.confirm()` — use inline error/success messages and modals
- Do NOT create one-off button styles — use the `.btn` system
- Do NOT use different tab styles on different pages — use the segmented pill tab bar
- Do NOT use raw `<table>` for entity lists — use the **card rows** pattern (see `service-card` in VendorProfile)
- Do NOT leave empty sections blank — always add an empty state
- Do NOT use a heading size outside the §2 scale table (no ad-hoc `font-size` on headings)
- Do NOT set a `max-width` on individual cards inside a grid — set it on the container
- Do NOT use a `max-width` not in the §3 page max-width table
- Do NOT use an ad-hoc `flex` or `grid` layout — use one of the §3 Flexbox & Grid patterns
