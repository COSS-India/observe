'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, User, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleThemeToggle } from '@/components/simple-theme-toggle';
import { isSuperAdmin } from '@/lib/utils/permissions';

export function TopBar({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { user, logout } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="min-h-20 border-border bg-background flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-8 py-6 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 self-start"
        >
          <Menu className="h-5 w-5 sm:h-5 sm:w-5" />
        </Button>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Primary Greeting */}
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-none tracking-tight">
            Hello, {user?.username || 'User'}
          </h1>
          {/* Role Badge with improved styling */}
          {isUserSuperAdmin ? (
            <Badge 
              variant="outline" 
              className="flex items-center align-middle gap-1.5 px-3 py-1.5 text-xs sm:text-[11px] font-medium  dark:bg-orange-950/30 rounded-sm flex-shrink-0 "
            >
              <Shield className="h-3.5 w-3.5 sm:h-3 sm:w-3 mb-[1px]" />
              <span>Super Admin</span>
            </Badge>
          ) : user?.role && (
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-xs sm:text-sm font-medium border-2 rounded-lg flex-shrink-0 capitalize"
            >
              {user.role}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
        {/* Theme Toggle */}
        <SimpleThemeToggle />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                  {getInitials(user?.username, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 sm:w-64 p-2">
            <DropdownMenuLabel className="p-2 sm:p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">{user?.username}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user?.email}</p>
                {isUserSuperAdmin && (
                  <Badge variant="destructive" className="w-fit text-[10px] sm:text-xs flex items-center gap-1 mt-2 px-2 py-1">
                    <Shield className="h-3 w-3" />
                    Super Admin
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-2 sm:p-3 hover:bg-accent">
              <User className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-2 sm:p-3 hover:bg-accent">
              <Bell className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="p-2 sm:p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
              <LogOut className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
