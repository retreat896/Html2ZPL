import React from 'react';

export default function PropertiesRenderer({ object, onChange, schema }) {
    if (!schema || !Array.isArray(schema)) {
        return <div className="text-sm text-gray-500">No properties defined.</div>;
    }

    const renderField = (field) => {
        const { name, type, label, options, min, max, step, showIf } = field;

        // Conditional rendering
        if (showIf && typeof showIf === 'function') {
            if (!showIf(object)) return null;
        }

        const commonClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
        const labelClasses = "block text-xs font-medium text-gray-700 dark:text-gray-300";

        switch (type) {
            case 'text':
                return (
                    <div key={name} className="space-y-1">
                        <label className={labelClasses}>{label}</label>
                        <input
                            type="text"
                            value={object[name] || ''}
                            onChange={(e) => onChange(name, e.target.value)}
                            className={commonClasses}
                        />
                    </div>
                );
            case 'number':
                return (
                    <div key={name} className="space-y-1">
                        <label className={labelClasses}>{label}</label>
                        <input
                            type="number"
                            value={object[name] !== undefined ? object[name] : ''}
                            onChange={(e) => onChange(name, parseFloat(e.target.value))}
                            className={commonClasses}
                            min={min}
                            max={max}
                            step={step}
                        />
                    </div>
                );
            case 'select':
                return (
                    <div key={name} className="space-y-1">
                        <label className={labelClasses}>{label}</label>
                        <select
                            value={object[name] || ''}
                            onChange={(e) => onChange(name, e.target.value)}
                            className={commonClasses}
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'boolean':
                return (
                    <label key={name} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!object[name]}
                            onChange={(e) => onChange(name, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                    </label>
                );
            case 'section':
                return (
                    <div key={name} className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                         {/* Optional Section Title */}
                         {label && <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h4>}
                         {field.fields.map(subField => renderField(subField))}
                    </div>
                );
            case 'row':
                 return (
                    <div key={name} className="grid grid-cols-2 gap-2">
                        {field.fields.map(subField => renderField(subField))}
                    </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
             {/* Always show Type */}
            <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="text-sm text-gray-900 dark:text-white capitalize">{object.type}</div>
            </div>

            {schema.map(field => renderField(field))}
        </div>
    );
}
