"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";

const initialUsers = [
  { id: "1", name: "Sarah Chen", email: "sarah@example.com", role: "Family", status: "active", joined: "2026-01-15" },
  { id: "2", name: "Mike Torres", email: "mike@example.com", role: "Assessor", status: "active", joined: "2025-11-03" },
  { id: "3", name: "Jane Liu", email: "jane@example.com", role: "Assessor", status: "active", joined: "2025-12-20" },
  { id: "4", name: "David Park", email: "david@example.com", role: "Contractor", status: "active", joined: "2026-02-10" },
  { id: "5", name: "Amy Walsh", email: "amy@example.com", role: "Family", status: "suspended", joined: "2025-09-05" },
  { id: "6", name: "Tom Reed", email: "tom@example.com", role: "Contractor", status: "active", joined: "2026-01-22" },
  { id: "7", name: "Lisa Patel", email: "lisa@example.com", role: "Family", status: "active", joined: "2025-10-18" },
  { id: "8", name: "James Obi", email: "james@example.com", role: "Assessor", status: "active", joined: "2026-03-01" },
  { id: "9", name: "Rachel Kim", email: "rachel@example.com", role: "Family", status: "active", joined: "2025-08-12" },
  { id: "10", name: "Carlos Ruiz", email: "carlos@example.com", role: "Contractor", status: "suspended", joined: "2025-07-30" },
  { id: "11", name: "Emma Brown", email: "emma@example.com", role: "Family", status: "active", joined: "2026-02-28" },
  { id: "12", name: "Noah Wilson", email: "noah@example.com", role: "Assessor", status: "active", joined: "2026-03-10" },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const { addNotification } = useStore();
  const perPage = 6;

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  function toggleSuspend(id: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next = u.status === "active" ? "suspended" : "active";
        addNotification({ title: "User Updated", message: `${u.name} has been ${next}.`, type: next === "suspended" ? "warning" : "success" });
        return { ...u, status: next };
      })
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1"><Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
              <div className="w-48">
                <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                  <option>All</option><option>Family</option><option>Assessor</option><option>Contractor</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Email</th><th className="pb-2 font-medium">Role</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Joined</th><th className="pb-2 font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {paged.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3 text-gray-500">{u.email}</td>
                      <td className="py-3"><Badge variant={u.role === "Assessor" ? "default" : u.role === "Contractor" ? "warning" : "secondary"}>{u.role}</Badge></td>
                      <td className="py-3"><Badge variant={u.status === "active" ? "success" : "destructive"}>{u.status}</Badge></td>
                      <td className="py-3 text-gray-500">{u.joined}</td>
                      <td className="py-3 space-x-2">
                        <Button size="sm" variant="ghost">View</Button>
                        <Button size="sm" variant={u.status === "active" ? "destructive" : "outline"} onClick={() => toggleSuspend(u.id)}>
                          {u.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {paged.length} of {filtered.length} users</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
