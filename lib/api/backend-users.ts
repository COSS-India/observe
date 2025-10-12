import axios from 'axios';
import type { Organization } from '@/types/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://3.110.144.203:9010';

interface BackendUserDetails {
  id: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  gender: string | null;
  email_id: string;
  personal_email: string | null;
  phone: string | null;
  org: Organization;
  status: string;
  role: string;
  user_type: string[];
  product_access: string[];
  created_on: string;
  updated_on: string;
  is_fresh: boolean;
  is_profile_updated: boolean;
  is_deleted: boolean;
  deleted_on: string | null;
  tnc_url: string;
  tnc_accepted: boolean;
  reference_documents: unknown[];
  last_login: string | null;
  is_exisiting_user: boolean;
  is_test_user: boolean;
  pending_req_count: number;
  associated_manager: unknown[];
  is_parichay: boolean;
}

export interface TransformedUserDetails {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  designation: string | null;
  gender: string | null;
  personalEmail: string | null;
  phone: string | null;
  org: Organization;
  organization: string;
  status: string;
  role: string;
  userType: string[];
  productAccess: string[];
  createdOn: string;
  updatedOn: string;
  isFresh: boolean;
  isProfileUpdated: boolean;
  isDeleted: boolean;
  tncAccepted: boolean;
  lastLogin: string | null;
  pendingReqCount: number;
}

/**
 * Fetch user details from the backend API
 * @param userId - The user ID or email
 * @param token - Optional authentication token
 * @returns Transformed user details
 */
export async function fetchUserDetails(
  userId: string,
  token?: string
): Promise<TransformedUserDetails> {
  try {
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<BackendUserDetails>(
      `${BACKEND_URL}/v1/users/${userId}`,
      { headers }
    );

    const user = response.data;

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: `${user.first_name} ${user.last_name}`,
      email: user.email_id,
      designation: user.designation,
      gender: user.gender,
      personalEmail: user.personal_email,
      phone: user.phone,
      org: user.org,
      organization: user.org?.org_name || 'Unknown Organization',
      status: user.status,
      role: user.role,
      userType: user.user_type,
      productAccess: user.product_access,
      createdOn: user.created_on,
      updatedOn: user.updated_on,
      isFresh: user.is_fresh,
      isProfileUpdated: user.is_profile_updated,
      isDeleted: user.is_deleted,
      tncAccepted: user.tnc_accepted,
      lastLogin: user.last_login,
      pendingReqCount: user.pending_req_count,
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

/**
 * Client-side function to fetch user details via the Next.js API route
 * @param userId - The user ID or email
 * @returns Transformed user details
 */
export async function fetchUserDetailsClient(userId: string): Promise<TransformedUserDetails> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user details from client:', error);
    throw error;
  }
}
