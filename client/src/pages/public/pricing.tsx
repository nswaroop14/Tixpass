import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Pricing() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-display font-bold mb-3">Pricing</h1>
        <p className="text-muted-foreground mb-8">Choose the plan that fits your events.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold">€50 per event</h2>
            <p className="text-muted-foreground mt-1">Pay-per-event model</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Unlimited attendees per event</li>
              <li>• QR ticket generation</li>
              <li>• Entry scanning and verification</li>
            </ul>
            <Link href="/organizer/signup">
              <Button className="mt-6 w-full h-11" aria-label="Select Pay-per-event">Choose Event Plan</Button>
            </Link>
          </Card>
          <Card className="p-6">
            <h2 className="text-2xl font-bold">€199 per month</h2>
            <p className="text-muted-foreground mt-1">Subscription model</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Multiple events per month</li>
              <li>• Priority support</li>
              <li>• All pay-per-event features</li>
            </ul>
            <Link href="/organizer/signup">
              <Button className="mt-6 w-full h-11" aria-label="Select Subscription">Choose Monthly Plan</Button>
            </Link>
          </Card>
        </div>
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-2">Feature Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-4 border rounded-xl">
              <p className="font-medium">Ticketing</p>
              <p className="text-muted-foreground">QR codes, attendee lists, check-in</p>
            </div>
            <div className="p-4 border rounded-xl">
              <p className="font-medium">Organizer Tools</p>
              <p className="text-muted-foreground">Bookings, manual tickets, stats</p>
            </div>
            <div className="p-4 border rounded-xl">
              <p className="font-medium">Support</p>
              <p className="text-muted-foreground">Email support and updates</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
