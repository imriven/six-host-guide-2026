# Seattle Indies Expo - SIX 2026 Host Field Guide

A mobile-friendly React reference guide for the SIX 2026 lineup. It includes searchable game cards, release and demo information, trailers, screenshots, an alphabetical index, and downloadable PDF and DOCX versions.

## Run it locally

1. Install Node.js 22 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the address shown in the terminal.

## Publish with Netlify

1. Push this project to GitHub.
2. In Netlify, choose **Add new project** and then **Import an existing project**.
3. Choose GitHub and select `imriven/six-host-guide-2026`.
4. Netlify will read `netlify.toml` automatically.
5. Confirm the build command is `npm run build` and the publish directory is `dist`.
6. Choose **Deploy**.

Future changes pushed to the GitHub repository will automatically trigger a new Netlify deployment.

## Important files

- `src/App.tsx` contains the game information and interface.
- `src/fullDescriptions.ts` contains the long game descriptions.
- `src/index.css` contains the visual styling and responsive layout.
- `public/SIX-2026-Game-Guide.pdf` is the printable guide.
- `public/SIX-2026-Game-Guide.docx` is the editable document.
- `public/SIX-2026-Run-of-Show.xlsx` contains the production run of show on its
  first tab and the app's game metadata on its `descriptions` tab.

## Regenerate the spreadsheet

Run `python scripts/build_ros_xlsx.py` from the repository root. The script
preserves the existing `Run of Show` tab and adds or replaces the
`descriptions` tab using the game data currently stored in `src/App.tsx` and
`src/fullDescriptions.ts`. It uses only the Python standard library.

## Verify before the event

Release dates, storefronts, and demo availability can change. Review the lineup against official developer and storefront pages before the event.
