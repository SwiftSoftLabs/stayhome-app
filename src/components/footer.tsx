"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

// The signed Synlex documents. /about had no page and is gone; Contact is the signed legal contact.
const footerLinks = [
  { href: "/legal", label: "Legal Center" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/legal/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
          <Shield className="h-5 w-5" />
          <span>StayHome</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-gray-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} StayHome. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
