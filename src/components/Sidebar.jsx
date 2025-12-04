import React, { useState } from 'react';
import clsx from 'clsx';
import { useProject } from '../context/ProjectContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { project, activeLabelId, setActiveLabelId, addLabel, deleteLabel } = useProject();
  const [isLabelsOpen, setIsLabelsOpen] = useState(true);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        id="sidebar-overlay" 
        className={clsx(
          "fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 hidden"
        )}
        onClick={toggleSidebar}
      ></div>

      <aside 
        id="sidebar" 
        className={clsx(
          "fixed lg:relative top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Sidebar Header */}
        <div id="sidebar-header" className="transition-all flex items-center justify-between h-16 md:p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <a href="#" className="flex items-center gap-1 overflow-hidden">
            {/* Icon */}
            <img className="pl-4 w-12 h-12 shrink-0" src="/favicon.svg" alt="Logo" />
            <span className={clsx("text-xl font-semibold text-gray-800 dark:text-white transition-all whitespace-nowrap", !isOpen && "lg:opacity-0 lg:w-0")}>
              LabelEditor
            </span>
          </a>
          {/* Left panel collapse toggle (visible on large screens) */}
          <button 
            onClick={toggleSidebar}
            className="hidden lg:inline-flex p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className={clsx("fa-solid", isOpen ? "fa-chevron-left" : "fa-chevron-right")}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav id="leftNav" className="flex-1 overflow-y-auto p-4 space-y-2">
          
          {/* Labels Section */}
          <div className="space-y-1 mb-4">
            <div 
                className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                onClick={() => setIsLabelsOpen(!isLabelsOpen)}
            >
                <span className={clsx("transition-all whitespace-nowrap", !isOpen && "lg:opacity-0 lg:hidden")}>Labels</span>
                {isOpen && <i className={clsx("fa-solid transition-transform duration-200", isLabelsOpen ? "fa-chevron-down" : "fa-chevron-right")}></i>}
            </div>
            
            <div className={clsx(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isLabelsOpen && isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}>
              {isOpen && (
                <div className="space-y-1 mt-1">
                    {project.labels.map(label => (
                        <div 
                            key={label.id}
                            className={clsx(
                                "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200",
                                activeLabelId === label.id 
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                            onClick={() => setActiveLabelId(label.id)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <i className="fa-solid fa-tag text-xs"></i>
                                <span className="truncate">{label.name}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteLabel(label.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity duration-200"
                                title="Delete Label"
                            >
                                <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    ))}
                    
                    <button 
                        onClick={addLabel}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Label</span>
                    </button>
                </div>
              )}
            </div>
          </div>

          <NavItem icon="fa-house" label="Home" active isOpen={isOpen} />
          <NavItem icon="fa-layer-group" label="Templates" isOpen={isOpen} />
          <NavItem icon="fa-tags" label="Label Sets" isOpen={isOpen} />
          <NavItem icon="fa-gear" label="Settings" isOpen={isOpen} />
        </nav>

        {/* Sidebar Footer */}
        <div className={clsx("p-4 border-t border-gray-200 dark:border-gray-700 shrink-0", !isOpen && "lg:hidden")}>
          <NavItem icon="fa-share-from-square" label="Help & Support" isOpen={isOpen} />
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active, isOpen }) {
  return (
    <a href="#" className={clsx(
      "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors",
      active 
        ? "bg-blue-50 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300" 
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
    )}>
      <i className={clsx("fa-solid text-xl transition-transform", icon)}></i>
      <span className={clsx("transition-all whitespace-nowrap", !isOpen && "lg:opacity-0 lg:hidden")}>{label}</span>
    </a>
  );
}
