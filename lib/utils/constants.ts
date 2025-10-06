export const APP_NAME = 'Grafana Admin';
export const APP_DESCRIPTION = 'Grafana Management Application';

// Navigation items
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'User Management',
    href: '/dashboard/users',
    icon: 'Users',
  },
  {
    title: 'Team Management',
    href: '/dashboard/teams',
    icon: 'UsersRound',
  },
  {
    title: 'Organization Management',
    href: '/dashboard/organizations',
    icon: 'Building2',
  },
  {
    title: 'My Dashboards',
    href: '/dashboard/my-dashboards',
    icon: 'Layout',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
  },
];

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

// Dashboard refresh intervals
export const REFRESH_INTERVALS = [
  { label: 'Off', value: '' },
  { label: '5s', value: '5s' },
  { label: '10s', value: '10s' },
  { label: '30s', value: '30s' },
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
];

// Time ranges
export const TIME_RANGES = [
  { label: 'Last 5 minutes', value: 'now-5m' },
  { label: 'Last 15 minutes', value: 'now-15m' },
  { label: 'Last 30 minutes', value: 'now-30m' },
  { label: 'Last 1 hour', value: 'now-1h' },
  { label: 'Last 3 hours', value: 'now-3h' },
  { label: 'Last 6 hours', value: 'now-6h' },
  { label: 'Last 12 hours', value: 'now-12h' },
  { label: 'Last 24 hours', value: 'now-24h' },
  { label: 'Last 2 days', value: 'now-2d' },
  { label: 'Last 7 days', value: 'now-7d' },
  { label: 'Last 30 days', value: 'now-30d' },
];

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  GRAFANA: {
    USERS: '/api/grafana/users',
    ORGS: '/api/grafana/orgs',
    TEAMS: '/api/grafana/teams',
    DASHBOARDS: '/api/grafana/dashboards',
  },
};
