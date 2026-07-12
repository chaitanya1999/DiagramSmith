import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  variant: 'success' | 'danger' | 'info';
}

let toastIdCounter = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, variant: 'success' | 'danger' | 'info' = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}