# Lab 8 recording

Assignment: <https://dsc106.com/labs/lab08/>

Start the portfolio with `npm start`, then open <http://127.0.0.1:8000/meta/>. Scroll through the commit descriptions: the sticky scatter plot updates to show commits through each date. The sliders use the same cutoff for the chart, statistics, and file visualization.

The data describes lines surviving in the analyzed Git snapshot, attributed to their commits. It does not reconstruct deleted or replaced lines from older versions.

## Recording script (about 50 seconds)

Record your laptop screen and speak as you demonstrate these steps. Keep the entire video under one minute, as required by the lab.

1. **0–25 seconds: scroll through the story.** “This is the evolution of my portfolio. As I scroll through these commit descriptions, the scatter plot updates to include commits through that point in time. The horizontal axis shows the commit date, the vertical axis shows the time of day, and larger circles represent more surviving lines. The circles animate as the filtered history changes.”
2. **25–40 seconds: scroll to the file visualization and move its slider.** “Below the story is a unit visualization. Each dot represents one line of code, and its color indicates the language. Files are sorted by their line counts, so I can see which files contribute the most at the selected date.”
3. **40–55 seconds: explain your takeaway.** Use your own takeaway. One option, if it matches what you learned: “The most interesting thing I learned was why keyed data joins matter. Using each commit ID as the key lets D3 reuse the same circle when I filter, which makes the animation stable.”

## Implementation and checks

- Lab steps 1–3: time filtering, stable keyed circle joins, CSS entry and position/radius transitions, sorted file units colored by language, and Scrollama-driven commit descriptions.
- Both sliders remain synchronized. Selection and language breakdown operate on visible commits. Reduced-motion preferences disable circle transitions.
- Existing system typography, blue accent, and light/dark theme are retained. The two-column story keeps the chart alongside each commit; smaller screens stack the chart above the narrative. Generous step spacing gives each commit time to cross the scroll trigger. Motion explains changing data rather than decorating the page. Dials: energy 1, rhythm 2, motion 2.
- PASS: DOM checks verified slider endpoints and intermediate cutoffs, one persistent SVG and keyed circle identity, file sorting and colors, keyboard selection/clearing, scroll callback updates, empty data, and invalid-data messages.
- PASS: JavaScript syntax and whitespace checks on the changed Lab 8 source; local Meta route returns HTTP 200; pinned Scrollama CDN module returns HTTP 200.
- Browser visual QA remains unverified because computer-use browser access was unavailable. DOM checks used a Scrollama callback stub and do not verify actual viewport intersection or CSS rendering.

No video has been recorded or submitted by this change.
