import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://3.110.144.203:9010';

interface BackendOrg {
  org_name: string;
  org_type: string;
  org_details: {
    ministry_name: string | null;
    department_name: string | null;
  };
  org_website: string | null;
  org_address: string | null;
}

interface BackendUserResponse {
  id: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  gender: string | null;
  email_id: string;
  personal_email: string | null;
  phone: string | null;
  org: BackendOrg;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`🔍 Fetching user details for ID: ${id}`);

    // Fetch user details from backend API
    const response = await axios.get<BackendUserResponse>(
      `${BACKEND_URL}/v1/users/${id}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    const backendUser = response.data;
    console.log('✅ Backend user details fetched successfully:', {
      id: backendUser.id,
      email: backendUser.email_id,
      org: backendUser.org?.org_name,
    });

    // Transform backend response to frontend format
    const user = {
      id: backendUser.id,
      firstName: backendUser.first_name,
      lastName: backendUser.last_name,
      username: `${backendUser.first_name} ${backendUser.last_name}`,
      email: backendUser.email_id,
      designation: backendUser.designation,
      gender: backendUser.gender,
      personalEmail: backendUser.personal_email,
      phone: backendUser.phone,
      org: backendUser.org,
      organization: backendUser.org?.org_name || 'Unknown Organization',
      status: backendUser.status,
      role: backendUser.role,
      userType: backendUser.user_type,
      productAccess: backendUser.product_access,
      createdOn: backendUser.created_on,
      updatedOn: backendUser.updated_on,
      isFresh: backendUser.is_fresh,
      isProfileUpdated: backendUser.is_profile_updated,
      isDeleted: backendUser.is_deleted,
      tncAccepted: backendUser.tnc_accepted,
      lastLogin: backendUser.last_login,
      pendingReqCount: backendUser.pending_req_count,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || error.message || 'Failed to fetch user details';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
