## 2025-05-15 - [A11y & Tooltip Enhancement]
**Learning:** Icon-only buttons lack context for screen readers and can be ambiguous for users. Additionally, tooltips on disabled buttons often fail to trigger because disabled elements don't fire mouse events. Associating Labels with Inputs via `id`/`htmlFor` is essential for both a11y and UX (clickable labels).
**Action:** Always add `aria-label` to icon-only buttons. Wrap disabled buttons in a `<span>` inside the `TooltipTrigger` to ensure tooltips still work. Consistently use `id` and `htmlFor` for form field associations.
