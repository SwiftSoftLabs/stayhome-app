import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "How it works - StayHome",
  description: "Request a home safety audit, then read the written report for your family.",
};

const steps = [
  { icon: Calendar, title: "Request an audit", desc: "Sign in, enter the home address, and choose a date and time. StayHome saves this as a request. It is not a paid booking, and no assessor is assigned yet." },
  { icon: FileText, title: "Read the written report", desc: "When a visit is completed, the assessor writes the safety report. The family account can open that report." },
  { icon: Users, title: "Stay with your account", desc: "Audits and reports stay on the family account that requested them. Assessor and contractor work accounts do not get a separate paid plan." },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">How it works</h1>
            <p className="mt-4 text-lg text-gray-600">
              StayHome is free for families during launch. You request an audit, and you can view your own reports after a visit is complete.
            </p>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-blue-600">Step {index + 1}</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">{step.title}</h2>
                <p className="mt-2 text-gray-600">{step.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/book"><Button size="lg">Request an audit</Button></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
