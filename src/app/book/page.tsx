"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { propertyService } from "@/lib/services/property.service";
import { auditService } from "@/lib/services/audit.service";
import { useStore } from "@/lib/store";
import type { AuditPackage } from "@/lib/types";
import Link from "next/link";

const steps = ["Address", "Date & Time", "Package", "Confirm"];

const DATES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + 2 + i * 2);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const TIMES = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"];

const PACKAGES: { name: AuditPackage; price: number; features: string[] }[] = [
  { name: "Basic", price: 199, features: ["5-room inspection", "Written report", "Email support"] },
  { name: "Standard", price: 249, features: ["All rooms", "Photo documentation", "Priority fixes list", "Phone support"] },
  { name: "Premium", price: 299, features: ["All rooms", "Photo + video", "Contractor matching", "90-day follow-up", "Dedicated advisor"] },
];

export default function BookPage() {
  const router = useRouter();
  const { currentUser, addNotification } = useStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [form, setForm] = useState({
    street: "", city: "", state: "", zip: "",
    property_type: "Single Family", floors: "1", rooms: "5",
    date: "", time: "",
    pkg: "Standard" as AuditPackage,
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleConfirm = async () => {
    if (!currentUser) return;
    setSubmitting(true);

    // 1. Create property
    const { data: property, error: propError } = await propertyService.create({
      owner_id: currentUser.id,
      street: form.street || "42 Oak Lane",
      city: form.city || "Austin",
      state: form.state || "TX",
      zip: form.zip || "78701",
      property_type: form.property_type,
      floors: Number(form.floors) || 1,
      rooms: Number(form.rooms) || 5,
    });

    if (propError || !property) {
      addNotification({ title: "Error", message: "Failed to save property. Please try again.", type: "error" });
      setSubmitting(false);
      return;
    }

    // 2. Create audit
    const { data: audit, error: auditError } = await auditService.create({
      property_id: property.id,
      family_id: currentUser.id,
      package: form.pkg,
      scheduled_date: form.date || DATES[0],
      scheduled_time: form.time || TIMES[0],
    });

    if (auditError || !audit) {
      addNotification({ title: "Error", message: "Failed to book audit. Please try again.", type: "error" });
      setSubmitting(false);
      return;
    }

    addNotification({
      title: "Booking Confirmed!",
      message: `Your ${form.pkg} audit is scheduled for ${form.date || DATES[0]} at ${form.time || TIMES[0]}.`,
      type: "success",
    });
    setBooked(true);
    setSubmitting(false);
  };

  const selectedPkg = PACKAGES.find((p) => p.name === form.pkg)!;

  const field = (label: string, key: string, placeholder = "", type = "text") => (
    <label key={key} className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );

  if (booked) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg space-y-6 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">✓</div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="text-gray-500">
            Your <strong>{form.pkg}</strong> audit is scheduled for <strong>{form.date || DATES[0]}</strong> at <strong>{form.time || TIMES[0]}</strong>.
          </p>
          <p className="text-sm text-gray-400">A confirmation has been added to your notifications.</p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/family/audits">
              <Button>View My Audits</Button>
            </Link>
            <Button variant="outline" onClick={() => { setBooked(false); setStep(0); setForm({ street: "", city: "", state: "", zip: "", property_type: "Single Family", floors: "1", rooms: "5", date: "", time: "", pkg: "Standard" }); }}>
              Book Another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book an Audit</h1>
          <p className="text-gray-500">Schedule a professional home safety assessment.</p>
        </div>

        {/* Stepper */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((s, i) => (
              <span key={s} className={i <= step ? "font-semibold text-blue-600" : ""}>{s}</span>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} />
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Step 0 — Address */}
            {step === 0 && (
              <>
                <CardTitle>Property Details</CardTitle>
                {field("Street Address", "street", "42 Oak Lane")}
                <div className="grid grid-cols-3 gap-3">
                  {field("City", "city", "Austin")}
                  {field("State", "state", "TX")}
                  {field("ZIP", "zip", "78701")}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">Property Type</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={form.property_type}
                      onChange={(e) => set("property_type", e.target.value)}
                    >
                      <option>Single Family</option>
                      <option>Condo</option>
                      <option>Townhouse</option>
                      <option>Apartment</option>
                    </select>
                  </label>
                  {field("Floors", "floors", "2", "number")}
                  {field("Rooms", "rooms", "6", "number")}
                </div>
              </>
            )}

            {/* Step 1 — Date & Time */}
            {step === 1 && (
              <>
                <CardTitle>Select Date &amp; Time</CardTitle>
                <div className="grid grid-cols-3 gap-2">
                  {DATES.map((d) => (
                    <button
                      key={d}
                      onClick={() => set("date", d)}
                      className={`rounded-xl border p-3 text-sm transition-all ${form.date === d ? "border-blue-600 bg-blue-50 font-semibold text-blue-700 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {form.date && (
                  <div className="grid grid-cols-4 gap-2">
                    {TIMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => set("time", t)}
                        className={`rounded-xl border p-2.5 text-sm transition-all ${form.time === t ? "border-blue-600 bg-blue-50 font-semibold text-blue-700 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2 — Package */}
            {step === 2 && (
              <>
                <CardTitle>Choose a Package</CardTitle>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PACKAGES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => set("pkg", p.name)}
                      className={`rounded-xl border p-4 text-left transition-all ${form.pkg === p.name ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        {form.pkg === p.name && <Badge variant="default">Selected</Badge>}
                      </div>
                      <p className="mt-1 text-2xl font-bold text-blue-600">${p.price}</p>
                      <ul className="mt-3 space-y-1 text-xs text-gray-500">
                        {p.features.map((f) => <li key={f} className="flex gap-1">&#10003; {f}</li>)}
                      </ul>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <>
                <CardTitle>Review &amp; Confirm</CardTitle>
                <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="font-medium text-gray-900 text-right">
                      {form.street || "42 Oak Lane"}, {form.city || "Austin"}, {form.state || "TX"} {form.zip || "78701"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date &amp; Time</span>
                    <span className="font-medium text-gray-900">{form.date || DATES[0]} at {form.time || TIMES[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package</span>
                    <span className="font-medium text-gray-900">{selectedPkg.name}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="text-xl font-bold text-blue-600">${selectedPkg.price}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  By confirming, you agree to our terms of service. Payment will be collected at the time of service.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
          >
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
