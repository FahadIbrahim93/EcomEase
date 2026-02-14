# Palette's Journal

## 2025-05-14 - Inventory Accessibility and Feedback
**Learning:** Replacing native browser 'confirm()' with 'AlertDialog' and adding item-specific loading states (e.g., 'deletingId') significantly improves the perceived quality and feedback loop of the application. Additionally, wrapping 'TooltipTrigger' in a '<span>' ensures tooltips are visible even for disabled buttons, which is critical for communicating state.
**Action:** Use 'AlertDialog' for all destructive actions and implement granular loading states to avoid UI-wide 'isPending' indicators. Always associate labels with inputs using 'id' and 'htmlFor'.
