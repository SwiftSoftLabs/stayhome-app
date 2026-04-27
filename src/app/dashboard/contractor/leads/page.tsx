"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLeads } from "@/lib/hooks/useLeads";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { MapPin, Calendar } from "lucide-react";

const urgencyVariant = { high: "destructive", medium: "warning", low: "secondary" } as const;

function LeadCard({ lead, onAccept, onDecline }: { lead: Lead; onAccept?: () => void; onDecline?: () => void }) {
  const property = lead.audit?.property;
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{lead.family_profile?.name ?? "Family"}</p>
            {property && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" /> {property.street}, {property.city}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Badge variant={urgencyVariant[lead.urgency]}>{lead.urgency} urgency</Badge>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{lead.hazard}</span>
              {lead.estimated_value && (
                <span className="font-medium text-gray-700">Est. ${lead.estimated_value.toLocaleString()}</span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
          {lead.status === "pending" && onAccept && onDecline && (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={onAccept}>Accept</Button>
              <Button size="sm" variant="outline" onClick={onDecline}>Decline</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContractorLeadsPage() {
  const { currentUser, addNotification } = useStore();
  const { leads, loading, acceptLead, declineLead } = useLeads();

  const handleAccept = async (id: string) => {
    const result = await acceptLead(id);
    if (result && !result.error) addNotification({ title: "Lead Accepted", message: "Lead moved to your active jobs.", type: "success" });
  };

  const handleDecline = async (id: string) => {
    const result = await declineLead(id);
    if (result && !result.error) addNotification({ title: "Lead Declined", message: "Lead has been declined.", type: "info" });
  };

  const available = leads.filter((l) => l.status === "pending" && !l.contractor_id);
  const mine = leads.filter((l) => l.contractor_id === currentUser?.id && l.status === "accepted");
  const declined = leads.filter((l) => l.status === "declined");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">Manage incoming project leads from completed safety audits.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        ) : (
          <Tabs defaultValue="available">
            <TabsList>
              <TabsTrigger value="available">Available ({available.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({mine.length})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({declined.length})</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="available">
                {available.length === 0 ? (
                  <p className="py-10 text-center text-gray-400">No available leads right now.</p>
                ) : (
                  available.map((l) => (
                    <LeadCard key={l.id} lead={l}
                      onAccept={() => handleAccept(l.id)}
                      onDecline={() => handleDecline(l.id)}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="accepted">
                {mine.length === 0 ? (
                  <p className="py-10 text-center text-gray-400">No accepted leads.</p>
                ) : (
                  mine.map((l) => <LeadCard key={l.id} lead={l} />)
                )}
              </TabsContent>
              <TabsContent value="declined">
                {declined.length === 0 ? (
                  <p className="py-10 text-center text-gray-400">No declined leads.</p>
                ) : (
                  declined.map((l) => <LeadCard key={l.id} lead={l} />)
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
