import React, { useEffect } from 'react';
import Layout from './components/Layout';
import MetaTags from './components/common/MetaTags';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';
import { initConsoleWrapper } from './utils/ConsoleWrapper';

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
            <ToastProvider>
                <ProjectProvider>
                    <MetaTags />
                    <Layout />
                </ProjectProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
