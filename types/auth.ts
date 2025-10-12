export interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'viewer';
  organization: string;
  grafanaOrgId?: number; // Grafana organization ID for organization-based access
  createdAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  captcha_text?: string;
  captcha_id?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}