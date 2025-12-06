import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';

export default function Header({ toggleSidebar, toggleRightSidebar }) {
    const { project, setIsPreviewOpen, updateProjectMeta, saveProject, loadProject } = useProject();
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState('');

    const handlePreview = () => {
        setIsPreviewOpen(true);
    };

    const startEditing = () => {
        setTempTitle(project.metadata.name);
        setIsEditing(true);
    };

    const saveTitle = () => {
        if (tempTitle.trim()) {
            updateProjectMeta({ name: tempTitle.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    return (
        <header className="flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 shrink-0">
            {/* Left Side: Hamburger (mobile) + Title */}
            <div className="flex items-center gap-3">
                <button id="hamburger-btn" onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i className="fa-solid fa-bars text-xl"></i>
                </button>
                {isEditing ? (
                    <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="text-xl font-semibold text-gray-800 dark:text-white bg-transparent border-b border-blue-500 focus:outline-none"
                    />
                ) : (
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none" onDoubleClick={startEditing} title="Double-click to rename">
                        {project.metadata.name}
                    </h1>
                )}
            </div>

            {/* Right Side: Actions + User */}
            <div id="rightPanel" className="flex items-center gap-4">
                <button
                    onClick={handlePreview}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Preview ZPL
                </button>

                <button
                    onClick={saveProject}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    title="Save Project to ZPL File">
                    <i className="fa-solid fa-download"></i>
                    Save
                </button>

                <label
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                    title="Open Project from ZPL File">
                    <i className="fa-solid fa-upload"></i>
                    Open
                    <input
                        type="file"
                        accept=".zpl,.txt"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    loadProject(ev.target.result);
                                };
                                reader.readAsText(file);
                                e.target.value = null; // Reset input
                            }
                        }}
                    />
                </label>

                <button className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Share
                </button>

                {/* GitHub Link */}
                <a
                    href="https://github.com/retreat896/html2zpl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                    title="View on GitHub">
                    <i className="fa-brands fa-github text-xl"></i>
                </a>
            </div>
        </header>
    );
}
