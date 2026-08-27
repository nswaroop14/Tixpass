import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { usePublicEvent, useCreateBooking, useSubmitPayment, useConfirmPayPalPayment } from "@/hooks/use-public";
import { api, buildUrl } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Copy,
  CheckCircle2,
  Ticket,
  Shield,
  Minus,
  Plus,
} from "lucide-react";

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
  const [txRef, setTxRef] = useState("");
  const [copied, setCopied] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", qty: 1 });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (step === 2 && bank?.paymentMethod === "paypal" && bank?.paymentLink && bookingId) {
      const containerId = "paypal-button-container-static";
      let script: HTMLScriptElement | null = null;
      let isMounted = true;

      const renderPayPalButton = () => {
        if (!isMounted) return;
        const container = document.getElementById(containerId);
        if (container && (window as any).paypal) {
          container.innerHTML = "";
          try {
            (window as any).paypal.HostedButtons({
              hostedButtonId: bank.paymentLink,
              onApprove: async (data: any) => {
                try {
                  const result = await confirmPayPal.mutateAsync({ id: bookingId, orderID: data.orderID });
                  if (result.status === "paid") {
                    setStep(3);
                  } else {
                    setPaypalError("Payment was successful but the booking status wasn't updated. Please contact support.");
                  }
                } catch (err) {
                  setPaypalError("Payment was successful but we couldn't confirm it on our server. Please contact support.");
                }
              },
              onError: (err: any) => {
                console.error("PayPal error:", err);
                setPaypalError("There was an error with the PayPal button. Please refresh the page.");
              },
            }).render(`#${containerId}`);
          } catch (renderErr) {
            console.error("PayPal render error:", renderErr);
            setPaypalError("Failed to initialize PayPal button.");
          }
        }
      };

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

      return () => {
        isMounted = false;
      };
    }
  }, [step, bank, bookingId]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading event...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Event Not Found</h2>
          <p className="text-sm text-gray-500 mt-2">This event may have been cancelled or the URL is invalid.</p>
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
        ticketQuantity: formData.qty,
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

  const handleCopyRef = () => {
    navigator.clipboard.writeText(txRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAmount = ((event.ticketPrice * formData.qty) / 100).toFixed(2);
  const isSoldOut = event.remainingCapacity <= 0;
  const isPaused = event.status !== "active";
  const lowAvailability = event.remainingCapacity > 0 && event.remainingCapacity <= 15;

  const stepLabels = ["Tickets", "Details", "Payment", "Confirmed"];

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-gray-900" style={{ height: "clamp(300px, 40vw, 450px)" }}>
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Ticket className="w-20 h-20 text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-5 md:p-10 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] md:text-[11px] font-semibold uppercase tracking-wider">
                {event.ticketTypes}
              </span>
              {isPaused && (
                <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-700 text-gray-300 rounded-md text-[10px] md:text-[11px] font-semibold uppercase tracking-wider">
                  Bookings Closed
                </span>
              )}
              {isSoldOut && (
                <span className="inline-flex items-center px-2.5 py-0.5 bg-red-600 text-white rounded-md text-[10px] md:text-[11px] font-semibold uppercase tracking-wider">
                  Sold Out
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-3 md:mb-4">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs md:text-sm border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {format(new Date(event.eventDate), "EEE, MMM d · h:mm a")}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs md:text-sm border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Progress Steps - Desktop */}
        <div className="hidden md:flex items-center justify-center gap-0 mb-10">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isComplete
                        ? "bg-indigo-600 text-white"
                        : isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-12 md:w-20 h-px mx-3 ${isComplete ? "bg-indigo-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-center gap-2 mb-6">
          <span className="text-xs font-semibold text-indigo-600">Step {step} of 3</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-6 h-1 rounded-full ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Main Content */}
          <div className="flex-1 min-w-0">
            {step === 1 && (
              <div className="space-y-8">
                {/* Ticket Selection */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Book Your Tickets</h2>
                  <p className="text-sm text-gray-500 mb-6">Select your tickets and continue to checkout.</p>

                  {isPaused ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Bookings are closed</h3>
                      <p className="text-sm text-gray-500">Please check back later or contact the organizer.</p>
                    </div>
                  ) : isSoldOut ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Sold Out</h3>
                      <p className="text-sm text-gray-500">All tickets for this event have been sold.</p>
                    </div>
                  ) : (
                    <form ref={formRef} onSubmit={handleBook}>
                      {/* Ticket Type Card */}
                      <div className="border border-gray-200 rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{event.ticketTypes}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">
                              €{(event.ticketPrice / 100).toFixed(2)}
                              <span className="text-sm font-normal text-gray-400 ml-1">/ ticket</span>
                            </p>
                          </div>
                          <div className="text-right">
                            {lowAvailability ? (
                              <span className="text-xs font-medium text-amber-600">Only {event.remainingCapacity} left</span>
                            ) : (
                              <span className="text-xs text-gray-400">{event.remainingCapacity} available</span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <span className="text-sm text-gray-600 font-medium">Quantity</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => formData.qty > 1 && setFormData({ ...formData, qty: formData.qty - 1 })}
                              disabled={formData.qty <= 1}
                              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-lg font-bold text-gray-900">{formData.qty}</span>
                            <button
                              type="button"
                              onClick={() =>
                                formData.qty < Math.min(10, event.remainingCapacity) &&
                                setFormData({ ...formData, qty: formData.qty + 1 })
                              }
                              disabled={formData.qty >= Math.min(10, event.remainingCapacity)}
                              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Your Details</h3>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                            <Input
                              required
                              placeholder="Your full name"
                              className="h-11 bg-gray-50 border-gray-200 text-sm"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-600">Email Address</Label>
                            <Input
                              required
                              type="email"
                              placeholder="email@example.com"
                              className="h-11 bg-gray-50 border-gray-200 text-sm"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-600">Phone Number</Label>
                            <Input
                              required
                              type="tel"
                              placeholder="+357 99 000000"
                              className="h-11 bg-gray-50 border-gray-200 text-sm"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button - Desktop */}
                      <div className="hidden lg:block pt-2">
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-sm font-semibold gap-2"
                          disabled={createBooking.isPending}
                        >
                          {createBooking.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Continue to Payment <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Event Info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Event Information</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">{event.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Venue</p>
                      <p className="text-sm font-medium text-gray-900">{event.venue}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">{format(new Date(event.eventDate), "MMM d, yyyy · h:mm a")}</p>
                    </div>
                    {event.language && (
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Audio</p>
                        <p className="text-sm font-medium text-gray-900">{event.language}</p>
                      </div>
                    )}
                    {event.subtitle && (
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Subtitles</p>
                        <p className="text-sm font-medium text-gray-900">{event.subtitle}</p>
                      </div>
                    )}
                    {event.screen && (
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Screen</p>
                        <p className="text-sm font-medium text-gray-900">{event.screen}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Ticket Type</p>
                      <p className="text-sm font-medium text-gray-900">{event.ticketTypes}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Price</p>
                      <p className="text-sm font-medium text-gray-900">€{(event.ticketPrice / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  {event.notes && (
                    <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider mb-2">Important Information</p>
                      <ul className="space-y-1.5">
                        {event.notes.split("\n").filter((n: string) => n.trim()).map((note: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                            <span>{note.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Payment</h2>
                <p className="text-sm text-gray-500 mb-6">Complete your payment to confirm your booking.</p>

                {bank?.paymentMethod === "paypal" ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-4">Click the button below to pay via PayPal. Once payment is complete, your tickets will be confirmed automatically.</p>
                      <div id="paypal-button-container-static" className="min-h-[150px] w-full relative">
                        {confirmPayPal.isPending && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          </div>
                        )}
                        {!paypalError && !(window as any).paypal && (
                          <div className="flex flex-col items-center justify-center gap-2 h-[150px]">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            <p className="text-xs text-gray-400">Loading PayPal...</p>
                          </div>
                        )}
                      </div>
                      {paypalError && (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200 mt-4">
                          <p className="text-red-600 text-xs font-medium">{paypalError}</p>
                          <button onClick={() => window.location.reload()} className="text-xs text-indigo-600 font-medium mt-1 hover:underline">
                            Refresh Page
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : bank?.paymentMethod === "link" && bank?.paymentLink ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-4">
                        Use the payment link below. Complete the transaction on the external site, copy the reference code, then return here to paste it.
                      </p>
                      <Button
                        type="button"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm gap-2"
                        onClick={() => window.open(bank.paymentLink, "_blank", "noopener,noreferrer")}
                      >
                        Open Payment Link <ExternalLink className="w-4 h-4" />
                      </Button>
                      <p className="text-[11px] text-gray-400 mt-3">Do not close this tab. Your booking details remain here while you complete payment.</p>
                    </div>
                    {/* Transaction Reference */}
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Transaction Reference</Label>
                      <Input
                        required
                        placeholder="ENTER REFERENCE CODE"
                        className="h-11 font-mono uppercase text-center text-sm tracking-widest bg-gray-50 border-gray-200"
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                        Enter the reference code from your payment receipt
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm"
                      onClick={handlePayment}
                      disabled={submitPayment.isPending || !txRef.trim()}
                    >
                      {submitPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bank Details */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Bank</span>
                        <span className="text-sm font-semibold text-gray-900">{bank?.bankName || "—"}</span>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Account Number</span>
                        <span className="text-sm font-semibold text-gray-900">{bank?.accountNumber || "—"}</span>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Account Holder</span>
                        <span className="text-sm font-semibold text-gray-900">{bank?.accountHolder || "—"}</span>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Routing Number</span>
                        <span className="text-sm font-semibold text-gray-900">{bank?.routingNumber || "—"}</span>
                      </div>
                      {bank?.accountType && (
                        <>
                          <div className="h-px bg-gray-200" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Account Type</span>
                            <span className="text-sm font-semibold text-gray-900">{bank.accountType}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Transaction Reference */}
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Transaction Reference</Label>
                      <Input
                        required
                        placeholder="ENTER REFERENCE CODE"
                        className="h-11 font-mono uppercase text-center text-sm tracking-widest bg-gray-50 border-gray-200"
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                        Use the payment reference so we can automatically match your payment to your booking.
                      </p>
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm"
                      onClick={handlePayment}
                      disabled={submitPayment.isPending || !txRef.trim()}
                    >
                      {submitPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
                    </Button>
                  </div>
                )}

                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-4 text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Go Back
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {txRef
                    ? `We're verifying your payment reference: ${txRef}`
                    : "Your payment has been received."}
                </p>

                {/* Digital Ticket Preview */}
                <div className="bg-gray-950 rounded-2xl p-6 text-white text-left max-w-sm mx-auto mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                      <Ticket className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">{(event as any).organizerName || "TixPass"}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-3 leading-tight">{event.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(event.eventDate), "EEE · MMM d · h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{event.venue}</span>
                    </div>
                    {event.subtitle && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <span className="text-xs">💬</span>
                        <span>Subtitles: {event.subtitle}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{event.ticketTypes}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 text-sm text-gray-600">
                  Once approved, your unique digital tickets will be sent to{" "}
                  <strong className="text-gray-900">{formData.email}</strong>
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm" onClick={() => (window.location.href = "/")}>
                  Return to Events
                </Button>
              </div>
            )}
          </div>

          {/* Right: Order Summary (Desktop) */}
          {step < 3 && (
            <div className="w-full lg:w-[360px] shrink-0">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900">Your Order</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.ticketTypes}</p>
                    </div>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{format(new Date(event.eventDate), "EEE, MMM d · h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {formData.qty} × €{(event.ticketPrice / 100).toFixed(2)}
                        </span>
                        <span className="font-medium text-gray-900">€{totalAmount}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex justify-between">
                        <span className="text-sm font-bold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">€{totalAmount}</span>
                      </div>
                    </div>
                    {/* CTA Button */}
                    <div className="pt-2">
                      {step === 1 && !isPaused && !isSoldOut && (
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-sm font-semibold gap-2"
                          disabled={createBooking.isPending}
                        >
                          {createBooking.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Continue to Payment <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      )}
                      {step === 2 && (
                        <p className="text-[11px] text-gray-400 text-center">Complete payment in the form above</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 px-1">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-400">Secure checkout. Your payment information is protected.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {step === 1 && !isPaused && !isSoldOut && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900">€{totalAmount}</p>
            </div>
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 text-sm font-semibold gap-2"
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
