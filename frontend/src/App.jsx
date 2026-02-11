import React, { useEffect } from 'react';
import Layout from './components/Layout';
import MetaTags from './components/common/MetaTags';
import ToastContainer from './components/ToastContainer';
import { initConsoleWrapper } from './utils/ConsoleWrapper';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';

function App() {
    useEffect(() => {
        initConsoleWrapper();

        // Check for dark mode preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <AuthProvider>
            <ProjectProvider>
                <MetaTags />
                <Layout />
                <ToastContainer />
            </ProjectProvider>
        </AuthProvider>
    );
}

export default App;
