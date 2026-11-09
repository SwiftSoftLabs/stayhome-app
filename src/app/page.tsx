import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Users, ClipboardList, Home, ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  { icon: Calendar, title: "Request an audit", desc: "Tell us the address and a time that works. This is a request until an assessor is assigned." },
  { icon: FileText, title: "Get a written report", desc: "After the visit is complete, the family can read the report the assessor wrote." },
  { icon: Users, title: "Keep it with your account", desc: "View the audits and reports that belong to your family." },
];

const features = [
  { icon: ClipboardList, title: "Audit requests", desc: "Families can request a home safety visit without a subscription." },
  { icon: FileText, title: "Written reports", desc: "Completed visits include a report written by the assessor." },
  { icon: Home, title: "Your own records", desc: "Sign in to see the requests and reports for your family." },
];

const freeFeatures = [
  "Request a home safety audit",
  "View reports for your own completed audits",
  "No subscription during the free launch",
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <Badge className="mb-4">Free for families</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Keep Your Loved Ones<br />Safe at Home
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Request a home safety audit and keep the written report with your family account.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/book"><Button size="lg">Request an audit <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="/how-it-works"><Button variant="outline" size="lg">How it works</Button></Link>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white py-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 text-center md:grid-cols-3">
            {[
              ["3 in 4", "seniors want to age at home"],
              ["$35,000", "avg fall hospitalization cost"],
              ["1 in 4", "seniors will fall this year"],
            ].map(([stat, label]) => (
              <div key={stat}>
                <p className="text-3xl font-bold text-blue-600">{stat}</p>
                <p className="mt-1 text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">Three steps to request a safer home</p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <s.icon className="h-8 w-8" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-blue-600">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">Why families use StayHome</h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="p-6">
                  <f.icon className="h-10 w-10 text-blue-600" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">Free for families</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">Request an audit. There is no paid plan during launch.</p>
            <Card className="mt-12">
              <CardHeader>
                <Badge className="w-fit">Free launch</Badge>
                <CardTitle>Family</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">Free</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/book" className="mt-6 block">
                  <Button className="w-full">Request an audit</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-blue-600 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to request an audit?</h2>
            <p className="mx-auto mt-2 max-w-lg text-blue-100">Add the address and a time. No payment is collected on this request.</p>
            <Link href="/book" className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">Request an audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
