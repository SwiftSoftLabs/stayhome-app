"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/insforge";
import { profileService } from "@/lib/services/profile.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Home, ClipboardCheck, Wrench, Chrome } from "lucide-react";
import type { Role } from "@/lib/types";

const roles = [
  { value: "family" as Role, label: "Family Member", icon: Home, desc: "Monitor a loved one's home safety" },
  { value: "assessor" as Role, label: "Assessor", icon: ClipboardCheck, desc: "Conduct professional home assessments" },
  { value: "contractor" as Role, label: "Contractor", icon: Wrench, desc: "Provide home modification services" },
];

export default function SignUpPage() {
  const router = useRouter();
  const { _setUser } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("family");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!terms) { setError("You must agree to the Terms of Service."); return; }
    setLoading(true);
    const { data, error: err } = await auth.signUp({
      email,
      password,
      name,
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (err) { setError(err.message ?? "Sign up failed."); return; }
    if (!data) { setError("Sign up failed."); return; }

    if (data.requireEmailVerification) {
      setNeedVerify(true);
      return;
    }

    // Email verification disabled — create profile and proceed
    if (data.user) {
      const u = data.user;
      await profileService.upsert({ id: u.id, name, email, role, onboarded: false });
      _setUser({ id: u.id, name, email, role, avatar: "" });
      router.push("/onboarding");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    const { data, error: err } = await auth.verifyEmail({ email, otp });
    setVerifyLoading(false);
    if (err) { setError(err.message ?? "Verification failed."); return; }
    if (data?.user) {
      const u = data.user;
      // Create profile with chosen role
      await profileService.upsert({ id: u.id, name, email, role, onboarded: false });
      _setUser({ id: u.id, name, email, role, avatar: "" });
      router.push("/onboarding");
    }
  };

  const handleGoogle = async () => {
    await auth.signInWithOAuth({
      provider: "google",
      redirectTo: `${window.location.origin}/onboarding`,
    });
  };

  if (needVerify) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4">Verify your email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <Input label="6-digit code" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <Button type="submit" className="w-full" disabled={verifyLoading}>
                {verifyLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold text-blue-600">
          <Shield className="h-8 w-8" />
          <span className="text-2xl">StayHome</span>
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Get started with StayHome in minutes</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button type="button" variant="outline" className="w-full flex items-center gap-2 mb-4" onClick={handleGoogle}>
              <Chrome className="h-4 w-4" />
              Continue with Google
            </Button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <Input label="Full Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Password" type="password" placeholder="Min. 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Input label="Confirm Password" type="password" placeholder="Repeat" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">I am a...</p>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                        role === r.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <r.icon className="h-6 w-6" />
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span className="text-xs leading-tight">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <span>I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
              </label>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
