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
`;

function App() {
  return (
    <>
      <Navbar />
      <Content>
        <h1>Hello, world!</h1>
      </Content>
    </>
  );
}

export default App;
