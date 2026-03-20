"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "Total Audits", value: "342" },
  { label: "Avg Safety Score", value: "68" },
  { label: "Avg Fixes Per Audit", value: "4.2" },
  { label: "Contractor Conversion", value: "42%" },
];

const monthlyAudits = [
  { month: "Oct", count: 42 },
  { month: "Nov", count: 55 },
  { month: "Dec", count: 38 },
  { month: "Jan", count: 61 },
  { month: "Feb", count: 72 },
  { month: "Mar", count: 74 },
];

const maxCount = Math.max(...monthlyAudits.map((m) => m.count));

const hazards = [
  { type: "Trip Hazards", frequency: 128, avgRisk: 62 },
  { type: "Inadequate Lighting", frequency: 97, avgRisk: 48 },
  { type: "Missing Grab Bars", frequency: 85, avgRisk: 55 },
  { type: "Faulty Wiring", frequency: 64, avgRisk: 82 },
  { type: "Slippery Surfaces", frequency: 59, avgRisk: 58 },
  { type: "Blocked Exits", frequency: 43, avgRisk: 88 },
];

const assessors = [
  { name: "Mike Torres", audits: 87, rating: 4.8 },
  { name: "Jane Liu", audits: 72, rating: 4.9 },
  { name: "James Obi", audits: 65, rating: 4.6 },
  { name: "Noah Wilson", audits: 58, rating: 4.7 },
  { name: "Sarah Park", audits: 42, rating: 4.5 },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">{k.label}</p>
                <p className="mt-1 text-2xl font-bold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Audits Per Month</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-48">
              {monthlyAudits.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-600">{m.count}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${(m.count / maxCount) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Top Hazards Found</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Hazard Type</th>
                  <th className="pb-2 font-medium">Frequency</th>
                  <th className="pb-2 font-medium">Avg Risk</th>
                </tr></thead>
                <tbody>
                  {hazards.map((h) => (
                    <tr key={h.type} className="border-b last:border-0">
                      <td className="py-2.5">{h.type}</td>
                      <td className="py-2.5">{h.frequency}</td>
                      <td className="py-2.5">
                        <span className={h.avgRisk >= 75 ? "font-bold text-red-600" : h.avgRisk >= 50 ? "text-amber-600" : "text-green-600"}>{h.avgRisk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Performing Assessors</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Audits</th>
                  <th className="pb-2 font-medium">Avg Rating</th>
                </tr></thead>
                <tbody>
                  {assessors.map((a) => (
                    <tr key={a.name} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{a.name}</td>
                      <td className="py-2.5">{a.audits}</td>
                      <td className="py-2.5 text-amber-500">{"★".repeat(Math.round(a.rating))} <span className="text-gray-600">{a.rating}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
