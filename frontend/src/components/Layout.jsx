import React, { useState, useEffect } from 'react';
import Sidebar from './editor/Sidebar';
import Header from './editor/Header';
import Editor from './editor/Editor';
import RightSidebar from './editor/RightSidebar';
import ZplPreviewModal from './editor/ZplPreviewModal';

import { useProject } from '../context/ProjectContext';
import TemplatesView from './dashboard/TemplatesView';

export default function Layout() {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const { currentView } = useProject();

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsLeftSidebarOpen(false);
                setIsRightSidebarOpen(false);
            } else {
                setIsLeftSidebarOpen(true);
                setIsRightSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);
    const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Header toggleLeftSidebar={toggleLeftSidebar} toggleRightSidebar={toggleRightSidebar} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isLeftSidebarOpen} toggleSidebar={toggleLeftSidebar} />

                <div className="flex-1 flex flex-col overflow-hidden">{currentView === 'templates' ? <TemplatesView /> : <Editor />}</div>

                {currentView === 'editor' && <RightSidebar isOpen={isRightSidebarOpen} setIsOpen={setIsRightSidebarOpen} />}
            </div>

            <ZplPreviewModal />
        </div>
    );
}
