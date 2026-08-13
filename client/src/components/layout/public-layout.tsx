import { ReactNode } from "react";
import { Link } from "wouter";
import { Ticket, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 border-b border-border bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">TixPass</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/organizer/signup">
              <Button className="hidden sm:inline" aria-label="Get Started">Get Started</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" aria-label="Pricing">Pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" aria-label="Contact Us">Contact</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="gap-2" aria-label="Organizer Login">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Organizer Login</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} TixPass. All rights reserved.</p>
      </footer>
    </div>
  );
}
