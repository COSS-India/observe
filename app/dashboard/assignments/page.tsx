'use client';

import React from 'react';
import { TeamDashboardAssignment } from '@/components/teams/TeamDashboardAssignment';

export default function DashboardAssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Assignments</h1>
        <p className="text-muted-foreground mt-2">
          Configure which dashboards are accessible to each team
        </p>
      </div>

      <TeamDashboardAssignment />
    </div>
  );
}
