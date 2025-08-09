# StellarRent – Homepage Revamp PRD

## 1) Problem & Goal
Parallel contributions (icons, cards, search, sidebar) left the homepage visually disconnected. Additionally, part of this disconnection comes from having migrated from one homepage to another — during that process, several well-designed features or purposeful sections (for example, the informative text) disappeared or no longer appear in the same way.

Right now, the “Home” page and the “Search” page are not clearly differentiated: the current Home focuses mainly on discovery, while Search contains many of the powerful tools (filters, sorting, map, infinite scroll) that give structure and utility to the browsing experience.

The goal is to align the homepage around one design system (colors, typography, iconography), restore or adapt the lost value from the previous homepage, and clearly split their purposes:

Homepage → optimized for users who have not yet signed in, with engaging discovery and informational sections.

Search page → optimized for signed-in users, with advanced filtering, sorting, and mapping tools.

### Success Criteria
- Visual cohesion across header, search, cards, and right sidebar using the current homepage dark theme.
- Global typography uses Geist everywhere.
- Dark theme colors centralized and reused across all dark pages.
- Card CTA uses `apps/web/public/icons/homepage-arrow.webp` (no “Go” text) on the homepage.
- Responsive at 375/768/1440 with no regressions.
- Core Web Vitals unchanged or improved; images served as WebP and/or `next/image` where feasible.

## 2) Scope
- Homepage UI/UX and shared tokens (colors/typography/spacing/icon usage).
- Apply tokens to Search and dashboards as follow‑ups (separate PRs).

Out of scope: new backend APIs, new global navigation/IA.

## 3) Users & UX Principles
- Fast path: scan → search → evaluate listings.
- Accessibility: contrast, focus styles, labels/tooltips; keyboard support.
- Calm visuals: minimal accents, consistent spacing and sizes.

## 4) Information Architecture (Homepage)
- Header: brand logo (left), future nav (right).
- Primary: compact Search bar (Location, Date, Guests).
- Listing feed: cards grid with consistent metadata and CTA capsule.
- Right Sidebar: slim rail with designer icons; only Search uses the capsule; tooltips on hover.

## 5) Design Tokens (foundations)
Create CSS variables in `apps/web/src/app/globals.css` (or a theme file) and optionally map in Tailwind.

- Colors (dark):
  - `--color-bg` (homepage background value)
  - `--color-surface` (cards/search surfaces)
  - `--color-primary` (accents/CTAs)
  - `--color-text`, `--color-muted`
  - Rating star: `#1cf0a8`

- Typography:
  - Geist via `next/font` (weights 400/500/600/700). Apply globally.

- Shape & Spacing:
  - Rounded: `rounded-xl`/`rounded-2xl` for cards/capsules.
  - Use Tailwind spacing scale consistently.

## 6) Technical Plan
1) Theme tokens
- Add CSS variables reflecting current homepage dark colors; apply on `:root`/`body`.
- Optionally map Tailwind colors to variables.

2) Font (Geist)
- Load with `next/font` in `apps/web/src/app/layout.tsx`; apply to `html, body`.

3) Iconography
- Keep designer assets from `apps/web/public/icons/*`.
- Use `IconContainer` only for the Search icon capsule in the sidebar; other icons plain.

4) Homepage listing cards (`apps/web/src/components/search/PropertyCard.tsx`)
- Replace CTA with `homepage-arrow.webp`.
- Rating/verified star color `#1cf0a8`.
- Prefer `next/image` with explicit width/height where feasible.

5) Search Bar (`apps/web/src/components/features/search/SearchBar.tsx`)
- Keep compact sizing; apply tokens for font sizes, gaps, and icon sizes.

6) Sidebar (`apps/web/src/components/layout/RightSidebar.tsx`)
- Only Search uses `IconContainer size="sm"`; others plain with tooltips.

7) Cross‑page adoption
- Apply dark tokens + Geist to Search page and dashboards as follow‑ups.

## 7) Accessibility & i18n
- `aria-label` on actionable icons.
- Tooltip text ≥ 12px with sufficient contrast.
- Preserve keyboard focus styles.

## 8) Risks & Mitigations
- Color drift → central variables; review PRs against tokens.
- Icon mismatch → enforce `public/icons` mapping.
- Performance regression → keep WebP/`next/image`, avoid layout shift.

## 9) QA Checklist
- Visual checks at 375/768/1440.
- Verify star color and CTA across cards.
- Tooltip alignment/overflow.
- Lighthouse ≥ 90 (Performance & Accessibility).

---

## Implementation Tasks (atomic)

### A. Card CTA uses homepage-arrow.webp
- Asset: `apps/web/public/icons/homepage-arrow.webp`.
- Update `apps/web/src/components/search/PropertyCard.tsx` CTA (icon‑only). Add `aria-label="Open property"`.

### B. Unify dark theme across dark pages
- Extract homepage colors into CSS variables in `globals.css`.
- Apply to:
  - Homepage root containers
  - Search page wrapper (`apps/web/src/app/search/page.tsx`)
  - Dashboard pages (follow‑up PR)

### C. Unify typography (Geist)
- Add Geist via `next/font` in `app/layout.tsx`; apply globally.
- Remove/override conflicting fonts.

### D. Sidebar icon treatment
- Only Search icon wrapped by `IconContainer`; others plain.
- Keep tooltips and order: Menu, Find a Property, My Calendar, Chats, Applications, Guest Invitations, My Bookings.

### E. Tokenize components
- Ensure `IconContainer` supports `sm`/`md` and is reused.
- Normalize padding/gaps in SearchBar and cards to token scale.

### F. Performance guardrails
- Use `next/image` for cards and CTA where feasible; provide width/height; keep WebP.

---

## Task Checklist
- [ ] A1: Replace card CTA with `homepage-arrow.webp` in `PropertyCard.tsx`; add `aria-label`.
- [ ] B1: Add dark theme CSS variables in `globals.css`; apply to Search page wrapper.
- [ ] C1: Install/apply Geist via `next/font` in `app/layout.tsx`.
- [ ] D1: Verify only Search icon has a capsule; others plain.
- [ ] E1: Use `IconContainer` size variants consistently.
- [ ] F1: Audit images for `next/image` and WebP.
- [ ] QA: Lighthouse and cross‑device visual checks.

## Files Likely Touched
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/search/PropertyCard.tsx`
- `apps/web/src/components/features/search/SearchBar.tsx`
- `apps/web/src/components/layout/RightSidebar.tsx`
- `apps/web/src/components/ui/icon-container.tsx`
- `apps/web/src/app/search/page.tsx`

## Rollout
- Branch: `feature/homepage-revamp`.
- Land tasks in small PRs (A → B → C…).
- Visual QA on preview before merge.
