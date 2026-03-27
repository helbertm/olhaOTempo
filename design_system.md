# Design System

## Metadata

- Canonical file: `design_system.md`
- Scope: static presentation-timer application
- Purpose: normative UI engineering contract for implementation and review

## 1. Design Principles

- Use calm hierarchy. Primary actions must be obvious without turning the interface into a CTA wall.
- Use one semantic action contract for one user goal. Do not create parallel actions with different copy, visibility, or disabled logic for the same outcome.
- Use visible text for critical actions. Do not rely on icon-only controls for mode changes.
- Use fixed-position controls only for high-frequency shortcuts or recovery actions.
- Do not introduce one-off UI components when the same behavior exists elsewhere.

## 2. Tokens

### Spacing Scale

- Use `--space-1` through `--space-10`.
- Do not introduce hard-coded spacing when an existing token fits.
- Use `--space-2` to `--space-4` for internal control gaps.
- Use `--space-4` to `--space-6` for component separation.

### Typography Scale

- Use `--type-overline` for utility labels, chips, and compact metadata.
- Use `--type-body-sm` and `--type-body-md` for functional copy.
- Use `--type-title-md`, `--type-brand-md`, `--type-display-lg`, and `--type-display-xl` for headings only.
- Use sentence case for primary action labels unless a strong legacy reason exists.
- Do not use all caps for new primary floating actions.

### Color Semantics

- Use `--accent` and `--accent-strong` for primary interactive emphasis.
- Use `--button-dark` and `--button-dark-text` for high-emphasis solid buttons.
- Use `--button-soft` for secondary ghost surfaces.
- Use `--warning` and `--warning-soft` only for cautionary meaning.
- Use `--danger` and `--danger-soft` only for destructive or error semantics.
- Do not communicate status by color alone.

### Elevation and Radius

- Use `--shadow-sm`, `--shadow-md`, `--shadow-lg` only.
- Use `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` only.
- Use `--control-pill-radius` for pill buttons and floating actions.
- Floating actions must use `--shadow-md` by default and a stronger hover shadow only on pointer-capable devices.

## 3. Accessibility Baseline

- Every interactive target must be at least 44x44 px.
- Every interactive control must have visible focus using `--state-focus-ring`.
- Hidden controls must be removed from the visual UI and the accessibility tree.
- Decorative icons must use `aria-hidden="true"`.
- Use the native `disabled` attribute only when the system also provides a clear explanation nearby or a shared disabled pattern across all equivalent entry points.
- Respect `prefers-reduced-motion: reduce`.

## 4. Button Family

- Base families are `primary`, `secondary`, `ghost`, `danger`, and `icon`.
- All buttons must share base radius, padding logic, focus treatment, and disabled treatment.
- One user goal must map to one semantic button family across all entry points.
- If an inline CTA and a floating shortcut trigger the same action, they must use the same copy family and the same enabled/blocked logic.

## 5. Forms

- Use native inputs, selects, and checkboxes.
- Labels must remain visible.
- Validation must be understandable without relying only on toast messages when the error is persistent.
- Do not add a unique disabled behavior to one entry point of a shared action.

## 6. Status, Badge, and Notice Rules

- Badges such as beta, preview, and warning labels must remain visually secondary to the page title.
- Notices that affect trust or live-usage expectations must be short and explicit.
- Warning color must not be reused for ordinary navigation or utility actions.

## 7. Navigation and Mode Switching

- Mode-switch actions must describe the resulting mode.
- Do not use playback metaphors for mode-entry actions unless the action actually starts playback.
- `Abrir modo apresentação` and `Apresentar` are valid mode-entry labels.
- `Iniciar` is invalid for mode entry when session start is optional.

## 8. Floating Actions

### Component Model

- Use one shared stack container: `.floating-action-stack`.
- Use one shared base control: `.floating-action-button`.
- Apply semantic modifiers such as `.floating-action-button-primary` and `.floating-action-button-secondary`.
- Do not style individual floating buttons as isolated one-off components.

### Positioning

- Anchor floating actions to bottom-right.
- Use safe-area aware offsets on both axes.
- Keep the primary floating action in the bottom-most slot.
- Stack secondary utility actions above the primary action.
- Do not reposition the primary floating action when a secondary action appears or disappears.

### Visibility Rules

- Floating shortcuts for mode entry must be visible only in the relevant source mode.
- A floating shortcut that opens presentation mode must be visible only in edit/configuration mode.
- A utility floating action such as back-to-top may use scroll-threshold logic.
- When an inline canonical CTA for the same action is visible in the viewport, hide the floating shortcut.
- Do not keep duplicate primary CTAs visible at the same time unless there is a strong operational reason and explicit review approval.

### Content Rules

- Floating primary actions must be label-first.
- Icons are optional.
- Do not use ambiguous Unicode play icons as the only or primary metaphor for opening presentation mode.
- If no shared icon source exists, omit the icon.

### State Rules

- Default, hover, focus, pressed, hidden, and disabled states must be defined at the base component level.
- Disabled state must not diverge from the inline equivalent action.
- If the inline equivalent action is not disabled and instead validates on activation, the floating shortcut must follow the same rule.

## 9. Tables

- When tables are introduced, derive them from one shared table pattern.
- Use monospaced numerals for time and measurement columns.
- Do not mix one-off table densities.

## 10. Checkbox, Radio, and Switch Rules

- Use native semantics.
- Keep visible text adjacent to the control.
- Focus must apply at the item container level when the native input receives focus.

## 11. Presentation Controls

- Presentation controls use theme-scoped tokens already defined in CSS.
- Quiet mode may reduce visual intensity but must not reduce contrast below operational clarity.
- Edit/return controls in presentation mode must remain distinct from floating shortcuts from edit mode.
- Do not render edit-mode floating actions inside presentation mode.

## 12. Responsive Breakpoint Logic

- Use the existing viewport logic already expressed in CSS and JS.
- Treat mobile touch ergonomics as first-class.
- Do not move floating actions to center-bottom unless content overlap analysis proves it is better.
- On mobile, preserve safe-area offsets and maintain stable thumb-reachable placement.

## 13. State Rules

- Support `default`, `hover`, `focus-visible`, `active`, `disabled`, `hidden`, `loading`, `error`, and `success` where relevant.
- If a component does not support one of these states, document that explicitly in code or tests.
- Hidden state must not leave dead spacing or invisible tab stops.

## 14. Icons

- Use icons only as reinforcement.
- Do not let icon choice redefine meaning that the label already states clearly.
- Do not introduce an external icon library for a single floating action.

## 15. Charts

- No chart rules are active until charts exist.
- If charts are introduced later, define responsiveness, contrast, and screen-reader labeling before implementation.

## 16. Reuse and Inheritance Expectations

- Shared component improvements must be centralized.
- If two controls share placement, radius, shadow, and motion behavior, they must inherit from one base.
- Do not duplicate JS visibility logic for equivalent triggers when a shared controller can be used.

## 17. Anti-Patterns

- Do not create duplicate visible primary CTAs for the same action without arbitration logic.
- Do not add one-off floating controls with isolated CSS and JS.
- Do not use all-caps labels for new primary floating actions.
- Do not keep edit-mode shortcuts visible in presentation mode.
- Do not introduce a disabled floating action while the inline equivalent remains enabled.
- Do not rely on a play triangle to represent presentation mode entry.
