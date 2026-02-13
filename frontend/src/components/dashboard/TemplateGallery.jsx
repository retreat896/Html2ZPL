import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function TemplateGallery({ templates, publicTemplates, loading, onSelectTemplate, onCreateNew }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 py-8 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Start a new project</h2>
                    <button onClick={() => navigate('/templates')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Template Gallery <i className="fa-solid fa-chevron-right text-xs ml-1"></i>
                    </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {/* Create Blank */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={onCreateNew}
                            className="bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg w-36 h-48 flex flex-col items-center justify-center transition-all group relative overflow-hidden"
                            title="Blank Project">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 mb-3 transition-colors">
                                <i className="fa-solid fa-plus text-xl"></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Blank</span>
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && [1, 2, 3].map((i) => <div key={i} className="flex-shrink-0 w-36 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>)}

                    {/* Login Card (if guest) */}
                    {!user && (
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg w-36 h-48 flex flex-col items-center justify-center transition-all group relative overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-lock text-xl"></i>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white px-2">Login to see your templates</span>
                            </button>
                        </div>
                    )}

                    {/* User Templates */}
                    {!loading &&
                        user &&
                        templates.map((template) => (
                            <div key={template.id} className="flex-shrink-0">
                                <button
                                    onClick={() => onSelectTemplate(template)}
                                    className="bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg w-36 h-48 flex flex-col transition-all relative overflow-hidden text-left">
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-900/50 w-full flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
                                        <i className="fa-solid fa-file-lines text-3xl text-gray-300 dark:text-gray-600"></i>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={template.metadata?.name}>
                                            {template.metadata?.name || 'Untitled'}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">My Template</p>
                                    </div>
                                </button>
                            </div>
                        ))}

                    {/* Public Templates */}
                    {!loading &&
                        publicTemplates.map((template) => (
                            <div key={template.id} className="flex-shrink-0">
                                <button
                                    onClick={() => onSelectTemplate(template)}
                                    className="bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg w-36 h-48 flex flex-col transition-all relative overflow-hidden text-left">
                                    <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 w-full flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
                                        <i className="fa-solid fa-globe text-3xl text-purple-300 dark:text-purple-600"></i>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={template.metadata?.name}>
                                            {template.metadata?.name || 'Untitled'}
                                        </h3>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 truncate">Public</p>
                                    </div>
                                </button>
                            </div>
                        ))}
                </div>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
}
