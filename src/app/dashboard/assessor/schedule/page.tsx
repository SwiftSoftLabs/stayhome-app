"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const weekDays = [
  { day: "Mon", date: "Mar 16" },
  { day: "Tue", date: "Mar 17" },
  { day: "Wed", date: "Mar 18" },
  { day: "Thu", date: "Mar 19" },
  { day: "Fri", date: "Mar 20" },
  { day: "Sat", date: "Mar 21" },
  { day: "Sun", date: "Mar 22" },
];

interface Audit {
  time: string;
  address: string;
  family: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  notes: string;
}

const auditsByDay: Record<string, Audit[]> = {
  "Mar 16": [
    { time: "10:00 AM", address: "22 Pine Road, Springfield", family: "Chen Family", status: "completed", notes: "Follow-up visit, check grab bars" },
    { time: "1:30 PM", address: "410 Cedar Ave, Shelbyville", family: "Patel Family", status: "completed", notes: "Initial assessment" },
    { time: "3:30 PM", address: "88 Willow Lane, Capital City", family: "Adams Family", status: "completed", notes: "Stair rail inspection" },
  ],
  "Mar 17": [
    { time: "9:00 AM", address: "55 Birch Ct, Springfield", family: "O'Brien Family", status: "completed", notes: "Kitchen and bathroom focus" },
    { time: "11:00 AM", address: "199 Walnut Blvd, Shelbyville", family: "Garcia Family", status: "completed", notes: "Full home assessment" },
    { time: "2:00 PM", address: "7 Spruce Drive, Capital City", family: "Kim Family", status: "cancelled", notes: "Rescheduled by family" },
  ],
  "Mar 18": [
    { time: "9:30 AM", address: "320 Ash Street, Springfield", family: "Thompson Family", status: "completed", notes: "Exterior and entrance focus" },
    { time: "12:00 PM", address: "14 Magnolia Way, Shelbyville", family: "Davis Family", status: "completed", notes: "Lighting audit" },
  ],
  "Mar 19": [
    { time: "10:00 AM", address: "61 Redwood Terrace, Springfield", family: "Robinson Family", status: "completed", notes: "Bathroom modifications review" },
    { time: "1:00 PM", address: "283 Chestnut Ave, Capital City", family: "Lee Family", status: "completed", notes: "Full assessment" },
    { time: "3:30 PM", address: "9 Poplar Lane, Shelbyville", family: "Brown Family", status: "completed", notes: "Stairs and hallway" },
  ],
  "Mar 20": [
    { time: "9:00 AM", address: "142 Oak Lane, Springfield", family: "Johnson Family", status: "scheduled", notes: "Initial assessment" },
    { time: "11:30 AM", address: "88 Maple Drive, Shelbyville", family: "Martinez Family", status: "in-progress", notes: "Focus on kitchen hazards" },
    { time: "2:00 PM", address: "305 Elm Street, Springfield", family: "Williams Family", status: "scheduled", notes: "Follow-up visit" },
  ],
  "Mar 21": [],
  "Mar 22": [],
};

const statusVariant = { scheduled: "default", "in-progress": "warning", completed: "success", cancelled: "destructive" } as const;

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState("Mar 20");
  const audits = auditsByDay[selectedDay] || [];

  const allAudits = weekDays.flatMap((d) =>
    (auditsByDay[d.date] || []).map((a) => ({ ...a, dayLabel: `${d.day} ${d.date}` }))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>

        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          <TabsContent value="week">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weekDays.map((d) => (
                <Button
                  key={d.date}
                  variant={selectedDay === d.date ? "default" : "outline"}
                  className="flex min-w-[80px] flex-col items-center gap-0.5 py-3"
                  onClick={() => setSelectedDay(d.date)}
                >
                  <span className="text-xs">{d.day}</span>
                  <span className="text-sm font-semibold">{d.date.split(" ")[1]}</span>
                  {(auditsByDay[d.date] || []).length > 0 && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </Button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {audits.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-gray-500">No audits scheduled for this day.</CardContent></Card>
              ) : (
                audits.map((a, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <span className="w-20 shrink-0 pt-0.5 text-sm font-semibold text-blue-600">{a.time}</span>
                        <div>
                          <p className="font-medium text-gray-900">{a.family}</p>
                          <p className="text-sm text-gray-500">{a.address}</p>
                          <p className="mt-1 text-xs text-gray-400">{a.notes}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[a.status]}>{a.status.replace("-", " ")}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader><CardTitle>All Audits This Week</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allAudits.map((a, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0">
                          <p className="text-xs text-gray-400">{a.dayLabel}</p>
                          <p className="text-sm font-semibold text-blue-600">{a.time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.family}</p>
                          <p className="text-xs text-gray-500">{a.address}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[a.status]}>{a.status.replace("-", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
