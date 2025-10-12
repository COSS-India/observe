"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Phone, User, Briefcase } from "lucide-react";

/**
 * UserProfileCard component displays the current user's profile information
 * including their organization details fetched from the backend API.
 * 
 * This component demonstrates how to use the enhanced user object
 * that includes organization details from the backend API.
 */
export function UserProfileCard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {user.designation && (
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Designation</p>
                <p className="text-sm text-muted-foreground">
                  {user.designation}
                </p>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Organization Info */}
        {user.org && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Organization</p>
                  <p className="text-sm text-muted-foreground">
                    {user.org.org_name}
                  </p>
                </div>
              </div>

              <div className="mt-3 ml-7 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm">{user.org.org_type}</p>
                </div>

                {user.org.org_details?.ministry_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Ministry
                    </p>
                    <p className="text-sm">
                      {user.org.org_details.ministry_name}
                    </p>
                  </div>
                )}

                {user.org.org_details?.department_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Department
                    </p>
                    <p className="text-sm">
                      {user.org.org_details.department_name}
                    </p>
                  </div>
                )}

                {user.org.org_website && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Website
                    </p>
                    <a
                      href={user.org.org_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {user.org.org_website}
                    </a>
                  </div>
                )}

                {user.org.org_address && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="text-sm">{user.org.org_address}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Additional Info */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user.role}</span>
          </div>

          {user.status && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{user.status}</span>
            </div>
          )}

          {user.userType && user.userType.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User Type</span>
              <span className="font-medium">{user.userType.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Grafana Info */}
        {(user.grafanaOrgId || user.grafanaUserId) && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Grafana Integration
            </p>
            <div className="space-y-1 text-sm">
              {user.grafanaOrgId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Org ID</span>
                  <span>{user.grafanaOrgId}</span>
                </div>
              )}
              {user.grafanaUserId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span>{user.grafanaUserId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
