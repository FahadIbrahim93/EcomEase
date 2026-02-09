## 2025-02-09 - [Replacing Native Confirm with AlertDialog]
**Learning:** Browser native `confirm()` dialogs are disruptive and unstyled. Replacing them with a state-driven `AlertDialog` improves visual consistency and allows for better descriptive text (e.g., including the item name).
**Action:** Always prefer `AlertDialog` for destructive actions. Use a state-controlled `open` prop and ensure the "Action" button handles loading states if the operation is asynchronous.

## 2025-02-09 - [Icon-only Button Accessibility]
**Learning:** Icon-only buttons (like Edit/Delete) are common in tables but are inaccessible to screen readers if they lack an `aria-label`.
**Action:** Always add `aria-label` to buttons that only contain an icon, using dynamic content (e.g., `Edit ${product.name}`) for better context.
