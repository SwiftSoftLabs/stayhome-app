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
import { Shield, Chrome } from "lucide-react";

function dashboardPath(role: string) {
  switch (role) {
    case "assessor": return "/dashboard/assessor";
    case "contractor": return "/dashboard/contractor";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/family";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { _setUser } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const { data, error: err } = await auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message ?? "Login failed."); return; }
    if (!data) { setError("Login failed."); return; }
    const u = data.user;
    const role = (u.metadata as Record<string, string>)?.role ?? "family";
    _setUser({ id: u.id, name: u.profile?.name ?? u.email.split("@")[0], email: u.email, role, avatar: u.profile?.avatar_url ?? "" });
    // Fetch profile for onboarding check
    const { data: profile } = await profileService.getById(u.id);
    if (profile && !profile.onboarded) { router.push("/onboarding"); return; }
    router.push(dashboardPath(role));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    const { data, error: err } = await auth.verifyEmail({ email, otp });
    setVerifyLoading(false);
    if (err) { setError(err.message ?? "Verification failed."); return; }
    if (data?.user) {
      const u = data.user;
      const role = (u.metadata as Record<string, string>)?.role ?? "family";
      _setUser({ id: u.id, name: u.profile?.name ?? u.email.split("@")[0], email: u.email, role, avatar: "" });
      router.push("/onboarding");
    }
  };

  const handleGoogle = async () => {
    await auth.signInWithOAuth({
      provider: "google",
      redirectTo: `${window.location.origin}/dashboard/family`,
    });
  };

  if (needVerify) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="mt-4">Check your email</CardTitle>
            <CardDescription>Enter the 6-digit code we sent to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={verifyLoading}>
                {verifyLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
            <button onClick={() => setNeedVerify(false)} className="mt-4 w-full text-center text-sm text-gray-500 hover:underline">
              Back to login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold text-blue-600">
          <Shield className="h-8 w-8" />
          <span className="text-2xl">StayHome</span>
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2 mb-4"
              onClick={handleGoogle}
            >
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
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
