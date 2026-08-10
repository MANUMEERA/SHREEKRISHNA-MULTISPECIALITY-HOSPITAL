import React, { createContext, useContext, useState, useCallback } from 'react';
import { AudioNotificationToast, playNotificationChime } from '../components/AudioNotificationToast';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'warning' | 'info';
  timestamp: string;
}

interface NotificationToastContextType {
  showToast: (title: string, description: string, type?: 'success' | 'warning' | 'info') => void;
  activeToast: ToastMessage | null;
  clearToast: () => void;
}

const NotificationToastContext = createContext<NotificationToastContextType | undefined>(undefined);

export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((title: string, description: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveToast(newToast);
    playNotificationChime();
  }, []);

  const clearToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <NotificationToastContext.Provider value={{ showToast, activeToast, clearToast }}>
      {children}
      <AudioNotificationToast toast={activeToast} onClose={clearToast} />
    </NotificationToastContext.Provider>
  );
};

export const useNotificationToast = () => {
  const context = useContext(NotificationToastContext);
  if (!context) {
    throw new Error('useNotificationToast must be used within a NotificationToastProvider');
  }
  return context;
};
