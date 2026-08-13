import { ReactNode } from "react";
import { Link } from "wouter";
import { Ticket, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-gray-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-gray-900">TixPass</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/organizer/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm px-4 gap-2">
                Get Started
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 h-9 text-sm">
                Pricing
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 h-9 text-sm">
                Contact
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 h-9 text-sm gap-2">
                <LogIn className="w-4 h-4" />
                Organizer Login
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            <Link href="/organizer/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-sm justify-start gap-2">
                Get Started
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 h-10 text-sm justify-start">
                Pricing
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 h-10 text-sm justify-start">
                Contact
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 h-10 text-sm justify-start gap-2">
                <LogIn className="w-4 h-4" />
                Organizer Login
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        <p>© {new Date().getFullYear()} TixPass. All rights reserved.</p>
      </footer>
    </div>
  );
}
