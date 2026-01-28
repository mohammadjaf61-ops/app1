'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { apiClient } from './api-client';

interface User {
  id: string;
  phone: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'PICKER' | 'DRIVER' | 'CASHIER';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await apiClient.get<User>('/auth/me');
      setUser(userData);
    } catch {
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (phone: string, otp: string) => {
    const response = await apiClient.post<{ accessToken: string; user: User }>('/auth/verify-otp', {
      phone,
      otp,
    });

    apiClient.setToken(response.accessToken);
    setUser(response.user);
    router.push('/dashboard');
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  const hasRole = (...roles: string[]) => {
    if (!user) {
      return false;
    }
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook for RBAC - checks if current user has required roles
 */
export function useRequireRole(...requiredRoles: string[]) {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (!isLoading && user && !hasRole(...requiredRoles)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, hasRole, requiredRoles, router]);

  return { user, isLoading, isAuthorized: hasRole(...requiredRoles) };
}
