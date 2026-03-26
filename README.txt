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
		## React App Development and Deployment

		This repository now hosts:
		- legacy static website content at the root (`index.html`, `assets/`, etc.)
		- a React app in `react-app/`

		### 1) Run React app locally

		1. `cd react-app`
		2. `npm install` (only first time or after `package.json` changes)
		3. `npm start`

		Then open: `http://localhost:3000`

		### 2) Build React app for production

		1. `cd react-app`
		2. `npm run build`

		Build output appears in `react-app/build/`.

		### 3) Deploy to GitHub Pages via `gh-pages`

		This repository uses the `gh-pages` branch as the live site source.

		1. Ensure `react-app/package.json` includes:
			- `"homepage": "https://avanbraeckel.github.io"`
			- `"predeploy": "npm run build"`
			- `"deploy": "gh-pages -d build"`
		2. `cd react-app`
		3. `npm install --save-dev gh-pages` (once)
		4. `npm run deploy`

		After deployment, GitHub Pages serves the generated files from `gh-pages`.

		### 4) Confirm GitHub Pages settings

		1. In GitHub, go to `Settings` -> `Pages`.
		2. Set `Branch` to `gh-pages` and `Folder` to `/ (root)`.
		3. Save. Wait a minute, then visit `https://avanbraeckel.github.io`.

		### 5) Keep old site files safe

		The existing website content remains available on `master` and in `backup-static-site` branch.
		You can restore or repurpose them anytime.
