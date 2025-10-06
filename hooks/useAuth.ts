'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { LoginCredentials } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, login: loginStore, logout: logoutStore, setUser, setToken } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await loginStore(credentials);
        router.push('/dashboard');
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
    setToken,
  };
}
