import type { User } from '@/types/auth';

/**
 * Check if the user is a superadmin
 * Superadmins have full access to all Grafana APIs and administrative features
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'superadmin';
}

/**
 * Check if the user is an admin (organization-level admin)
 * Admins may have limited administrative capabilities within their organization
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if the user is a viewer
 * Viewers have read-only access to their dashboards
 */
export function isViewer(user: User | null): boolean {
  return user?.role === 'viewer';
}

/**
 * Check if the user can access admin features
 * Currently only superadmin has access
 */
export function canAccessAdminFeatures(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can manage users
 */
export function canManageUsers(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can manage organizations
 */
export function canManageOrganizations(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can manage teams
 */
export function canManageTeams(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can manage folders
 */
export function canManageFolders(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can access organization users management
 */
export function canManageOrganizationUsers(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can access settings
 */
export function canAccessSettings(user: User | null): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if the user can only view their own dashboards
 */
export function canOnlyViewOwnDashboards(user: User | null): boolean {
  return !isSuperAdmin(user);
}

/**
 * Get accessible routes for a user
 */
export function getAccessibleRoutes(user: User | null): string[] {
  const baseRoutes = ['/dashboard', '/dashboard/my-dashboards'];
  
  if (isSuperAdmin(user)) {
    return [
      ...baseRoutes,
      '/dashboard/users',
      '/dashboard/organization-users',
      '/dashboard/teams',
      '/dashboard/organizations',
      '/dashboard/folders',
      '/dashboard/settings',
    ];
  }
  
  return baseRoutes;
}

/**
 * Check if user has access to a specific route
 */
export function hasAccessToRoute(user: User | null, route: string): boolean {
  const accessibleRoutes = getAccessibleRoutes(user);
  return accessibleRoutes.some(r => route === r || route.startsWith(r + '/'));
}
