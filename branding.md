# Zephra — Neuromarketing Brand System v1.0

> An all‑in‑one platform for launching, scaling, and growing businesses through intelligent digital‑marketing automation.

---

## 1) Brand Essence

**Promise:** Turn ideas into growth on autopilot.

**Positioning:** Premium, trustworthy automation that thinks ahead and markets for you.

**Personality (Big 3):**

* **Competence** (credible, precise, trustworthy)
* **Excitement** (innovative, energetic, forward‑moving)
* **Sophistication** (elevated, tasteful, effortless)

**Tone of Voice:** Crisp, confident, optimistic; minimal buzzwords; verbs over adjectives.

**One‑liner:** *“Zephra moves your growth forward—quietly, intelligently, and fast.”*

---

## 2) Color System (Neuromarketing‑driven)

> Built to signal competence + innovation, deliver high legibility, and drive action. Use the exact HEX values below across web, product, and print.

### 2.1 Primary Palette (Core Identity)

* **Zephra Electric (Azure)** — `#2F80FF`

  * Primary brand hue; evokes trust, clarity, intelligence.
* **Zephra Ultra (Violet)** — `#7B61FF`

  * Signals innovation, creativity, premium tech.
* **Zephra Depth (Indigo/Navy)** — `#0D1B2A`

  * Anchoring base for backgrounds, conveys stability/competence.

**Signature Gradient:** *Zephra Flow* — `linear-gradient(135deg, #2F80FF 0%, #7B61FF 40%, #A26BFF 100%)`

**Usage ratio (light mode):**

* Depth 50–60% (backgrounds/sections)
* Electric 20–25% (brand, charts, links)
* Ultra 10–15% (accents, gradients)
* Neutrals 10–15%

### 2.2 Action & Feedback Colors

* **Primary CTA (Action Blue):** `#2F80FF` on Depth `#0D1B2A` or on **Cloud** `#F5F7FF`.
* **Success (Growth Teal):** `#16C79A`
* **Warning (Amber):** `#FFC145`
* **Danger (Crimson):** `#E23D3D`
* **Info (Cyan):** `#2EC9FF`

### 2.3 Neutrals / Surfaces

* **Obsidian (Text)** — `#0B0F19`
* **Slate** — `#243447`
* **Mist** — `#E9EEF7`
* **Cloud (UI Surface)** — `#F5F7FF`
* **Pure White** — `#FFFFFF`

### 2.4 Dark Mode Mapping

* Background: `#0B0F19`
* Cards: `#0F1420`
* Text: `#F2F5FF`
* Primary CTA: `#7B61FF` (hover `#8D74FF`)
* Links: `#2F80FF`

### 2.5 Data‑Viz Mini Palette

* Series 1: `#2F80FF`
* Series 2: `#7B61FF`
* Series 3: `#16C79A`
* Series 4: `#FFC145`
* Series 5: `#E23D3D`
* Background gridlines: `#E9EEF7`

### 2.6 Accessibility & Contrast (quick rules)

* Minimum text contrast AA: 4.5:1 (body), 3:1 (large text).
* Prefer **Electric** text on **Cloud**, **Ultra** accents on **Depth**. Avoid gray‑on‑gray.
* For CTAs: prioritize **contrast** and recognizable affordance over specific hue folklore.

---

## 3) Logo System

**Concept:** *The Breath/Flow Mark* — a forward‑tilted “Z” drawn as a continuous, curved airstream (wind ribbon) that carries motion + ease. The curves signal safety and approachability; the forward tilt implies momentum.

### 3.1 Components

* **Sigil:** Continuous ribbon “Z,” 9° forward tilt, rounded terminals.
* **Wordmark:** Custom grotesk with gentle curvature on diagonals of “Z,” open apertures in “e,” “a,” and a distinctive hooked “r.”

### 3.2 Construction

* **Proportions:** Height = 1×; Width = 0.66× of the height for the central diagonal; ribbon thickness = 1/9 of mark height.
* **Clearspace:** 0.5× logo height on all sides.
* **Minimum size:** 24 px (sigil), 80 px (lockup) on screens; 10 mm (print).

### 3.3 Color Lockups

* **Primary:** Sigil in *Zephra Flow* gradient on white/Cloud.
* **Mono Light:** Pure white on Depth.
* **Mono Dark:** Obsidian on Cloud.

### 3.4 Don’ts

* No drop shadows or bevels.
* Don’t rotate backward (kills momentum).
* Don’t recolor the sigil outside brand palette.
* Don’t stretch or outline the mark.

---

## 4) Typography

**Goals:** high legibility (speed), premium feel, and a hint of technical precision.

* **Display / Headlines:** *Space Grotesk* (600/700)

  * Geometric yet warm; pairs with the curved sigil.
* **UI / Body:** *Inter* (400/500/600)

  * Optimized for screens, excellent readability.
* **Code / Metrics:** *Geist Mono* (500)

**Fallback stacks:**

* Display: `"Space Grotesk", "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif`
* Body: `Inter, "SF Pro Text", Roboto, Arial, sans-serif`

**Type Rules:**

* Headlines tight (-2% tracking), body +1% tracking.
* Line lengths: 48–72ch body; 24–40ch for landing page hero copy.
* Use numeric tabular figures in pricing/metrics.

---

## 5) UI System (atoms → patterns)

### 5.1 Buttons

* **Primary:** Filled, 12px radius, 16px vertical padding.

  * Default: Electric (#2F80FF) text on white in light mode; in dark mode, Ultra (#7B61FF) text on Depth.
  * Hover: +8% lightness.
  * Focus: 2px focus ring in #2EC9FF at 3:1 contrast.
* **Secondary:** Outline with 1.5px Electric stroke; hover fills 8% tint.
* **Tertiary:** Text‑only with underline on hover.

### 5.2 Cards

* Elevation via soft shadow `0 10px 30px rgba(9, 12, 20, .18)` and a 1px hairline border `rgba(255,255,255,.06)` in dark mode.

### 5.3 Forms

* 12px radius inputs, 1.5px border in Mist, focus to Electric.
* Labels 13–14px / 600 weight; helper text 12–13px / 400.

### 5.4 Navigation

* Sticky top bar on scroll; translucency blur 12px over Depth.
* Active state underline 3px in Electric.

---

## 6) Motion Language (the “Breath”)

* **Principles:** Ease‑out; subtle inertia on entrances; never bounce.
* **Durations:** 200–300ms micro; 400–600ms macro.
* **Examples:**

  * Sigil gently “breathes” 1.5% scale in 3s loop on idle.
  * Gradient shimmer on CTA (300ms) on hover.
  * Scroll‑reveals: 20px translate‑Y + 10% opacity → 0.

---

## 7) Imagery & Art Direction

* Abstract wind/flow fields, volumetric light, soft particles; cool spectrum with hints of violet.
* Product imagery: clean dashboards with generous negative space, composited in subtle depth of field.
* Avoid stock clichés; show outcomes (growth curves, pipeline clarity) not people staring at screens.

---

## 8) Messaging Framework

* **Hero:** “Your marketing, fully orchestrated.”
* **Subhead:** “Ads, funnels, email & SMS—planned, produced, and optimized by AI.”
* **Three pillars:** *Launch faster. Scale smarter. Spend better.*
* **Proof hooks:** time‑to‑launch, CAC reduction, ROAS lift, pipeline velocity.
* **CTAs:** “Start orchestrating” (primary), “See it build a campaign” (secondary).

---

## 9) Layout System (Web)

* 12‑column grid, 80–96px gutters at desktop; 16–24px on mobile.
* Hero height 80–90vh; keep H1 ≤ 7 words.
* Section rhythm: 120–160px vertical spacing.
* Use depth layers: background flow field → gradient wash → content card.

---

## 10) Social & Ad Templates

* **Banner:** Big wordmark; Flow gradient band; right‑side product mock; Depth background.
* **Post system:** Duotone imagery (Electric + Ultra) with bold 3–5 word headline.
* **Short‑video bumper:** 1.0s ribbon‑Z sweep reveal → headline → dashboard sizzle.

---

## 11) Sample CSS Tokens

```css
:root{
  --z-depth:#0D1B2A; --z-electric:#2F80FF; --z-ultra:#7B61FF;
  --z-obsidian:#0B0F19; --z-cloud:#F5F7FF; --z-mist:#E9EEF7;
  --z-success:#16C79A; --z-warning:#FFC145; --z-danger:#E23D3D; --z-info:#2EC9FF;
  --radius-12:12px; --elev:0 10px 30px rgba(9,12,20,.18);
}
.btn-primary{background:var(--z-electric); color:#fff; border-radius:var(--radius-12)}
.card{box-shadow:var(--elev); border:1px solid rgba(255,255,255,.06)}
```

---

## 12) Validation & Testing Plan

* **Accessibility:** Audit color contrast; keyboard focus orders; dark‑mode parity.
* **Behavioral:** A/B test CTA hue vs background for highest contrast CTR; headline length ≤ 7 words; motion timing.
* **Implicit:** 5‑second logo recall test; semantic‑differential surveys (competent/exciting/sophisticated scales).
* **Analytics:** Track *time‑to‑first‑action*, click depth, demo starts.

---

## 13) What to Build Next

1. Finalize sigil & wordmark vectors (mono + gradient).
2. Export brand kit (SVG, PDF, PNG, Figma styles, CSS tokens).
3. Produce social kit (banner, avatar, post templates, video bumper).
4. Apply system to landing page + product UI.

— End —
