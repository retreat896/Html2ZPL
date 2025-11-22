import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TextObject from '../classes/items/TextObject';

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
        bleed: 0 // Pixels of bleed allowed beyond label boundaries (can be negative for inset)
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

        let newObj;
        const defaultProps = { x: 50, y: 50 };

        switch (type) {
            case 'text':
                newObj = new TextObject({ ...defaultProps, text: 'New Text' });
                break;
            // Add other types here
            default:
                return;
        }

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
            updateLabelSettings
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
