"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Hazard { name: string; risk: number; description: string; cost: number }
interface Room { name: string; hazards: Hazard[] }

const rooms: Room[] = [
  { name: "Bathroom", hazards: [
    { name: "Missing grab bars", risk: 8, description: "No grab bars near toilet or shower. High fall risk.", cost: 350 },
    { name: "Slippery floor tile", risk: 6, description: "Glazed tile becomes very slippery when wet.", cost: 800 },
  ]},
  { name: "Kitchen", hazards: [
    { name: "Loose floor tile", risk: 5, description: "Cracked tile near sink creates a tripping hazard.", cost: 200 },
    { name: "High cabinets", risk: 3, description: "Frequently used items stored above shoulder height.", cost: 150 },
  ]},
  { name: "Hallway", hazards: [
    { name: "Poor lighting", risk: 7, description: "Dim lighting along the main hallway, especially at night.", cost: 300 },
  ]},
  { name: "Bedroom", hazards: [
    { name: "Loose area rug", risk: 6, description: "Area rug lacks non-slip backing. Tripping risk.", cost: 50 },
  ]},
  { name: "Stairs", hazards: [
    { name: "Worn handrail", risk: 9, description: "Handrail is loose and wobbles under pressure.", cost: 450 },
    { name: "Uneven step height", risk: 4, description: "Bottom step is slightly taller than the rest.", cost: 600 },
  ]},
];

const totalCost = rooms.flatMap((r) => r.hazards).reduce((s, h) => s + h.cost, 0);
const overallScore = 72;

function riskColor(r: number) {
  if (r >= 7) return "destructive";
  if (r >= 4) return "warning";
  return "success";
}

export default function ReportPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Bathroom: true });

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Report</h1>
            <p className="text-gray-500">42 Oak Lane, Austin TX &middot; Feb 18, 2026</p>
            <p className="text-sm text-gray-500">Assessor: James Carter</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-400 text-amber-500">
              <span className="text-xl font-bold">{overallScore}</span>
            </div>
            <Button variant="outline" onClick={() => alert("PDF download coming soon")}>Download PDF</Button>
          </div>
        </div>

        {/* Room breakdown */}
        <div className="space-y-3">
          {rooms.map((room) => (
            <Card key={room.name}>
              <button
                className="flex w-full items-center justify-between p-5 text-left"
                onClick={() => toggle(room.name)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{room.name}</span>
                  <Badge variant="secondary">{room.hazards.length} hazard{room.hazards.length > 1 ? "s" : ""}</Badge>
                </div>
                <span className="text-gray-400">{expanded[room.name] ? "−" : "+"}</span>
              </button>
              {expanded[room.name] && (
                <CardContent className="space-y-3 border-t pt-4">
                  <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-gray-100 text-sm text-gray-400">
                    Photo placeholder
                  </div>
                  {room.hazards.map((h, i) => (
                    <div key={i} className="flex items-start justify-between rounded-md border border-gray-100 p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{h.name}</span>
                          <Badge variant={riskColor(h.risk)}>Risk {h.risk}/10</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{h.description}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-gray-700">${h.cost}</span>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total estimated repair cost</span>
              <span className="font-bold text-gray-900">${totalCost.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Priority fixes:</span> Worn handrail (stairs), Missing grab bars (bathroom), Poor lighting (hallway)
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/dashboard/family/contractors">
                <Button>Find Contractors for These Fixes</Button>
              </Link>
              <Button variant="outline" onClick={() => alert("PDF download coming soon")}>Download PDF</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
