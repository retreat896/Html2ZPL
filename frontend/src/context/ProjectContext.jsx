import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import ObjectRegistry from '../classes/ObjectRegistry';
import { getZplCoordinates, getLabelDimensionsInDots } from '../utils/zplMath';
import { parseZPL } from '../utils/zplParser';
import { generateThumbnails } from '../utils/thumbnailUtils';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

const DEFAULT_LABEL_SETTINGS = { width: 4, height: 6, unit: 'inch', dpmm: 8 };

const DEFAULT_EDITOR_SETTINGS = {
    confineToLabel: true,
    bleed: 0,
    showGrid: true,
    snapToGrid: true,
    gridSize: 10,
    showHtmlObjects: true,
};

export const ProjectProvider = ({ children }) => {
    const rehydrateProject = (projectData) => {
        if (!projectData || !projectData.labels) return projectData;

        const rehydratedLabels = projectData.labels.map((label) => {
            const rehydratedObjects = label.objects.map((obj) => {
                const def = ObjectRegistry.get(obj.type);
                if (def && def.class) {
                    // Flatten props: merge obj (x,y,width) with obj.props (text, font, etc.)
                    // The constructor usually expects all properties at the top level
                    const flattenedProps = { ...obj, ...(obj.props || {}) };
                    const instance = new def.class(flattenedProps);
                    // Ensure ID and other base properties are preserved strictly
                    instance.id = obj.id;
                    instance.x = obj.x;
                    instance.y = obj.y;
                    instance.width = obj.width;
                    instance.height = obj.height;
                    return instance;
                }
                return obj;
            });
            return { ...label, objects: rehydratedObjects };
        });

        return { ...projectData, labels: rehydratedLabels };
    };

    const getInitialProject = () => {
        const saved = localStorage.getItem('html2zpl_project');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return rehydrateProject(parsed);
            } catch (e) {
                console.error('Failed to parse saved project', e);
            }
        }
        return {
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
                    settings: { ...DEFAULT_LABEL_SETTINGS },
                    objects: [],
                },
            ],
        };
    };

    const [project, setProject] = useState(getInitialProject);

    const [activeLabelId, setActiveLabelId] = useState(() => {
        // Initialize active label ID based on the loaded project
        if (project.labels && project.labels.length > 0) {
            return project.labels[0].id;
        }
        return null;
    });

    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [editorSettings, setEditorSettings] = useState(() => {
        const saved = localStorage.getItem('html2zpl_settings');
        if (saved) {
            try {
                return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse saved settings', e);
            }
        }
        return DEFAULT_EDITOR_SETTINGS;
    });

    // Interaction Mode: 'design' or 'fill'
    const [interactionMode, setInteractionMode] = useState('design'); // 'design' or 'fill'
    // 'saved', 'saving', 'error', 'unsaved'
    const [saveStatus, setSaveStatus] = useState('saved');

    // Ref to track the last saved state to prevent save loops
    // We initialize it as empty string so first load might trigger check,
    // but the 'if project.id' check handles the very first empty state.
    // Actually, handling initial load: we don't want to auto-save immediately on load.
    // We can set this ref when we load a project too?
    const lastSavedProjectRef = React.useRef(null);

    // Auto-save logic
    useEffect(() => {
        if (!project || !project.id || !token) return;

        const currentProjectStr = JSON.stringify(project);

        // If first run (after load) or no change, don't save.
        if (lastSavedProjectRef.current === null) {
            lastSavedProjectRef.current = currentProjectStr;
            return;
        }

        if (currentProjectStr === lastSavedProjectRef.current) {
            // No content change
            return;
        }

        setSaveStatus('unsaved');

        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            console.log('Auto-saving...');

            // We save the CURRENT project state captured in closure?
            // No, we should use the state at the time timer fires?
            // `project` in closure is the one that triggered the effect.
            // If multiple updates happened, this effect was cleaned up and re-run with new closure.
            // So `project` here IS the latest stable state after 2s of no changes.

            const res = await saveToCloud(project.metadata.name);

            if (res.success) {
                setSaveStatus('saved');
                // Update ref to match what we just saved (including any ID updates if saveToCloud returns them)
                // saveToCloud returns { success: true, savedData: ... }
                // We use savedData because saveToCloud might have updated the project (e.g. ID)
                // and called setProject, which triggers this effect again.
                // By updating the ref to match savedData, next effect run will see match and abort.
                if (res.savedData) {
                    lastSavedProjectRef.current = JSON.stringify(res.savedData);
                } else {
                    // Fallback if savedData missing
                    lastSavedProjectRef.current = JSON.stringify(project);
                }
            } else {
                setSaveStatus('error');
            }
        }, 2000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project]); // Dependency on 'project' means it triggers on every change.ate Values: Map of objectId -> value
    const [templateValues, setTemplateValues] = useState({});

    // View State: 'editor' | 'templates' | 'settings'
    const [currentView, setCurrentView] = useState('editor');

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const activeLabel = project.labels?.find((l) => l.id === activeLabelId);

    const addLabel = () => {
        const newLabel = {
            id: uuidv4(),
            name: `Label ${project.labels.length + 1}`,
            settings: { ...DEFAULT_LABEL_SETTINGS },
            objects: [],
        };
        setProject((prev) => ({ ...prev, labels: [...prev.labels, newLabel] }));
        setActiveLabelId(newLabel.id);
    };

    const deleteLabel = (id) => {
        if (project.labels.length <= 1) {
            // Don't allow deleting the last label
            return;
        }
        setProject((prev) => {
            const newLabels = prev.labels.filter((l) => l.id !== id);
            return { ...prev, labels: newLabels };
        });

        if (activeLabelId === id) {
            setActiveLabelId(newLabels[0].id);
        }
    };

    const addObject = (type, extraProps = {}) => {
        if (!activeLabel) return;

        const definition = ObjectRegistry.get(type);
        if (!definition) {
            console.error(`Unknown object type: ${type}`);
            return;
        }

        const defaultProps = { x: 50, y: 50, ...extraProps };
        const newObj = new definition.class(defaultProps);

        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === activeLabelId) {
                    return { ...label, objects: [...label.objects, newObj] };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
        setSelectedObjectId(newObj.id);
    };

    const deleteObject = (id) => {
        if (!activeLabel) return;
        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === activeLabelId) {
                    const newObjects = label.objects.filter((o) => o.id !== id);
                    return { ...label, objects: newObjects };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
        if (selectedObjectId === id) {
            setSelectedObjectId(null);
        }
    };

    const updateObject = (id, props) => {
        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === activeLabelId) {
                    const updatedObjects = label.objects.map((obj) => {
                        if (obj.id === id) {
                            const newObj = Object.create(Object.getPrototypeOf(obj));
                            Object.assign(newObj, obj, props);
                            return newObj;
                        }
                        return obj;
                    });
                    return { ...label, objects: updatedObjects };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
    };

    const reorderObject = (id, action) => {
        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === activeLabelId) {
                    const objects = [...label.objects];
                    const index = objects.findIndex((o) => o.id === id);
                    if (index === -1) return label;

                    const obj = objects[index];
                    objects.splice(index, 1); // Remove object

                    if (action === 'front') {
                        objects.push(obj);
                    } else if (action === 'back') {
                        objects.unshift(obj);
                    } else if (action === 'forward') {
                        const newIndex = Math.min(index + 1, objects.length);
                        objects.splice(newIndex, 0, obj);
                    } else if (action === 'backward') {
                        const newIndex = Math.max(index - 1, 0);
                        objects.splice(newIndex, 0, obj);
                    }

                    return { ...label, objects };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
    };

    const updateLabelSettings = (labelId, newSettings) => {
        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === labelId) {
                    return { ...label, settings: { ...label.settings, ...newSettings } };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
    };

    const updateProjectMeta = (updates) => {
        setProject((prev) => ({ ...prev, metadata: { ...prev.metadata, ...updates } }));
    };

    const renameLabel = (labelId, newName) => {
        setProject((prev) => {
            const updatedLabels = prev.labels.map((label) => {
                if (label.id === labelId) {
                    return { ...label, name: newName };
                }
                return label;
            });
            return { ...prev, labels: updatedLabels };
        });
    };

    const toggleInteractionMode = () => {
        setInteractionMode((prev) => (prev === 'design' ? 'fill' : 'design'));
    };

    const updateTemplateValue = (objectId, value) => {
        setTemplateValues((prev) => ({ ...prev, [objectId]: value }));
    };

    const generateZPL = (labelId) => {
        const label = project.labels.find((l) => l.id === labelId);
        if (!label) return '';

        const { width, height, dpmm, unit } = label.settings;

        // Calculate print width/height in dots using centralized logic
        const { width: printWidth, height: labelLength } = getLabelDimensionsInDots(width, height, dpmm, unit);

        let zpl = `^XA\n^PW${printWidth}\n^LL${labelLength}\n^PON\n`;

        label.objects.forEach((obj, index) => {
            const def = ObjectRegistry.get(obj.type);
            if (def && def.class) {
                // Create a copy with coordinates converted to printer dots
                const convertedObj = getZplCoordinates(obj, label.settings);

                const instance = new def.class(convertedObj);
                Object.assign(instance, convertedObj);
                // Pass index and templateValues to toZPL
                zpl += instance.toZPL(index, templateValues) + '\n';
            }
        });

        zpl += '^XZ';
        return zpl;
    };

    // Cloud Functions
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL ?? '/api';

    const fetchProjects = async () => {
        if (!token) return [];
        try {
            const res = await fetch(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch projects');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const saveToCloud = async (nameObj, projectData = null) => {
        if (!token) return { success: false, error: 'Not logged in' };
        try {
            // Use provided project data or current state
            const projectToSave = projectData || project;

            // Allow name to be passed as argument, OR fallback to existing metadata name, OR default to 'Untitled Project'
            // NOTE: The argument 'nameObj' might be the name string OR null/undefined if called without args.
            const nameToUse = nameObj || projectToSave.metadata?.name || 'Untitled Project';



            // Update metadata name if we are using current state,
            // OR if we want to ensure the name is correct in the payload.
            const updatedProject = {
                ...projectToSave,
                metadata: { ...projectToSave.metadata, name: nameToUse },
            };

            if (!projectData) {
                setProject(updatedProject);
            }

            // Generate thumbnails
            // We need ZPL for the thumbnail. We can use the current active label, or the first label.
            // Using the active label is probably what the user expects (what they are working on).
            // But if called from auto-save loop without user interacton, "activeLabelId" might be stale in closure?
            // "projectToSave" has labels. We should find the active one or first one.

            // Re-find active label from projectToSave
            // If activeLabelId is available in scope, we can use it, but safe to check projectToSave.labels
            const labelForThumbnail = projectToSave.labels.find(l => l.id === activeLabelId) || projectToSave.labels[0];

            let thumbnailSmall = null;
            let thumbnailLarge = null;

            if (labelForThumbnail) {
                // We need to generate ZPL for this label.
                // We can't reuse "generateZPL" function easily because it relies on state (templateValues),
                // but we can duplicate the logic or extract it. 
                // "generateZPL" uses "project" from state closure which might be old? 
                // Actually "generateZPL" uses "project" from closure.
                // Let's use the helper logic from "generateZPL" but adapted for "projectToSave"

                // Helper to generate ZPL for a specific label object
                const generateZPLForLabel = (label) => {
                    const { width, height, dpmm, unit } = label.settings;
                    const { width: printWidth, height: labelLength } = getLabelDimensionsInDots(width, height, dpmm, unit);
                    let zpl = `^XA\n^PW${printWidth}\n^LL${labelLength}\n^PON\n`;
                    label.objects.forEach((obj, index) => {
                        const def = ObjectRegistry.get(obj.type);
                        if (def && def.class) {
                            const convertedObj = getZplCoordinates(obj, label.settings);
                            const instance = new def.class(convertedObj);
                            Object.assign(instance, convertedObj);
                            zpl += instance.toZPL(index, templateValues) + '\n';
                        }
                    });
                    zpl += '^XZ';
                    return zpl;
                };

                const zpl = generateZPLForLabel(labelForThumbnail);
                const thumbs = await generateThumbnails(zpl, labelForThumbnail.settings);
                thumbnailSmall = thumbs.thumbnailSmall;
                thumbnailLarge = thumbs.thumbnailLarge;
            }

            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: projectToSave.id, // Send ID to update existing
                    name: nameToUse,
                    data: JSON.stringify(updatedProject),
                    isTemplate: updatedProject.metadata?.isTemplate || false,
                    thumbnailSmall,
                    thumbnailLarge
                }),
            });

            if (!res.ok) throw new Error('Failed to save project');

            const result = await res.json();

            // Update local project with the backend ID and UUID
            if (result.id) {
                setProject((prev) => ({
                    ...prev,
                    id: result.id,
                    uuid: result.uuid || prev.uuid // Store UUID if returned
                }));
                updatedProject.id = result.id;
                if (result.uuid) updatedProject.uuid = result.uuid;
            }

            return { success: true, savedData: updatedProject };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const loadFromCloud = async (id) => {
        let backendProject = null;

        // 1. Try fetching as authenticated user if logged in
        if (token) {
            try {
                const res = await fetch(`${API_URL}/projects/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    backendProject = await res.json();
                }
            } catch (e) {
                console.warn('Failed to load as authenticated user, trying public...', e);
            }
        }

        // 2. If no data yet (not logged in, or fetch failed/404), try public endpoint
        if (!backendProject) {
            try {
                const res = await fetch(`${API_URL}/public/projects/${id}`);
                if (res.ok) {
                    backendProject = await res.json();
                } else {
                    return { success: false, error: 'Project not found or private' };
                }
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        if (!backendProject || !backendProject.data) return { success: false, error: 'Failed to load project data' };

        try {
            const parsedProject = JSON.parse(backendProject.data);
            const rehydrated = rehydrateProject(parsedProject);

            // Attach backend metadata
            rehydrated.id = backendProject.id;
            rehydrated.uuid = backendProject.uuid; // Attach UUID
            rehydrated.is_public = backendProject.is_public;

            setProject(rehydrated);
            if (rehydrated.labels.length > 0) setActiveLabelId(rehydrated.labels[0].id);

            // Sync ref to prevent immediate auto-save
            lastSavedProjectRef.current = JSON.stringify(rehydrated);

            return { success: true, data: rehydrated };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const deleteCloudProject = async (id) => {
        if (!token) return { success: false, error: 'Not logged in' };
        try {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete project');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const fetchPublicTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/public/templates`);
            if (!res.ok) throw new Error('Failed to fetch public templates');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const publishProject = async (id, isPublic = true) => {
        if (!token) return { success: false, error: 'Not logged in' };
        try {
            const res = await fetch(`${API_URL}/projects/${id}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isPublic }),
            });
            if (!res.ok) throw new Error('Failed to update public status');

            // Update local state
            setProject((prev) => ({ ...prev, is_public: isPublic ? 1 : 0 }));

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const saveProject = () => {
        const json = JSON.stringify(project);
        const base64 = btoa(json);

        // Generate ZPL for the active label to serve as the "preview" or printable part
        const zplContent = generateZPL(activeLabelId);

        // Embed the project data in a comment block
        // Using a unique delimiter to make parsing easier
        const fileContent = `${zplContent}\n^FX HEADER:HTML2ZPL:DATA:START:${base64}:END ^FS`;

        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.metadata.name || 'label-project'}.zpl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const loadProject = (fileText) => {
        try {
            const match = fileText.match(/HEADER:HTML2ZPL:DATA:START:(.*?):END/);
            if (match && match[1]) {
                const json = atob(match[1]);
                const loadedProject = JSON.parse(json);

                // Basic validation
                if (!loadedProject.labels || !Array.isArray(loadedProject.labels)) {
                    throw new Error('Invalid project format');
                }

                // Rehydrate objects
                const finalProject = rehydrateProject(loadedProject);
                setProject(finalProject);

                // Restore active label if possible, otherwise first label
                if (finalProject.labels.length > 0) {
                    setActiveLabelId(finalProject.labels[0].id);
                }
            } else {
                // Fallback: Parse ZPL commands
                console.log('No embedded data found, attempting to parse ZPL...');

                // We need to determine settings from the ZPL if possible, or use defaults/current
                // For now, we'll use the current active label's settings or defaults
                // Ideally, we should parse ^PW and ^LL to guess dimensions

                // Simple regex to find ^PW and ^LL
                const pwMatch = fileText.match(/\^PW(\d+)/);
                const llMatch = fileText.match(/\^LL(\d+)/);

                let settings = { ...DEFAULT_LABEL_SETTINGS };

                // If we have an active label, use its settings as a base
                if (activeLabel) {
                    settings = { ...activeLabel.settings };
                }

                // If we found dimensions in ZPL, we might want to update settings,
                // but converting back from dots to inches/mm without knowing the original unit/dpmm is tricky.
                // For now, we will rely on the provided settings for coordinate conversion.

                const objects = parseZPL(fileText, settings);

                if (objects.length > 0) {
                    // Create a new label with these objects
                    const newLabel = {
                        id: uuidv4(),
                        name: 'Imported Label',
                        settings: settings,
                        objects: objects,
                    };

                    setProject((prev) => ({
                        ...prev,
                        labels: [...prev.labels, newLabel],
                    }));
                    setActiveLabelId(newLabel.id);
                    alert('Imported ZPL as a new label. Note: Some settings may need adjustment.');
                } else {
                    alert('No recognized objects found in ZPL file.');
                }
            }
        } catch (e) {
            console.error('Failed to load project:', e);
            alert('Failed to load project. The file might be corrupted.');
        }
    };

    // Local Template Management
    const saveLocalTemplate = (template) => {
        try {
            const existing = localStorage.getItem('html2zpl_templates');
            let templates = existing ? JSON.parse(existing) : [];

            // Check if exists (update) or new
            const index = templates.findIndex((t) => t.metadata.created === template.metadata.created && t.metadata.name === template.metadata.name);

            if (index >= 0) {
                templates[index] = template;
            } else {
                templates.push(template);
            }

            localStorage.setItem('html2zpl_templates', JSON.stringify(templates));
            return true;
        } catch (e) {
            console.error('Failed to save local template', e);
            return false;
        }
    };

    const getLocalTemplates = () => {
        try {
            const existing = localStorage.getItem('html2zpl_templates');
            return existing ? JSON.parse(existing) : [];
        } catch (e) {
            console.error('Failed to load local templates', e);
            return [];
        }
    };

    const deleteLocalTemplate = (createdTimestamp) => {
        try {
            const existing = localStorage.getItem('html2zpl_templates');
            if (!existing) return;
            let templates = JSON.parse(existing);
            templates = templates.filter((t) => t.metadata.created !== createdTimestamp);
            localStorage.setItem('html2zpl_templates', JSON.stringify(templates));
        } catch (e) {
            console.error('Failed to delete local template', e);
        }
    };

    // Settings Sync
    const saveSettingsToCloud = async (settings) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ settings }),
            });
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    // Load settings on login
    React.useEffect(() => {
        const loadSettings = async () => {
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/settings`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const cloudSettings = await res.json();
                        if (Object.keys(cloudSettings).length > 0) {
                            setEditorSettings((prev) => ({ ...prev, ...cloudSettings }));
                        }
                    }
                } catch (e) {
                    console.error('Failed to load settings:', e);
                }
            }
        };
        loadSettings();
    }, [token]);

    // Auto-save settings on change (Debounced)
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('html2zpl_settings', JSON.stringify(editorSettings));
            if (token) {
                saveSettingsToCloud(editorSettings);
            }
        }, 1000); // Debounce 1s

        return () => clearTimeout(timeoutId);
    }, [editorSettings, token]);

    // Auto-save Project to LocalStorage
    React.useEffect(() => {
        localStorage.setItem('html2zpl_project', JSON.stringify(project));
    }, [project]);

    return (
        <ProjectContext.Provider
            value={{
                project,
                setProject,
                activeLabelId,
                setActiveLabelId,
                activeLabel,
                selectedObjectId,
                setSelectedObjectId,
                editorSettings,
                setEditorSettings,
                addLabel,
                deleteLabel,
                addObject,
                deleteObject,
                updateObject,
                reorderObject,
                updateLabelSettings,
                updateProjectMeta,
                renameLabel,
                generateZPL,
                saveProject,
                loadProject,
                fetchProjects,
                saveToCloud,
                loadFromCloud,
                deleteCloudProject,
                isPreviewOpen,
                setIsPreviewOpen,
                interactionMode,
                setInteractionMode,
                toggleInteractionMode,
                templateValues,
                updateTemplateValue,
                currentView,
                setCurrentView,
                saveLocalTemplate,
                getLocalTemplates,
                deleteLocalTemplate,
                fetchPublicTemplates,
                publishProject,
                rehydrateProject,
                saveStatus,
            }}>
            {children}
        </ProjectContext.Provider>
    );
};
