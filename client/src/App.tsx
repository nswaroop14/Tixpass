import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import TicketLink from "@/pages/ticket-link";
import BrowseEvents from "@/pages/public/browse";
import Home from "./pages/public/home";
import PublicEvent from "./pages/public/event";
import PublicTicket from "./pages/public/ticket";
import Pricing from "./pages/public/pricing";
import Contact from "./pages/public/contact";
import OrganizerSignup from "./pages/public/organizer-signup";
import Login from "./pages/auth/login";
import AdminDashboard from "./pages/admin/dashboard";
import OrganizerEvents from "./pages/organizer/events";
import OrganizerDashboard from "./pages/organizer/dashboard";
import AttendeeList from "./pages/organizer/attendees";
import OrganizerBookings from "./pages/organizer/bookings";
import OrganizerScan from "./pages/organizer/scan";
import OrganizerProfile from "./pages/organizer/profile";
import OrganizerAnalytics from "./pages/organizer/analytics";

function ProtectedRoute({ component: Component, roleRequired, ...props }: { component: React.ComponentType<any>, roleRequired?: string, [key: string]: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (roleRequired && user.role !== roleRequired) {
    // Redirect wrong roles to their respective dashboards
    return <Redirect to={user.role === 'admin' ? '/admin' : '/organizer'} />;
  }

  return <Component {...props} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/browse" component={BrowseEvents} />
      <Route path="/t/:ticketCode" component={TicketLink} />
      <Route path="/event/:identifier" component={PublicEvent} />
      <Route path="/ticket/:ticketId" component={PublicTicket} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/organizer/signup" component={OrganizerSignup} />
      
      {/* Auth */}
      <Route path="/login">
        {() => {
          if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
          if (user) return <Redirect to={user.role === 'admin' ? '/admin' : '/organizer'} />;
          return <Login />;
        }}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} roleRequired="admin" />}
      </Route>
      <Route path="/admin/organizers">
        {() => <ProtectedRoute component={AdminDashboard} roleRequired="admin" />}
      </Route>

      {/* Organizer Routes */}
      <Route path="/organizer">
        {() => <ProtectedRoute component={OrganizerDashboard} roleRequired="organizer" />}
      </Route>
      <Route path="/organizer/events">
        {() => <ProtectedRoute component={OrganizerEvents} roleRequired="organizer" />}
      </Route>
      <Route path="/organizer/events/:id/attendees">
        {(params) => <ProtectedRoute component={AttendeeList} roleRequired="organizer" {...params} />}
      </Route>
      <Route path="/organizer/bookings">
        {() => <ProtectedRoute component={OrganizerBookings} roleRequired="organizer" />}
      </Route>
      <Route path="/organizer/scan">
        {() => <ProtectedRoute component={OrganizerScan} roleRequired="organizer" />}
      </Route>
      <Route path="/organizer/profile">
        {() => <ProtectedRoute component={OrganizerProfile} roleRequired="organizer" />}
      </Route>
      <Route path="/organizer/analytics">
        {() => <ProtectedRoute component={OrganizerAnalytics} roleRequired="organizer" />}
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
