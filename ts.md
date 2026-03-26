# Recreate React App with TypeScript (step-by-step)

Use this guide when you want the `react-app` project to be TypeScript-based.

## 1) Backup and cleanup existing React app

```bash
cd /Users/austin/Code/avanbraeckel.github.io
# optional backup branch for the old react-app state
git checkout master
git checkout -b backup-react-app
git add react-app
git commit -m "backup: existing react-app before TypeScript migration"
git push -u origin backup-react-app

# back on master to do rebuild:
git checkout master
rm -rf react-app
```

## 2) Create new TypeScript React app

```bash
npx create-react-app react-app --template typescript
```

This creates `react-app/` with .tsx source files and TypeScript config.

## 3) Confirm TypeScript files exist

```bash
ls react-app/src
# should include App.tsx, index.tsx, react-app-env.d.ts, etc.
```

## 4) Add the Hello World component

Edit `react-app/src/App.tsx` to something simple:

```tsx
import React from 'react';
import './App.css';

function App(): JSX.Element {
  return (
    <div className="App">
      <h1>Hello, world!</h1>
    </div>
  );
}

export default App;
```

## 5) Add navbar in TypeScript

1. Create `react-app/src/Navbar.tsx`:

```tsx
import React from 'react';
import './Navbar.css';

const Navbar: React.FC = () => (
  <nav className="navbar">
    <a className="navbar-brand" href="/">
      Home
    </a>
  </nav>
);

export default Navbar;
```

2. Use in `App.tsx`:

```tsx
import React from 'react';
import Navbar from './Navbar';
import './App.css';

function App(): JSX.Element {
  return (
    <>
      <Navbar />
      <main className="app-content">
        <h1>Hello, world!</h1>
      </main>
    </>
  );
}

export default App;
```

## 6) Add CSS for persistent top navbar

Create `react-app/src/Navbar.css`:

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background-color: #282c34;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1000;
}

.navbar-brand {
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
}

.app-content {
  padding-top: 70px;
}
```

## 7) Local run and quick test

```bash
cd react-app
npm install
npm start
```

Open `http://localhost:3000` and confirm you see the nav bar and Hello World.

## 8) Deployment setup (gh-pages)

1. Install and configure in `react-app/package.json`:

```json
"homepage": "https://avanbraeckel.github.io",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

2. Install dependency:

```bash
cd react-app
npm install --save-dev gh-pages
```

3. Deploy:

```bash
npm run deploy
```

## 9) Configure GitHub Pages source

- On GitHub -> Settings -> Pages
- Branch: `gh-pages`, Folder: `/ (root)`
- Save and wait a couple minutes
- Visit `https://avanbraeckel.github.io`

## 10) Commit changes

```bash
git add react-app ts.md navbar.md
git commit -m "migrate React app to TypeScript and add docs"
git push origin master
```
