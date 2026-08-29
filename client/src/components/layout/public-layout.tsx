import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, Menu, X, ArrowRight, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location === "/";

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header
        className={`h-16 sticky top-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <img
              src="/tixpass-logo-v2.png"
              alt="TixPass"
              className="h-10 md:h-12 w-auto group-hover:scale-105 transition-transform"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/browse">
              <Button variant="ghost" className={`h-9 text-sm font-medium ${scrolled || !isHome ? "text-gray-600 hover:text-gray-900" : "text-gray-700 hover:text-gray-900"}`}>
                Events
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className={`h-9 text-sm font-medium ${scrolled || !isHome ? "text-gray-600 hover:text-gray-900" : "text-gray-700 hover:text-gray-900"}`}>
                Pricing
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className={`h-9 text-sm font-medium ${scrolled || !isHome ? "text-gray-600 hover:text-gray-900" : "text-gray-700 hover:text-gray-900"}`}>
                Contact
              </Button>
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <Link href="/login">
              <Button variant="ghost" className={`h-9 text-sm font-medium gap-1.5 ${scrolled || !isHome ? "text-gray-600 hover:text-gray-900" : "text-gray-700 hover:text-gray-900"}`}>
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Button>
            </Link>
            <Link href="/organizer/signup">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white h-9 text-sm px-5 rounded-full font-medium gap-1.5 ml-1">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-in slide-in-from-top-2">
            <Link href="/browse" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 h-11 text-sm justify-start font-medium">
                Events
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 h-11 text-sm justify-start font-medium">
                Pricing
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 h-11 text-sm justify-start font-medium">
                Contact
              </Button>
            </Link>
            <div className="border-t border-gray-100 my-2" />
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 h-11 text-sm justify-start font-medium gap-2">
                <LogIn className="w-4 h-4" />
                Organizer Login
              </Button>
            </Link>
            <Link href="/organizer/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-sm justify-start font-medium gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <img src="/tixpass-logo-v2.png" alt="TixPass" className="h-10 md:h-12 w-auto" />
              </Link>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
                The seamless way to discover, book and manage tickets for movies, events and experiences.
              </p>
              <div className="flex items-center gap-3">
                <a href="mailto:svantech0@gmail.com" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-violet-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
                <a href="https://www.instagram.com/tixpass/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-violet-600 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><Link href="/browse" className="text-sm text-gray-400 hover:text-white transition-colors">Browse Events</Link></li>
                <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/organizer/signup" className="text-sm text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Organizer Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} TixPass. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
