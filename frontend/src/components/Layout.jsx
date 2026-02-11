import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Editor from './Editor';
import RightSidebar from './RightSidebar';
import ZplPreviewModal from './ZplPreviewModal';

import { useProject } from '../context/ProjectContext';
import TemplatesView from './TemplatesView';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { currentView } = useProject();

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Header toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                <div className="flex-1 flex flex-col overflow-hidden">{currentView === 'templates' ? <TemplatesView /> : <Editor />}</div>

                {currentView === 'editor' && <RightSidebar />}
            </div>

            <ZplPreviewModal />
        </div>
    );
}
