import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  profile: {
    id: string;
    name: string;
    role: string;
    email: string;
    phoneNumber?: string;
    department?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token and validate it
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await apiClient.getCurrentUser();
          if (response.data && typeof response.data === 'object' && 'user' in response.data) {
            const userData = (response.data as { user: User }).user;
            setUser(userData);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = (response.data as { user: User; token: string }).user;
        setUser(userData);
        return { error: null };
      } else {
        return { error: new Error('Login failed') };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error instanceof Error ? error : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = (response.data as { user: User }).user;
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, user might be logged out
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 