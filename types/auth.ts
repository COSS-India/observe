export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'viewer';
  organization: string;
  isSuperAdmin?: boolean; // True only for karmayogi user with full Grafana API access
  grafanaUserId?: number; // Grafana user ID for folder-based dashboard access
  createdAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
