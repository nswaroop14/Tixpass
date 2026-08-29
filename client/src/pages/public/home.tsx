import { useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-50 to-white text-center">
        <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-8">
          <Ticket className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight max-w-4xl text-zinc-950 mb-6">
          The seamless way to manage and sell tickets.
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mb-12">
          A premium ticketing experience for organizers and attendees alike. 
          Scan, verify, and manage events all in one place.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="h-14 px-8 text-base font-semibold rounded-full hover-elevate"
            onClick={() => setLocation("/login")}
          >
            Go to Organizer Portal <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-8 text-base font-semibold rounded-full"
            onClick={() => setLocation("/browse")}
          >
            Browse Events <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-8 text-base font-semibold rounded-full"
            aria-label="Get Started as Organizer"
            onClick={() => setLocation("/organizer/signup")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
