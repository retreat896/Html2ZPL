import React from 'react';

export default function ResetConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                        <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                    </div>
                    
                    <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                        Reset Application?
                    </h3>
                    
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                        This will log you out and clear all locally stored data (settings, local templates). 
                        Cloud data will not be affected. 
                        <br/><br/>
                        <span className="font-semibold text-red-600 dark:text-red-400">Are you sure you want to proceed?</span>
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            Yes, Reset Everything
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
