"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Building2,
  Layout,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChartColumn,
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
    name: "User Management",
    href: "/dashboard/users",
    icon: Users,
    requiresSuperAdmin: true,
  },
  // {
  //   name: "Organization Users",
  //   href: "/dashboard/organization-users",
  //   icon: Users,
  //   requiresSuperAdmin: true,
  // },
  {
    name: "Team Management",
    href: "/dashboard/teams",
    icon: UsersRound,
    requiresSuperAdmin: true,
  },
  {
    name: "Organizations",
    href: "/dashboard/organizations",
    icon: Building2,
    requiresSuperAdmin: true,
  },
  {
    name: "Folders",
    href: "/dashboard/folders",
    icon: FolderOpen,
    requiresSuperAdmin: true,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiresSuperAdmin: true,
  },
];

export function Sidebar() {
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
    <div
      className={cn(
        "flex flex-col border-r bg-gray-50 dark:bg-gray-900 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b">
        {!collapsed && (
          <Link
            href="/dashboard/my-dashboards"
            className="flex items-center gap-1"
          >
            <div className="p-2 bg-gray-600 rounded-full">
              {" "}
              <ChartColumn className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-xl">Bhashini</span>
              <span className="font-medium text-[12px]">
                Observability Platform
              </span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-3 px-4 py-6">
        {visibleNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
