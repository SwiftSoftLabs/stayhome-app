"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Bell, Menu, X, LogOut, User, Settings,
  ChevronDown,
} from "lucide-react";

type NL = { href: string; label: string }[];
const navLinks: Record<string, NL> = {
  public: [{ href: "/", label: "Home" }, { href: "/how-it-works", label: "How it Works" }, { href: "/pricing", label: "Pricing" }],
  family: [{ href: "/dashboard", label: "Dashboard" }, { href: "/book-audit", label: "Book Audit" }, { href: "/reports", label: "Reports" }, { href: "/contractors", label: "Contractors" }],
  assessor: [{ href: "/dashboard", label: "Dashboard" }, { href: "/schedule", label: "Schedule" }, { href: "/report-builder", label: "Report Builder" }],
  contractor: [{ href: "/dashboard", label: "Dashboard" }, { href: "/leads", label: "Leads" }, { href: "/active-jobs", label: "Active Jobs" }],
  admin: [{ href: "/dashboard", label: "Dashboard" }, { href: "/users", label: "Users" }, { href: "/audits", label: "Audits" }],
};

export function Navbar() {
  const { currentUser, notifications, markAllRead, logout } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const links = navLinks[currentUser?.role ?? "public"] ?? navLinks.public;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
            <Shield className="h-6 w-6" />
            <span className="text-lg">StayHome</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-gray-900">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <button onClick={markAllRead} className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center p-0 text-[10px]">
                    {unread}
                  </Badge>
                )}
              </button>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100">
                  <Avatar size="sm" src={currentUser.avatar} initials={currentUser.name.slice(0, 2)} />
                  <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link href="/settings/security" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Shield className="h-4 w-4" /> Security
                    </Link>
                    <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={() => { logout(); setDropdownOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden gap-2 md:flex">
              <Link href="/login"><Button variant="ghost">Login</Button></Link>
              <Link href="/signup"><Button>Sign Up</Button></Link>
            </div>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-gray-900">
              {l.label}
            </Link>
          ))}
          {!currentUser && (
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login"><Button variant="ghost">Login</Button></Link>
              <Link href="/signup"><Button>Sign Up</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
