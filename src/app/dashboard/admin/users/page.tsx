"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { profileService } from "@/lib/services/profile.service";
import { useStore } from "@/lib/store";
import type { Profile } from "@/lib/types";

const roleVariant = {
  assessor: "default",
  contractor: "warning",
  family: "secondary",
  admin: "destructive",
} as const;

export default function UsersPage() {
  const { addNotification } = useStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    profileService.listAll().then(({ data }) => {
      setUsers(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-48">
                <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                  <option>All</option>
                  <option>Family</option>
                  <option>Assessor</option>
                  <option>Contractor</option>
                  <option>Admin</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Joined</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-gray-900">{u.name ?? "—"}</td>
                        <td className="py-3 text-gray-500">{u.email ?? "—"}</td>
                        <td className="py-3">
                          <Badge variant={roleVariant[u.role] ?? "secondary"} className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addNotification({ title: "User", message: `Viewing ${u.name ?? "user"}.`, type: "info" })}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paged.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {paged.length} of {filtered.length} users</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center px-2 text-sm text-gray-600">{page} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
