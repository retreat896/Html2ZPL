import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ObjectRegistry from '../classes/ObjectRegistry';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [project, setProject] = useState({
        version: '1.1',
        metadata: {
            name: 'New Project',
            created: Date.now(),
            author: 'User'
        },
        labels: [
            {
                id: uuidv4(),
                name: 'Label 1',
                settings: { width: 4, height: 6, unit: 'inch', dpmm: 8 },
                objects: []
            }
        ]
    });

    const [activeLabelId, setActiveLabelId] = useState(project.labels[0].id);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [editorSettings, setEditorSettings] = useState({
        confineToLabel: true,
        bleed: 0, // Pixels of bleed allowed beyond label boundaries (can be negative for inset)
        showGrid: true,
        snapToGrid: true,
        gridSize: 10 // Pixels
    });

    const activeLabel = project.labels.find(l => l.id === activeLabelId);

    const addLabel = () => {
        const newLabel = {
            id: uuidv4(),
            name: `Label ${project.labels.length + 1}`,
            settings: { width: 4, height: 6, unit: 'inch', dpmm: 8 },
            objects: []
        };
        setProject({ ...project, labels: [...project.labels, newLabel] });
        setActiveLabelId(newLabel.id);
    };

    const deleteLabel = (id) => {
        if (project.labels.length <= 1) {
            // Don't allow deleting the last label
            return; 
        }
        const newLabels = project.labels.filter(l => l.id !== id);
        setProject({ ...project, labels: newLabels });
        
        if (activeLabelId === id) {
            setActiveLabelId(newLabels[0].id);
        }
    };

    const addObject = (type) => {
        if (!activeLabel) return;

        const definition = ObjectRegistry.get(type);
        if (!definition) {
            console.error(`Unknown object type: ${type}`);
            return;
        }

        const defaultProps = { x: 50, y: 50 };
        const newObj = new definition.class(defaultProps);

        const updatedLabels = project.labels.map(label => {
            if (label.id === activeLabelId) {
                return { ...label, objects: [...label.objects, newObj] };
            }
            return label;
        });

        setProject({ ...project, labels: updatedLabels });
        setSelectedObjectId(newObj.id);
    };

    const updateObject = (id, props) => {
        const updatedLabels = project.labels.map(label => {
            if (label.id === activeLabelId) {
                const updatedObjects = label.objects.map(obj => {
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
        setProject({ ...project, labels: updatedLabels });
    };

    const updateLabelSettings = (labelId, newSettings) => {
        const updatedLabels = project.labels.map(label => {
            if (label.id === labelId) {
                return { ...label, settings: { ...label.settings, ...newSettings } };
            }
            return label;
        });
        setProject({ ...project, labels: updatedLabels });
    };

    const generateZPL = (labelId) => {
        const label = project.labels.find(l => l.id === labelId);
        if (!label) return '';

        const { width, height, dpmm, unit } = label.settings;
        
        // Calculate print width/height in dots
        const printWidth = Math.round(width * 25.4 * dpmm);
        const labelLength = Math.round(height * 25.4 * dpmm);
        
        // Display uses 100 DPI, printer uses actual dpmm
        // Calculate conversion ratio: printer dots per display pixel
        const DISPLAY_DPI = 100;
        const displayPixelsPerUnit = unit === 'inch' ? DISPLAY_DPI : (DISPLAY_DPI / 25.4);
        const printerDotsPerUnit = unit === 'inch' ? (25.4 * dpmm) : dpmm;
        const conversionRatio = printerDotsPerUnit / displayPixelsPerUnit;

        let zpl = `^XA\n^PW${printWidth}\n^LL${labelLength}\n^PON\n`;

        label.objects.forEach(obj => {
            const def = ObjectRegistry.get(obj.type);
            if (def && def.class) {
                // Create a copy with coordinates converted to printer dots
                const convertedObj = { ...obj };
                
                // Convert positions
                if (typeof convertedObj.x === 'number') {
                    convertedObj.x = Math.round(convertedObj.x * conversionRatio);
                }
                if (typeof convertedObj.y === 'number') {
                    convertedObj.y = Math.round(convertedObj.y * conversionRatio);
                }
                
                // Convert dimensions
                if (typeof convertedObj.width === 'number') {
                    convertedObj.width = Math.round(convertedObj.width * conversionRatio);
                }
                if (typeof convertedObj.height === 'number') {
                    convertedObj.height = Math.round(convertedObj.height * conversionRatio);
                }
                
                // Convert font size (approximate - may need adjustment)
                if (typeof convertedObj.fontSize === 'number') {
                    convertedObj.fontSize = Math.round(convertedObj.fontSize * conversionRatio);
                }
                
                const instance = new def.class(convertedObj);
                Object.assign(instance, convertedObj);
                zpl += instance.toZPL() + '\n';
            }
        });

        zpl += '^XZ';
        return zpl;
    };

    return (
        <ProjectContext.Provider value={{ 
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
            updateObject,
            updateLabelSettings,
            generateZPL
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
