export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'viewer';
  name?: string;
  createdAt?: string;
}
