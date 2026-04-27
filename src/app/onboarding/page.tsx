"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { profileService } from "@/lib/services/profile.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 3;

function dashboardPath(role: string) {
  switch (role) {
    case "assessor": return "/dashboard/assessor";
    case "contractor": return "/dashboard/contractor";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/family";
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, _setUser } = useStore();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    phone: "", address: "", city: "", state: "",
    license_number: "", specialization: "",
    business_name: "", service_area: "",
  });

  const role = currentUser?.role ?? "family";
  const update = (field: string, value: string) => setProfile((p) => ({ ...p, [field]: value }));

  const handleFinish = async () => {
    if (!currentUser) return;
    setSaving(true);
    await profileService.upsert({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role as "family" | "assessor" | "contractor" | "admin",
      onboarded: true,
      ...profile,
    });
    _setUser({ ...currentUser, onboarded: true });
    setSaving(false);
    router.push(dashboardPath(role));
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="flex items-center gap-2 font-bold text-blue-600">
        <Shield className="h-8 w-8" />
        <span className="text-2xl">StayHome</span>
      </div>

      {/* Step indicators */}
      <div className="mt-10 flex items-center gap-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const s = i + 1;
          const done = s < step;
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                done ? "bg-green-500 text-white shadow-md" : active ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-200" : "bg-gray-200 text-gray-400"
              }`}>
                {done ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < TOTAL_STEPS && (
                <div className={`h-0.5 w-14 transition-all ${s < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <Card className="mt-8 w-full max-w-lg shadow-xl">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to StayHome{currentUser ? `, ${currentUser.name.split(" ")[0]}` : ""}!
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {role === "family" && "We'll help you set up your home safety profile so we can protect your loved ones."}
                {role === "assessor" && "Let's get your assessor profile ready so you can start conducting safety audits."}
                {role === "contractor" && "Set up your business profile to start receiving home modification leads."}
                {role === "admin" && "Welcome, admin. Let's confirm your profile details."}
              </p>
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5">
                <p className="text-sm font-semibold text-blue-900 capitalize">Role: {role}</p>
                <p className="mt-1 text-sm text-blue-700">{currentUser?.email}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
              <Input label="Phone Number" type="tel" placeholder="(555) 123-4567" value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
              {(role === "family" || role === "admin") && (
                <>
                  <Input label="Street Address" placeholder="123 Main St" value={profile.address} onChange={(e) => update("address", e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" placeholder="Springfield" value={profile.city} onChange={(e) => update("city", e.target.value)} />
                    <Input label="State" placeholder="IL" value={profile.state} onChange={(e) => update("state", e.target.value)} />
                  </div>
                </>
              )}
              {role === "assessor" && (
                <>
                  <Input label="License Number" placeholder="ASR-12345" value={profile.license_number} onChange={(e) => update("license_number", e.target.value)} />
                  <Input label="Specialization" placeholder="e.g. Fall Prevention, Accessibility" value={profile.specialization} onChange={(e) => update("specialization", e.target.value)} />
                </>
              )}
              {role === "contractor" && (
                <>
                  <Input label="Business Name" placeholder="Safe Homes LLC" value={profile.business_name} onChange={(e) => update("business_name", e.target.value)} />
                  <Input label="Service Area" placeholder="e.g. Greater Chicago Area" value={profile.service_area} onChange={(e) => update("service_area", e.target.value)} />
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">You&apos;re All Set!</h2>
                <p className="mt-2 text-gray-600">Your profile is complete. Head to your dashboard to get started.</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : <div />}
            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? "Saving..." : "Go to Dashboard"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
