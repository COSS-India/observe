'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Team } from '@/types/auth';
import { UsersRound } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamChange: (team: Team) => void;
}

export function TeamSelector({ teams, selectedTeam, onTeamChange }: TeamSelectorProps) {
  if (!teams || teams.length === 0) {
    return null;
  }

  // Don't show selector if user only has one team
  if (teams.length === 1) {
    return null;
  }

  const handleValueChange = (teamId: string) => {
    const team = teams.find((t) => t.id.toString() === teamId);
    if (team) {
      onTeamChange(team);
    }
  };

  return (
    <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <UsersRound className="h-5 w-5" />
          <Label htmlFor="team-selector" className="text-sm font-medium">
            Select Team:
          </Label>
        </div>
        <Select
          value={selectedTeam?.id.toString() || ''}
          onValueChange={handleValueChange}
        >
          <SelectTrigger id="team-selector" className="w-[300px]">
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{team.name}</span>
                  {team.email && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {team.email}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedTeam && (
        <p className="mt-2 text-sm text-muted-foreground">
          Viewing dashboards and folders for <strong>{selectedTeam.name}</strong>
        </p>
      )}
    </div>
  );
}
