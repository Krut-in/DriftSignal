
# Color Enhancement Plan

## Overview
Add three distinctive accent colors to elevate the dashboard's visual appeal while maintaining the existing warm corporate aesthetic and semantic risk colors.

## Proposed Color Palette

### The Three Accent Colors

| Color | Name | HSL Value | Usage |
|-------|------|-----------|-------|
| **Accent 1** | Ocean Teal | `175 65% 35%` | Main heading, primary brand element |
| **Accent 2** | Burnt Copper | `25 75% 50%` | KPI card icons, interactive highlights |
| **Accent 3** | Slate Indigo | `235 35% 45%` | Section headers, collapsible triggers |

These colors are:
- Unique and sophisticated (not standard blue/green/red)
- Complementary to the existing navy/cream/amber palette
- Accessible with good contrast ratios

## Where Colors Will Be Applied

### Accent 1: Ocean Teal
- Main app header icon background
- "Revenue Drift Intelligence" title accent

### Accent 2: Burnt Copper  
- KPI card icon backgrounds (replacing neutral gray)
- Adds warmth and visual interest to key metrics

### Accent 3: Slate Indigo
- Collapsible section header backgrounds
- Creates visual hierarchy without overwhelming

## Implementation Details

### File 1: `src/index.css`
Add three new CSS custom properties:

```css
/* Light mode */
--accent-teal: 175 65% 35%;
--accent-copper: 25 75% 50%;
--accent-indigo: 235 35% 45%;

/* Dark mode variants */
--accent-teal: 175 55% 45%;
--accent-copper: 25 70% 55%;
--accent-indigo: 235 40% 55%;
```

### File 2: `tailwind.config.ts`
Extend the colors object:

```typescript
accent: {
  teal: "hsl(var(--accent-teal))",
  copper: "hsl(var(--accent-copper))",
  indigo: "hsl(var(--accent-indigo))",
}
```

### File 3: `src/pages/Index.tsx`
- Change header icon background: `bg-accent-teal`
- Change collapsible triggers: `bg-accent-indigo/10` with `text-accent-indigo` for icon

### File 4: `src/components/revenue/KPICard.tsx`
- Change icon container: `bg-accent-copper/15` with `text-accent-copper`

### File 5: `src/components/revenue/AIAnalysisPanel.tsx`
- Lightbulb icon: `text-accent-copper` (ties AI insights to KPIs visually)

## What Stays Unchanged
- Risk colors (red/amber/green) - these have semantic meaning
- Text colors and backgrounds - maintains readability
- Card and border styles - keeps clean aesthetic

## Visual Impact Summary

| Element | Before | After |
|---------|--------|-------|
| App header icon | Navy background | Teal background |
| KPI icons | Gray background | Copper/bronze tint |
| Collapsible headers | Plain card | Subtle indigo accent |
| AI panel icon | Default gray | Copper highlight |

This approach uses color sparingly at key focal points rather than throughout, creating visual hierarchy without overwhelming the data-focused interface.
