# Palette's Journal - Critical UX/Accessibility Learnings

## 2025-05-22 - [AlertDialog and Loading States]
**Learning:** When replacing native `confirm()` with Radix-based `AlertDialog`, it is critical to pass the `isPending` state from mutations to the `AlertDialogAction` button to prevent duplicate submissions and provide visual feedback.
**Action:** Always include `disabled={mutation.isPending}` and conditional text (e.g., "Deleting...") in `AlertDialogAction` components.

## 2025-05-22 - [Form Accessibility]
**Learning:** Many UI components in this repository lack the explicit association between labels and inputs, which is essential for screen readers and improves click targets.
**Action:** Ensure every `Label` has an `htmlFor` attribute matching the `id` of its corresponding `Input`.
