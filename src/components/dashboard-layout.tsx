"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Menu, X } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <Sidebar className="fixed inset-y-0 left-0 z-50 flex shadow-lg" />
          </div>
        )}

        <main className="flex-1 overflow-auto bg-gray-50">
          {/* Mobile sidebar toggle */}
          <div className="flex items-center border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="ml-2 text-sm font-medium text-gray-700">Menu</span>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
