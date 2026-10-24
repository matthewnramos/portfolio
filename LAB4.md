# Lab 4 handoff

Assignment: <https://dsc106.com/labs/lab04/>

## Implemented

- `lib/projects.json` contains 12 projects with numeric years across 2024–2026.
- `global.js` exports `fetchJSON`, `renderProjects`, and `fetchGitHubData`.
- The Projects page renders all records from JSON and computes its heading count.
- The homepage renders the first three records using the same renderer with `h3` headings under its `h2` section heading.
- The homepage fetches public repositories, public gists, followers, and following for `matthewnramos` from GitHub's API.
- Loading, empty, and error states provide feedback; a failed GitHub request does not prevent projects from loading.
- Existing navigation, saved themes, and contact behavior remain available.
- Script and stylesheet URLs use `?v=lab4-ordered` to avoid mixing cached Lab 3 files with Lab 4 modules. Every reference to `global.js` uses the same version so it initializes only once per page. Update this version together across HTML and JavaScript imports when releasing future code changes.

## Verification

- JavaScript syntax and JSON data checks passed.
- Browser checks confirmed 12 cards on Projects, three on Home, working local images, live API counts, and the correct navigation state under the `/portfolio/` path.
- Desktop and 390px mobile layouts were inspected, including light and dark themes; neither page overflowed horizontally at the mobile size.
- Isolated function checks covered HTTP errors, malformed JSON, offline requests, empty lists, repeated rendering without duplicates, heading validation, missing fields, and site-relative image paths.

## Content choices to review

- The entries are ordered Project 1, Project 2, Labs 1–4, other portfolio projects, and placeholders. The first three entries are Project 1, Project 2, and Lab 1. The first three JSON records always appear on the homepage; reorder them to feature other work.
- Lab dates use 2026, matching this repository's history.
- RateMyProfessor and BuildVCT retain the existing descriptions and use **2026**, confirmed by Matthew.
- Four entries remain explicitly labeled placeholders. Their 2024 and 2025 years are sample data, not claims about completed work. The assignment permits placeholders and requires varied years for the next lab.
- Project 2 uses its original chart as a local thumbnail and links to <https://gyjdb.github.io/dsc106-project2/>. Project 1 describes the grocery-store food-processing comparison from the supplied screenshot and includes the chart-only thumbnail approved for public publishing by Matthew. Other placeholder images remain available locally.

## Preview and publish

From the repository folder, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/>. Use an HTTP server rather than opening the HTML as a local file, because modules and JSON loading require HTTP.

After reviewing the content, push the Lab 4 commit to `main` using GitHub Desktop or `git push origin main`. Check the Pages deployment in GitHub Actions, then open the live site and verify that it shows the new stats and project list.

- Repository: <https://github.com/matthewnramos/portfolio>
- Expected GitHub Pages URL: <https://matthewnramos.github.io/portfolio/> (verify in repository Settings → Pages).

## Tasks you must do

1. Review the placeholders and featured project order.
2. Follow at least three classmates on GitHub and ask them to follow you back, as requested in Step 3.0. The new stats display the API's actual counts; they are not hardcoded.
3. Changes are published to GitHub Pages. Verify the live site before recording.
4. Record a narrated **MP4 of 60 seconds or less**, capturing your computer screen. Submit it with both the repository and website links in the course submission system.

## Suggested recording outline (about 55 seconds)

- **0–15 seconds:** Show the homepage, scroll to GitHub Stats and Latest Projects, and explain that the profile counts come from the API and only three projects appear here.
- **15–25 seconds:** Click Projects and show the computed “12 Projects” heading and the full list loaded from JSON.
- **25–40 seconds:** Open `lib/projects.json` in your editor. Briefly change a title, save, and refresh the Projects page and homepage to demonstrate shared data. Restore the title afterward. Prepare the editor and browser in advance to keep this quick.
- **40–55 seconds:** Share the most interesting thing you personally learned. One possible topic is how a single reusable renderer keeps two pages consistent. Then answer a Think About It question, such as the one below.

**Think About It: Why clear the container before rendering?**

The function may run more than once. Clearing the container removes the previous cards so the new render replaces them instead of duplicating them. In this implementation, `replaceChildren()` performs that reset.

Alternative: **Why use `type="module"`?** It enables `import` and `export` so both page scripts can reuse the functions in `global.js`. Modules also support the top-level `await` used here.

Explain the code in your own words, and choose a learning takeaway that reflects your own experience.
