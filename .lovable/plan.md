
# Layout Rearrangement Plan

## Overview
Restructure the dashboard layout to stack all three main sections vertically in a single column, removing the current side-by-side grid arrangement.

## Current Layout
```text
+------------------------------------------+
|  Customer Health Timeline (full width)    |
+------------------------------------------+
|                                          |
| Customer Revenue Drift  |  AI Analysis   |
|    (2 columns)          |  (1 column)    |
|                                          |
+------------------------------------------+
```

## New Layout
```text
+------------------------------------------+
|  Customer Health Timeline (collapsible)   |
+------------------------------------------+
|  Customer Revenue Drift (collapsible)     |
+------------------------------------------+
|  AI Analysis Panel                        |
+------------------------------------------+
```

## Changes Required

### File: `src/pages/Index.tsx`

**Remove the grid container** - The current `<div className="grid gap-8 lg:grid-cols-3">` wrapper will be removed.

**Stack sections vertically** - All three sections will be siblings with consistent `mb-8` spacing:

1. **Customer Health Timeline** (lines 108-120)
   - Keep as-is (already full width, collapsible)
   - Maintain `mb-8` for spacing

2. **Customer Revenue Drift** (lines 125-136)
   - Remove `lg:col-span-2` class
   - Add `mb-8` for spacing below
   - Keep collapsible functionality

3. **AI Analysis Panel** (lines 139-146)
   - Remove the wrapping `<section className="lg:col-span-1">`
   - Keep as a simple section without column constraints

## Summary
- One file modified: `src/pages/Index.tsx`
- Remove 3-column grid layout
- All sections become full-width and stacked vertically
- Collapsible functionality preserved for Health Timeline and Revenue Drift
- AI Analysis remains non-collapsible as designed
