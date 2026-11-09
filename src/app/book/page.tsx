"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { propertyService } from "@/lib/services/property.service";
import { auditService } from "@/lib/services/audit.service";
import { useStore } from "@/lib/store";
import { validateAuditAddress } from "@/lib/launch/policy";

const steps = ["Address", "Date & Time", "Review"];

const DATES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + 2 + i * 2);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const TIMES = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"];

type RequestForm = {
  street: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  floors: string;
  rooms: string;
  date: string;
  time: string;
};

const emptyForm: RequestForm = {
  street: "",
  city: "",
  state: "",
  zip: "",
  property_type: "Single Family",
  floors: "1",
  rooms: "5",
  date: "",
  time: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <label htmlFor={id} className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function BookPage() {
  const { currentUser, loading, addNotification } = useStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RequestForm>(emptyForm);

  const set = (key: keyof RequestForm, val: string) => {
    setForm((current) => ({ ...current, [key]: val }));
  };

  const handleNext = () => {
    if (step === 0) {
      const address = validateAuditAddress(form);
      if (!address.ok) {
        setError(address.error);
        return;
      }
    }
    if (step === 1 && (!form.date || !form.time)) {
      setError("Choose a date and a time.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleConfirm = async () => {
    if (!currentUser) return;
    const address = validateAuditAddress(form);
    if (!address.ok) {
      setError(address.error);
      setStep(0);
      return;
    }
    if (!form.date || !form.time) {
      setError("Choose a date and a time.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: property, error: propError } = await propertyService.create({
      owner_id: currentUser.id,
      street: address.value.street,
      city: address.value.city,
      state: address.value.state,
      zip: address.value.zip,
      property_type: form.property_type,
      floors: Number(form.floors) || 1,
      rooms: Number(form.rooms) || 5,
    });

    if (propError || !property) {
      addNotification({ title: "Error", message: "Failed to save property. Please try again.", type: "error" });
      setError("Failed to save the address. Please try again.");
      setSubmitting(false);
      return;
    }

    // Package is the existing stored label. The request is unpaid and unassigned.
    const { data: audit, error: auditError } = await auditService.create({
      property_id: property.id,
      family_id: currentUser.id,
      package: "Basic",
      scheduled_date: form.date,
      scheduled_time: form.time,
    });

    if (auditError || !audit) {
      addNotification({ title: "Error", message: "Failed to save the audit request. Please try again.", type: "error" });
      setError("Failed to save the audit request. Please try again.");
      setSubmitting(false);
      return;
    }

    addNotification({
      title: "Audit request received",
      message: `Request for ${address.value.street} on ${form.date} at ${form.time}. No payment was collected and no assessor is assigned yet.`,
      type: "success",
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-500">Loading your account…</p>
      </DashboardLayout>
    );
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Request an audit</h1>
          <p className="text-gray-600">Sign in to send a free family audit request.</p>
          <Link href="/login"><Button>Sign in</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg space-y-6 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">✓</div>
          <h2 className="text-2xl font-bold text-gray-900">Audit request received</h2>
          <p className="text-gray-600">
            We saved your request for <strong>{form.street}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            This is a request only. No payment has been collected and no assessor is assigned yet.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard/family/audits">
              <Button>View my audits</Button>
            </Link>
            <Button variant="outline" onClick={() => { setSubmitted(false); setStep(0); setForm(emptyForm); }}>
              Request another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const address = validateAuditAddress(form);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request an audit</h1>
          <p className="text-gray-500">Tell us where and when. This does not charge a card or assign an assessor.</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((label, index) => (
              <span key={label} className={index <= step ? "font-semibold text-blue-600" : ""}>{label}</span>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <Card>
          <CardContent className="space-y-5 p-6">
            {step === 0 && (
              <>
                <CardTitle>Property address</CardTitle>
                <TextField label="Street address" value={form.street} onChange={(value) => set("street", value)} placeholder="Street address" autoComplete="street-address" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TextField label="City" value={form.city} onChange={(value) => set("city", value)} placeholder="City" autoComplete="address-level2" />
                  <TextField label="State" value={form.state} onChange={(value) => set("state", value)} placeholder="State" autoComplete="address-level1" />
                  <TextField label="ZIP" value={form.zip} onChange={(value) => set("zip", value)} placeholder="ZIP" autoComplete="postal-code" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label htmlFor="property-type" className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">Property type</span>
                    <select
                      id="property-type"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={form.property_type}
                      onChange={(event) => set("property_type", event.target.value)}
                    >
                      <option>Single Family</option>
                      <option>Condo</option>
                      <option>Townhouse</option>
                      <option>Apartment</option>
                    </select>
                  </label>
                  <TextField label="Floors" value={form.floors} onChange={(value) => set("floors", value)} type="number" />
                  <TextField label="Rooms" value={form.rooms} onChange={(value) => set("rooms", value)} type="number" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <CardTitle>Preferred date and time</CardTitle>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DATES.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => set("date", date)}
                      className={`rounded-xl border p-3 text-sm transition-all ${form.date === date ? "border-blue-600 bg-blue-50 font-semibold text-blue-700 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
                      aria-pressed={form.date === date}
                    >
                      {date}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIMES.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => set("time", time)}
                      className={`rounded-xl border p-2.5 text-sm transition-all ${form.time === time ? "border-blue-600 bg-blue-50 font-semibold text-blue-700 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
                      aria-pressed={form.time === time}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && address.ok && (
              <>
                <CardTitle>Review request</CardTitle>
                <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="font-medium text-gray-900 sm:text-right">
                      {address.value.street}, {address.value.city}, {address.value.state} {address.value.zip}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-500">Preferred time</span>
                    <span className="font-medium text-gray-900">{form.date} at {form.time}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-t pt-3 sm:flex-row sm:justify-between">
                    <span className="font-semibold text-gray-700">Payment</span>
                    <span className="font-medium text-gray-900">None. This is a free request.</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Submitting sends an audit request. An assessor is not assigned until StayHome assigns one.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => { setError(null); setStep((current) => Math.max(current - 1, 0)); }}
          >
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Sending request…" : "Submit request"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
