import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';

export default function ShareModal({ isOpen, onClose }) {
    const { project, publishProject, updateProjectMeta } = useProject();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (project && project.metadata) {
            // Check project.is_public from DB (if available in root) or metadata
            // detailed project object usually has it in root properties if loaded from DB
            // but our local state might store it in metadata if we standardized that?
            // Let's check ProjectContext or backend response.
            // Backend returns { id, name, is_template, is_public, ... }
            //Frontend rehydrate puts it... where?
            // server.js: `res.json(project)` -> returns flat object.
            // ProjectContext rehydrateProject:
            // `return { ...projectData, labels: rehydratedLabels };`
            // So `is_public` should be on the root of `project`.
            
            setIsPublic(!!project.is_public);
        }
    }, [project, isOpen]);

    if (!isOpen || !project) return null;

    const navUrl = window.location.origin + '/editor/' + project.id;

    const handleToggle = async () => {
        setLoading(true);
        const newStatus = !isPublic;
        
        const res = await publishProject(project.id, newStatus);
        
        if (res.success) {
            setIsPublic(newStatus);
            // We should also update the local project state so it persists in UI if we reopen modal
            // We need a way to update root properties of project in context
            // context `updateProjectMeta` only updates metadata.
            // We might need a `setProject(prev => ({ ...prev, is_public: newStatus }))` exposed or use setProject directly.
            // But ShareModal doesn't have setProject, it uses useProject.
            // logic below will happen in component.
            addToast(newStatus ? 'Project is now public' : 'Project is now private', 'success');
        } else {
            addToast('Failed to update status: ' + res.error, 'error');
            // Revert on failure
            setIsPublic(!newStatus);
        }
        setLoading(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(navUrl);
        addToast('Link copied to clipboard', 'success');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share Project</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Public Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">Public Access</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {isPublic 
                                        ? "Anyone with the link can view this project." 
                                        : "Only you can access this project."}
                                </p>
                            </div>
                            <button
                                onClick={handleToggle}
                                disabled={loading}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isPublic ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                            >
                                <span className="sr-only">Use setting</span>
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isPublic ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Link Section */}
                        {isPublic && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Share Link</label>
                                <div className="flex rounded-lg shadow-sm">
                                    <input
                                        type="text"
                                        readOnly
                                        value={navUrl}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 font-medium text-sm transition-colors"
                                    >
                                        <i className="fa-regular fa-copy mr-2"></i>
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
