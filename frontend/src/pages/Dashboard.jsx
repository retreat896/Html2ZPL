import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import TemplateGallery from '../components/dashboard/TemplateGallery';
import ProjectList from '../components/dashboard/ProjectList';
import RenameModal from '../components/common/RenameModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const { fetchProjects, fetchPublicTemplates, getLocalTemplates, setProject, setActiveLabelId, setInteractionMode, deleteCloudProject, deleteLocalTemplate, saveLocalTemplate, saveToCloud, loadFromCloud } = useProject();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [myTemplates, setMyTemplates] = useState([]);
    const [publicTemplates, setPublicTemplates] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState(null);

    useEffect(() => {
        document.title = 'HTML2ZPL - Dashboard';
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch all cloud projects
                const cloudProjects = await fetchProjects();

                // 2. Fetch public templates
                const pubTemplates = await fetchPublicTemplates();

                // 3. Get local templates/projects (legacy support)
                const localTemplates = getLocalTemplates();

                // Process Cloud Projects
                // Separate into Templates and Regular Projects
                const cTemplates = cloudProjects.filter((p) => p.is_template === 1 || p.is_template === true);
                const cProjects = cloudProjects.filter((p) => p.is_template !== 1 && p.is_template !== true);

                // Format cloud templates
                const formattedCloudTemplates = cTemplates.map((t) => ({
                    ...t,
                    metadata: { ...t.metadata, isTemplate: true },
                    _source: 'cloud',
                }));

                // Format local templates (deduplicate)
                const cloudIds = new Set(formattedCloudTemplates.map((t) => `${t.metadata.name}-${t.updated_at}`));
                const uniqueLocal = localTemplates.filter((t) => !cloudIds.has(`${t.metadata.name}-${t.metadata.created}`)).map((t) => ({ ...t, _source: 'local' }));

                setMyTemplates([...uniqueLocal, ...formattedCloudTemplates]);

                // Format Public Templates
                setPublicTemplates(
                    pubTemplates.map((t) => ({
                        ...t,
                        metadata: {
                            name: t.name,
                            created: t.updated_at,
                            isTemplate: true,
                        },
                        _source: 'public',
                    })),
                );

                // Recent Projects
                // Sort by updated_at desc
                const sortedProjects = cProjects.sort((a, b) => {
                    return new Date(b.updated_at) - new Date(a.updated_at);
                });
                setRecentProjects(sortedProjects);

            } catch (error) {
                console.error('Error loading dashboard', error);
                addToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [fetchProjects, fetchPublicTemplates, getLocalTemplates, addToast]);

    const handleCreateNew = async () => {
        // Create a blank project
        const newId = uuidv4();
        // We can navigate to /editor/new or /editor/:id
        // If we navigate to /editor/new, the editor needs to handle creating the ID.
        // Let's create the project structure in context first IF we want to persist it immediately,
        // but validation-wise it's better to let the editor handle initialization.
        // However, providing a unique ID is good.
        // Let's navigate to /editor/new and let EditorLayout handle it, OR pass an ID.
        // Implementation Plan said: /editor/:newId or /editor/new

        navigate('/editor/new');
    };

    const handleSelectTemplate = (template) => {
        setPendingTemplate(template);
        setIsRenameModalOpen(true);
    };

    const handleCreateEvaluatedTemplate = async (customName) => {
        if (!pendingTemplate) return;
        const template = pendingTemplate;
        let templateData = template;

        // If template doesn't have labels (likely from public/cloud list summary), fetch full data
        if (!template.labels && (template._source === 'cloud' || template._source === 'public')) {
            setLoading(true);
            try {
                const res = await loadFromCloud(template.id);
                if (res.success && res.data) {
                    templateData = { ...template, ...res.data };
                } else {
                    console.error('Failed to load full template data', res.error);
                    addToast('Could not load template details. Using summary.', 'warning');
                }
            } catch (e) {
                console.error('Error fetching template details', e);
            } finally {
                setLoading(false);
            }
        }

        // Navigate with template data and custom name
        navigate('/editor/new', { state: { template: templateData, customName } });
        setPendingTemplate(null);
    };

    const handleOpenProject = (project) => {
        // Open existing project
        navigate(`/editor/${project.id}`);
    };

    const handleDeleteProject = async (project) => {
        if (!window.confirm(`Are you sure you want to delete "${project.name || 'Untitled Project'}"?`)) return;

        try {
            const res = await deleteCloudProject(project.id);
            if (res.success) {
                setRecentProjects((prev) => prev.filter((p) => p.id !== project.id));
                addToast('Project deleted', 'success');
            } else {
                addToast('Failed to delete project: ' + res.error, 'error');
            }
        } catch (e) {
            addToast('Error deleting project', 'error');
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-gray-900 relative">
            <DashboardNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col relative z-0">
                <TemplateGallery templates={myTemplates} publicTemplates={publicTemplates} loading={loading} onCreateNew={handleCreateNew} onSelectTemplate={handleSelectTemplate} />

                <ProjectList projects={recentProjects} loading={loading} onOpenProject={handleOpenProject} onDeleteProject={handleDeleteProject} />

                <RenameModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onConfirm={handleCreateEvaluatedTemplate} title="Start New Project" confirmText="Create Project" initialName={pendingTemplate ? `Copy of ${pendingTemplate.metadata.name}` : ''} />
            </div>
        </div>
    );
}
