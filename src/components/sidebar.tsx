"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ClipboardList, FileText, Users, CreditCard,
  Settings, Calendar, ClipboardCheck, FileEdit, DollarSign,
  Inbox, Hammer, CheckCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const sidebarLinks: Record<string, NavItem[]> = {
  family: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/my-audits", label: "My Audits", icon: ClipboardList },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/contractors", label: "Contractors", icon: Users },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  assessor: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/active-audits", label: "Active Audits", icon: ClipboardCheck },
    { href: "/report-builder", label: "Report Builder", icon: FileEdit },
    { href: "/earnings", label: "Earnings", icon: DollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  contractor: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Leads", icon: Inbox },
    { href: "/active-jobs", label: "Active Jobs", icon: Hammer },
    { href: "/completed", label: "Completed", icon: CheckCircle },
    { href: "/payments", label: "Payments", icon: DollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Users", icon: Users },
    { href: "/audits", label: "Audits", icon: ClipboardList },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/payments", label: "Payments", icon: DollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentUser } = useStore();

  if (!currentUser) return null;

  const links = sidebarLinks[currentUser.role] ?? sidebarLinks.family;

  return (
    <aside className={cn("flex w-64 flex-col border-r border-gray-200 bg-white", className)}>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
