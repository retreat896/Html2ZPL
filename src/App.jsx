import React, { useEffect } from 'react';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import { initConsoleWrapper } from './utils/ConsoleWrapper';
import { ProjectProvider } from './context/ProjectContext';

function App() {
  useEffect(() => {
    initConsoleWrapper();
    
    // Check for dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <ProjectProvider>
      <Layout />
      <ToastContainer />
    </ProjectProvider>
  );
}

export default App;
