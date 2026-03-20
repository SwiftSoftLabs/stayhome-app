"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const rooms = ["Bathroom", "Kitchen", "Hallway", "Bedroom", "Stairs", "Living Room", "Exterior"];
const categories = ["Tripping", "Lighting", "Grab Bar", "Electrical", "Stairs"];
const checklistItems = ["Photos taken", "Measurements recorded", "Hazards documented", "Occupant interviewed", "Room sketch completed"];

interface Hazard {
  id: string;
  description: string;
  riskScore: number;
  category: string;
  estimatedCost: string;
  notes: string;
}

type RoomData = Record<string, { hazards: Hazard[]; checklist: Record<string, boolean> }>;

function initRoomData(): RoomData {
  const data: RoomData = {};
  rooms.forEach((r) => {
    data[r] = { hazards: [], checklist: {} };
    checklistItems.forEach((c) => { data[r].checklist[c] = false; });
  });
  return data;
}

export default function AuditToolPage() {
  const [roomData, setRoomData] = useState<RoomData>(initRoomData);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Hazard, "id">>({ description: "", riskScore: 5, category: "Tripping", estimatedCost: "", notes: "" });

  const showNotification = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const addHazard = (room: string) => {
    if (!draft.description) return;
    const h: Hazard = { ...draft, id: crypto.randomUUID() };
    setRoomData((prev) => ({ ...prev, [room]: { ...prev[room], hazards: [...prev[room].hazards, h] } }));
    setDraft({ description: "", riskScore: 5, category: "Tripping", estimatedCost: "", notes: "" });
    showNotification("Hazard added successfully");
  };

  const deleteHazard = (room: string, id: string) => {
    setRoomData((prev) => ({ ...prev, [room]: { ...prev[room], hazards: prev[room].hazards.filter((h) => h.id !== id) } }));
  };

  const updateHazard = (room: string, id: string, updates: Partial<Hazard>) => {
    setRoomData((prev) => ({
      ...prev,
      [room]: { ...prev[room], hazards: prev[room].hazards.map((h) => (h.id === id ? { ...h, ...updates } : h)) },
    }));
  };

  const toggleCheck = (room: string, item: string) => {
    setRoomData((prev) => ({
      ...prev,
      [room]: { ...prev[room], checklist: { ...prev[room].checklist, [item]: !prev[room].checklist[item] } },
    }));
  };

  const totalHazards = Object.values(roomData).reduce((sum, r) => sum + r.hazards.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notification && (
          <div className="fixed right-4 top-4 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {notification}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Tool</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            <span><strong>Address:</strong> 142 Oak Lane, Springfield</span>
            <span><strong>Family:</strong> Johnson Family</span>
            <span><strong>Date:</strong> March 20, 2026</span>
          </div>
        </div>

        <Tabs defaultValue="Bathroom">
          <TabsList className="flex-wrap">
            {rooms.map((r) => (
              <TabsTrigger key={r} value={r}>
                {r} {roomData[r].hazards.length > 0 && <Badge variant="destructive" className="ml-1">{roomData[r].hazards.length}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          {rooms.map((room) => (
            <TabsContent key={room} value={room}>
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Photo Upload</CardTitle></CardHeader>
                  <CardContent>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-blue-400 hover:bg-blue-50">
                      <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-sm text-gray-500">Drag and drop photos or click to browse</span>
                      <input type="file" multiple accept="image/*" className="hidden" />
                    </label>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Hazards ({roomData[room].hazards.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {roomData[room].hazards.map((h) => (
                      <div key={h.id} className="rounded-lg border border-gray-200 p-3">
                        {editingId === h.id ? (
                          <div className="space-y-2">
                            <Input value={h.description} onChange={(e) => updateHazard(room, h.id, { description: e.target.value })} label="Description" />
                            <div className="grid grid-cols-2 gap-2">
                              <Select label="Risk" value={String(h.riskScore)} onChange={(e) => updateHazard(room, h.id, { riskScore: Number(e.target.value) })}>
                                {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                              </Select>
                              <Select label="Category" value={h.category} onChange={(e) => updateHazard(room, h.id, { category: e.target.value })}>
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                              </Select>
                            </div>
                            <Button size="sm" onClick={() => setEditingId(null)}>Done</Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{h.description}</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Badge variant={h.riskScore >= 7 ? "destructive" : h.riskScore >= 4 ? "warning" : "success"}>Risk: {h.riskScore}/10</Badge>
                                <Badge variant="secondary">{h.category}</Badge>
                                {h.estimatedCost && <Badge variant="outline">${h.estimatedCost}</Badge>}
                              </div>
                              {h.notes && <p className="mt-1 text-xs text-gray-500">{h.notes}</p>}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(h.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteHazard(room, h.id)}>Delete</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">Add Hazard</p>
                      <Input label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Describe the hazard..." />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Select label="Risk Score" value={String(draft.riskScore)} onChange={(e) => setDraft({ ...draft, riskScore: Number(e.target.value) })}>
                          {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                        </Select>
                        <Select label="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Input label="Est. Cost ($)" value={draft.estimatedCost} onChange={(e) => setDraft({ ...draft, estimatedCost: e.target.value })} placeholder="0.00" />
                      </div>
                      <Textarea label="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Additional notes..." />
                      <Button onClick={() => addHazard(room)}>Add Hazard</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Room Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {checklistItems.map((item) => (
                      <label key={item} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
                        <input type="checkbox" checked={roomData[room].checklist[item]} onChange={() => toggleCheck(room, item)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => showNotification("Progress saved")}>Save &amp; Continue</Button>
          <Button onClick={() => { if (totalHazards > 0) showNotification("Report generated successfully!"); else showNotification("Add at least one hazard before generating a report."); }}>
            Generate Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
