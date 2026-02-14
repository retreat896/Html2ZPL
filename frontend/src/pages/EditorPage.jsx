import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/editor/Sidebar';
import Header from '../components/editor/Header';
import Editor from '../components/editor/Editor';
import RightSidebar from '../components/editor/RightSidebar';
import ZplPreviewModal from '../components/editor/ZplPreviewModal';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

export default function EditorPage() {
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const { project, setProject, setActiveLabelId, loadFromCloud, rehydrateProject, setInteractionMode, saveToCloud } = useProject();
    const { addToast } = useToast();
    const isLoadingRef = useRef(false);

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
            if (isLoadingRef.current) return;
            isLoadingRef.current = true; // Block subsequent calls immediately

            setInteractionMode('design'); // Ensure we are in design mode to allow editing

            // Optimization: If we are already on the right project (UUID or ID matches), don't reload
            if (project && (project.uuid === projectId || String(project.id) === projectId)) {
                isLoadingRef.current = false;
                return;
            }

            if (projectId === 'new') {
                try {
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
                        isLoadingRef.current = false;
                    } else {
                        // Blank Project
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

                        // Trigger immediate save to get UUID and ID (if logged in)
                        // We check if saveToCloud is available/functional (it checks token internally)
                        saveToCloud(null, blankProject).then(res => {
                            if (res.success && res.savedData) {
                                setProject(res.savedData);
                                if (res.savedData.uuid) {
                                    navigate(`/editor/${res.savedData.uuid}`, { replace: true });
                                }
                            }
                            isLoadingRef.current = false;
                        }).catch(() => {
                            isLoadingRef.current = false;
                        });
                    }
                } catch (e) {
                    console.error("Error initializing new project", e);
                    isLoadingRef.current = false;
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
                        isLoadingRef.current = false;
                        return;
                    } catch (e) {
                        console.error('Failed to rehydrate passed project data', e);
                        // Fallback to cloud load if rehydration fails (though unlikely for valid local data)
                    }
                }

                // Load existing project from cloud
                const res = await loadFromCloud(projectId);
                isLoadingRef.current = false; // Reset after load attempt
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
