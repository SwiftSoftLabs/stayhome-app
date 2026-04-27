"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { profileService } from "@/lib/services/profile.service";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { Star, Wrench, MapPin } from "lucide-react";

const SPECIALTIES = ["All", "Grab Bars", "Lighting", "Flooring", "General"];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
      <span className="text-gray-500">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ContractorsPage() {
  const { addNotification } = useStore();
  const [contractors, setContractors] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    profileService.listContractors().then(({ data }) => {
      setContractors(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = contractors.filter((c) => {
    const profile = c.profile as Record<string, unknown> | null;
    const name = ((profile?.name as string) ?? (c.business_name as string) ?? "").toLowerCase();
    const specs = (c.specialties as string[]) ?? [];
    return name.includes(search.toLowerCase()) && (filter === "All" || specs.includes(filter));
  });

  const requestQuote = (name: string) => {
    addNotification({ title: "Quote Requested", message: `Your request has been sent to ${name}.`, type: "success" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Contractors</h1>
          <p className="text-gray-500">Vetted professionals ready to help with your home safety improvements.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${filter === s ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2,3,4,5].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Wrench className="mx-auto h-12 w-12 text-gray-200 mb-3" />
            <p>No contractors match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const profile = c.profile as Record<string, unknown> | null;
              const name = (c.business_name as string) ?? (profile?.name as string) ?? "Contractor";
              const rating = (c.rating as number) ?? 0;
              const specs = (c.specialties as string[]) ?? [];
              const area = (c.service_area as string) ?? "";
              const jobs = (c.jobs_completed as number) ?? 0;
              const verified = c.verified as boolean;
              return (
                <Card key={c.id as string} className="hover:shadow-md transition-shadow">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-xl font-bold text-blue-600">
                        {name.charAt(0)}
                      </div>
                      {verified && <Badge variant="success" className="text-xs">Verified</Badge>}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{name}</p>
                      {area && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" /> {area}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {specs.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                    <Stars rating={rating} />
                    <p className="text-xs text-gray-500">{jobs} jobs completed</p>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/family/contractors/${c.id}`}>
                        <Button size="sm" variant="outline">Profile</Button>
                      </Link>
                      <Button size="sm" onClick={() => requestQuote(name)}>Request Quote</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
