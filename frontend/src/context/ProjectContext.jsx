import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import ObjectRegistry from '../classes/ObjectRegistry';
import { getZplCoordinates, getLabelDimensionsInDots } from '../utils/zplMath';
import { parseZPL } from '../utils/zplParser';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

const DEFAULT_LABEL_SETTINGS = { width: 4, height: 6, unit: 'inch', dpmm: 8 };

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
    const [editorSettings, setEditorSettings] = useState({
        confineToLabel: true,
        bleed: 0, // Pixels of bleed allowed beyond label boundaries (can be negative for inset)
        showGrid: true,
        snapToGrid: true,
        gridSize: 10, // Pixels
        showHtmlObjects: true,
    });

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const activeLabel = project.labels.find((l) => l.id === activeLabelId);

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
                // Pass index to toZPL for comment inclusion
                zpl += instance.toZPL(index) + '\n';
            }
        });

        zpl += '^XZ';
        return zpl;
    };

    // Cloud Functions
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL ?? "/api";

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

    const saveToCloud = async (name) => {
        if (!token) return { success: false, error: 'Not logged in' };
        try {
            // Update metadata name
            const updatedProject = { ...project, metadata: { ...project.metadata, name } };
            setProject(updatedProject);

            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    data: JSON.stringify(updatedProject),
                }),
            });

            if (!res.ok) throw new Error('Failed to save project');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const loadFromCloud = async (id) => {
        if (!token) return { success: false, error: 'Not logged in' };
        try {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load project');
            const data = await res.json();

            const parsedProject = JSON.parse(data.data);
            const rehydrated = rehydrateProject(parsedProject);
            setProject(rehydrated);
            if (rehydrated.labels.length > 0) setActiveLabelId(rehydrated.labels[0].id);

            return { success: true };
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

    // Settings Sync
    const saveSettingsToCloud = async (settings) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ settings })
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
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const cloudSettings = await res.json();
                        if (Object.keys(cloudSettings).length > 0) {
                            setEditorSettings(prev => ({ ...prev, ...cloudSettings }));
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
            }}>
            {children}
        </ProjectContext.Provider>
    );
};
