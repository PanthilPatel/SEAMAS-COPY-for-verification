---
name: Luminous Control Matrix
colors:
  surface: '#f9f9ff'
  surface-dim: '#c8dbfb'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d4e3ff'
  on-surface: '#071c34'
  on-surface-variant: '#464554'
  inverse-surface: '#1f314a'
  inverse-on-surface: '#ebf1ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#00658e'
  on-secondary: '#ffffff'
  secondary-container: '#74caff'
  on-secondary-container: '#005477'
  tertiary: '#a41992'
  on-tertiary: '#ffffff'
  tertiary-container: '#c33aad'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#c7e7ff'
  secondary-fixed-dim: '#84cfff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6c'
  tertiary-fixed: '#ffd7f0'
  tertiary-fixed-dim: '#fface8'
  on-tertiary-fixed: '#3a0032'
  on-tertiary-fixed-variant: '#840076'
  background: '#f9f9ff'
  on-background: '#071c34'
  surface-variant: '#d4e3ff'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.02em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes an ultra-refined, luminous command environment tailored for mission-critical multi-agent AI orchestration. Moving deliberately away from the fatigue of dark-mode operations centers, it introduces an airy, high-precision atmosphere reminiscent of modern aerospace glass cockpits and advanced analytical research labs.

The aesthetic fuses **Precision Minimalism** with technical **Blueprint Architectural Detailing**. It communicates absolute operational clarity, instantaneous telemetry feedback, and rigorous institutional trust. Interfaces are defined by pure white elevated instrumentation planes hovering over an atmospheric, cool sky-tinted canvas, structured by delicate technical grids and high-acuity typography. The sensory response is calm, calculating, pristine, and authoritative.

## Colors
The palette balances an atmospheric, high-luminance canvas with intense, functional color coding:

- **Canvas & Backgrounds:** The base environment transitions across soft sky-tinted gradients from `#f3fbff` to `#e7f3ff`. Pristine floating surfaces utilize pure `#ffffff`.
- **Primary Accent (`#6366f1`):** Electric indigo serves as the command anchor, reserved for primary operational intents, selected states, and core system actions.
- **Secondary Accent (`#0e7fb0`):** Tuned deep cyan with strict contrast-compliance, driving agent state telemetry, operational routing, and live process links.
- **Tertiary Accent (`#a1148f`):** Vivid deep magenta utilized for swarm arbitration, anomaly flagging, and synthesis triggers.
- **Neutrals & Text:** Primary text sits at deep near-navy (`#0c2038`) for razor-sharp readability. Secondary metadata and labels use muted slate-navy (`#3d5b7d`), while tertiary parameters, inactive icons, and ghost gridlines use crystalline steel (`#7893b2`).
- **Semantic Accents:** Status feedback incorporates strict operational emerald (`#059669`) for stable consensus and warning amber (`#d97706`) for resource saturation and human-in-the-loop alerts.

## Typography
The typographic hierarchy creates clear cognitive boundaries between system structure, natural language deliberation, and telemetry telemetry data:

1. **Display & Headlines (Space Grotesk):** Provides mechanical, forward-leaning architectural personality. Structural letterforms anchor dashboards, stream headers, and operational status tiers.
2. **Body & Prose (Inter):** Highly legible, neutral workhorse engineered for agent conversational transcripts, system logs, prompt formulation, and configuration summaries.
3. **Labels & Data Telemetry (JetBrains Mono):** Monospaced characters with tabular figures ensure real-time latency readouts, token usage counters, hexadecimal IDs, and system coordinates remain aligned and immediately scannable without layout shifting.

## Layout & Spacing
The layout leverages a responsive 12-column fluid grid system configured to house dense technical monitoring data and dynamic agent stream sidebars:

- **Desktop (>= 1280px):** 12-column system, `1.5rem` gutters, and `3rem` margins. Three-zone orchestration layout: docked agent fleet matrix (left), active mission visualizer (center), and live event log / parameter inspector (right).
- **Tablet (768px - 1279px):** 8-column layout, `1.25rem` gutters, and `2rem` margins. Side panels fold into collapsable drawers with floating quick-switch dock pills.
- **Mobile (< 768px):** 4-column layout, `1rem` gutters, and `1rem` margins. The operational views stack vertically, prioritizing active agent status pills and bottom-anchored executive control bars.

A faint structural background blueprint pattern—composed of intersecting isometric or hexagonal lines rendered in `rgba(14, 111, 160, 0.04)` at 32px intervals—anchors the canvas, emphasizing spatial organization and systematic discipline.

## Elevation & Depth
Elevation mimics stacked physical acrylic and translucent silicon instrumentation cards suspended over a backlit analytical surface:

- **Ground Base Canvas:** Luminous sky-tinted white gradient (`#f3fbff` to `#e7f3ff`) layered with faint technical coordinate guidelines.
- **Level 1 (Structural Containers & Cards):** Opaque pure white (`#ffffff`) surfaces surrounded by a crisp hairline border of `1px solid rgba(14, 111, 160, 0.15)`. Supported by an atmospheric cyan-tinted drop shadow: `0 4px 20px -2px rgba(14, 111, 160, 0.08), 0 2px 6px -1px rgba(14, 111, 160, 0.04)`.
- **Level 2 (Popovers, Menus, Hover States):** Surface pure white with subtle cyan edge-highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.8)`). Elevated cyan shadow: `0 12px 32px -4px rgba(14, 111, 160, 0.14), 0 4px 12px -2px rgba(14, 111, 160, 0.06)`.
- **Level 3 (Modal Overlays & System Interventions):** Crisp elevated white panels over a subtle, desaturated sky-tinted backdrop blur (`backdrop-filter: blur(8px); background: rgba(243, 251, 255, 0.65)`). Border: `1px solid rgba(14, 111, 160, 0.25)`. Shadow: `0 24px 48px -8px rgba(14, 111, 160, 0.18)`.

## Shapes
The shape system employs crisp, architectural geometry with intentional, measured softness (Level 1: Soft). This reflects professional software designed for technical confidence rather than playful consumer trends.

- Standard UI cards, data nodes, and input fields use `0.25rem` (4px) corner radii to maintain tight, architectural alignment.
- Action tags, agent identity chips, and operational badges scale slightly up to `0.5rem` (8px, `rounded-lg`) for tactile separation from structural panels.
- Micro elements such as status indicators and toggle nodes rely on geometric circles or crisp squares with 1px chamfered aesthetics to signify raw system logic.

## Components

### Buttons
- **Primary:** Solid `#6366f1` background, `#ffffff` text, 1px border of `rgba(255, 255, 255, 0.2)`. Hover state deepens to `#4f46e5` with subtle indigo glow `0 0 16px rgba(99, 102, 241, 0.35)`.
- **Secondary (Telemetry/Action):** White background, `#0e7fb0` text, border `1px solid rgba(14, 111, 160, 0.25)`. Hover: background shifts to `rgba(14, 111, 160, 0.05)`.
- **Destructive/Intervention:** Translucent soft red tint `rgba(239, 68, 68, 0.08)`, border `1px solid rgba(239, 68, 68, 0.3)`, text `#b91c1c`.

### Chips & Agent Status Badges
- Compact height (24px), font: `label-mono-sm`.
- Background: pure white with `1px solid rgba(14, 111, 160, 0.18)`.
- Preceded by a 6px status LED: solid green pulse (`#059669`) for active processing, steady amber (`#d97706`) for waiting on human feedback, and deep cyan (`#0e7fb0`) for idle/ready.

### Input Fields & Controls
- Background: `#ffffff`, text: `#0c2038`, font: `body-md`.
- Border: `1px solid rgba(14, 111, 160, 0.2)`. Placeholder: `#7893b2`.
- Focus state: border shifts to `#6366f1` with an outer ring `0 0 0 3px rgba(99, 102, 241, 0.15)`.

### Cards & Telemetry Pods
- Background: `#ffffff`, padding: `space-md` to `space-lg`.
- Border: hairline `1px solid rgba(14, 111, 160, 0.15)`.
- Header section separated by a horizontal divider line of `rgba(14, 111, 160, 0.08)`. Headers combine Space Grotesk section titles with monospace performance indices on the right.

### Checkboxes & Radios
- Box/Circle: pure white background with `1px solid rgba(14, 111, 160, 0.35)`.
- Checked: `#6366f1` fill with sharp white SVG check icon or inner pip.

### Specialized Agent Mesh Nodes
- Floating graph or diagram modules featuring dual-state borders: idling in `rgba(14, 111, 160, 0.2)` and activating in `#6366f1` or `#a1148f` depending on swarm arbitration role.