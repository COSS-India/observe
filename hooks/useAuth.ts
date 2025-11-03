'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import type { LoginCredentials } from '@/types/auth';
import { 
  getAuthFromStorage, 
  isAuthStateValid,
  forceUpdateAuthStorage 
} from '@/lib/utils/auth-persistence';

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, login: loginStore, logout: logoutStore, setUser, updateUser, setToken } = useAuthStore();

  // Check and restore auth state on mount if needed
  useEffect(() => {
    // If store says we're not authenticated, check localStorage
    if (!isAuthenticated) {
      const storedAuth = getAuthFromStorage();
      if (storedAuth && isAuthStateValid(storedAuth)) {
        console.log('Restoring auth state from localStorage');
        if (storedAuth.user && storedAuth.token) {
          setUser(storedAuth.user);
          setToken(storedAuth.token);
        }
      }
    }
  }, [isAuthenticated, setUser, setToken]);

  // Periodically verify auth state is persisted
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const interval = setInterval(() => {
        const storedAuth = getAuthFromStorage();
        if (!isAuthStateValid(storedAuth)) {
          console.warn('Auth state lost from storage, restoring...');
          forceUpdateAuthStorage(user, token);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, token]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await loginStore(credentials);
        router.push('/dashboard/my-dashboards');
      } catch (error) {
        throw error;
      }
    },
    [loginStore, router]
  );

  const logout = useCallback(() => {
    logoutStore();
    router.push('/login');
  }, [logoutStore, router]);

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setUser,
    updateUser,
    setToken,
  };
}
