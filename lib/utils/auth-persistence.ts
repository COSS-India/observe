/**
 * Utility functions to help with authentication persistence
 * and prevent random logouts
 */

import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get auth state from localStorage with error handling
 */
export function getAuthFromStorage(): AuthState | null {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }

    const stored = localStorage.getItem('auth-storage');
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return parsed?.state || null;
  } catch (error) {
    console.error('Error reading auth from storage:', error);
    return null;
  }
}

/**
 * Verify auth state is valid
 */
export function isAuthStateValid(authState: AuthState | null): boolean {
  if (!authState) return false;
  
  return !!(
    authState.user &&
    authState.token &&
    authState.isAuthenticated === true
  );
}

/**
 * Force save auth state to localStorage
 */
export function forceUpdateAuthStorage(user: User, token: string): void {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('Cannot save auth state: localStorage not available');
      return;
    }

    const authState = {
      state: {
        user,
        token,
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorage.setItem('auth-storage', JSON.stringify(authState));
    console.log('Auth state saved to localStorage');
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
}

/**
 * Clear auth storage
 */
export function clearAuthStorage(): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem('auth-storage');
      console.log('Auth storage cleared');
    }
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}
