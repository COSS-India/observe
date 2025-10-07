'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Edit, Save, X, Lock } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || '',
    organization: user?.organization || '',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role || '',
      organization: user?.organization || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl space-xl">
      <div className="space-tight">
        <h1 className="text-heading-1 text-foreground">Settings</h1>
        <p className="text-body text-gray-600">
          Manage your application settings and preferences
        </p>
      </div>

            <Card className="card-widget max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
          <CardTitle className="text-card-title text-foreground">Account Information</CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-9 px-4 text-body border-border hover:bg-accent"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label className="text-small font-semibold text-gray-600 uppercase tracking-wide">
                Username
              </Label>
              {isEditing ? (
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-10 text-body"
                />
              ) : (
                <div className="text-body text-foreground py-2">{user?.username || 'N/A'}</div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2 border-t border-gray-200 pt-6">
              <Label className="text-small font-semibold text-gray-600 uppercase tracking-wide">
                Email Address
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 text-body"
                />
              ) : (
                <div className="text-body text-foreground py-2">{user?.email || 'N/A'}</div>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2 border-t border-gray-200 pt-6">
              <Label className="text-small font-semibold text-gray-600 uppercase tracking-wide">
                Role
              </Label>
              {isEditing ? (
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-10 text-body"
                />
              ) : (
                <div className="text-body text-foreground py-2 capitalize">{user?.role || 'N/A'}</div>
              )}
            </div>

            {/* Organization Field */}
            <div className="space-y-2 border-t border-gray-200 pt-6">
              <Label className="text-small font-semibold text-gray-600 uppercase tracking-wide">
                Organization
              </Label>
              {isEditing ? (
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="h-10 text-body"
                />
              ) : (
                <div className="text-body text-foreground py-2">{user?.organization || 'N/A'}</div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  className="h-10 px-6 text-body"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 px-6 text-body border-border hover:bg-accent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}

            {/* Change Password Link */}
            {!isEditing && (
              <div className="pt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="h-9 px-0 text-body text-primary hover:text-primary hover:bg-transparent"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
