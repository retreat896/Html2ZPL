import { toast } from 'sonner';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

export const initConsoleWrapper = () => {
  console.error = (...args) => {
    originalConsoleError(...args);
    // Convert args to string for display
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    toast.error(message);
  };

  console.warn = (...args) => {
    originalConsoleWarn(...args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    toast.warning(message);
  };
};
