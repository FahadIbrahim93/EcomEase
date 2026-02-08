## 2025-05-14 - [Vitest/JSDOM MatchMedia and Component Prop Passing]
**Learning:** In this project, components using responsive hooks (like `useMobile`) require `window.matchMedia` to be mocked in tests. Also, extracted sub-components in layouts (like `DashboardLayoutContent`) must explicitly receive all necessary state props from their parents to avoid `ReferenceError`.
**Action:** Always ensure `matchMedia` is mocked in new test files and double-check prop drilling in layout components.
