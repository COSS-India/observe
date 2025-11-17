import { NextRequest, NextResponse } from 'next/server';
import grafanaClient from '@/lib/grafana-client';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9010';

async function fetchTeamByOrganization(
  organizationName: string
): Promise<{ teamId?: number }> {
  try {
    console.log(`🔍 Looking for team matching organization: "${organizationName}"`);
    
    // Get all teams from Grafana
    const response = await grafanaClient.get('/api/teams/search', {
      params: { 
        perpage: 1000,
      },
    });

    const teams = response.data.teams || [];
    console.log(`📋 Found ${teams.length} total teams in Grafana`);
    
    // Find team with matching name (case-insensitive)
    const matchingTeam = teams.find((t: { name: string; id: number }) => 
      t.name.toLowerCase() === organizationName.toLowerCase()
    );

    if (matchingTeam) {
      console.log(`✅ Team found! Name: "${matchingTeam.name}", ID: ${matchingTeam.id}`);
      return { teamId: matchingTeam.id };
    }

    console.warn(`❌ No team found with name "${organizationName}"`);
    return { teamId: undefined };
  } catch (error) {
    console.error('❌ Error fetching team:', error);
    return { teamId: undefined };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, captcha_text, captcha_id } = await request.json();

    // Validate captcha is provided
    if (!captcha_text || !captcha_id) {
      return NextResponse.json(
        { error: 'Captcha is required' },
        { status: 400 }
      );
    }

    // FastAPI backend authentication with captcha verification
    try {
      console.log('🔄 Attempting FastAPI backend authentication...');
      const backendResponse = await axios.post(`${BACKEND_URL}/v1/signin`, {
        email: username,
        password: password,
        captcha_text: captcha_text,
        captcha_id: captcha_id
      });

      const backendUser = backendResponse.data;
      console.log('✅ FastAPI authentication successful:', { email: backendUser.email, role: backendUser.role });

      // Extract user ID from JWT token
      let userId = null;
      if (backendUser.token) {
        try {
          // Decode JWT token to get user ID (sub field)
          const tokenPayload = JSON.parse(Buffer.from(backendUser.token.split('.')[1], 'base64').toString());
          userId = tokenPayload.sub;
          console.log(`🔍 Extracted user ID from token: ${userId}`);
        } catch (tokenError) {
          console.error('❌ Error decoding token:', tokenError);
        }
      }

      // Fetch complete user details using the user ID
      let userDetails = null;
      if (userId) {
        try {
          console.log(`🔄 Fetching user details for ID: ${userId}`);
          const userDetailsResponse = await axios.get(`${BACKEND_URL}/v1/users/${userId}`);
          userDetails = userDetailsResponse.data;
          console.log('✅ User details fetched successfully:', {
            orgName: userDetails.org?.org_name,
            orgType: userDetails.org?.org_type
          });
        } catch (userError) {
          console.error('❌ Error fetching user details:', userError);
        }
      }
      console.log("📋 Backend User Response:", backendUser);

      // Extract organization name from user details or fallback to backend user data
      const organizationName = userDetails?.org?.org_name ||
                              backendUser.organization ||
                              backendUser.org?.org_name ||
                              'Unknown Organization';

      console.log('🏢 Organization mapping:', {
        fromUserDetails: userDetails?.org?.org_name,
        fromBackendUser: backendUser.organization,
        fromBackendUserOrg: backendUser.org?.org_name,
        finalOrganization: organizationName,
        orgType: userDetails?.org?.org_type || backendUser.org_type
      });

      // Map role with detailed logging (case-insensitive comparison)
      const normalizedRole = (backendUser.role || '').toLowerCase().replace(/\s+/g, '');

      console.log('🔑 Role mapping:', {
        backendRole: backendUser.role,
        normalizedRole: normalizedRole,
        backendRoleType: typeof backendUser.role,
        isSuperadmin: normalizedRole === 'superadmin',
        isAdmin: normalizedRole === 'admin',
      });

      const mappedRole = normalizedRole === 'superadmin' ? 'superadmin' :
                        normalizedRole === 'admin' ? 'admin' : 'viewer';

      console.log('✅ Mapped role:', mappedRole);

      // Map backend user to frontend format
      const user = {
        id: backendUser.email, // Use email as ID for simplicity
        username: backendUser.username || backendUser.email.split('@')[0],
        email: backendUser.email,
        role: mappedRole as 'superadmin' | 'admin' | 'viewer',
        organization: organizationName,
        orgType: userDetails?.org?.org_type || backendUser.org_type,
        userType: userDetails?.user_type || [],
        firstName: userDetails?.first_name || backendUser.first_name,
        lastName: userDetails?.last_name || backendUser.last_name,
        designation: userDetails?.designation,
        status: userDetails?.status
      };

      // Fetch user's teams directly from Grafana (this is the primary source of truth)
      let teams = [];
      let defaultGrafanaTeamId;
      let userGrafanaTeams = [];

      try {
        console.log(`🔍 Looking up Grafana user by email: ${user.email}`);
        const lookupResponse = await grafanaClient.get(`/api/users/lookup?loginOrEmail=${encodeURIComponent(user.email)}`);
        const grafanaUser = lookupResponse.data;
        console.log(`✅ Found Grafana user: ${grafanaUser.id}, ${grafanaUser.email}`);

        // Get teams for this Grafana user - this is the authoritative source
        const userTeamsResponse = await grafanaClient.get(`/api/users/${grafanaUser.id}/teams`);
        userGrafanaTeams = userTeamsResponse.data || [];
        console.log(`✅ User is a member of ${userGrafanaTeams.length} teams in Grafana`);

        // Handle team fetching based on role
        if (user.role === 'superadmin') {
          // For superadmin, try to fetch organization teams from backend
          try {
            console.log(`🔄 Fetching teams for organization: "${user.organization}" (superadmin)`);
            const teamsResponse = await axios.get(
              `${BACKEND_URL}/v1/organizations/${encodeURIComponent(user.organization)}/teams`
            );
            teams = teamsResponse.data || [];
            console.log(`✅ Found ${teams.length} teams for organization "${user.organization}"`);
          } catch (orgTeamsError) {
            console.error('❌ Failed to fetch organization teams for superadmin:', orgTeamsError);
            // Fallback to user's Grafana teams even for superadmin
            teams = userGrafanaTeams.map((grafanaTeam: any) => ({
              id: grafanaTeam.id,
              name: grafanaTeam.name,
              grafanaTeamId: grafanaTeam.id,
              email: grafanaTeam.email || ''
            }));
            console.log(`⚠️ Fallback: Using user's ${teams.length} Grafana teams directly`);
          }
        } else if (user.role === 'viewer') {
          // For customer/viewer role: intersect backend organization teams with Grafana user teams
          try {
            console.log(`🔄 Fetching organization teams from backend for customer/viewer role...`);
            const orgTeamsResponse = await axios.get(
              `${BACKEND_URL}/v1/organizations/${encodeURIComponent(user.organization)}/teams`
            );
            const orgTeams = orgTeamsResponse.data || [];
            console.log(`✅ Found ${orgTeams.length} teams for organization "${user.organization}" in backend`);

            // Create a map of Grafana team IDs that the user has access to
            const userGrafanaTeamIds = new Set(userGrafanaTeams.map((team: any) => team.id));
            console.log(`📋 User has access to Grafana team IDs: ${Array.from(userGrafanaTeamIds).join(', ')}`);
            console.log(`📋 Backend org teams have grafanaTeamIds: ${orgTeams.map((t: any) => t.grafanaTeamId).join(', ')}`);

            // Filter organization teams to only include those the user has access to in Grafana
            teams = orgTeams.filter((orgTeam: any) => {
              const hasAccess = userGrafanaTeamIds.has(orgTeam.grafanaTeamId);
              if (hasAccess) {
                console.log(`✅ Team "${orgTeam.name}" (Grafana ID: ${orgTeam.grafanaTeamId}) is mapped in backend and user has access`);
              } else {
                console.log(`❌ Team "${orgTeam.name}" (Grafana ID: ${orgTeam.grafanaTeamId}) is in backend but user doesn't have Grafana access`);
              }
              return hasAccess;
            });

            console.log(`🔒 Customer/Viewer role: Showing ${teams.length} teams (intersection of ${orgTeams.length} org teams and ${userGrafanaTeams.length} user Grafana teams)`);

            // If no intersection found, use Grafana teams as fallback (but still filter by organization if possible)
            if (teams.length === 0 && userGrafanaTeams.length > 0) {
              console.log(`⚠️ No intersection found, falling back to Grafana teams with organization filtering`);
              // Even in fallback, try to filter by organization name if team names match organization
              const orgNameLower = user.organization.toLowerCase();
              teams = userGrafanaTeams
                .filter((grafanaTeam: any) => {
                  // Only include teams that match organization name or are explicitly in org teams
                  return grafanaTeam.name.toLowerCase().includes(orgNameLower) || 
                         orgTeams.some((ot: any) => ot.grafanaTeamId === grafanaTeam.id);
                })
                .map((grafanaTeam: any) => ({
                  id: grafanaTeam.id,
                  name: grafanaTeam.name,
                  grafanaTeamId: grafanaTeam.id,
                  email: grafanaTeam.email || ''
                }));
              
              // If still no teams after filtering, log warning but don't show all teams
              if (teams.length === 0) {
                console.log(`⚠️ No organization-filtered teams found for customer/viewer`);
              }
            }
          } catch (orgTeamsError) {
            console.error('❌ Failed to fetch organization teams for customer role:', orgTeamsError);
            // Fallback to user's Grafana teams if backend call fails
            // But still try to filter by organization name
            const orgNameLower = user.organization.toLowerCase();
            teams = userGrafanaTeams
              .filter((grafanaTeam: any) => {
                // Filter teams by organization name match
                return grafanaTeam.name.toLowerCase().includes(orgNameLower);
              })
              .map((grafanaTeam: any) => ({
                id: grafanaTeam.id,
                name: grafanaTeam.name,
                grafanaTeamId: grafanaTeam.id,
                email: grafanaTeam.email || ''
              }));
            
            console.log(`⚠️ Fallback: Using ${teams.length} organization-filtered Grafana teams for customer/viewer`);
          }
        } else {
          // For admin and other roles, use their actual Grafana teams
          teams = userGrafanaTeams.map((grafanaTeam: any) => ({
            id: grafanaTeam.id, // Use Grafana team ID as the ID
            name: grafanaTeam.name,
            grafanaTeamId: grafanaTeam.id,
            email: grafanaTeam.email || ''
          }));
          console.log(`🔒 Admin role: Using user's ${teams.length} Grafana teams directly`);
        }

        // Set default team (first team if available)
        if (teams.length > 0) {
          defaultGrafanaTeamId = teams[0].grafanaTeamId;
          console.log(`📌 Default team selected: ${teams[0].name} (Grafana ID: ${defaultGrafanaTeamId})`);
        } else {
          console.log(`⚠️ No teams available for user`);
        }
      } catch (teamsError) {
        console.error('❌ Failed to fetch teams:', teamsError);

        // Fallback: try to fetch team using old name-matching logic
        console.log('🔄 Falling back to Grafana name-matching...');
        const grafanaData = await fetchTeamByOrganization(user.organization);
        if (grafanaData.teamId) {
          console.log(`✅ Fallback successful: Found team via name-matching (ID: ${grafanaData.teamId})`);
          
          // Even in fallback, check if user is member of this team
          let isUserMemberOfFallbackTeam = false;
          if (user.role !== 'superadmin') {
            try {
              const lookupResponse = await grafanaClient.get(`/api/users/lookup?loginOrEmail=${encodeURIComponent(user.email)}`);
              const grafanaUser = lookupResponse.data;
              const userTeamsResponse = await grafanaClient.get(`/api/users/${grafanaUser.id}/teams`);
              const userGrafanaTeams = userTeamsResponse.data || [];
              isUserMemberOfFallbackTeam = userGrafanaTeams.some((team: any) => team.id === grafanaData.teamId);
            } catch (fallbackCheckError) {
              console.error('❌ Error checking user membership for fallback team:', fallbackCheckError);
              isUserMemberOfFallbackTeam = false;
            }
          } else {
            isUserMemberOfFallbackTeam = true; // Superadmin has access to all teams
          }

          if (isUserMemberOfFallbackTeam) {
            defaultGrafanaTeamId = grafanaData.teamId;
            // Create a pseudo-team object for consistency
            teams = [{
              id: 0,
              name: user.organization,
              grafanaTeamId: grafanaData.teamId
            }];
            console.log(`✅ User has access to fallback team`);
          } else {
            console.log(`❌ User does not have access to fallback team`);
            teams = [];
          }
        }
      }

      return NextResponse.json({
        user: {
          ...user,
          teams: teams,
          grafanaTeamId: defaultGrafanaTeamId,
        },
        token: backendUser.token, // Use backend token
      });

    } catch (backendError) {
      console.log('❌ FastAPI authentication failed');
      if (axios.isAxiosError(backendError)) {
        console.error('Backend error:', backendError.response?.data || backendError.message);
        return NextResponse.json(
          { error: backendError.response?.data?.detail || 'Invalid credentials or captcha' },
          { status: 401 }
        );
      } else {
        console.error('Backend error:', backendError);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
