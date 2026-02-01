# PR-P Visual Identity Lock (Design Tokens First)

## Context
We need consistent brand expression across mobile and web surfaces. Hardcoded colors, typography, and shadows were drifting across apps and components, which made UI updates slow and inconsistent.

## Decision
1. **Design tokens as the source of truth**
   - Use `@hypermarket/design-tokens` for colors, shadows, and typography decisions.
   - Replace ad-hoc hex values in mobile UI and customer app components with token references.

2. **Mobile UI + core alignment**
   - Mobile UI components and mobile-core theme helpers reference tokens for consistent defaults.
   - App-level components (e.g., customer mobile) reference tokens for icon colors, placeholder text, and status UI.

3. **Tailwind theme alignment**
   - Tailwind palettes map to the same token values to preserve utility usage without reintroducing new hex values.

4. **Accessibility + consistency**
   - Use semantic tokens for status colors (success/warning/error/info).
   - Use text and border tokens for neutral UI elements.

## Consequences
- Visual consistency across surfaces.
- Faster, centralized branding updates by editing token values.
- Reduced design regressions from ad-hoc styling.

## Out of Scope
- Redesigning component layouts or interaction flows.
- Introducing new palette variants beyond the existing token set.
