import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function ProjectList({ projects, loading, onOpenProject, onDeleteProject }) {
    const { user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Projects</h2>
                    <div className="flex items-center gap-2">
                        {/* Sort/Filter controls could go here */}
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2">
                            <i className="fa-solid fa-sort-amount-down"></i>
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2">
                            <i className="fa-solid fa-list"></i>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    !user ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                                <i className="fa-solid fa-lock text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Save Your Work</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Log in to save your projects to the cloud and access them from anywhere.</p>
                            <button onClick={() => setIsLoginModalOpen(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                                Login / Sign Up
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <i className="fa-solid fa-folder-open text-2xl"></i>
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-medium">No recent projects</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Start a new project from the gallery above.</p>
                        </div>
                    )
                ) : (
                    <div className="space-y-2">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => onOpenProject(project)}
                                className="group flex items-center p-4 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800/50 cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-gray-700 transition-all">
                                <div className="flex-shrink-0 mr-4">
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <i className="fa-solid fa-tag"></i>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{project.name || 'Untitled Project'}</h4>
                                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-4">
                                        <span>Opened {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Unknown date'}</span>
                                        <span>•</span>
                                        <span>{project.label_count !== undefined ? project.label_count : project.labels?.length || 0} Labels</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProject(project);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Delete">
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <i className="fa-solid fa-ellipsis-vertical"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
