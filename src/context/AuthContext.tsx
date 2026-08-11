import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, NotificationItem } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<User>;
  signup: (data: Partial<User>) => Promise<User>;
  logout: () => Promise<void>;
  switchUserRole: (newRole: UserRole) => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.getCurrentUser();
        setUser(u);
        if (u) {
          const notifs = await api.getNotifications(u.id);
          setNotifications(notifs);
        }
      } catch (err) {
        console.error('Failed to load user state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const refreshNotifications = async () => {
    if (user) {
      const notifs = await api.getNotifications(user.id);
      setNotifications(notifs);
    }
  };

  const login = async (email: string, targetRole?: UserRole) => {
    const loggedInUser = await api.login(email, targetRole);
    setUser(loggedInUser);
    const notifs = await api.getNotifications(loggedInUser.id);
    setNotifications(notifs);
    return loggedInUser;
  };

  const signup = async (data: Partial<User>) => {
    const newUser = await api.signup(data);
    setUser(newUser);
    setNotifications([]);
    return newUser;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setNotifications([]);
  };

  const switchUserRole = async (newRole: UserRole) => {
    let targetEmail = 'patient@skmh.org';
    if (newRole === 'admin' || newRole === 'super_admin') {
      targetEmail = 'SHREEKRISHNA';
    } else if (newRole === 'receptionist') {
      targetEmail = 'reception.opd@skmh.org';
    } else if (newRole === 'doctor') {
      targetEmail = 'rajesh.krishna@skmh.org';
    }

    const loggedUser = await api.login(targetEmail, newRole);
    setUser(loggedUser);
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'patient',
        loading,
        login,
        signup,
        logout,
        switchUserRole,
        notifications,
        unreadCount,
        markNotificationRead,
        refreshNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
