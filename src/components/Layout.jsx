import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Editor from './Editor';
import RightSidebar from './RightSidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsRightSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsRightSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);

  return (
    <div className="flex h-full w-full h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header toggleSidebar={toggleSidebar} toggleRightSidebar={toggleRightSidebar} />
        
        <div className="flex-1 flex overflow-hidden">
          <Editor />
          <RightSidebar isOpen={isRightSidebarOpen} toggleRightSidebar={toggleRightSidebar} />
        </div>
      </div>
    </div>
  );
}
