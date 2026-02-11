import React from 'react';
import { useProject } from '../../context/ProjectContext';
import ObjectRegistry from '../../classes/ObjectRegistry';

export default function FillPanel() {
    const { activeLabel, templateValues, updateTemplateValue } = useProject();

    if (!activeLabel) return <div className="p-4 text-sm text-gray-500">No label selected.</div>;

    // Filter objects that are marked as templates
    const templateObjects = activeLabel.objects.filter(obj => obj.isTemplate);

    if (templateObjects.length === 0) {
        return (
            <div className="p-4 text-sm text-gray-500 text-center">
                <p className="mb-2">No template fields found.</p>
                <p className="text-xs">Switch to <strong>Design Mode</strong> to add templated objects.</p>
            </div>
        );
    }

    const handleChange = (id, value) => {
        updateTemplateValue(id, value);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-3">
                Fill Template
            </h3>
            
            {templateObjects.map((obj) => {
                const def = ObjectRegistry.get(obj.type);
                const label = obj.fieldLabel || obj.type;
                const value = templateValues[obj.id] !== undefined ? templateValues[obj.id] : '';
                
                return (
                    <div key={obj.id} className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(obj.id, e.target.value)}
                            placeholder={obj.previewText || `Enter ${obj.type}...`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                        />
                        {obj.finalInput && (
                            <p className="text-[10px] text-gray-400 truncate">
                                Pattern: {obj.finalInput}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
