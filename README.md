# Seattle Indies Expo - SIX 2026 Host Field Guide

A mobile-friendly React reference guide for the SIX 2026 lineup. It includes searchable game cards, release and demo information, trailers, screenshots, an alphabetical index, and downloadable PDF and DOCX versions.

## Run it locally

1. Install Node.js 22 and Python 3.12 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the address shown in the terminal.

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

Netlify's build image includes Python. The repository pins Python 3.12 in
`netlify.toml`, and the converter uses only the standard library, so there are
no Python packages to install.

## Important files

- `public/SIX-2026-Run-of-Show.xlsx` is the source of truth for game and
  production data.
- `scripts/xlsx_to_json.py` validates the workbook and generates app data.
- `src/generated/games.json` and `src/generated/runOfShow.json` are generated;
  do not edit them by hand.
- `src/App.tsx` and `src/RunOfShow.tsx` contain the interfaces, not event data.
- `src/index.css` contains the visual styling and responsive layout.
- `public/SIX-2026-Game-Guide.pdf` is the printable guide.
- `public/SIX-2026-Game-Guide.docx` is the editable document.

## Update event data

1. Edit or download the updated `SIX-2026-Run-of-Show.xlsx` workbook.
2. Replace `public/SIX-2026-Run-of-Show.xlsx` with that file. Keep both the
   `Run of Show` and `descriptions` worksheet names unchanged.
3. Run `npm run data:build` to validate the workbook and regenerate both JSON
   files.
4. Run `npm run check` and `npm run build`.
5. Commit the workbook and generated JSON together, then push. Netlify runs the
   converter again before every deployment.

The `Game ID` column is the stable application identifier. Add one for a new
game using lowercase kebab-case, but do not change an existing ID when a game
name changes. Each game title in `Run of Show` must exactly match a `Name` on
the `descriptions` worksheet; validation reports the worksheet row when data
is missing or invalid.

On `descriptions`, `Platforms` preserves the complete platform list while
`Display Platforms` controls the app's filter chips. `Availability` must be
either `Released` or `Not yet released`. `Official URL` and `Steam App ID` may
be blank; the other columns are required. On `Run of Show`, edits to ordering,
times, hosts, the host-assignment note, and production notes all flow into the
app after regeneration.

Useful commands:

- `npm run data:build` validates XLSX and writes JSON.
- `npm run data:check` validates XLSX and fails if committed JSON is stale.
- `npm run test:data` runs converter tests.
- `npm run check` checks generated data and TypeScript.
- `npm run build` regenerates data and creates the production site.

GitHub Actions runs the data tests, freshness check, and production build on
pull requests and pushes to `main`.

## Verify before the event

Release dates, storefronts, and demo availability can change. Review the lineup against official developer and storefront pages before the event.
