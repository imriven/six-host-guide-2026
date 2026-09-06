# Seattle Indies Expo - SIX 2026 Host Field Guide

A mobile-friendly React reference guide for the SIX 2026 lineup. It includes searchable game cards, release and demo information, trailers, screenshots, an alphabetical index, and downloadable PDF and DOCX versions.

## Run it locally

1. Install [mise](https://mise.jdx.dev/), then open a terminal in this folder.
2. Run `mise install` to install the pinned Node.js, npm, Python, and uv versions.
3. Run `npm install`.
4. Run `uv pip install --python .venv/bin/python -r requirements.txt`.
5. Run `npm run dev`.
6. Open the address shown in the terminal.

`npm run dev` validates the workbook and regenerates the app data before Vite
starts.

## Publish with Netlify

1. Push this project to GitHub.
2. In Netlify, choose **Add new project** and then **Import an existing project**.
3. Choose GitHub and select `imriven/six-host-guide-2026`.
4. Netlify will read `netlify.toml` automatically.
5. Confirm the build command is `npm run build` and the publish directory is `dist`.
6. Choose **Deploy**.

Future changes pushed to the GitHub repository will automatically trigger a new Netlify deployment.

Netlify's build image includes Python. The repository pins Node.js 24.20.0 and
Python 3.14.7 in `netlify.toml`; `package.json` pins npm 11.19.0 and every npm
dependency; and `requirements.txt` pins the complete Python dependency set.
Netlify installs those dependencies before running the build. The XLSX
converter itself uses only the Python standard library.

## Important files

- `public/SIX-2026-Run-of-Show.xlsx` is the source of truth for game and
  production data.
- `scripts/xlsx_to_json.py` validates the workbook and generates app data.
- `src/generated/games.json` and `src/generated/runOfShow.json` are generated;
  do not edit them by hand.
- `scripts/build_ros_docx.py` and `scripts/build_ros_pdf_only.py` generate the
  downloadable run-of-show documents from the workbook.
- `public/SIX-2026-Run-of-Show.docx` and
  `public/SIX-2026-Run-of-Show.pdf` are generated; do not edit them by hand.
- `src/App.tsx` and `src/RunOfShow.tsx` contain the interfaces, not event data.
- `src/index.css` contains the visual styling and responsive layout.
- `public/SIX-2026-Game-Guide.pdf` is the printable guide.
- `public/SIX-2026-Game-Guide.docx` is the editable document.

## Update event data

1. Edit or download the updated `SIX-2026-Run-of-Show.xlsx` workbook.
2. Replace `public/SIX-2026-Run-of-Show.xlsx` with that file. Keep both the
   `Run of Show` and `descriptions` worksheet names unchanged.
3. Run `npm run build`. This validates the workbook, regenerates both JSON
   files and both run-of-show documents, runs the converter tests and
   TypeScript checks, and builds the site.
4. Commit the workbook and locally generated files together, then push.
   Netlify regenerates them again before every deployment.

Files generated during a Netlify build are included in that deployment but are
not committed or pushed back to GitHub. A local `npm run build` updates the
tracked generated files in your working tree so they can be committed when
desired.

Game names link the worksheets: each scheduled game row in `Run of Show` must
use the exact `Name` from `descriptions` in its `GAME / BREAK` cell. Games may
be left out of the schedule, but a scheduled game may appear only once. Move
those rows to reorder the show. When renaming a scheduled game, update its name
on both worksheets; validation reports duplicate or mismatched names before
the build. Opening and closing rows are optional, but duplicates are rejected.
Titles containing `Sponsor Segment` are treated as sponsor/ad rows, and titles
ending in `Video` or `Videos` are treated as prerecorded showcase rows.

On `descriptions`, `Platforms` preserves the complete platform list while
`Display Platforms` controls the app's filter chips. `Availability` must be
either `Released` or `Not yet released`. `Official URL` and `Steam App ID` may
be blank; the other columns are required. On `Run of Show`, edits to ordering,
times, hosts, the host-assignment note, and production notes all flow into the
app after regeneration. Host identifiers such as `A` are expanded to the names
in the `Host A = ...` assignment note in generated JSON, documents, and the
website; descriptive values such as `Prerecorded` and `All Hosts` are retained.

Useful commands:

- `npm run build` is the normal all-in-one local command.
- `npm run dev` regenerates data and starts the local development server.
- `npm run documents:build` regenerates only the run-of-show DOCX and PDF.
- `npm run data:check` is the CI-oriented freshness check for committed JSON.

GitHub Actions runs the data tests, freshness check, and production build on
pull requests and pushes to `main`.

## Verify before the event

Release dates, storefronts, and demo availability can change. Review the lineup against official developer and storefront pages before the event.
