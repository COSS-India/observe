export interface Team {
  id: number;
  name: string;
  email?: string;
  grafanaTeamId: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'viewer';
  organization: string; // org.org_name from API
  orgType?: string; // org.org_type from API
  userType?: string[]; // user_type from API
  firstName?: string;
  lastName?: string;
  designation?: string;
  status?: string;
  grafanaTeamId?: number; // Currently selected team's Grafana ID
  teams?: Team[]; // Array of teams user can access via organization
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