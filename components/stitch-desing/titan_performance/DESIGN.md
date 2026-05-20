---
name: Titan Performance
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#b9c7e0'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d2'
  tertiary: '#ffffff'
  on-tertiary: '#303030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  card-padding: 24px
---

## Brand & Style

The design system is engineered for elite rugby athletes in the high-stakes environment of post-season recovery and gains. The personality is intense, disciplined, and strictly professional. It avoids the "gamified" look of consumer fitness apps in favor of a high-performance dashboard aesthetic found in professional sports analytics.

The visual style is **High-Contrast Modernism**. It utilizes a "Deep Athletic Dark Mode" to reduce eye strain during early morning or late-night sessions while using neon accents to signal energy and critical action points. The interface feels like a precision instrument—rugged enough for the pitch, refined enough for the lab.

## Colors

The palette is built on a foundation of absolute blacks and deep charcoals to create an infinite depth effect.

- **Primary (Neon Green):** Reserved for high-priority status, active states, and "Start Workout" calls to action. It serves as a visual jolt against the dark canvas.
- **Secondary (Slate):** Used for structural elements like borders, dividers, and inactive icons. It provides definition without competing for attention.
- **Surface/Cards:** Layers are built using `#1E1E1E`. This slight elevation from the `#121212` background creates a clear container for data-heavy modules.
- **Success/Warning/Error:** Use variants of the primary neon for success, a muted amber for warning, and a high-saturated crimson for over-training alerts.

## Typography

This design system uses **Inter** for its systematic, neutral, and highly legible qualities at all weights. To emphasize the "High-Performance" aspect, we use **JetBrains Mono** for technical data, rep counts, and timestamps, creating a functional distinction between narrative text and performance metrics.

- **Headlines:** Use Bold or Extra Bold weights with tight letter spacing to create a sense of urgency and power.
- **Data Labels:** Use the mono font in all-caps for technical labels (e.g., "HEART RATE", "MAX VO2").
- **Body Text:** Keep to Regular or Medium weights for clarity against dark backgrounds, ensuring a contrast ratio of at least 7:1 for accessibility.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for desktop (12 columns) and a fluid single-column layout for mobile. 

- **Grid:** On desktop, the content is centered with a max-width of 1280px. 
- **Density:** High. Athletes need to see multiple data points simultaneously. Gutters are kept tight (16px) to maximize the "dashboard" feel.
- **Modular Blocks:** Content is organized into cards. Use the `card-padding` (24px) consistently to ensure that complex charts and tables have enough internal breathing room to remain readable.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows.

1.  **Level 0 (Base):** `#121212` — The fundamental background.
2.  **Level 1 (Surface):** `#1E1E1E` — Used for cards and primary containers.
3.  **Level 2 (Active/Overlay):** `#2A2A2A` — Used for hovered states or modal windows.

**Borders:** Use 1px solid strokes of `#334155` (Slate) to define the edges of cards. For active or selected states, the border should switch to the Primary Neon Green. Shadows should be avoided or kept extremely tight and dark to prevent a "muddy" UI.

## Shapes

The shape language is **Soft (0.25rem / 4px)**. This choice leans into an industrial, professional aesthetic. Sharp enough to feel precise, but slightly rounded to remain modern.

- **Buttons & Inputs:** 4px radius.
- **Cards:** 8px (`rounded-lg`) to provide a distinct containerization for data modules.
- **Charts:** Line charts should use straight segments or very slight curves; avoid overly "bubbly" or organic smoothing.

## Components

- **Buttons:** Primary buttons use a solid Neon Green background with Black text for maximum impact. Secondary buttons use a Slate-700 outline with White text.
- **Cards:** Dark surface (`#1E1E1E`) with a subtle slate border. Group related metrics (e.g., "Load", "Intensity", "Recovery") into single card clusters.
- **Status Toggles:** Oversized and tactile. The "on" state must glow with the Primary Neon Green color.
- **Data Tables:** Use Zebra stripping with `#121212` and `#1E1E1E`. Use "High-Contrast Dots" (Neon Green) to indicate completion or positive performance trends within rows.
- **Line/Bar Charts:** Use Neon Green for the primary data series. Grid lines within charts should be muted Slate at 10-20% opacity.
- **Workload Indicator:** A specialized gauge component using the Primary Neon Green to show where an athlete is in their training cycle relative to their peak.