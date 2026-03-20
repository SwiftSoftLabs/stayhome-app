"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import Link from "next/link";

interface Contractor {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  jobs: number;
}

const contractors: Contractor[] = [
  { id: "c1", name: "SafeStep Pros", specialties: ["Grab Bars", "Flooring"], rating: 4.9, jobs: 142 },
  { id: "c2", name: "BrightPath Electrical", specialties: ["Lighting"], rating: 4.7, jobs: 98 },
  { id: "c3", name: "HomeSafe Remodeling", specialties: ["General", "Flooring"], rating: 4.8, jobs: 210 },
  { id: "c4", name: "AccessAbility Installs", specialties: ["Grab Bars", "General"], rating: 4.6, jobs: 76 },
  { id: "c5", name: "ClearView Lighting Co.", specialties: ["Lighting", "General"], rating: 4.5, jobs: 63 },
  { id: "c6", name: "SureGrip Solutions", specialties: ["Grab Bars", "Flooring", "General"], rating: 4.8, jobs: 185 },
];

const specialties = ["All", "Grab Bars", "Lighting", "Flooring", "General"];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-amber-500">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="ml-1 text-gray-500">{rating}</span>
    </span>
  );
}

export default function ContractorsPage() {
  const { addNotification } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = contractors.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.specialties.includes(filter);
    return matchSearch && matchFilter;
  });

  const requestQuote = (name: string) => {
    addNotification({ title: "Quote Requested", message: `Your quote request has been sent to ${name}.`, type: "success" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Contractors</h1>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search contractors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {specialties.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-400">
                  {c.name.charAt(0)}
                </div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                <div className="flex flex-wrap gap-1">
                  {c.specialties.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
                <Stars rating={c.rating} />
                <p className="text-sm text-gray-500">{c.jobs} jobs completed</p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/family/contractors/${c.id}`}>
                    <Button size="sm" variant="outline">View Profile</Button>
                  </Link>
                  <Button size="sm" onClick={() => requestQuote(c.name)}>Request Quote</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-gray-400">No contractors match your search.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
