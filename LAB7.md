# Lab 7 handoff

Assignment: <https://dsc106.com/labs/lab07/>

- Published map: <https://matthewnramos.github.io/bikewatching/>
- Separate repository: <https://github.com/matthewnramos/bikewatching>
- Local project: `/Users/matthew/Documents/GitHub/bikewatching`
- Recording script: `bikewatching/WALKTHROUGH.md` in the separate repository.
- Draft video: `deliverables/lab07-walkthrough.mp4` in this portfolio repository.

The map includes the Mapbox basemap, Boston and Cambridge bike-lane layers, a keyed D3 SVG station overlay aligned with pan/zoom/resize, square-root marker sizing, station tooltips, a time slider, midnight wrapping, minute buckets, three traffic-flow colors, and a swatch legend. The portfolio entry includes a real screenshot and a link to the new site, and appears first in Latest Projects.

## Data and checks

The supplied data contains 261,687 rides and 453 station records. All-day traffic joins to 414 stations with 250,444 departures and 249,975 arrivals. Endpoints whose IDs are missing from the station file cannot be located and are excluded from mapped counts. The README documents this distinction.

Five Node tests pass. Independent calculations agree with the JavaScript implementation for all-day, 8 AM, 6 PM, and midnight views. Browser testing covered time filtering, changing marker sizes and colors, pan/zoom, reset, station tooltips, keyboard pinning, both midnight slider endpoints, Any time, and a 390px mobile layout with tap details. A temporary fixture server verified empty and missing-data messages and recovery. Normal data was restored, and the live map loaded successfully from the portfolio link.

The first GitHub push was rejected by push protection because it flagged the public Mapbox token. The unpublished commit was replaced with token-free source. The token is supplied through the encrypted `MAPBOX_PUBLIC_TOKEN` GitHub Actions secret, and the build generates the browser configuration in `dist/`. Local `config.js` and `dist/` are ignored. GitHub Pages publishes the generated artifact; no protection bypass was used. The Actions test, build, and deploy jobs passed. Live HTML, scripts, styles, station metadata, and generated configuration matched the tested files.

## Video

The draft MP4 is 45.25 seconds, 1920 by 1080, with captured browser interactions and synthetic Samantha narration. It presents the map and legend, demonstrates zoom/pan and station details, changes the time filter from morning to evening, resets to Any time, and explains minute buckets with midnight filtering. A full decode verified 1,356 video frames and the AAC audio stream without errors. Sample frames were visually inspected.

Review the video and takeaway before submitting. The separate repository's `WALKTHROUGH.md` provides words and screen actions for recording your own version. No course submission has been made.

## Design delivery checks

- Hard gate PASS: Real sourced data, working links and controls, labelled slider, loading/empty/error states, visible keyboard focus, 390px layout and touch details checked. Page text contrast is at least 4.94:1, with tooltip text at least 7.58:1. The screenshot and video have fixed dimensions.
- Purpose gate PASS: The light basemap supports reading the overlays; three colors encode flow, green encodes bike lanes, circle area encodes traffic, and a tooltip shadow marks elevation. Hover feedback respects reduced motion.
- Liveliness PASS: Energy 1, rhythm 1, motion 1 preserve the portfolio's existing system typography, blue accent, and restrained spacing. The standalone map is the focal point; header controls stack and the legend wraps on mobile.
- Craftsmanship PASS: Data calculations, edge-case tests, browser interactions, failure recovery, production deployment, and the video export were verified. The portfolio retains its established layout, with the project data and screenshot added through the existing renderer.
