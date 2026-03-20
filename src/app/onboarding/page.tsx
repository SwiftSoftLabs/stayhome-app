"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 3;

function getDashboardPath(role: string): string {
  switch (role) {
    case "assessor": return "/dashboard/assessor";
    case "contractor": return "/dashboard/contractor";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/family";
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser } = useStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ phone: "", address: "", city: "", state: "", license: "", specialization: "", businessName: "", serviceArea: "" });

  const role = currentUser?.role ?? "family";

  const update = (field: string, value: string) => setProfile((p) => ({ ...p, [field]: value }));

  const handleFinish = () => {
    router.push(getDashboardPath(role));
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="flex items-center gap-2 font-bold text-blue-600">
        <Shield className="h-7 w-7" />
        <span className="text-xl">StayHome</span>
      </div>

      {/* Progress */}
      <div className="mt-8 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const s = i + 1;
          const done = s < step;
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < TOTAL_STEPS && <div className={`h-0.5 w-12 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      <Card className="mt-8 w-full max-w-lg">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Welcome to StayHome{currentUser ? `, ${currentUser.name}` : ""}!</h2>
              <p className="text-gray-600">
                {role === "family" && "We'll help you set up your home safety profile so we can protect your loved ones."}
                {role === "assessor" && "Let's get your assessor profile ready so you can start conducting safety audits."}
                {role === "contractor" && "Set up your business profile to start receiving home modification leads."}
                {role === "admin" && "Welcome, admin. Let's confirm your profile details."}
              </p>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">Your role: <span className="capitalize">{role}</span></p>
                <p className="mt-1 text-sm text-blue-600">{currentUser?.email ?? "No email set"}</p>
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
                  <Input label="License Number" placeholder="ASR-12345" value={profile.license} onChange={(e) => update("license", e.target.value)} />
                  <Input label="Specialization" placeholder="e.g. Fall Prevention, Accessibility" value={profile.specialization} onChange={(e) => update("specialization", e.target.value)} />
                </>
              )}

              {role === "contractor" && (
                <>
                  <Input label="Business Name" placeholder="Safe Homes LLC" value={profile.businessName} onChange={(e) => update("businessName", e.target.value)} />
                  <Input label="Service Area" placeholder="e.g. Greater Chicago Area" value={profile.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} />
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">You&apos;re All Set!</h2>
              <p className="text-gray-600">Your profile is ready. Head to your dashboard to get started.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            ) : <div />}
            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
