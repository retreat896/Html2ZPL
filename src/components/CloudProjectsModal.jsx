import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import ConfirmationModal from './ConfirmationModal';

export default function CloudProjectsModal({ isOpen, onClose }) {
    const { fetchProjects, saveToCloud, loadFromCloud, deleteCloudProject, project } = useProject();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'Confirm',
        confirmColor: 'blue',
    });

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setProjectName(project.metadata.name || '');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setLoading(true);
        const data = await fetchProjects();
        setProjects(data);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const result = await saveToCloud(projectName);
        if (result.success) {
            setSuccess('Project saved successfully!');
            loadProjects();
        } else {
            setError(result.error);
        }
    };

    const confirmLoad = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Load Project',
            message: 'Loading a project will overwrite your current workspace. Unsaved changes will be lost. Do you want to continue?',
            confirmText: 'Load',
            confirmColor: 'blue',
            onConfirm: () => executeLoad(id),
        });
    };

    const executeLoad = async (id) => {
        setLoading(true);
        const result = await loadFromCloud(id);
        setLoading(false);

        if (result.success) {
            onClose();
        } else {
            setError(result.error);
        }
    };

    const confirmDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Project',
            message: 'Are you sure you want to delete this project? This action cannot be undone.',
            confirmText: 'Delete',
            confirmColor: 'red',
            onConfirm: () => executeDelete(id),
        });
    };

    const executeDelete = async (id) => {
        const result = await deleteCloudProject(id);
        if (result.success) {
            loadProjects();
        } else {
            setError(result.error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[80vh] flex flex-col">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>

                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2">Cloud Projects</h2>

                    {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>}

                    {success && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">{success}</div>}

                    {/* Save Current Section */}
                    <div className="mb-8 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Save Current Workspace</h3>
                        <form onSubmit={handleSave} className="flex gap-3">
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Project Name"
                                required
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                                <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
                                Save
                            </button>
                        </form>
                    </div>

                    {/* List Projects */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Your Saved Projects</h3>

                        {loading && projects.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">No saved projects yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {projects.map((proj) => (
                                    <div key={proj.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{proj.name}</h4>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Modified: {new Date(proj.updated_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => confirmLoad(proj.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors">
                                                Load
                                            </button>
                                            <button onClick={() => confirmDelete(proj.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmColor={confirmModal.confirmColor}
            />
        </>
    );
}
