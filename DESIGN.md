---
name: Technical Fieldbook
description: A product portfolio presented as a clear field log of engineering judgment and evidence.
colors:
  primary: "#082848"
  secondary: "#d8f838"
  tertiary: "#e46e58"
  surface-blue: "#0d304c"
  warm-white: "#f7f7f6"
  muted-text: "#bdcbd1"
  divider-bluegray: "#506b7e"
  rule-bluegray: "#6d7a86"
  plate-silver: "#adb3b3"
typography:
  display:
    fontFamily: '"Chiron Hei HK", Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(2.7rem, 4.58cqw, 4.58rem)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.01em"
  headline:
    fontFamily: '"Chiron Hei HK", Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(2rem, 4vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Chiron Hei HK", Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(3.2rem, 6.5vw, 5.6rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Chiron Hei HK", Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Menlo", "SFMono-Regular", Consolas, ui-monospace, monospace'
    fontSize: "0.78rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  square: "0px"
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0 1.1rem"
    height: "56px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.warm-white}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0 1.1rem"
    height: "56px"
  navigation-link:
    backgroundColor: "transparent"
    textColor: "{colors.warm-white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0"
  question-field:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.square}"
    padding: "0.8rem"
  question-chip:
    backgroundColor: "transparent"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.square}"
    padding: "0.55rem 0.7rem"
  chat-panel:
    backgroundColor: "{colors.surface-blue}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.square}"
    padding: "clamp(1rem, 2.5vw, 1.6rem)"
---

# Design System: Technical Fieldbook

## Overview

**Creative North Star: "Technical Fieldbook"**

The portfolio reads as a field log of engineering judgment. It brings Steven’s Software Engineering Manager role forward, then lets real career and product evidence support the story and lead visitors to a project, resume, or contact path.

Deep ultramarine sheets, chartreuse index marks, coral evidence labels, warm-white type, fine rules, and precise margin marks organize the material. The fieldbook language carries hierarchy and evidence; screenshots remain authentic product surfaces, and every annotation stays tied to something visible on the site.

**Key Characteristics:**

- Role and evidence share the first view, with a spacious split on desktop and a readable stack on mobile.
- Thin rules, small measurement marks, and mono labels create a technical sheet structure.
- Chartreuse carries index and action emphasis; coral identifies screenshot evidence callouts.
- Real product screenshots and verified portfolio content carry the proof.

## Colors

The palette pairs a deep blue field with high-visibility chartreuse, coral evidence marks, warm-white text, and restrained blue-gray rules.

### Primary

- **Deep Ultramarine Field Sheet:** The primary canvas across the homepage and portfolio routes; its broad, uninterrupted area gives the evidence and type room to read.

### Secondary

- **Chartreuse Index:** Ruler numerals, measurement ticks, active or hovered navigation, and the filled primary action. Its visibility comes from targeted use.

### Tertiary

- **Coral Evidence Tick:** Product screenshot labels; use it to call out visible evidence, not as a broad surface.

### Neutral

- **Deep Blue Surface:** A slightly lifted tonal field for the portfolio chat panel.
- **Warm White:** Main headings, body copy, navigation, and outlined actions.
- **Mist Text:** Secondary prose and supporting interface text.
- **Blue-Gray Divider:** Thin boundaries around content and controls.
- **Blue-Gray Rule:** Measurement rules and field guides.
- **Plate Silver:** The fine frame around the product screenshot.

### Named Rules

**The Evidence Color Rule.** Chartreuse marks indices, active states, and the primary action; coral marks screenshot evidence labels. Keep both accents localized.

## Typography

**Display Font:** Chiron Hei HK (fallbacks: Inter, system UI, sans-serif)  
**Body Font:** Chiron Hei HK (fallbacks: Inter, system UI, sans-serif)  
**Label/Mono Font:** Menlo (fallbacks: SFMono-Regular, Consolas, ui-monospace)

**Character:** Chiron Hei HK gives role and section headings a firm, contemporary voice while keeping body copy clear. Menlo supplies the measured, instrument-like layer for navigation, dates, metadata, and annotations.

### Hierarchy

- **Display** (weight 600, fluid desktop size clamp(2.7rem, 4.58cqw, 4.58rem), line-height 0.94): The homepage role headline; mobile uses a viewport-based scale and keeps its three-line lockup.
- **Headline** (weight 700, clamp(2rem, 4vw, 3.2rem), line-height 1.08): Home and route section headings.
- **Title** (weight 700, clamp(3.2rem, 6.5vw, 5.6rem), line-height 0.98): Route-level page titles.
- **Body** (weight 400, 16px, line-height 1.6): General copy; longer route introductions are capped near 68ch.
- **Label** (weight 500, 0.78rem, letter-spacing 0.06em): Mono metadata and small section labels. Measurement labels may use wider tracking.

### Named Rules

**The Field Label Rule.** Use mono for compact metadata, navigation, dates, and measurement labels; keep explanatory paragraphs in the sans family.

## Layout

The homepage uses a role-and-evidence split in its wide first view: role, supporting statement, and actions sit left while one large real product screenshot sits right. The field ruler and baseline frame this composition. This is the homepage signature, not a template for every route.

The site content is capped at 1200px. The homepage hero expands to a 1586px canvas and scales with viewport height. At 900px and below, the header changes to a mobile menu and the hero stacks; the product screenshot switches to its dedicated mobile image and callout labels flow beneath it. At 560px and below, hero actions stack into one column. Content rows and leadership columns also collapse for narrow screens. The page supports a 320px minimum viewport width.

## Elevation & Depth

The system is flat by default. A slightly lighter blue chat surface, 1px rules, and screenshot frames establish separation without structural drop shadows. The composer’s small focus halo is an interaction cue, not a surface elevation.

## Shapes

Corners are square across actions, navigation, the chat panel, and the question composer. Fine 1px borders and separators define edges. Bracket-shaped corner marks and registration crosses use straight strokes and align to the measured sheet structure.

### Named Rules

**The Bracket Rule.** Use crisp corner marks to frame actions and evidence labels; keep their geometry precise and their role tied to navigation or visible evidence.

## Components

### Buttons

Field actions feel direct and legible, with square corners and bracket marks extending beyond the outline.

- **Shape:** Square corners (0px radius), with chartreuse corner brackets.
- **Primary:** Chartreuse fill with ultramarine text; 56px high on the wide hero and padded horizontally.
- **Outline:** Transparent ultramarine fill, chartreuse border, warm-white text.
- **Hover / Focus:** Hover changes the fill and foreground for contrast. Keyboard focus uses a 2px chartreuse outline offset by 4px. The arrow shifts slightly on hover where motion is allowed.

### Chips

- **Style:** Portfolio chat starter questions use a transparent background, 1px blue-gray border, warm-white text, and square corners.
- **State:** Hover turns the border and text chartreuse and adds a subtle chartreuse tint; disabled controls reduce opacity.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** The chat panel uses the deep blue surface over the primary field.
- **Shadow Strategy:** Flat; the panel has no shadow.
- **Border:** 1px blue-gray stroke.
- **Internal Padding:** Fluid padding from 1rem to 1.6rem.

### Inputs / Fields

- **Style:** The portfolio question composer has a square, 1px blue-gray boundary over the primary field.
- **Focus:** Its border changes to chartreuse and receives a 2px chartreuse-tinted focus cue.
- **Error / Disabled:** The send, starter, and retry controls become unavailable during pending or unavailable chat states and use reduced opacity.

### Navigation

Desktop links use Menlo with open tracking, no resting box, and chartreuse hover or active color. At 900px and below, navigation moves behind a square 44px menu button; the expanded panel aligns to the header and separates links with thin rules.

### Signature Component: Evidence Plate

The homepage evidence plate uses the supplied Aeris screenshot at desktop size, a dedicated mobile screenshot on narrow screens, a fine silver frame, and coral labels positioned against visible product content. Preserve the screenshot itself and keep each label factual.

## Do's and Don'ts

### Do:

- **Do** use chartreuse for ruler indexes, active navigation, and primary actions; keep coral callouts tied to visible product evidence.
- **Do** keep mono labels compact and let the main role and paragraph copy use Chiron Hei HK.
- **Do** use the supplied product screenshots as the evidence surface and tie annotations to visible content.
- **Do** keep action and chat controls square, with the mobile hero actions stacked at 560px and below.

### Don't:

- **Don't** invent measurements, career claims, annotations, or product screens.
- **Don't** stretch chartreuse or coral into large page backgrounds.
- **Don't** add rounded card treatments or decorative shadows to the flat field-sheet structure.
