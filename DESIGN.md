---
name: Architectural Minimalism
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#44474a'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#75777a'
  outline-variant: '#c5c6ca'
  surface-tint: '#5d5e61'
  primary: '#000101'
  on-primary: '#ffffff'
  primary-container: '#1a1c1e'
  on-primary-container: '#838486'
  inverse-primary: '#c6c6c9'
  secondary: '#53625c'
  on-secondary: '#ffffff'
  secondary-container: '#d3e3dc'
  on-secondary-container: '#576660'
  tertiary: '#000101'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1d1b'
  on-tertiary-container: '#828583'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e5'
  primary-fixed-dim: '#c6c6c9'
  on-primary-fixed: '#1a1c1e'
  on-primary-fixed-variant: '#454749'
  secondary-fixed: '#d6e6df'
  secondary-fixed-dim: '#bacac3'
  on-secondary-fixed: '#111e1a'
  on-secondary-fixed-variant: '#3b4a45'
  tertiary-fixed: '#e1e3e0'
  tertiary-fixed-dim: '#c5c7c4'
  on-tertiary-fixed: '#191c1b'
  on-tertiary-fixed-variant: '#444746'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-padding: 80px
---

## Brand & Style
This design system is built upon the principles of organic minimalism and architectural precision. It targets a sophisticated audience that values transparency, high-trust interactions, and quiet luxury. The emotional response should be one of calm authority and effortless clarity.

The aesthetic direction avoids the "loud" trends of consumer tech in favor of a tactile, editorial feel. It utilizes a disciplined geometric layout, generous negative space, and a focus on structural integrity. Instead of relying on simulated depth through shadows, the system uses "planar layering"—defining hierarchy through color blocks, 1px borders, and deliberate spatial overlaps. The result is a UI that feels constructed rather than just rendered, evoking the stability of modern architecture.

## Colors
The palette is grounded in a high-contrast relationship between deep charcoals and soft, warm off-whites. This provides a "paper-like" quality that is easier on the eyes than pure white (#FFFFFF).

- **Primary (Deep Charcoal):** Used for typography, primary icons, and structural 1px borders to ground the layout.
- **Secondary (Muted Sage):** A refined accent used sparingly for meaningful highlights, active states, and success indicators. It provides an "organic" counterpoint to the rigid geometry.
- **Tertiary (Warm Slate/Greige):** Used for secondary UI elements, inactive states, and subtle background partitions.
- **Neutral (Off-White):** The canvas color, providing a soft, sophisticated backdrop that enhances the architectural feel.

Color application should be flat. Use subtle shifts between Neutral and Tertiary to define different functional areas rather than gradients or shadows.

## Typography
The typography strategy relies on the tension between the high-contrast, editorial Serif (Bodoni Moda) and the precise, technical Sans (Hanken Grotesk).

- **Headlines:** Use Bodoni Moda for all major headings. It provides the "luxury" and "architectural" character. Keep weight at Medium (500) to ensure the hairlines of the glyphs remain crisp.
- **UI & Body:** Hanken Grotesk is the workhorse. It should be used for all functional UI components, data, and long-form body text. 
- **Hierarchy:** Use all-caps with generous letter-spacing for labels (Label-MD) to create a sense of navigational order.
- **Alignment:** Stick to a strict left-aligned grid. Avoid justified text.

## Layout & Spacing
The layout philosophy is rooted in a **Fixed Grid** for desktop and a **Fluid Grid** for mobile. It uses a 12-column system that prioritizes white space as a functional element rather than "empty" space.

- **Margins:** Large outer margins (64px on desktop) are essential to maintain the "high-trust" architectural feel. 
- **Rhythm:** All vertical spacing should be multiples of the 4px base unit. Section headers should be followed by significant padding (Section-Padding) to allow the content to "breathe."
- **Geometric Alignment:** Elements should be snapped to the grid with 1px borders used to separate columns or rows where visual distinction is required.
- **Breakpoints:**
  - Mobile (<768px): 4 columns, 20px margins.
  - Tablet (768px - 1024px): 8 columns, 40px margins.
  - Desktop (>1024px): 12 columns, 64px margins, 1280px max content width.

## Elevation & Depth
This design system rejects traditional box-shadows. Instead, depth is communicated through **planar layering** and **tonal shifts**.

- **Level 0 (Base):** The primary neutral background.
- **Level 1 (Panels):** Elements that sit on the base use a Tertiary color fill or a 1px Primary color border. 
- **Level 2 (Interaction):** When an element is focused or active, it does not "rise" via shadow. Instead, it changes its border weight or shifts its background color to a slightly darker or more saturated hue (e.g., from Neutral to Tertiary).
- **Transparency:** Use backdrop blurs (Glassmorphism) only for global navigation bars to maintain context of the content beneath, but keep the opacity high (90%+) to maintain the "solid" architectural feel.

## Shapes
Shapes in this design system are predominantly rectangular to reinforce the geometric, architectural theme.

- **Corner Radius:** A "Soft" (0.25rem) radius is used for interactive elements like buttons and input fields to prevent the UI from feeling aggressive or "sharp."
- **Cards & Containers:** Should remain at the base roundedness (0.25rem) or even 0px (Sharp) for large layout sections. 
- **Interactive States:** Avoid pill-shapes. The geometry should remain consistent across all states to maintain a professional, grounded appearance.

## Components

### Buttons
- **Primary:** Deep Charcoal background, Off-White text. No shadow. 1px border of the same charcoal color to ensure crispness.
- **Secondary:** Transparent background, 1px Deep Charcoal border, Deep Charcoal text.
- **Tertiary/Ghost:** No border, Muted Sage text, uppercase label with spacing.

### Input Fields
- **Styling:** 1px Tertiary border that shifts to Primary (Charcoal) on focus. Background is slightly off-white to distinguish from the base canvas.
- **Typography:** Labels use the `label-sm` style, positioned strictly above the field.

### Cards
- **Construction:** No shadows. Use a 1px Tertiary border or a flat Tertiary background fill.
- **Padding:** Generous internal padding (minimum 24px) to ensure content doesn't feel cramped.

### Chips & Tags
- **Styling:** Rectangular with a 1px border. Background matches the Tertiary color. Font is `label-sm`.

### Lists & Tables
- **Dividers:** 1px Tertiary horizontal lines only. No vertical dividers between columns unless data density is extremely high.
- **Hover States:** Subtle background color shift to the Tertiary shade.

### Navigation
- **Global Header:** Minimalist, using the `label-md` style for links. High-opacity backdrop blur (0.9) to allow content to scroll underneath without losing legibility.