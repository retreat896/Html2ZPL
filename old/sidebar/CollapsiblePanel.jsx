import React from 'react';
import clsx from 'clsx';

export default function CollapsiblePanel({ title, icon, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Panel Header */}
      <div 
        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={onToggle}
      >
        <i className={clsx("fa-solid text-gray-600 dark:text-gray-400", icon)}></i>
        <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <i className={clsx("fa-solid text-xs text-gray-500 transition-transform", isOpen ? "fa-chevron-down" : "fa-chevron-right")}></i>
      </div>
      
      {/* Panel Content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
