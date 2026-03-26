# Simple Full-Width Persistent Navbar (React)

This guide shows how to add a fixed navbar at the top of the page.
It stays visible on every route, and includes a single link: **Home**.

## 1) Create a `Navbar` component

File: `react-app/src/Navbar.tsx`

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

## 2) Add navbar styles

File: `react-app/src/Navbar.css`

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

body {
  margin: 0;
  padding-top: 50px; /* move page content below navbar */
}
```

## 3) Use `Navbar` in `App`

Edit: `react-app/src/App.tsx`

```tsx
import React from 'react';
import Navbar from './Navbar';
import './App.css';

function App() {
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

## 4) Optional: keep content below navbar

Add to `App.css`:

```css
.app-content {
  padding-top: 20px;
}
```

## 5) Run locally and verify

- `cd react-app`
- `npm start`
- Open `http://localhost:3000`
- The top bar should remain visible while you click Home; `/` is your “Hello World” page.
