import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function ProjectList({ projects, loading, onOpenProject, onDeleteProject }) {
    const { user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    return (
        <div className="flex-1 bg-white dark:bg-gray-900">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => onOpenProject(project)}
                                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full relative">

                                {/* Top: Preview */}
                                <div className="aspect-[8.5/11] w-full bg-gray-100 dark:bg-gray-900/50 relative overflow-hidden border-b border-gray-100 dark:border-gray-700">
                                    {project.thumbnail_small ? (
                                        <img
                                            src={project.thumbnail_small}
                                            alt={project.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><i class="fa-solid fa-tag text-4xl text-gray-300 dark:text-gray-600"></i></div>';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <i className="fa-solid fa-tag text-4xl text-gray-300 dark:text-gray-600"></i>
                                        </div>
                                    )}

                                    {/* Actions Overlay */}
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProject(project);
                                            }}
                                            className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-red-600 rounded-lg shadow-sm backdrop-blur-sm transition-colors"
                                            title="Delete">
                                            <i className="fa-solid fa-trash text-sm"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom: Info */}
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="mb-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate" title={project.name}>
                                            {project.name || 'Untitled Project'}
                                        </h4>
                                    </div>
                                    <div className="mt-auto flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
                                        <span>
                                            <i className="fa-regular fa-clock mr-1"></i>
                                            {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Unknown'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            <i className="fa-solid fa-layer-group mr-1"></i>
                                            {project.label_count !== undefined ? project.label_count : project.labels?.length || 0} Labels
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
}
