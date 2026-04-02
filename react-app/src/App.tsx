import React from 'react';
import styled from 'styled-components';
import Navbar from './Navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import TransientPage from './TransientPage';

const NoMatch: React.FC = () => (
  <div>
    <h1>404 - Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

const Content = styled.main`
  padding-top: 70px;
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
`;

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/transient" element={<TransientPage />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </Content>
    </BrowserRouter>
  );
}

export default App;
