"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import Link from "next/link";

const steps = ["Address", "Date & Time", "Package", "Review & Pay", "Confirmed"];

const dates = ["Apr 5", "Apr 7", "Apr 8", "Apr 10", "Apr 12", "Apr 14"];
const times = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"];

const packages = [
  { name: "Basic", price: 199, features: ["5-room inspection", "Written report", "Email support"] },
  { name: "Standard", price: 249, features: ["All rooms", "Photo documentation", "Priority fixes list", "Phone support"] },
  { name: "Premium", price: 299, features: ["All rooms", "Photo + video", "Contractor matching", "90-day follow-up", "Dedicated advisor"] },
];

export default function BookPage() {
  const { addNotification } = useStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    street: "", city: "", state: "", zip: "",
    type: "Single Family", floors: "1", rooms: "5",
    date: "", time: "",
    pkg: "Standard",
    card: "", expiry: "", cvc: "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const next = () => {
    if (step === 3) {
      addNotification({ title: "Booking Confirmed", message: `Your audit is booked for ${form.date} at ${form.time}.`, type: "success" });
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const input = (label: string, key: string, placeholder = "") => (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );

  const selectedPkg = packages.find((p) => p.name === form.pkg)!;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Book an Audit</h1>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((s, i) => (
              <span key={s} className={i <= step ? "font-semibold text-blue-600" : ""}>{s}</span>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} />
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Step 0 — Address */}
            {step === 0 && (
              <div className="space-y-4">
                <CardTitle>Property Details</CardTitle>
                {input("Street Address", "street", "42 Oak Lane")}
                <div className="grid grid-cols-3 gap-3">
                  {input("City", "city", "Austin")}
                  {input("State", "state", "TX")}
                  {input("ZIP", "zip", "78701")}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">Property Type</span>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>
                      <option>Single Family</option><option>Condo</option><option>Townhouse</option><option>Apartment</option>
                    </select>
                  </label>
                  {input("Floors", "floors", "2")}
                  {input("Rooms", "rooms", "6")}
                </div>
              </div>
            )}

            {/* Step 1 — Date */}
            {step === 1 && (
              <div className="space-y-4">
                <CardTitle>Select Date &amp; Time</CardTitle>
                <div className="grid grid-cols-3 gap-2">
                  {dates.map((d) => (
                    <button key={d} onClick={() => set("date", d)}
                      className={`rounded-md border p-3 text-sm ${form.date === d ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                {form.date && (
                  <div className="grid grid-cols-4 gap-2">
                    {times.map((t) => (
                      <button key={t} onClick={() => set("time", t)}
                        className={`rounded-md border p-2 text-sm ${form.time === t ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Package */}
            {step === 2 && (
              <div className="space-y-4">
                <CardTitle>Choose a Package</CardTitle>
                <div className="grid gap-3 sm:grid-cols-3">
                  {packages.map((p) => (
                    <button key={p.name} onClick={() => set("pkg", p.name)}
                      className={`rounded-lg border p-4 text-left ${form.pkg === p.name ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"}`}>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-2xl font-bold text-blue-600">${p.price}</p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-500">{p.features.map((f) => <li key={f}>&#10003; {f}</li>)}</ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Review & Pay */}
            {step === 3 && (
              <div className="space-y-4">
                <CardTitle>Review &amp; Pay</CardTitle>
                <div className="space-y-2 rounded-md bg-gray-50 p-4 text-sm">
                  <p><span className="font-medium">Address:</span> {form.street || "42 Oak Lane"}, {form.city || "Austin"}, {form.state || "TX"} {form.zip || "78701"}</p>
                  <p><span className="font-medium">Date:</span> {form.date || "Apr 5"} at {form.time || "9:00 AM"}</p>
                  <p><span className="font-medium">Package:</span> {selectedPkg.name} — <span className="font-bold">${selectedPkg.price}</span></p>
                </div>
                <div className="space-y-3">
                  {input("Card Number", "card", "4242 4242 4242 4242")}
                  <div className="grid grid-cols-2 gap-3">
                    {input("Expiry", "expiry", "12/28")}
                    {input("CVC", "cvc", "123")}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Confirmation */}
            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">&#10003;</div>
                <CardTitle>Booking Confirmed!</CardTitle>
                <p className="text-gray-500">Your audit is scheduled for <strong>{form.date || "Apr 5"}</strong> at <strong>{form.time || "9:00 AM"}</strong>.</p>
                <p className="text-sm text-gray-400">A confirmation email has been sent to your inbox.</p>
                <Link href="/dashboard/family"><Button>Go to Dashboard</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>Previous</Button>
            <Button onClick={next}>{step === 3 ? "Confirm & Pay" : "Next"}</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
