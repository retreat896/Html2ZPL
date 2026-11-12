import React, { useState } from 'react';
import clsx from 'clsx';
import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import { IconPlus, IconTag } from '@tabler/icons-react';
import { useProject } from '../../context/ProjectContext';

const densityWidths = {
    compact: '13rem',
    normal: '16rem',
    spacious: '18rem',
};

export default function Sidebar({ isOpen, toggleSidebar, density }) {
    const { project, activeLabelId, setActiveLabelId, addLabel, deleteLabel, renameLabel, updateProjectMeta } = useProject();
    const [isLabelsOpen, setIsLabelsOpen] = useState(true);
    const expandedWidth = densityWidths[density] || densityWidths.normal;
    const collapsedRail = !isOpen;

    // Project Rename State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');

    const startEditingTitle = () => {
        setTempTitle(project.metadata.name);
        setIsEditingTitle(true);
    };

    const saveTitle = () => {
        if (tempTitle.trim()) {
            updateProjectMeta({ name: tempTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
        }
    };

    // Renaming State
    const [editingLabelId, setEditingLabelId] = useState(null);
    const [tempLabelName, setTempLabelName] = useState('');

    const startEditingLabel = (e, label) => {
        e.stopPropagation(); // Prevent activating label when starting edit
        setEditingLabelId(label.id);
        setTempLabelName(label.name);
    };

    const saveLabelName = () => {
        if (editingLabelId && tempLabelName.trim()) {
            renameLabel(editingLabelId, tempLabelName.trim());
        }
        setEditingLabelId(null);
    };

    const handleLabelKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveLabelName();
        } else if (e.key === 'Escape') {
            setEditingLabelId(null);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div id="sidebar-overlay" className={clsx('fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity', isOpen ? 'opacity-100' : 'opacity-0 hidden')} onClick={toggleSidebar}></div>

            <aside id="sidebar" data-open={isOpen} style={{ width: isOpen ? expandedWidth : undefined }} className={clsx('fixed lg:relative top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 flex flex-col shrink-0 transition-all duration-300 ease-in-out', isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20')}>
                {/* Sidebar Header */}
                <div id="sidebar-header" className="transition-all flex items-center justify-between h-16 md:p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-1 overflow-hidden">
                        <div className={clsx('transition-all whitespace-nowrap overflow-hidden', !isOpen && 'lg:opacity-0 lg:w-0')}>
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onBlur={saveTitle}
                                    onKeyDown={handleTitleKeyDown}
                                    autoFocus
                                    className="text-lg font-semibold text-gray-800 dark:text-white bg-transparent border-b border-brand-500 focus:outline-none w-32 ml-2"
                                />
                            ) : (
                                <span className="editor-project-title text-lg font-semibold text-gray-800 dark:text-white transition-colors cursor-pointer hover:text-brand-600 ml-2" onDoubleClick={startEditingTitle} title="Double-click to rename project">
                                    {project.metadata?.name || 'Untitled'}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Left panel collapse toggle (visible on large screens) */}
                    <button onClick={toggleSidebar} aria-label={isOpen ? 'Collapse labels sidebar' : 'Expand labels sidebar'} aria-expanded={isOpen} className="hidden lg:inline-flex p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i className={clsx('fa-solid', isOpen ? 'fa-chevron-left' : 'fa-chevron-right')}></i>
                    </button>
                    {/* Mobile Close Button */}
                    <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav id="leftNav" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {!isOpen && (
                        <Stack align="center" gap={collapsedRail ? 4 : 'xs'} mt={collapsedRail ? 4 : 'xs'}>
                            {project.labels?.map((label) => (
                                <Tooltip key={label.id} label={label.name} position="right" withArrow>
                                    <ActionIcon
                                        size={collapsedRail ? 36 : undefined}
                                        variant={activeLabelId === label.id ? 'light' : 'subtle'}
                                        color={activeLabelId === label.id ? 'brand' : 'gray'}
                                        aria-label={`Select ${label.name}`}
                                        aria-pressed={activeLabelId === label.id}
                                        onClick={() => setActiveLabelId(label.id)}>
                                        <IconTag size={collapsedRail ? 24 : 18} stroke={1.8} />
                                    </ActionIcon>
                                </Tooltip>
                            ))}
                            <Tooltip label="New label" position="right" withArrow>
                                <ActionIcon size={collapsedRail ? 36 : undefined} variant="light" color="brand" aria-label="Create new label" onClick={addLabel}>
                                    <IconPlus size={collapsedRail ? 24 : 18} stroke={1.8} />
                                </ActionIcon>
                            </Tooltip>
                        </Stack>
                    )}

                    {/* Labels Section */}
                    <div className="space-y-1 mb-4">
                        <div
                            className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            onClick={() => setIsLabelsOpen(!isLabelsOpen)}>
                            <span className={clsx('transition-all whitespace-nowrap', !isOpen && 'lg:opacity-0 lg:hidden')}>Labels</span>
                            {isOpen && <i className={clsx('fa-solid transition-transform duration-200', isLabelsOpen ? 'fa-chevron-down' : 'fa-chevron-right')}></i>}
                        </div>

                        <div className={clsx('overflow-hidden transition-all duration-300 ease-in-out', isLabelsOpen && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
                            {isOpen && (
                                <div className="space-y-1 mt-1">
                                    {project.labels?.map((label) => (
                                        <div
                                            key={label.id}
                                            className={clsx(
                                                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200',
                                                activeLabelId === label.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                                            )}
                                            onClick={() => setActiveLabelId(label.id)}>
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <i className="fa-solid fa-tag text-xs shrink-0"></i>
                                                {editingLabelId === label.id ? (
                                                    <input
                                                        type="text"
                                                        value={tempLabelName}
                                                        onChange={(e) => setTempLabelName(e.target.value)}
                                                        onBlur={saveLabelName}
                                                        onKeyDown={handleLabelKeyDown}
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full bg-white dark:bg-gray-700 border border-brand-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="truncate select-none" onDoubleClick={(e) => startEditingLabel(e, label)} title="Double-click to rename">
                                                        {label.name}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteLabel(label.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity duration-200 shrink-0"
                                                title="Delete Label">
                                                <i className="fa-solid fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addLabel}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200">
                                        <i className="fa-solid fa-plus"></i>
                                        <span>New Label</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}
