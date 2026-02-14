import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import Dashboard from './pages/Dashboard';
import TemplatesView from './components/dashboard/TemplatesView';
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
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <ProjectProvider>
                        <MetaTags />
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/templates" element={<TemplatesView />} />
                            {/* <Route path="/editor/new" element={<EditorPage />} />  Removed to let :projectId handle 'new' */}
                            <Route path="/editor/:projectId" element={<EditorPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ProjectProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
