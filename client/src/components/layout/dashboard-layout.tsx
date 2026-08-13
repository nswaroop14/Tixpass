import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  ScanLine,
  Menu,
  BarChart3,
  HelpCircle,
} from "lucide-react";
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
    { href: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/organizer/scan", label: "Scan Tickets", icon: ScanLine },
    { href: "/organizer/profile", label: "Account", icon: Users },
  ];

  const links = role === "admin" ? adminLinks : organizerLinks;

  const isActive = (href: string) => {
    if (href === "/organizer" || href === "/admin") {
      return location === href;
    }
    return location.startsWith(href);
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-gray-900">
            {role === "admin" ? "Admin Portal" : "Organizer Hub"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <link.icon
                className={`w-[18px] h-[18px] ${
                  active ? "text-indigo-600" : "text-gray-400"
                }`}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Help Section */}
      {role === "organizer" && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900">Need Help?</span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Access guides and support for managing your events.
            </p>
            <Link href="/organizer/profile">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 border-gray-200 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                View Help Center →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-9 text-sm"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar (Desktop) */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col hidden md:flex shrink-0">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px] flex flex-col bg-white">
                <NavContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-display font-bold text-lg text-gray-900">
              {role === "admin" ? "Admin" : "Organizer"}
            </h1>
          </div>

          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
