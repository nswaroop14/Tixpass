import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { usePublicEvent, useCreateBooking, useSubmitPayment, useConfirmPayPalPayment } from "@/hooks/use-public";
import { api, buildUrl } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, AlertCircle, Banknote, ArrowRight, Check, ExternalLink } from "lucide-react";

export default function PublicEvent() {
  const [, params] = useRoute("/event/:eventId");
  const eventId = params?.eventId || "";
  
  const { data: event, isLoading, error } = usePublicEvent(eventId);
  const createBooking = useCreateBooking();
  const submitPayment = useSubmitPayment();
  const confirmPayPal = useConfirmPayPalPayment();

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bank, setBank] = useState<any | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  // Fetch organizer bank details early, before any conditional returns, to keep hooks order stable
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!eventId) return;
        const url = buildUrl(api.public.bank.byEvent.path, { id: eventId });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setBank(data);
        } else {
          if (!cancelled) setBank(null);
        }
      } catch {
        if (!cancelled) setBank(null);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  // Form States
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", qty: 1 });
  const [txRef, setTxRef] = useState("");

  useEffect(() => {
    if (step === 2 && bank?.paymentMethod === "paypal" && bank?.paymentLink && bookingId) {
      const containerId = "paypal-button-container-static";
      let script: HTMLScriptElement | null = null;
      let isMounted = true;

      const renderPayPalButton = () => {
        if (!isMounted) return;
        const container = document.getElementById(containerId);
        if (container && (window as any).paypal) {
          container.innerHTML = ""; // Clear any existing content
          try {
            (window as any).paypal.HostedButtons({
              hostedButtonId: bank.paymentLink,
              onApprove: async (data: any) => {
              console.log("[PayPal] Payment approved by PayPal, confirming with backend...");
              try {
                const result = await confirmPayPal.mutateAsync({ id: bookingId, orderID: data.orderID });
                console.log("[PayPal] Backend confirmation successful:", result);
                if (result.status === 'paid') {
                  setStep(3);
                } else {
                  console.warn("[PayPal] Booking status is not 'paid' after confirmation:", result.status);
                  setPaypalError("Payment was successful but the booking status wasn't updated. Please contact support.");
                }
              } catch (err) {
                console.error("[PayPal] Backend confirmation failed:", err);
                setPaypalError("Payment was successful but we couldn't confirm it on our server. Please contact support.");
              }
            },
              onError: (err: any) => {
                console.error("PayPal error:", err);
                setPaypalError("There was an error with the PayPal button. Please refresh the page.");
              }
            }).render(`#${containerId}`);
          } catch (renderErr) {
            console.error("PayPal render error:", renderErr);
            setPaypalError("Failed to initialize PayPal button.");
          }
        }
      };

      // Load SDK Dynamically
      if (!(window as any).paypal && bank.paypalClientId) {
        script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${bank.paypalClientId}&components=hosted-buttons`;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          if (isMounted) renderPayPalButton();
        };
        script.onerror = () => {
          if (isMounted) setPaypalError("PayPal SDK failed to load. Please refresh the page.");
        };
        document.head.appendChild(script);
      } else if ((window as any).paypal) {
        renderPayPalButton();
      } else if (!bank.paypalClientId) {
        setPaypalError("Organizer has not configured their PayPal Client ID correctly.");
      }

      // Cleanup
      return () => {
        isMounted = false;
        if (script && document.head.contains(script)) {
          // Keep the script if multiple events are viewed, but we could remove it
          // For now, just stop the callback
        }
      };
    }
  }, [step, bank, bookingId]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Event Not Found</h2>
          <p className="text-muted-foreground mt-2">This event may have been cancelled or the URL is invalid.</p>
        </div>
      </PublicLayout>
    );
  }

  

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createBooking.mutateAsync({
        eventId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        ticketQuantity: formData.qty
      });
      setBookingId(res.id);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    try {
      const trimmed = txRef.trim();
      if (!/^[A-Za-z0-9\-_/]{6,}$/.test(trimmed)) {
        alert("Please enter a valid reference (min 6 characters, letters/numbers allowed).");
        return;
      }
      await submitPayment.mutateAsync({ id: bookingId, transactionReference: txRef });
      setStep(3);
    } catch (err) {
      console.error(err);
    }
  };

  const totalAmount = ((event.ticketPrice * formData.qty) / 100).toFixed(2);
  const isSoldOut = event.remainingCapacity <= 0;
  const isPaused = event.status !== "active";

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Banner Section - Perfectly fits and scales */}
        <div className="relative w-full overflow-hidden bg-zinc-900 shadow-2xl mb-10 md:mb-16 rounded-[32px] ring-1 ring-white/10">
          <div className="aspect-[21/9] md:aspect-[21/7] relative w-full overflow-hidden">
            {event.bannerUrl ? (
              <img 
                src={event.bannerUrl} 
                alt={event.title} 
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01] transition-transform duration-700 hover:scale-105" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Calendar className="w-24 h-24 text-white" />
              </div>
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
            <div className="max-w-3xl">
              <div className="flex gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-primary text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                  {event.ticketTypes}
                </span>
                {isPaused && (
                  <span className="inline-block px-3 py-1 bg-zinc-800 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                    Bookings Closed
                  </span>
                )}
                {isSoldOut && (
                  <span className="inline-block px-3 py-1 bg-destructive text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                    Sold Out
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-white mb-4 md:mb-6 drop-shadow-md">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-3 md:gap-6 text-zinc-100 drop-shadow-sm">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  <span className="font-medium">{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-xs md:text-sm">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  <span className="font-medium">{event.venue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Side: Description */}
          <div className="flex-1 space-y-10">
            <section>
              <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                About this Event
              </h3>
              <div className="prose prose-zinc max-w-none text-zinc-600 leading-relaxed text-lg whitespace-pre-wrap">
                {event.description}
              </div>
            </section>
            
            <section className="p-8 bg-muted/30 rounded-3xl border border-border/50">
              <h4 className="font-bold text-lg mb-4">Event Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Venue</p>
                  <p className="font-medium text-zinc-800">{event.venue}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Date & Time</p>
                  <p className="font-medium text-zinc-800">{format(new Date(event.eventDate), 'MMMM d, yyyy @ h:mm a')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Ticket Type</p>
                  <p className="font-medium text-zinc-800">{event.ticketTypes}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Price</p>
                  <p className="font-medium text-zinc-800">€{(event.ticketPrice / 100).toFixed(2)}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Side: Sidebar / Checkout */}
          <div className="w-full lg:w-[450px]">
            <div className="sticky top-24 bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden">
              <div className="bg-primary/5 p-6 border-b border-border">
                <h3 className="font-display font-bold text-xl">Get Your Tickets</h3>
                <p className="text-sm text-muted-foreground">Secure your spot at this event.</p>
              </div>
              
              <div className="p-6 md:p-8">
                {step === 1 && (
                  <>
                    <div className="flex justify-between items-center mb-8 bg-zinc-50 p-4 rounded-2xl border border-border/50">
                      <div>
                        <div className="text-3xl font-display font-bold text-primary">
                          €{(event.ticketPrice / 100).toFixed(2)}
                        </div>
                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-tighter mt-1">{event.ticketTypes}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-zinc-400">PRICE</div>
                      </div>
                    </div>
                    
                    {isPaused ? (
                      <div className="text-center py-10">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Bookings are closed for now</h3>
                        <p className="text-muted-foreground mt-2">Please check back later or contact the organizer.</p>
                      </div>
                    ) : isSoldOut ? (
                      <div className="text-center py-10">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Sold Out</h3>
                        <p className="text-muted-foreground mt-2">All tickets for this event have been sold.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleBook} className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Quantity</Label>
                          <select 
                            className="w-full h-14 px-5 rounded-2xl border border-input bg-background font-bold text-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                            value={formData.qty}
                            onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value)})}
                          >
                            {Array.from({ length: Math.min(10, event.remainingCapacity) }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n}>{n} Ticket{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full Name</Label>
                            <Input required placeholder="Your name" className="h-14 rounded-2xl px-5 border-border/60" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Email Address</Label>
                            <Input required type="email" placeholder="email@example.com" className="h-14 rounded-2xl px-5 border-border/60" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phone Number</Label>
                            <Input required type="tel" placeholder="+1 (555) 000-0000" className="h-14 rounded-2xl px-5 border-border/60" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                          </div>
                        </div>
                        
                        <div className="pt-6 border-t border-border mt-8 flex items-center justify-between">
                          <span className="font-display font-bold text-xl text-zinc-500">Total</span>
                          <span className="font-display font-black text-3xl text-zinc-900">€{totalAmount}</span>
                        </div>

                        <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl hover-elevate shadow-xl shadow-primary/20 gap-2 mt-4" disabled={createBooking.isPending}>
                          {createBooking.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>Book Now <ArrowRight className="w-5 h-5" /></>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">You will proceed to payment verification next.</p>
                      </form>
                    )}
                  </>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-primary/5 p-6 rounded-3xl text-center border border-primary/10">
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                        <Banknote className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-xl mb-1">Transfer Payment</h3>
                      <p className="text-sm text-muted-foreground">Please pay <strong className="text-primary font-bold">€{totalAmount}</strong> to complete your booking.</p>
                      
                      {bank?.paymentMethod === "paypal" ? (
                        <div className="bg-white border border-border p-6 rounded-3xl mt-6 text-center space-y-5 shadow-inner w-full">
                          <p className="text-sm font-medium">Click the button below to pay via PayPal. Once payment is complete, your tickets will be sent automatically.</p>
                          <div id="paypal-button-container-static" className="min-h-[150px] w-full block relative mx-auto [&_iframe]:!min-w-full [&_iframe]:!w-full [&_*]:!whitespace-nowrap [&_.pp-68MAVF4NNT33Y]:!block">
                            {confirmPayPal.isPending && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            )}
                            {/* The PayPal button will be rendered here */}
                            {!paypalError && !(window as any).paypal && (
                              <div className="flex flex-col items-center justify-center gap-2 h-[150px]">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Loading PayPal...</p>
                              </div>
                            )}
                          </div>
                          {paypalError && (
                            <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
                              <p className="text-destructive text-xs font-semibold">{paypalError}</p>
                              <Button variant="link" className="text-xs h-auto p-0 mt-1" onClick={() => window.location.reload()}>Refresh Page</Button>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-4">Important: Do not close this window</p>
                        </div>
                      ) : bank?.paymentMethod === "link" && bank?.paymentLink ? (
                        <div className="bg-white border border-border p-5 rounded-2xl mt-6 text-left space-y-4 shadow-inner">
                          <p className="text-sm">Use the payment link below. Complete the transaction on the external site, copy the reference code, then return here to paste it.</p>
                          <Button type="button" className="w-full h-14 rounded-2xl font-bold gap-2" onClick={() => window.open(bank.paymentLink, "_blank", "noopener,noreferrer")}>
                            Open Payment Link <ExternalLink className="w-4 h-4" />
                          </Button>
                          <p className="text-xs text-muted-foreground">Do not close this tab. Your booking details remain here while you complete payment.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-border p-5 rounded-2xl mt-6 text-left space-y-3 font-mono text-sm shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs font-bold">BANK</span>
                            <span className="font-bold text-zinc-900">{bank?.bankName || "—"}</span>
                          </div>
                          <div className="h-px bg-zinc-100 w-full" />
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs font-bold">ACCOUNT</span>
                            <span className="font-bold text-zinc-900">{bank?.accountNumber || "—"}</span>
                          </div>
                          <div className="h-px bg-zinc-100 w-full" />
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs font-bold">HOLDER</span>
                            <span className="font-bold text-zinc-900">{bank?.accountHolder || "—"}</span>
                          </div>
                          <div className="h-px bg-zinc-100 w-full" />
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs font-bold">ROUTING</span>
                            <span className="font-bold text-zinc-900">{bank?.routingNumber || "—"}</span>
                          </div>
                          <div className="h-px bg-zinc-100 w-full" />
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs font-bold">TYPE</span>
                            <span className="font-bold text-zinc-900">{bank?.accountType || "—"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">Verify details carefully before transfer.</p>
                        </div>
                      )}
                    </div>

                    {bank?.paymentMethod !== "paypal" && (
                      <form onSubmit={handlePayment} className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Transaction Reference No.</Label>
                          <Input 
                            required 
                            placeholder="ENTER REFERENCE CODE" 
                            className="h-14 font-mono uppercase text-center text-lg tracking-widest rounded-2xl border-primary/30 focus:border-primary" 
                            value={txRef} 
                            onChange={e => setTxRef(e.target.value)} 
                          />
                          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
                            Enter the reference code from your {
                              bank?.paymentMethod === "paypal" ? "PayPal receipt" : 
                              bank?.paymentMethod === "link" ? "payment site receipt" : 
                              "bank transfer receipt"
                            }
                          </p>
                        </div>
                        <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl hover-elevate shadow-xl shadow-primary/20" disabled={submitPayment.isPending}>
                          {submitPayment.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Payment'}
                        </Button>
                        <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-zinc-400" onClick={() => setStep(1)}>
                          Go Back
                        </Button>
                      </form>
                    )}
                    {bank?.paymentMethod === "paypal" && (
                      <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-zinc-400 mt-4" onClick={() => setStep(1)}>
                        Go Back
                      </Button>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-display font-bold mb-4">Payment Received!</h3>
                    <div className="space-y-4 text-muted-foreground mb-10 leading-relaxed">
                      <p>
                        We're currently verifying your payment reference: <strong className="text-zinc-900 font-mono tracking-wider">{txRef}</strong>
                      </p>
                      <p className="bg-muted/50 p-4 rounded-2xl border border-border text-sm italic">
                        Once approved, your unique digital tickets will be sent to <strong className="text-zinc-900 not-italic">{formData.email}</strong>.
                      </p>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-bold" onClick={() => window.location.href = '/'}>
                      Return to Events
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
