import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ResetConfirmModal from '../common/ResetConfirmModal';

export default function DashboardSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { addToast } = useToast();
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const handleReset = () => {
        // Clear Local Storage
        localStorage.clear();

        // Logout User
        logout();

        // Close Modal & Sidebar
        setIsResetModalOpen(false);
        onClose();

        // Navigation & Toast
        navigate('/');
        addToast('Application reset successfully. All local data cleared.', 'success');

        // Force reload to ensure clean state
        window.location.reload();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose}></div>}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-barcode text-white"></i>
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">Html2ZPL</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div className="p-4 space-y-1">
                    <button
                        onClick={() => {
                            navigate('/');
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <i className="fa-solid fa-house w-5 text-center"></i>
                        Dashboard
                    </button>

                    <a href="https://retreat896.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <i className="fa-solid fa-globe w-5 text-center"></i>
                        Portfolio
                    </a>

                    <a href="https://github.com/retreat896/html2zpl" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <i className="fa-brands fa-github w-5 text-center"></i>
                        GitHub
                    </a>
                </div>

                <div className="absolute bottom-4 left-0 w-full px-4">
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors mb-4">
                        <i className="fa-solid fa-rotate-right"></i>
                        Reset Application
                    </button>
                    <a
                        href="https://github.com/retreat896/html2zpl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors mb-4">
                        <i className="fa-brands fa-github w-5 text-center"></i>
                        Source Code
                    </a>

                    <div className="text-xs text-center text-gray-400 dark:text-gray-500">v0.2.0-beta</div>
                </div>
            </div>

            <ResetConfirmModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleReset} />
        </>
    );
}
