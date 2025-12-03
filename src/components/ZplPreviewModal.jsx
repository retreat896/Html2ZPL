import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { zplToBase64Async } from 'zpl-renderer-js';

export default function ZplPreviewModal() {
    const { isPreviewOpen, setIsPreviewOpen, generateZPL, activeLabelId, activeLabel } = useProject();
    const [zplCode, setZplCode] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isPreviewOpen && activeLabelId) {
            const code = generateZPL(activeLabelId);
            if (code && code.trim().length > 0) {
                setZplCode(code);
                fetchPreview(code);
            } else {
                setZplCode('');
                setError('No ZPL code generated');
            }
        } else {
            // Cleanup
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            setImageUrl(null);
            setZplCode('');
            setError(null);
        }
    }, [isPreviewOpen, activeLabelId]);

    const fetchPreview = async (zpl) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Local Rendering using zpl-renderer-js
            const { width, height, unit, dpmm } = activeLabel.settings;
            
            // Convert dimensions to mm if needed
            const widthMm = unit === 'inch' ? width * 25.4 : width;
            const heightMm = unit === 'inch' ? height * 25.4 : height;

            console.log(`Rendering ZPL: ${widthMm}mm x ${heightMm}mm @ ${dpmm}dpmm`);
            
            // Signature: zplToBase64Async(zpl, widthMm, heightMm, dpmm)
            const png = await zplToBase64Async(zpl, widthMm, heightMm, dpmm);
            
            if (png && png.startsWith('data:')) {
                setImageUrl(png);
            } else {
                setImageUrl(`data:image/png;base64,${png}`);
            }

        } catch (err) {
            setError('Failed to render ZPL locally');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isPreviewOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-6xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">ZPL Preview</h2>
                    <button 
                        onClick={() => setIsPreviewOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Code */}
                    <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Generated ZPL
                        </div>
                        <textarea 
                            readOnly
                            value={zplCode}
                            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
                        />
                    </div>

                    {/* Right: Preview */}
                    <div className="w-1/2 flex flex-col bg-gray-200 dark:bg-gray-900">
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 uppercase tracking-wider flex justify-between items-center">
                            <span>Preview</span>
                            {isLoading && <span className="text-blue-500">Loading...</span>}
                        </div>
                        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                            {error ? (
                                <div className="text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="font-medium">Preview Failed</p>
                                    <p className="text-sm opacity-80">{error}</p>
                                </div>
                            ) : imageUrl ? (
                                <img 
                                    src={imageUrl} 
                                    alt="ZPL Preview" 
                                    className="max-w-full max-h-full shadow-lg border border-gray-300 dark:border-gray-600 bg-white"
                                />
                            ) : (
                                <div className="text-gray-400 dark:text-gray-600">
                                    Generating preview...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(zplCode);
                            // Could add a toast here
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Copy ZPL
                    </button>
                    <button 
                        onClick={() => setIsPreviewOpen(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
