Photon by HTML5 UP
html5up.net | @ajlkn
Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)

Demo images courtesy of Unsplash, a radtastic collection of CC0 (public domain) images.


Credits:
	AJ
	aj@lkn.io | @ajlkn

	Demo Images:
		Unsplash (unsplash.com)

	Icons:
		Font Awesome (fontawesome.io)

	Other:
		jQuery (jquery.com)
		Responsive Tools (github.com/ajlkn/responsive-tools)

		---
		## Site Development and Deployment

		This repository now hosts:
		- the new site in `site/` (Next.js + React, exported as static files)
		- the original reports, photos and a copy of the legacy site in `archive/` (not deployed)
		- legacy static website content at the root (`index.html`, `assets/`, etc.) and the old React app in `react-app/`, kept until the migration is signed off

		### 1) Run the site locally

		1. `cd site`
		2. `npm install` (only first time or after `package.json` changes)
		3. `npm run dev`

		Then open: `http://localhost:3000`

		The dev server reloads as you edit. Use npm 10 or newer (check with `npm -v`).

		### 2) Preview the production build locally

		1. `cd site`
		2. `npm run build`
		3. `npm start`

		Then open: `http://localhost:3000`

		This serves exactly what GitHub Pages will serve. Use it to test the in-browser Transient player, since it needs the built files.
		The first build takes a minute or two because it optimizes the images.
		Build output appears in `site/out/`.

		### 3) Run tests and checks

		1. `cd site`
		2. `npm test` (Vitest, single run; `npm run test:watch` to keep it running)
		3. `npm run lint`, `npm run typecheck` and `npm run format:check`

		### 4) Deploy to GitHub Pages via GitHub Actions

		This repository uses GitHub Actions as the live site source (`.github/workflows/deploy.yml`).

		1. In GitHub, go to `Settings` -> `Pages`.
		2. Set `Source` to `GitHub Actions`, then save.
		3. Push to `master`. The workflow builds `site/` and publishes `site/out/`.

		Wait a minute, then visit `https://avanbraeckel.github.io`.
		The old `gh-pages` branch and `npm run deploy` flow are no longer used.

		### 5) Keep old site files safe

		The original reports (as PDFs), full-size photos, the Transient zip and a runnable copy of the legacy site are in `archive/` (see `archive/README.md`).
		The existing website content also remains available on `master` and in `backup-static-site` branch.
		You can restore or repurpose them anytime.
