"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

const contractor = {
  name: "SafeStep Pros",
  specialty: "Grab Bars & Flooring",
  rating: 4.9,
  jobs: 142,
  memberSince: "Jan 2021",
  about:
    "SafeStep Pros specializes in home safety modifications for aging-in-place families. With over 5 years of experience, we help families create safe, accessible living environments.",
  services: [
    { name: "Grab Bar Installation", range: "$150 – $400" },
    { name: "Non-Slip Flooring", range: "$500 – $2,000" },
    { name: "Threshold Ramps", range: "$100 – $350" },
    { name: "Stair Handrails", range: "$200 – $600" },
  ],
  reviews: [
    { author: "Margaret T.", rating: 5, date: "Mar 2, 2026", text: "Excellent work installing grab bars in our bathroom. Very professional and clean." },
    { author: "David R.", rating: 5, date: "Feb 14, 2026", text: "Replaced all our hallway flooring with non-slip material. Looks great and feels much safer." },
    { author: "Susan K.", rating: 4, date: "Jan 20, 2026", text: "Good work overall. Scheduling took a bit longer than expected but the quality was top notch." },
    { author: "James P.", rating: 5, date: "Dec 8, 2025", text: "Installed stair handrails and threshold ramps. My mother can now move around the house independently." },
  ],
};

function Stars({ count }: { count: number }) {
  return <span className="text-amber-500">{"★".repeat(count)}{"☆".repeat(5 - count)}</span>;
}

export default function ContractorProfilePage() {
  const { addNotification } = useStore();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                S
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contractor.name}</h1>
                <p className="text-gray-500">{contractor.specialty}</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <Stars count={Math.round(contractor.rating)} />
                  <span className="text-gray-500">{contractor.rating} &middot; {contractor.jobs} jobs &middot; Member since {contractor.memberSince}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => addNotification({ title: "Quote Requested", message: `Quote request sent to ${contractor.name}.`, type: "success" })}>
                Request Quote
              </Button>
              <Button variant="outline" onClick={() => alert("Call feature coming soon")}>Call</Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">{contractor.about}</p></CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader><CardTitle>Services &amp; Pricing</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {contractor.services.map((s) => (
                <div key={s.name} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="font-medium text-gray-900">{s.range}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {contractor.reviews.map((r, i) => (
              <div key={i} className="space-y-1 border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{r.author}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <Stars count={r.rating} />
                <p className="text-sm text-gray-600">{r.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Portfolio */}
        <Card>
          <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex h-28 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                  Project {i + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
