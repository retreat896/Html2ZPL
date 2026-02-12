import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Editor from './Editor';
import RightSidebar from './RightSidebar';
import ZplPreviewModal from './ZplPreviewModal';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

export default function EditorLayout() {
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const { setProject, setActiveLabelId, loadFromCloud, rehydrateProject, setInteractionMode } = useProject();
    const { addToast } = useToast();

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                // Only auto-close if we are resizing DOWN to mobile.
                // If we are already on mobile, we might want to keep user's state?
                // But the simplistic approach is usually fine:
                // Actually, the previous logic was:
                // if < 1024 set false. else set true.
                // This forces it open on desktop and closed on mobile ALWAYS on resize.
                // Let's keep that behavior for now as it ensures consistency.
                setIsLeftSidebarOpen(false);
                setIsRightSidebarOpen(false);
            } else {
                setIsLeftSidebarOpen(true);
                setIsRightSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load Project Logic
    useEffect(() => {
        const initEditor = async () => {
            setInteractionMode('design'); // Ensure we are in design mode to allow editing

            if (projectId === 'new') {
                // Check if we have template state passed via navigation
                const templateState = location.state?.template;

                if (templateState) {
                    // Initialize from template
                    // Deep copy to avoid mutating the template itself
                    // Remove IDs to ensure it's treated as new
                    const newProject = JSON.parse(JSON.stringify(templateState));
                    newProject.id = undefined; // Will be assigned on save or we can assign a temp one?
                    // The backend assigns ID on create normally?
                    // Actually `saveToCloud` in Context:
                    // `const res = await fetch(\`\${API_URL}/projects\`, ...)`
                    // Backend returns ID.

                    const customName = location.state?.customName;
                    newProject.metadata.name = customName || `Copy of ${newProject.metadata.name}`;
                    newProject.metadata.created = Date.now();
                    newProject.metadata.isTemplate = false; // It's a project now

                    // Reset labels IDs
                    if (newProject.labels) {
                        newProject.labels = newProject.labels.map((l) => ({
                            ...l,
                            id: uuidv4(),
                        }));
                    }

                    setProject(newProject);
                    if (newProject.labels?.length > 0) setActiveLabelId(newProject.labels[0].id);
                    addToast('Initialized from template', 'success');
                } else {
                    // Blank Project
                    // Context `getInitialProject` (or we can manually reset)
                    // Currently `ProjectContext` initializes with "New Project".
                    // If we navigate here, we might want to ensure it is reset if it was previously occupied.
                    // But `useProject` state persists.

                    // We should probably reset to default if we just came here.
                    // But if `projectId` is new, `useEffect` runs.

                    // TODO: Add `resetProject` to Context for cleaner blank slate?
                    // For now, let's create a blank local object
                    const blankProject = {
                        version: '1.1',
                        metadata: {
                            name: 'New Project',
                            created: Date.now(),
                            author: 'User',
                            isTemplate: false,
                        },
                        labels: [
                            {
                                id: uuidv4(),
                                name: 'Label 1',
                                settings: { width: 4, height: 6, unit: 'inch', dpmm: 8 },
                                objects: [],
                            },
                        ],
                    };
                    setProject(blankProject);
                    setActiveLabelId(blankProject.labels[0].id);
                }
            } else if (projectId) {
                // Check if project data was passed via navigation (e.g. for local templates)
                if (location.state?.projectData) {
                    const passedData = location.state.projectData;
                    try {
                        // Rehydrate objects to ensure classes are instantiated
                        const rehydrated = rehydrateProject(passedData);
                        setProject(rehydrated);
                        if (rehydrated.labels && rehydrated.labels.length > 0) {
                            setActiveLabelId(rehydrated.labels[0].id);
                        }
                        // Skip cloud load if we have data
                        return;
                    } catch (e) {
                        console.error('Failed to rehydrate passed project data', e);
                        // Fallback to cloud load if rehydration fails (though unlikely for valid local data)
                    }
                }

                // Load existing project from cloud
                const res = await loadFromCloud(projectId);
                if (!res.success) {
                    addToast('Failed to load project: ' + res.error, 'error');
                    navigate('/'); // Back to dashboard on failure
                }
            }
        };

        initEditor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, location.state]);

    const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);
    const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Header toggleLeftSidebar={toggleLeftSidebar} toggleRightSidebar={toggleRightSidebar} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isLeftSidebarOpen} toggleSidebar={toggleLeftSidebar} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Editor />
                </div>

                <RightSidebar isOpen={isRightSidebarOpen} setIsOpen={setIsRightSidebarOpen} />
            </div>

            <ZplPreviewModal />
        </div>
    );
}
