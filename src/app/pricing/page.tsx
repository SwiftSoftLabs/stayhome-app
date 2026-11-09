import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - StayHome",
  description: "StayHome is free for families during launch. Request an audit from your account.",
};

const included = [
  "Request a home safety audit for your family",
  "View reports on your own completed audits",
  "Assessor and contractor work accounts stay free",
  "No subscription during the free launch",
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Free for families</h1>
            <p className="mt-4 text-lg text-gray-600">
              Request an audit. Paid plans are not offered until a real product is ready.
            </p>
          </div>
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <p className="text-3xl font-bold text-gray-900">Free</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/book" className="mt-6 block">
                <Button className="w-full">Request an audit</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
