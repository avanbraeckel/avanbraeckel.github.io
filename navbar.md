# Simple Full-Width Persistent Navbar (React)

This guide shows how to add a fixed navbar at the top of the page.
It stays visible on every route, and includes a single link: **Home**.

## 1) Create a `Navbar` component

File: `react-app/src/Navbar.tsx`

```tsx
import React from 'react';
import styled from 'styled-components';

const Bar = styled.nav`
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
`;

const Brand = styled.a`
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
`;

const Navbar: React.FC = () => (
  <Bar>
    <Brand href="/">Home</Brand>
  </Bar>
);

export default Navbar;
```

## 2) Remove old CSS file (not needed)

Delete `react-app/src/Navbar.css` and remove any `import './Navbar.css'` reference.

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

## 4) Keep content below navbar

In this variant we use styled component in `App.tsx` and no specific `App.css` override is required, but ensure your content container has `padding-top: 70px` to avoid being hidden behind the fixed navbar.

## 5) Run locally and verify

- `cd react-app`
- `npm start`
- Open `http://localhost:3000`
- The top bar should remain visible while you click Home; `/` is your “Hello World” page.
