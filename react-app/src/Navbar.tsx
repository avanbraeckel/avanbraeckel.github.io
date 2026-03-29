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
