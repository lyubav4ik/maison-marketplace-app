---
name: Aura Couture
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#111111'
  on-primary: '#ffffff'
  primary-container: '#262626'
  on-primary-container: '#8e8d8c'
  inverse-primary: '#c8c6c5'
  secondary: '#5f5e5d'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfdd'
  on-secondary-container: '#636261'
  tertiary: '#220b04'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a1f15'
  on-tertiary-container: '#ad8475'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1c1c'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e5e2e0'
  secondary-fixed-dim: '#c8c6c4'
  on-secondary-fixed: '#1b1c1b'
  on-secondary-fixed-variant: '#474745'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ebbcac'
  on-tertiary-fixed: '#2e150b'
  on-tertiary-fixed-variant: '#603f33'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  button:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is engineered for a premium female fashion e-commerce experience that feels like a private digital boutique. The brand personality is sophisticated, poised, and understated, targeting a discerning audience that values quality over trends.

The visual style is **High-End Minimalism** mixed with **Editorial Elegance**. It utilizes generous whitespace (negative space) to allow product photography to breathe, treating each item as a piece of art. The interface should evoke an emotional response of calm, exclusivity, and confidence. Interaction patterns should be fluid and intentional, avoiding unnecessary clutter or aggressive sales triggers.

## Colors

The palette relies on a "Quiet Luxury" foundation. 

- **Primary (Deep Charcoal):** Used for primary typography, icons, and high-emphasis buttons. It provides a more sophisticated contrast than pure black.
- **Secondary (Soft Beige):** Used for large surface areas, subtle section backgrounds, and decorative containers to soften the "Crisp White" base.
- **Tertiary (Muted Terracotta):** An accent color used sparingly for calls to action, price highlights, or specific status indicators to provide a warm, feminine touch.
- **Neutral (Crisp White):** The core canvas color, ensuring the interface remains bright and airy.

All interactive states for the primary color should transition to a slightly desaturated version of the terracotta to maintain the premium feel.

## Typography

This design system uses a classic serif-on-sans pairing to establish hierarchy and prestige.

- **Headlines (Playfair Display):** Should be used for editorial headings, product names, and section titles. The "Display" weight is reserved for hero sections and large marketing banners.
- **Body & UI (Montserrat):** A geometric sans-serif that provides modern clarity for product descriptions, navigation, and functional labels. 
- **Language Optimization:** All fonts must support the Cyrillic character set. For Russian text, ensure line-height is slightly increased for body text to maintain readability across longer word lengths typical of the language.
- **Special Treatment:** Use `label-caps` for category navigation and small metadata to create an organized, architectural feel.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main content container is capped at 1440px to preserve the editorial composition on ultra-wide monitors.

- **Grid:** Use a 12-column grid for desktop with 24px gutters. For mobile, shift to a 2-column or 1-column layout depending on the product card density.
- **Rhythm:** Spacing should be generous. Use 64px or 80px vertical margins between major homepage sections to enforce the "High-end Boutique" feel.
- **Safe Zones:** Content should never feel cramped against the screen edges. Mobile margins are set to 16px, but for editorial sections, 24px is preferred.

## Elevation & Depth

To maintain a modern, flat aesthetic, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Use the secondary "Soft Beige" to differentiate background sections from "Crisp White" product cards. 
- **Borders:** Use delicate, 1px borders in a light charcoal (10% opacity) for input fields and card separators.
- **Active States:** Subtle 4px blur shadows are only permitted on hover for interactive cards to provide a "lifted" tactile response without breaking the minimalist aesthetic.
- **Overlays:** Use a 40% opacity Charcoal backdrop for modals and side-drawers (like the shopping cart) to focus the user's eye.

## Shapes

The shape language is **Rounded**, balancing the sharp precision of minimalist grids with the soft, approachable nature of fashion.

- **Primary Roundedness:** 0.5rem (8px) for buttons and input fields.
- **Image Containers:** Product images should maintain a sharp or very subtly rounded (4px) corner to keep the professional photography feel.
- **Decorative Elements:** Use pill-shaped badges for "New Arrival" or "Sold Out" tags to contrast against the structured grid.

## Components

- **Buttons:** Primary buttons are solid Charcoal with White text, using the `button` typography style. Secondary buttons are outlined with a 1px border. The "Add to Cart" button on product pages may use the Terracotta accent for prominence.
- **Product Cards:** Clean vertical layout. High-quality image occupies 80% of the card height. Product title in Playfair Display (small), price in Montserrat (medium). Use a subtle fade-in effect on hover to show an alternative product angle.
- **Input Fields:** Minimalist design with only a bottom border or a very light 4-sided border. Labels should use the `label-caps` style for a professional, form-driven look.
- **Lists & Filtering:** Use a side-drawer for filters on mobile and a top horizontal bar on desktop. Use "Soft Beige" chips for active filters.
- **Shopping Bag:** A sleek right-side drawer that slides in, utilizing the full height of the screen to display large item thumbnails and a clear checkout path.
- **Breadcrumbs:** Small `label-caps` text in desaturated charcoal to help navigation without distracting from the main visuals.