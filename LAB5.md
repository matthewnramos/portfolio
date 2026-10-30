# Lab 5 handoff

Assignment: <https://dsc106.com/labs/lab05/>

The Projects page now uses D3 7.9.0 to group the existing JSON records by year, draw SVG pie slices, and render a matching legend with counts. Searching updates the chart and cards immediately and searches all project metadata without case sensitivity. Slice and legend selection toggle a year filter. The older placeholder projects and their sample years remain explicitly labeled.

## Combined-filter fix

The tutorial's search and year handlers each render their own subset of the full data. The second handler replaces the first handler's results without preserving its filter.

In `projects/projects.js`:

- Lines 13–14 store the search query and selected year independently.
- Lines 18–20 update the year and call `updateProjects()`.
- Lines 70–77 search first, filter those search results by the selected year, and render that intersection.
- Line 83 charts the search results before year filtering, keeping the other matching years available for selection.
- Lines 91–93 update the query and call the same updater.

Selection stores a year value rather than a slice index. Search can remove or reorder the slices without changing which year is selected. If the selected year has no search matches, the page retains both filters, shows zero results, and offers Clear filters.

## Verification

- PASS: Initial render shows 12 cards and year counts 2026: 8, 2025: 1, 2024: 3, matching `lib/projects.json`.
- PASS: Searching JavaScript then clicking the 2026 slice retains two results, rather than restoring all eight projects in that year.
- PASS: Selecting 2024 with Enter then searching 11 yields one result; selecting 2026 then searching JavaScript yields two.
- PASS: Changing the search with an active year, unmatched searches, deselection, and Clear filters produce the expected results without duplicating cards, paths, or legend items.
- PASS: A 390px viewport has a 390px document width. The chart stacks above the legend. Light and dark themes render successfully; controls have visible keyboard focus.
- PASS: JavaScript syntax, `git diff --check`, and browser error-log checks passed.

## Video

`deliverables/lab05-walkthrough.mp4` is a 57.03-second MP4 with synthetic Samantha narration, captured webpage interactions, and a readable explanation of the actual source lines. It demonstrates both filter orders, explains the tutorial bug, and highlights using a visualization both as a summary and as an input control. The video is a submission artifact, not a webpage asset. A full decode verified all 1,710 video frames and the AAC audio track without errors.

Preview from the repository with `python3 -m http.server 8000 --bind 127.0.0.1`, then open <http://127.0.0.1:8000/projects/>.

## Design verification

Existing direction: Matthew's portfolio uses system typography, blue navigation accents, readable project cards, and a theme selector. The chart uses three stable colors for the three year categories, plus pink for selection. The side-by-side chart and legend follow the lab and stack on mobile. Spacing separates the overview, search, and results. The short opacity transition shows which wedge is hovered and respects reduced motion. Energy 1, rhythm 1, motion 1 reflect the existing portfolio.

- Hard gate PASS: Existing real data and labeled placeholders; functioning controls; loading, empty, and error messages; no mobile overflow in the checked viewport; keyboard and both themes verified.
- Purpose gate PASS: Color identifies years and selection; the chart/legend layout supports comparison; existing typography and cards preserve the portfolio's presentation; motion communicates hover.
- Liveliness PASS: The chart is the overview focal point; the established blue accent and project grid remain consistent with the portfolio; spacing separates its controls and output.
- Craftsmanship PASS: Combined filters, count updates, stable year selection, repeated rendering, and recovery from no results were exercised in the browser.

## Submission

Upload the MP4 attachment to the course submission page along with the repository and published webpage links. No course submission has been made from this workspace.
