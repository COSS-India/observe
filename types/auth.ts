export interface OrgDetails {
  ministry_name: string | null;
  department_name: string | null;
}

export interface Organization {
  org_name: string;
  org_type: string;
  org_details: OrgDetails;
  org_website: string | null;
  org_address: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'viewer';
  organization: string;
  grafanaOrgId?: number; // Grafana organization ID for organization-based access
  grafanaUserId?: number; // Grafana user ID for permission-based access (non-super admin only)
  createdAt?: string;
  // Extended user details from backend API
  firstName?: string;
  lastName?: string;
  designation?: string | null;
  gender?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  org?: Organization;
  status?: string;
  userType?: string[];
  productAccess?: string[];
  isFresh?: boolean;
  isProfileUpdated?: boolean;
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