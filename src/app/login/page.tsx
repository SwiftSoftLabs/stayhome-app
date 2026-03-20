"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

function getRoleFromEmail(email: string): string {
  const e = email.toLowerCase();
  if (e.includes("assessor")) return "assessor";
  if (e.includes("contractor")) return "contractor";
  if (e.includes("admin")) return "admin";
  return "family";
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "assessor": return "/dashboard/assessor";
    case "contractor": return "/dashboard/contractor";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/family";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    const role = getRoleFromEmail(email);
    const name = email.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim() || "User";
    login({
      id: crypto.randomUUID(),
      name,
      email,
      role,
      avatar: "",
    });
    router.push(getDashboardPath(role));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 font-bold text-blue-600">
            <Shield className="h-7 w-7" />
            <span className="text-xl">StayHome</span>
          </Link>
          <CardTitle className="mt-4">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <Link href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full">Log In</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
