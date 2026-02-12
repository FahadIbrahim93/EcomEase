## 2025-05-15 - [Accessible Tooltips for Disabled Buttons]
**Learning:** In Radix UI / Shadcn UI, tooltips attached to disabled buttons will not trigger because the button has `pointer-events: none`.
**Action:** Wrap the disabled button in a `<span>` and attach the `TooltipTrigger` to the span to ensure the tooltip remains accessible even when the button is inactive.
