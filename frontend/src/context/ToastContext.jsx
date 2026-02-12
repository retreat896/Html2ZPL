import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-lg transform transition-all animate-slide-up flex items-center justify-between
                        ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
                        ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
                        ${toast.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
                        `}
                    >
                        <span>{toast.message}</span>
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 hover:opacity-75"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
