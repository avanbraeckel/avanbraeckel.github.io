# React Overhaul for GitHub Pages Site

This guide explains how to keep your current static site files while launching a new React “Hello World” site on `avanbraeckel.github.io`.

## 1) Backup existing site in Git

1. Ensure clean working tree:
   - `git status`
2. Add and commit any uncommitted local changes:
   - `git add .`
   - `git commit -m "backup: existing static site before React transition"`
3. Create backup branch and push:
   - `git checkout -b backup-static-site`
   - `git push -u origin backup-static-site`
4. Return to main branch:
   - `git checkout master`

## 2) Scaffold React app (keeps existing files intact)

1. Install Node.js (if not installed):
   - `brew install node`
2. Scaffold React in a subfolder:
   - `npx create-react-app react-app`
3. Confirm files exist:
   - `ls react-app` should show `src`, `public`, `package.json`, etc.

## 3) Implement Hello World in React

1. Edit `react-app/src/App.js`:
   ```jsx
   function App() {
     return (
       <div style={{ textAlign: "center", marginTop: "20%" }}>
         <h1>Hello, world!</h1>
       </div>
     );
   }
   export default App;
   ```
2. Optionally simplify `react-app/src/App.css` to contain minimal styling.

## 4) Build and test locally

1. Build inside React folder:
   - `cd react-app`
   - `npm run build`
2. Run local static server (optional):
   - `npm install -g serve`
   - `serve -s build`
3. Open the given local URL and check your “Hello, world!” page.

## 5) Deploy to GitHub Pages (best practice)

### Option A: gh-pages automation

1. In `react-app/package.json`, add:
   ```json
   "homepage": "https://avanbraeckel.github.io",
   "scripts": {
     ...existing scripts...,
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
2. Install deployment helper:
   - `npm install --save-dev gh-pages`
3. Deploy:
   - `npm run deploy`

### Option B: manual root deploy (less safe)

1. Build:
   - `npm run build`
2. Copy `build` output to site root (careful: overwrites root files):
   - `cp -R build/* ../` 
3. Commit/push to `master`:
   - `git add .`
   - `git commit -m "deploy: React Hello World site"
   - `git push origin master`

## 6) Check GitHub Pages settings

1. In GitHub repo Settings > Pages,
   - If you used `gh-pages`, set source to branch `gh-pages`.
   - If you deployed root, set source to `master`/`main` with `/root`.
2. Visit `https://avanbraeckel.github.io` and verify React page loads.

## 7) Keep old content available

- You can revisit the static site branch:
  - `git checkout backup-static-site`
- Copy legacy content to a `legacy/` folder if you want to keep it live alongside React.

## 8) Optional future structure

- `master` can remain React app sources.
- `legacy/` or `backup-static-site` holds old static HTML paths.
- Run `npm run build` and `npm run deploy` from `react-app` for updates.
