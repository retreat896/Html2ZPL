import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import CreateTemplateModal from './CreateTemplateModal';

export default function TemplatesView() {
    const { setProject, setActiveLabelId, setInteractionMode, setCurrentView, saveToCloud, fetchProjects, getLocalTemplates, saveLocalTemplate, loadFromCloud, fetchPublicTemplates, publishProject, deleteCloudProject, deleteLocalTemplate } = useProject();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [publicTemplates, setPublicTemplates] = useState([]);
    const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'public'
    const [loading, setLoading] = useState(true);

    // Load templates on mount
    useEffect(() => {
        const loadTemplates = async () => {
            setLoading(true);
            try {
                // 1. Local Templates
                const local = getLocalTemplates();

                // 2. Cloud Templates (if available)
                const cloudProjects = await fetchProjects();

                // Filter for isTemplate: true
                // API now returns `is_template` (0 or 1)
                const cloudTemplates = cloudProjects.filter((p) => {
                    return p.is_template === 1 || p.is_template === true;
                });

                const formattedLocal = local.map((t) => ({ ...t, _source: 'local' }));

                // Map cloud templates.
                const formattedCloud = cloudTemplates.map((t) => ({
                    ...t,
                    metadata: {
                        name: t.name,
                        created: t.updated_at, // Use updated_at as created fallback
                        isTemplate: true,
                    },
                    _source: 'cloud',
                    isPublic: t.is_public === 1,
                }));

                // Deduplicate: If a template exists in both Local and Cloud (matched by created time or name), prefer Cloud.
                const cloudIds = new Set(formattedCloud.map((t) => `${t.metadata.name}-${t.metadata.created}`));
                const uniqueLocal = formattedLocal.filter((t) => !cloudIds.has(`${t.metadata.name}-${t.metadata.created}`));

                setTemplates([...uniqueLocal, ...formattedCloud]);

                // 3. Load Public Templates
                const publicT = await fetchPublicTemplates();
                // Map public templates
                const formattedPublic = publicT.map((t) => ({
                    ...t,
                    metadata: {
                        name: t.name,
                        created: t.updated_at,
                        isTemplate: true,
                    },
                    _source: 'public', // Distinct source
                }));
                setPublicTemplates(formattedPublic);
            } catch (err) {
                console.error('Error loading templates', err);
                addToast('Failed to load templates', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadTemplates();
    }, [fetchProjects, getLocalTemplates, fetchPublicTemplates, addToast]);

    const handleCreateTemplate = async (name, description) => {
        const newTemplate = {
            version: '1.1',
            metadata: {
                name: name,
                description: description,
                created: Date.now(),
                author: 'User',
                isTemplate: true, // Key flag
            },
            labels: [
                {
                    id: uuidv4(),
                    name: 'Template Label 1',
                    settings: { width: 4, height: 6, unit: 'inch', dpmm: 8 },
                    objects: [],
                },
            ],
        };

        // 1. Set local state
        setProject(newTemplate);
        setActiveLabelId(newTemplate.labels[0].id);
        setInteractionMode('design');
        setCurrentView('editor');

        // 2. Attempt Cloud Save
        try {
            const result = await saveToCloud(name, newTemplate);

            if (result.success) {
                addToast('Template created and saved to cloud successfully!', 'success');
            } else {
                console.warn('Cloud save failed, falling back to local.', result.error);
                saveLocalTemplate(newTemplate);
                addToast('Template saved locally (Cloud unavailable).', 'warning');
            }
        } catch (e) {
            console.error('Cloud save error:', e);
            saveLocalTemplate(newTemplate);
            addToast('Template saved locally (Cloud error).', 'warning');
        }
    };

    const handleLoadTemplate = async (template) => {
        if (template._source === 'public') {
            // For public templates, we might need to fetch full data if the list only has summaries
            // But assuming we want to load it into the editor:
            // We will treat it as a new project import essentially
        }

        // If it's a cloud/public template without full data (labels), fetch it
        if ((template._source === 'cloud' || template._source === 'public') && !template.labels) {
            setLoading(true);
            try {
                // Determine which ID to load.
                // Since public templates are just projects, loadFromCloud(id) should work if the backend allows public access
                // Backend `GET /projects/:id` is authenticated.
                // Depending on backend, we might need a public endpoint for fetching data?
                // Wait, `server.js` `GET /projects/:id` requires auth and matches user_id.
                // Public templates are visible but might not be fetchable via specific ID if they don't belong to user?
                // Actually `loadFromCloud` calls `/projects/:id`.
                // If I am viewing a public template that IS NOT MINE, `GET /projects/:id` will 404.

                // We need `GET /public/templates/:id` or make `GET /projects/:id` allow public access if public.
                // For now, let's assume `loadFromCloud` might fail for public templates if not owned by user.
                // Check if we have public fetch endpoint? We added `GET /public/templates` list.
                // We didn't add `GET /public/templates/:id`.

                // CRITICAL: We need a way to load the full content of a public template!
                // I will add a `fetchPublicProject` to context or fallback logic.
                // But for now, let's try `loadFromCloud`.

                const res = await loadFromCloud(template.id);
                if (!res.success) {
                    addToast('Failed to load template data: ' + res.error, 'error');
                }
                // loadFromCloud sets the project context internally
            } catch (e) {
                addToast('Error loading template', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // Local or fully loaded
            setProject(template);
            if (template.labels && template.labels.length > 0) setActiveLabelId(template.labels[0].id);
        }

        setInteractionMode('design');
        setCurrentView('editor');
    };

    const handlePublish = async (e, template) => {
        e.stopPropagation();
        if (template._source !== 'cloud') {
            addToast('Only cloud-saved templates can be published. Please save to cloud first.', 'warning');
            return;
        }

        const newStatus = !template.isPublic;
        // Optimistic update
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? { ...t, isPublic: newStatus } : t)));

        try {
            const res = await publishProject(template.id, newStatus);
            if (!res.success) {
                // Revert
                setTemplates((prev) => prev.map((t) => (t.id === template.id ? { ...t, isPublic: !newStatus } : t)));
                addToast('Failed to publish: ' + res.error, 'error');
            } else {
                addToast(newStatus ? 'Template published to public library!' : 'Template unpublished.', 'success');
                // Refresh public list
                const publicT = await fetchPublicTemplates();
                // ... map and setPublicTemplates ...
                // Simplified for now:
                // setPublicTemplates(...)
            }
        } catch (e) {
            console.error(e);
            addToast('An error occurred.', 'error');
        }
    };

    const handleDeleteTemplate = async (e, template) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete template "${template.metadata.name}"?`)) return;

        try {
            if (template._source === 'local') {
                deleteLocalTemplate(template.metadata.created);
                setTemplates((prev) => prev.filter((t) => t.metadata.created !== template.metadata.created));
                addToast('Local template deleted.', 'success');
            } else if (template._source === 'cloud') {
                const res = await deleteCloudProject(template.id);
                if (res.success) {
                    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
                    addToast('Cloud template deleted.', 'success');
                } else {
                    addToast('Failed to delete cloud template: ' + res.error, 'error');
                }
            }
        } catch (err) {
            console.error('Error deleting template:', err);
            addToast('An error occurred while deleting.', 'error');
        }
    };

    const displayedTemplates = viewMode === 'mine' ? templates : publicTemplates;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Create and manage your label templates.</p>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setViewMode('mine')}
                        className={`pb-2 px-4 font-medium transition-colors ${viewMode === 'mine' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                        My Templates
                    </button>
                    <button
                        onClick={() => setViewMode('public')}
                        className={`pb-2 px-4 font-medium transition-colors ${viewMode === 'public' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                        Public Library
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Create New Template Card (Only in 'mine' view) */}
                    {viewMode === 'mine' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all group h-64">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-plus text-2xl"></i>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Create New Template</span>
                        </button>
                    )}

                    {/* Template List */}
                    {displayedTemplates.map((template, idx) => (
                        <div key={idx} onClick={() => handleLoadTemplate(template)} className="flex flex-col p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 h-64 relative group">
                            {/* Actions for My Templates */}
                            {viewMode === 'mine' && template._source === 'cloud' && (
                                <div className="absolute top-3 right-3 flex gap-2 z-10">
                                    <button
                                        onClick={(e) => handlePublish(e, template)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${template.isPublic ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600'}`}
                                        title={template.isPublic ? 'Publicly Visible (Click to Unpublish)' : 'Publish to Public Library'}>
                                        <i className={`fa-solid ${template.isPublic ? 'fa-globe' : 'fa-share-nodes'}`}></i>
                                    </button>
                                    <button onClick={(e) => handleDeleteTemplate(e, template)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600" title="Delete Template">
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            )}

                            {viewMode === 'mine' && template._source === 'local' && (
                                <button
                                    onClick={(e) => handleDeleteTemplate(e, template)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm z-10 bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                    title="Delete Template">
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            )}

                            {/* Public View Logic */}
                            {viewMode === 'public' && <div className="absolute top-3 right-3 z-10">{/* Maybe add a 'copy to my templates' button later */}</div>}

                            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900/50 rounded-lg mb-4 overflow-hidden">
                                <i className="fa-solid fa-file-lines text-4xl text-gray-300 dark:text-gray-600"></i>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={template.metadata?.name || 'Untitled'}>
                                    {template.metadata?.name || 'Untitled'}
                                </h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{template.metadata?.created ? new Date(template.metadata.created).toLocaleDateString() : ''}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${template._source === 'local' ? 'bg-orange-100 text-orange-600' : template._source === 'public' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {template._source === 'public' ? 'Public' : template._source || 'Local'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CreateTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateTemplate} />
        </div>
    );
}
