---
name: Cinemood
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d4e4fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#4a454e'
  inverse-surface: '#223144'
  inverse-on-surface: '#eaf1ff'
  outline: '#7b757f'
  outline-variant: '#ccc4cf'
  surface-tint: '#6a548a'
  primary: '#6a548a'
  on-primary: '#ffffff'
  primary-container: '#d6bcfa'
  on-primary-container: '#5e497e'
  inverse-primary: '#d5bbf9'
  secondary: '#844e63'
  on-secondary: '#ffffff'
  secondary-container: '#feb9d1'
  on-secondary-container: '#7b465a'
  tertiary: '#1e6b43'
  on-tertiary: '#ffffff'
  tertiary-container: '#8cd7a6'
  on-tertiary-container: '#0c5f38'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eddcff'
  primary-fixed-dim: '#d5bbf9'
  on-primary-fixed: '#250f43'
  on-primary-fixed-variant: '#513c71'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f8b3cb'
  on-secondary-fixed: '#350c1f'
  on-secondary-fixed-variant: '#69374b'
  tertiary-fixed: '#a7f3c0'
  tertiary-fixed-dim: '#8bd7a6'
  on-tertiary-fixed: '#002110'
  on-tertiary-fixed-variant: '#00522f'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d4e4fc'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Quicksand
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base-unit: 8px
  container-padding-mobile: 24px
  container-padding-desktop: 64px
  gutter: 24px
  section-gap: 48px
---

## Brand & Style

The design system is centered on a "Playful Serenity" narrative, specifically tailored for a delightful and stress-free movie-watching experience. The brand personality is gentle, inviting, and whimsical, aiming to evoke a sense of comfort and childlike wonder without appearing immature.

The aesthetic blends **Minimalism** with **Soft-Tactile** influences. It prioritizes vast amounts of whitespace (cream-colored "breathing room") to prevent cognitive load. UI elements should feel like soft, physical objects—pillows or smooth river stones—rather than flat digital constructs. The style avoids all sharp edges, harsh contrasts, and corporate rigidness in favor of a fluid, organic interface that feels approachable and "huggable."

## Colors

The palette is a curated collection of desaturated pastels that function harmoniously rather than competitively. 

- **Primary (Soft Lavender):** Used for main actions, active navigation states, and brand highlights.
- **Secondary (Blush Pink):** Used for favorites, romantic genres, or emotional feedback.
- **Tertiary (Mint Green):** Used for positive indicators, "watched" statuses, or downloads.
- **Accents (Buttery Yellow, Baby Blue, Peach):** Used for genre categorization and playful decorative elements.
- **Base (Cream):** The foundation of the entire UI. Pure white is avoided to reduce eye strain and maintain the warm, "analog" feel.
- **Text (Slate Grey):** High-contrast blacks are replaced with a soft neutral grey to keep the typography legible but gentle.

## Typography

This design system utilizes **Quicksand** exclusively to maintain a cohesive, friendly voice. The rounded terminals of the typeface mirror the roundedness of the UI components.

Headlines should use heavier weights (SemiBold/Bold) with slight negative letter spacing to feel "plump" and impactful. Body text remains at Medium weight (500) rather than Regular (400) where possible to ensure legibility against the pastel backgrounds. All caps should be reserved strictly for small labels or category tags to maintain a non-aggressive tone.

## Layout & Spacing

The layout follows a **Fluid Grid** model with exaggerated margins to emphasize the "Cinemood" sense of calm. 

- **Mobile:** A 4-column grid with 24px side margins. Elements should favor vertical stacking with generous padding between cards (minimum 16px).
- **Desktop:** A 12-column grid with a max-width of 1440px. Gutters are kept wide (24px) to ensure the interface never feels "cramped."
- **Rhythm:** Use an 8px baseline. Vertical rhythm is intentionally loose; headers should have significant clearance from the content above them to create a sense of organized, peaceful discovery.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Ambient Shadows** rather than traditional elevation.

1.  **The Base:** The Cream background (#FFFDF5) acts as the floor.
2.  **The Surface:** White or slightly tinted cards sit atop the base.
3.  **The Shadow:** Shadows must be extremely diffused and low-opacity. Use a "Colored Glow" technique: instead of a black/grey shadow, use a very faint version of the component's own color (e.g., a Lavender button casts a soft Lavender shadow).
4.  **Blur:** Use soft background blurs (10px–20px) for navigation bars to suggest depth while maintaining the pastel color harmony.

## Shapes

The shape language is defined by extreme **Pill-shaped** geometry. 

There are no hard corners in this design system. Standard containers use `rounded-2xl` (1.5rem), while buttons, input fields, and tags always use the `rounded-full` (Pill) treatment. Movie posters and thumbnail images should always have a minimum of 24px corner radius to ensure they integrate softly into the surrounding UI.

## Components

- **Buttons:** Primary buttons are pill-shaped, using a solid pastel fill with a subtle "inner-glow" (a slightly lighter top border) to give them a 3D, tactile feel.
- **Cards:** Movie cards should have no borders. Instead, use a soft background color tint or a very faint ambient shadow to define their edges. 
- **Input Fields:** Search bars and text inputs use a light cream or white fill with a soft 1px border in a slightly darker neutral tint. Focus states should transition the border to the Primary Lavender.
- **Chips/Tags:** Used for movie genres. These are small pill-shaped elements using the quaternary and quinary colors (Yellow, Blue, Peach). Text inside should be `label-sm`.
- **Mood Sliders:** Unique to the app, sliders should use a thick, rounded track with a large, circular "bubble" handle.
- **Icons:** Use thin-line icons with rounded caps (2px stroke). Where possible, use a "duotone" style where a secondary soft-filled shape sits behind the line icon.
- **Lists:** List items should have significant vertical padding (20px+) and be separated by whitespace or extremely faint, short dividers rather than full-width lines.