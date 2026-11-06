# Lab 6 handoff

Assignment: <https://dsc106.com/labs/lab06/>

The new `meta/` page includes six code statistics, a D3 scatterplot of commit date versus time of day, commit tooltips with GitHub links, square-root circle sizing, rectangular brushing, a selection count, and a language breakdown. Smaller circles render above larger circles. Clicking a dot or pressing Enter or Space toggles its selection; Escape and Clear selection reset it.

## Preview and refresh

Run `npm ci` once to install the development dependency. Run `npm start`, then open <http://127.0.0.1:8000/meta/>.

Run `npm run analyze` after committing code changes to refresh `meta/loc.csv`. Keep this CSV in Git. `node_modules/` is ignored.

The refresh command runs the lab's elocuent analyzer with two-space indentation in a temporary checkout of the latest commit. This avoids treating unfinished edits as a `0000000` commit or generating nonexistent GitHub commit links. It leaves the working tree intact and removes its temporary checkout afterward. The CSV describes surviving HTML, CSS, and JavaScript lines in the analyzed revision, rather than all edits ever made.

The deployed snapshot is from `db830d3` and includes the Lab 6 implementation: 1,508 lines, 13 commits, ten files, an average file length of 150.8 lines (displayed as 151), a longest line of 265 characters, and a maximum indentation depth of 12. Future commits need another `npm run analyze` refresh.

## Walkthrough

`deliverables/lab06-walkthrough.mp4` is a 48.11-second, 1440 by 1080 MP4 with captured browser interactions and synthetic Samantha narration. It follows the lab's requested order: present the visualization, demonstrate interactions, then explain a useful takeaway about square-root scales. It shows the earlier `e1a3e4b` snapshot, before the deployment refresh added Lab 6's own code. The video file is a submission artifact, rather than a website asset. Its full H.264 video and AAC audio streams decoded without errors (1,442 frames).

Narration:

1. This Meta page summarizes the code behind my portfolio. Six statistics describe the analyzed snapshot. Below, each dot is a commit. The horizontal axis shows the date, and the vertical axis shows the time of day. Dot area represents lines of code.
2. Selecting a dot reveals its date, time, author, and line count, with a link to GitHub. Smaller dots are drawn last so they stay reachable when commits overlap.
3. Dragging a rectangle selects several commits. The selected dots turn pink, and the language breakdown updates with counts and percentages for those commits. Clear selection resets the chart.
4. One useful takeaway is why circle sizes need a square root scale. Radius grows with the square root of the line count, so area stays proportional. A linear radius would exaggerate larger commits.

Review the narration before submitting, particularly the final takeaway. Course submission is separate from website deployment.

## Verification

- PASS: `npm run analyze` generated a CSV containing only repository source paths and real commit IDs, with no dependency files or uncommitted placeholder IDs.
- PASS: Independently recomputed the displayed statistics from the CSV.
- PASS: A brush around the four late-October evening commits selected four dots and showed JavaScript: 251 lines (55.3%), CSS: 154 (33.9%), HTML: 49 (10.8%), matching an independent CSV calculation.
- PASS: Dot clicks, repeated Enter and Space toggles, Escape, Clear selection, single-line commits, and hover/focus tooltip content behaved correctly in Chrome.
- PASS: The 390px mobile view fit its viewport, reflowed navigation and statistics, and supported tapping a commit. The chart rendered in both light and dark themes.
- PASS: Temporarily serving an empty CSV showed the empty state; a missing CSV showed recovery messages. Restored the real CSV and verified a successful reload.
- PASS: All five internal navigation destinations returned HTTP 200. Shared module versions match across pages and their imports, so a page loads navigation once.
- PASS: JavaScript syntax checks and whitespace checks for the new changes passed. Two existing trailing-space lines in `projects/projects.js` were preserved with the user's earlier edits.

## Design verification

Direction: an analytical portfolio page for visitors interested in the source code, using the existing system typography, blue accent, theme selector, and restrained spacing. Energy 1, rhythm 1, motion 1 follow the established portfolio. Pink and a dashed outline mark selected data; blue marks ordinary data. The scatterplot is the focal point. Whitespace separates statistics, instructions, the plot, and selection results. A short hover transition provides feedback and respects reduced motion. The tooltip shadow distinguishes a floating detail panel from page content. No new imagery or decorative assets were needed.

- Hard gate PASS: Real Git data and requested navigation; no fabricated claims or assets; functioning controls; loading, empty, and error states; mobile layout, keyboard selection, visible focus, and both themes checked. Text contrast calculations ranged from 4.94:1 to 14.48:1 for page colors, and from 5.17:1 to 5.75:1 for tooltip links.
- Purpose gate PASS: Blue preserves the site's identity, pink plus a dashed stroke identifies selection, faint horizontal grid lines support time comparisons, the tooltip shadow conveys elevation, and brief motion marks hover. No unrelated cards, icons, badges, gradients, or illustrations were added.
- Liveliness PASS: Explicit 1/1/1 dials match the existing site; the commit plot supplies the focal point, blue is the deliberate accent, navigation and typography repeat the portfolio's visual language, and section spacing follows the task's sequence.
- Craftsmanship PASS: Recorded selection, tooltip, reset, and proportional-size interactions; verified the computed counts, responsive layout, themes, failure recovery, script syntax, and video export. New styles are scoped to the Meta chart and its supporting components.
