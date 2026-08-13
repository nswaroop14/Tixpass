import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard, Users, Calendar, Ticket, ScanLine, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "organizer";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/organizers", label: "Organizers", icon: Users },
  ];

  const organizerLinks = [
    { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/events", label: "Events", icon: Calendar },
    { href: "/organizer/bookings", label: "Bookings", icon: Ticket },
    { href: "/organizer/scan", label: "Scan Tickets", icon: ScanLine },
    { href: "/organizer/profile", label: "Account", icon: Users },
  ];

  const links = role === "admin" ? adminLinks : organizerLinks;

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="font-display font-bold text-lg tracking-tight">
          {role === "admin" ? "Admin Portal" : "Organizer Hub"}
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            location === link.href 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
            <link.icon className="w-5 h-5" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-card border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">
                <NavContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-display font-bold text-lg">
              {role === "admin" ? "Admin" : "Organizer"}
            </h1>
          </div>
          
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
