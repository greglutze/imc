'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'error') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className="pointer-events-auto animate-fade-in cursor-pointer max-w-sm"
            style={{
              animation: 'fadeUp 0.3s ease-out',
            }}
          >
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium
                ${toast.type === 'error' ? 'bg-[#1A1A1A] text-white' : ''}
                ${toast.type === 'success' ? 'bg-[#1A1A1A] text-white' : ''}
                ${toast.type === 'info' ? 'bg-[#1A1A1A] text-white' : ''}
              `}
            >
              <span className="shrink-0">
                {toast.type === 'error' && '✕'}
                {toast.type === 'success' && '✓'}
                {toast.type === 'info' && '→'}
              </span>
              <span>{toast.text}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
