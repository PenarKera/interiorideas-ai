# Design System: Cinematic Architectural Excellence

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Monolith"**

This design system is engineered to evoke the precision of high-end architectural renderings and the immersive depth of cinematic title sequences. We are moving away from the "web-as-a-document" mental model toward "web-as-an-environment." 

The system breaks traditional template rigidity through **Bento Grid architecture**, utilizing intentional asymmetry and generous negative space to let architectural imagery breathe. We achieve a premium feel not through decoration, but through the sophisticated manipulation of light, transparency, and "The Monolith" effect—where UI elements feel carved from obsidian and glass rather than painted on a screen.

---

## 2. Colors & Surface Philosophy

The palette is anchored in **Deep Space (#050505)**, providing a high-contrast stage for **Electric Blue (#3B82F6)** accents.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely by:
- **Tonal Shifts:** Transitioning from `surface_container_lowest` (#0E0E0E) to `surface` (#131313).
- **Negative Space:** Utilizing the `20` (7rem) or `24` (8.5rem) spacing tokens to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical glass layers. 
- **Base Layer:** `surface_dim` (#131313).
- **Secondary Containers:** `surface_container_low` (#1C1B1B).
- **Active/Prominent Cards:** `surface_container_high` (#2A2A2A).
By nesting a "High" container within a "Low" section, we create a soft, natural lift that mimics architectural depth without the clutter of shadows.

### Glassmorphism 2.0
For floating navigation, modals, and overlay controls, use the following spec:
- **Background:** `surface` at 0.03 opacity.
- **Blur:** `backdrop-blur: 20px`.
- **Edge:** A "Ghost Border" using `outline_variant` at 15% opacity, 0.5px width.

---

## 3. Typography: Editorial Authority

We use a high-contrast typographic scale to establish an authoritative, editorial voice.

*   **The Hero (Display & Headline):** `Space Grotesk`. Set with a weight of 700 and a tight letter-spacing of `-0.05em`. This creates a "blocked" look that feels intentional and architectural.
*   **The Narrative (Body & Title):** `Inter`. This provides a technical, clean counterpoint to the expressive headlines. 
*   **Hierarchy as Identity:** Use `display-lg` (3.5rem) against `body-sm` (0.75rem) to create dramatic visual tension. This "Size Gap" is a signature of high-end design.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Avoid "Drop Shadows" which feel muddy. Instead, use "Ambient Glows."
- **Ambient Glow:** For elevated states, apply a box-shadow with a 40px blur, using `primary_container` (#78B6FF) at 5% opacity. This mimics the way a light table illuminates a blueprint.

### The Ghost Border Fallback
If a border is required for accessibility in input fields or buttons, use a 0.5px stroke of `outline_variant` (#414750) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons: The Kinetic Trigger
- **Primary:** Background `primary` (#AED0FF), text `on_primary` (#00325A). Shape: `md` (0.375rem). 
- **Interaction:** On hover, apply an **Inner Glow** (inner box-shadow) using `white` at 10% opacity and a subtle staggered fade-in of the label text.
- **Tertiary:** Ghost style. No background, `outline_variant` at 10% opacity for the border.

### Bento Cards
- **Architecture:** Use the Spacing Scale `3` (1rem) for internal padding.
- **Style:** `surface_container_low` with a 0.5px `Ghost Border`. 
- **Forbid Dividers:** Never use `<hr>` tags. Separate content groups using `spacing.6` (2rem).

### Inputs: The Precision Field
- **Base:** `surface_container_lowest` (#0E0E0E).
- **Active State:** Border shifts to `primary` (#AED0FF) at 40% opacity with a subtle `20px` backdrop blur.
- **Label:** `label-sm` in `on_surface_variant`, placed 0.5rem above the field.

### Cinematic Components
- **The Reveal Mask:** Images should use a `clip-path` animation to slide into view, triggered by scroll.
- **Staggered Fade-In:** Groups of cards must fade in with a 50ms stagger and a slight Y-axis shift (10px).

---

## 6. Do’s and Don’ts

### Do:
- **Embrace the Dark:** Use `surface_container_lowest` for the deepest parts of your layout to create a "void" effect.
- **Use Intentional Asymmetry:** In a Bento grid, let one cell span 2 columns while its neighbor spans 1 to create a rhythmic, non-modular feel.
- **Monochromatic Accents:** Keep `Electric Blue` strictly for interactive elements (buttons, active tabs). Everything else stays in the grayscale/tonal range.

### Don’t:
- **Don’t Use Pure White Text:** Use `on_surface` (#E5E2E1) for body text to reduce eye strain and maintain the cinematic mood.
- **Don’t Use Standard Borders:** Avoid 1px #FFFFFF borders. They break the illusion of the "Monolith."
- **Don’t Crowd the Content:** If a layout feels "busy," double the negative space. Architectural luxury is defined by the space you *don't* use.