export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'viewer';
  organization: string;
  isSuperAdmin?: boolean; // True only for karmayogi user with full Grafana API access
  name?: string;
  createdAt?: string;
}
