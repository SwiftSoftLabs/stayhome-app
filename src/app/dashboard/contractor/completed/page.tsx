"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const completedJobs = [
  { id: 1, address: "111 First St, Springfield", date: "2026-03-18", cost: "$2,400", rating: 5 },
  { id: 2, address: "222 Second Ave, Riverside", date: "2026-03-15", cost: "$1,800", rating: 4 },
  { id: 3, address: "333 Third Rd, Lakeview", date: "2026-03-12", cost: "$3,100", rating: 5 },
  { id: 4, address: "444 Fourth Ln, Oakdale", date: "2026-03-08", cost: "$1,500", rating: 4 },
  { id: 5, address: "555 Fifth Dr, Hillside", date: "2026-02-28", cost: "$2,200", rating: 5 },
  { id: 6, address: "666 Sixth Ct, Westfield", date: "2026-02-20", cost: "$4,000", rating: 3 },
  { id: 7, address: "777 Seventh Blvd, Eastview", date: "2026-02-15", cost: "$1,900", rating: 5 },
  { id: 8, address: "888 Eighth Pl, Northgate", date: "2026-02-10", cost: "$2,800", rating: 4 },
];

const months = ["All", "March 2026", "February 2026"];

function getMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-amber-500">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );
}

export default function CompletedJobs() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? completedJobs : completedJobs.filter((j) => getMonth(j.date) === filter);

  const totalEarnings = filtered.reduce((sum, j) => sum + parseInt(j.cost.replace(/[$,]/g, ""), 10), 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900">Completed Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">Review your completed work history.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-gray-900">{filtered.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">${totalEarnings.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg Rating</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{(filtered.reduce((s, j) => s + j.rating, 0) / filtered.length).toFixed(1)}</p></CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter by month:</span>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((job) => (
          <Card key={job.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900">{job.address}</p>
                <p className="text-sm text-gray-500">Completed {job.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <Stars count={job.rating} />
                <Badge variant="success">{job.cost}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
