import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, NotificationItem } from '../types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

interface SignupData {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  blood_group?: string;
  street_address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  past_medical_history?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact?: string;
  emergency_phone?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => Promise<void>;
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

  const fetchAndSetUser = async (userId: string) => {
    try {
      const u = await api.getCurrentUserById(userId);
      setUser(u);
      if (u) {
        const notifs = await api.getNotifications(u.id);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (!supabase) {
          const u = await api.getCurrentUser();
          if (mounted) setUser(u);
          return;
        }

        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Supabase auth.getUser error:', error.message);
        }
        if (authUser && mounted) {
          await fetchAndSetUser(authUser.id);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          await fetchAndSetUser(session.user.id);
        } else {
          setUser(null);
          setNotifications([]);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const refreshNotifications = async () => {
    if (user) {
      const notifs = await api.getNotifications(user.id);
      setNotifications(notifs);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const loggedInUser = await api.login(email, password);
      setUser(loggedInUser);
      const notifs = await api.getNotifications(loggedInUser.id);
      setNotifications(notifs);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setLoading(true);
    try {
      const newUser = await api.signup(data);
      setUser(newUser);
      setNotifications([]);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
      setUser(null);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
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

