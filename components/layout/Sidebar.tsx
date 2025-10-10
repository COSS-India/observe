"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  UsersRound,
  Building2,
  Layout,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChartColumn,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/utils/permissions";

const navigation = [
  // { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresSuperAdmin: false },
  {
    name: "My Dashboards",
    href: "/dashboard/my-dashboards",
    icon: Layout,
    requiresSuperAdmin: false,
  },
  {
    name: "All Dashboards",
    href: "/dashboard/all-dashboards",
    icon: LayoutGrid,
    requiresSuperAdmin: true,
  },
  
  // {
  //   name: "Organization Users",
  //   href: "/dashboard/organization-users",
  //   icon: Users,
  //   requiresSuperAdmin: true,
  // },
  {
    name: "Organizations",
    href: "/dashboard/organizations",
    icon: Building2,
    requiresSuperAdmin: true,
  },
  {
    name: "Customer organizations",
    href: "/dashboard/teams",
    icon: UsersRound,
    requiresSuperAdmin: true,
  },
  {
    name: "Customer categories",
    href: "/dashboard/folders",
    icon: FolderOpen,
    requiresSuperAdmin: true,
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: Users,
    requiresSuperAdmin: true,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiresSuperAdmin: true,
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Filter navigation items based on user permissions
  const visibleNavigation = navigation.filter((item) => {
    if (item.requiresSuperAdmin) {
      return isSuperAdmin(user);
    }
    return true;
  });

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-border bg-background transition-all duration-300 flex-shrink-0",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 border-b border-border flex-shrink-0">
          {!collapsed && (
            <Link
              href="/dashboard/my-dashboards"
              className="flex items-center gap-2 min-w-0"
            >
              <div className="p-1.5 sm:p-2 bg-primary rounded-lg flex-shrink-0">
                <ChartColumn className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base sm:text-lg truncate">Bhashini</span>
                <span className="font-medium text-[10px] sm:text-xs text-muted-foreground truncate">
                  Observability Platform
                </span>
              </div>
            </Link>
          )}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && "mx-auto", "h-8 w-8 sm:h-9 sm:w-9")}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button> */}
        </div>

        <nav className="flex-1 space-y-1 sm:space-y-2 px-3 sm:px-6 py-4 sm:py-8 overflow-y-auto">
          {visibleNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 sm:w-72 flex flex-col border-r border-border bg-background lg:hidden overflow-hidden">
          <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 border-b border-border flex-shrink-0">
            <Link
              href="/dashboard/my-dashboards"
              className="flex items-center gap-2 min-w-0"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="p-1.5 sm:p-2 bg-primary rounded-lg flex-shrink-0">
                <ChartColumn className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base sm:text-lg truncate">Bhashini</span>
                <span className="font-medium text-[10px] sm:text-xs text-muted-foreground truncate">
                  Observability Platform
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 sm:space-y-2 px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
