import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function DashboardNavbar({ toggleSidebar }) {
    const { user, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 relative z-30">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Toggle Sidebar">
                    <i className="fa-solid fa-bars text-xl"></i>
                </button>
                <div className="p-1 flex items-center gap-2 cursor-pointer  cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <img className="shrink-0 cursor-pointer" src="/favicon.svg" alt="Logo" title="Back to Dashboard" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Html2ZPL</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* User Profile / Logout */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.username || 'Guest User'}</span>
                    </div>
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 focus:outline-none ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                            <i className="fa-solid fa-user"></i>
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                            {user ? (
                                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                    Sign Out
                                </button>
                            ) : (
                                <button onClick={() => setIsLoginModalOpen(true)} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
                                    <i className="fa-solid fa-right-to-bracket"></i>
                                    Login / Sign Up
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </nav>
    );
}
