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
  name?: string;
  createdAt?: string;
}
