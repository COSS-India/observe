'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Team, TeamMember, GrafanaUser } from '@/types/grafana';

interface TeamMembersPageProps {
  team: Team;
  onBack: () => void;
}

export function TeamMembersManager({ team, onBack }: TeamMembersPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<GrafanaUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await grafanaAPI.getTeamMembers(team.id);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to fetch team members');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  const fetchAllUsers = async () => {
    try {
      const data = await grafanaAPI.listUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAllUsers();
  }, [fetchMembers]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      setLoading(true);
      await grafanaAPI.addUserToTeam(team.id, parseInt(selectedUserId));
      toast.success('Member added successfully');
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      await fetchMembers();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err?.response?.data?.message || 'Failed to add member');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      setLoading(true);
      await grafanaAPI.removeUserFromTeam(team.id, userId);
      toast.success('Member removed successfully');
      await fetchMembers();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err?.response?.data?.message || 'Failed to remove member');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out users who are already members
  const availableUsers = allUsers.filter(
    (user) => user && user.id && !members.some((member) => member.userId === user.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage members of &quot;{team.name}&quot;
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>
                Users who are part of this team
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && members.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No members in this team. Add members to get started.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .filter((member) => member && member.userId)
                    .map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell className="font-medium">{member.login || 'N/A'}</TableCell>
                        <TableCell>{member.email || 'N/A'}</TableCell>
                        <TableCell>{member.login || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {member.permission === 4 ? 'Admin' : member.permission === 2 ? 'Edit' : 'View'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={loading}
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user to add to &quot;{team.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No available users</div>
                  ) : (
                    availableUsers
                      .filter((user) => user && user.id && user.name && user.email)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId || loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
