import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorLayout from './components/editor/EditorLayout';
import HomePage from './pages/HomePage';
import TemplatesView from './components/dashboard/TemplatesView';
import MetaTags from './components/common/MetaTags';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';
import { initConsoleWrapper } from './utils/ConsoleWrapper';

function App() {
    useEffect(() => {
        initConsoleWrapper();

    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <ProjectProvider>
                        <MetaTags />
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/templates" element={<TemplatesView />} />
                            <Route path="/editor/:projectId" element={<EditorLayout />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ProjectProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
