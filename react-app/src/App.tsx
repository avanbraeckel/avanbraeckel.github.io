import React from 'react';
import styled from 'styled-components';
import Navbar from './Navbar';

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
    <>
      <Navbar />
      <Content>
        <h1>Under construction!👷🏻‍♂️</h1>
      </Content>
    </>
  );
}

export default App;
