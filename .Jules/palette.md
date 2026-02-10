# Palette's Journal - UX & Accessibility Learnings

## 2025-05-15 - [Consistent Tooltips for Icon-only Buttons]
**Learning:** Icon-only action buttons in tables (like Edit/Delete) are common accessibility gaps. While they save space, they lack visual and screen-reader context.
**Action:** Always provide an `aria-label` for screen readers and a `Tooltip` for sighted users on icon-only buttons. Using a `<span>` wrapper around disabled buttons ensures tooltips still show up on hover.
