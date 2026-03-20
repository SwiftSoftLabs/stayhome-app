"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Home, ClipboardCheck, Wrench } from "lucide-react";

const roles = [
  { value: "family", label: "Family Member", icon: Home, desc: "Monitor a loved one's home safety" },
  { value: "assessor", label: "Assessor", icon: ClipboardCheck, desc: "Conduct professional home assessments" },
  { value: "contractor", label: "Contractor", icon: Wrench, desc: "Provide home modification services" },
];

function getDashboardPath(role: string): string {
  switch (role) {
    case "assessor": return "/dashboard/assessor";
    case "contractor": return "/dashboard/contractor";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/family";
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("family");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("You must agree to the Terms of Service.");
      return;
    }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 font-bold text-blue-600">
            <Shield className="h-7 w-7" />
            <span className="text-xl">StayHome</span>
          </Link>
          <CardTitle className="mt-4">Create your account</CardTitle>
          <CardDescription>Get started with StayHome in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <Input label="Full Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirm Password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">I am a...</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-4 text-center transition-colors ${
                      role === r.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span>I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
            </label>

            <Button type="submit" className="w-full">Sign Up</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
