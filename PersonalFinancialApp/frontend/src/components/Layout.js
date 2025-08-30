import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { theme } from '../theme';

// Global styles for the entire app
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }
  
  body {
    font-family: ${theme.typography.fontFamily.sans.join(', ')};
    background: ${theme.colors.light.bg};
    color: ${theme.colors.light.text.primary};
    line-height: ${theme.typography.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${theme.colors.light.bg};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.light.border};
    border-radius: ${theme.borderRadius.full};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.neutral[400]};
  }
  
  /* Focus styles */
  *:focus {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }
  
  /* Selection styles */
  ::selection {
    background: ${theme.colors.primary[500]}40;
    color: ${theme.colors.light.text.primary};
  }
`;

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${theme.colors.light.bg};
`;

const MainContent = styled.main`
  flex: 1;
  background: ${theme.colors.light.bg};
  overflow-x: hidden;
  position: relative;
`;

const ContentArea = styled.div`
  padding: ${theme.spacing[6]};
  max-width: 100%;
  
  @media (max-width: 768px) {
    padding: ${theme.spacing[4]};
  }
`;

// Background pattern for visual interest
const BackgroundPattern = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.02;
  background-image: 
    radial-gradient(circle at 25% 25%, ${theme.colors.primary[500]} 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, ${theme.colors.primary[400]} 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
`;

function Layout({ children, sidebar }) {
  return (
    <>
      <GlobalStyle />
      <LayoutContainer>
        <BackgroundPattern />
        
        {/* Sidebar */}
        {sidebar}
        
        {/* Main Content */}
        <MainContent>
          <ContentArea>
            {children}
          </ContentArea>
        </MainContent>
      </LayoutContainer>
    </>
  );
}

export default Layout;