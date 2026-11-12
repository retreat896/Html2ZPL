import React, { useState, useRef, useEffect } from 'react';
import { ActionIcon, Menu, SegmentedControl, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function Header({ toggleLeftSidebar, density, setDensity }) {
    const { project, setIsPreviewOpen, loadProject, saveStatus } = useProject();
    const { user, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    // Close mobile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handlePreview = () => {
        setIsPreviewOpen(true);
    };

    return (
        <>
            <header className="flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 shrink-0">
                {/* Left Side: Hamburger (mobile) */}
                <div className="flex items-center gap-3">
                    <button id="hamburger-btn" onClick={toggleLeftSidebar} className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i className="fa-solid fa-bars text-xl"></i>
                    </button>

                    <Link to="/" className="p-1 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <img className="shrink-0 cursor-pointer" src="/favicon.svg" alt="Logo" title="Back to Home" />
                        </div>
                        <span className="text-xl font-bold text-brand inline-block">Html2ZPL</span>
                    </Link>
                </div>

                {/* Right Side: Actions + User */}
                <div id="rightPanel" className="flex items-center gap-4">
                    <div className="hidden xl:block">
                        <SegmentedControl
                            size="xs"
                            value={density}
                            onChange={setDensity}
                            data={[
                                { label: 'Compact', value: 'compact' },
                                { label: 'Normal', value: 'normal' },
                                { label: 'Spacious', value: 'spacious' },
                            ]}
                            aria-label="Editor density"
                        />
                    </div>

                    <div className="hidden lg:block xl:hidden">
                        <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                                <ActionIcon variant="default" aria-label="Editor density settings">
                                    <IconAdjustmentsHorizontal size={17} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Editor density</Menu.Label>
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={density}
                                    onChange={setDensity}
                                    data={[
                                        { label: 'Compact', value: 'compact' },
                                        { label: 'Normal', value: 'normal' },
                                        { label: 'Spacious', value: 'spacious' },
                                    ]}
                                    aria-label="Editor density"
                                />
                            </Menu.Dropdown>
                        </Menu>
                    </div>
                    {/* Save Status Indicator */}
                    {user && project && project.id && (
                        <div className="mr-2 text-xs font-medium flex items-center gap-1.5 min-w-[80px] justify-end">
                            {saveStatus === 'saving' && (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin text-brand-500"></i>
                                    <span className="text-gray-500 dark:text-gray-400">Saving...</span>
                                </>
                            )}
                            {saveStatus === 'saved' && (
                                <>
                                    <i className="fa-solid fa-check text-green-500"></i>
                                    <span className="text-gray-500 dark:text-gray-400">Saved</span>
                                </>
                            )}
                            {saveStatus === 'unsaved' && <span className="text-gray-400 dark:text-gray-500">Unsaved</span>}
                            {saveStatus === 'error' && (
                                <>
                                    <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                                    <span className="text-red-500">Error</span>
                                </>
                            )}
                        </div>
                    )}
                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">


                        <button
                            onClick={handlePreview}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Preview ZPL
                        </button>

                        <label
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                            title="Import a ZPL File">
                            <i className="fa-solid fa-upload"></i>
                            Import
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

                        {/* ... (User Session Logic) ... */}
                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.username}</span>
                                <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsLoginModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-brand-700">
                                Login
                            </button>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <div className="lg:hidden relative" ref={mobileMenuRef}>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                            <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                        </button>

                        {/* Mobile Dropdown */}
                        {isMobileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <Text size="xs" fw={600} mb={6}>Editor density</Text>
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={density}
                                        onChange={setDensity}
                                        data={[
                                            { label: 'Compact', value: 'compact' },
                                            { label: 'Normal', value: 'normal' },
                                            { label: 'Spacious', value: 'spacious' },
                                        ]}
                                        aria-label="Editor density"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        handlePreview();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Preview ZPL
                                </button>
                                <label className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                                    <i className="fa-solid fa-upload w-4 text-center"></i>
                                    Import
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
                                                setIsMobileMenuOpen(false);
                                            }
                                        }}
                                    />
                                </label>

                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                {user ? (
                                    <>
                                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Signed in as {user.username}</div>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                            <i className="fa-solid fa-right-from-bracket w-4 text-center"></i>
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsLoginModalOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-brand-600 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                        <i className="fa-solid fa-right-to-bracket w-4 text-center"></i>
                                        Login
                                    </button>
                                )}
                            </div>
                        )}

                    </div>

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

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
}
