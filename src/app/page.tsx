"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, FileText, Users, Brain, ShieldCheck, Activity, BarChart3,
  Star, CheckCircle, ArrowRight,
} from "lucide-react";

const steps = [
  { icon: Calendar, title: "Book an Assessment", desc: "Schedule a certified home safety assessment at a time that works for you." },
  { icon: FileText, title: "Get Your Safety Report", desc: "Receive a detailed AI-powered report with prioritized recommendations." },
  { icon: Users, title: "Connect with Contractors", desc: "Get matched with vetted local contractors to implement changes." },
];

const features = [
  { icon: Brain, title: "AI-Powered Reports", desc: "Our AI analyzes hundreds of risk factors to generate comprehensive safety reports." },
  { icon: ShieldCheck, title: "Vetted Contractors", desc: "Every contractor in our network is licensed, insured, and background-checked." },
  { icon: Activity, title: "Ongoing Monitoring", desc: "Optional smart-home sensors track changes and alert you to new risks." },
  { icon: BarChart3, title: "Risk Scoring", desc: "Proprietary scoring system quantifies risk so you can prioritize what matters most." },
];

const plans = [
  { name: "Safety Audit", price: "$199–299", period: "one-time", features: ["Certified in-home assessment", "AI-powered safety report", "Priority recommendations", "Contractor referrals"], highlight: false },
  { name: "Monitoring", price: "$25", period: "/mo", features: ["Everything in Safety Audit", "Smart sensor kit", "Real-time alerts", "Monthly risk updates"], highlight: true },
  { name: "Premium", price: "$49", period: "/mo", features: ["Everything in Monitoring", "Quarterly check-ins", "Dedicated care coordinator", "Priority contractor scheduling"], highlight: false },
];

const testimonials = [
  { name: "Sarah M.", relation: "Daughter", quote: "After my mom's first fall scare, StayHome gave us peace of mind. The assessment found 12 risks we never noticed.", rating: 5 },
  { name: "James K.", relation: "Son", quote: "The contractors were professional and fast. Within a week, Dad's bathroom had grab bars and better lighting.", rating: 5 },
  { name: "Linda T.", relation: "Caregiver", quote: "The monitoring alerts caught a loose railing before it became a problem. Worth every penny.", rating: 5 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <Badge className="mb-4">Trusted by 10,000+ families</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Keep Your Loved Ones<br />Safe at Home
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Professional home safety assessments powered by AI. Prevent falls, reduce risks, and help seniors age in place with confidence.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/book"><Button size="lg">Book an Audit <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="#how-it-works"><Button variant="outline" size="lg">Learn More</Button></Link>
            </div>
          </div>
        </section>

        {/* Stats */}
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

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">Three simple steps to a safer home</p>
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

        {/* Features */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">Why Choose StayHome</h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Pricing */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {plans.map((p) => (
                <Card key={p.name} className={p.highlight ? "border-blue-600 ring-2 ring-blue-600" : ""}>
                  <CardHeader>
                    {p.highlight && <Badge className="w-fit">Most Popular</Badge>}
                    <CardTitle>{p.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                      <span className="text-sm text-gray-500">{p.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 shrink-0 text-green-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/book" className="mt-6 block">
                      <Button variant={p.highlight ? "default" : "outline"} className="w-full">Get Started</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">What Families Are Saying</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="p-6">
                  <div className="flex gap-1">{Array.from({ length: t.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="mt-4 text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.relation}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-blue-600 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to Make Your Home Safer?</h2>
            <p className="mx-auto mt-2 max-w-lg text-blue-100">Join thousands of families who trust StayHome to protect their loved ones.</p>
            <Link href="/book" className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">Book an Audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
