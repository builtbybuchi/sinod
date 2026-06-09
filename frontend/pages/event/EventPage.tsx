import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Storage } from 'appwrite';
import appwriteClient from '../../services/appwrite';
import { 
  initiateSquadcoPayment 
} from '../../services/squadcoService';
import { sendRegistrationEmail } from '../../services/emailService';
import * as eventsApi from '../../services/eventsApiService';
import { generateRegistrationId } from '../../utils/idGenerator';

// Declare Squadco widget types
declare global {
  interface Window {
    Squad: any;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface EventDetails {
  $id: string;
  event_name: string;
  event_description: string;
  event_time: string;
  event_end_time?: string;
  virtual_status: boolean;
  public_status: boolean;
  event_address?: string;
  event_url?: string;
  city: string;
  paid: boolean;
  event_price?: number;
  user_email: string;
  auto_approve?: boolean;
  has_custom_questions?: boolean;
  custom_questions?: string;
  theme?: string;
  primary_color?: string;
  font_family?: string;
  logo_url?: string;
  bg_color?: string;
  text_color?: string;
  ticket_types?: string;
  allow_group_registration?: boolean;
  max_group_size?: number;
  coupons?: string;
  fee_bearer?: string; // 'host' or 'attendee'
}

interface CustomQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  benefits: string;
}

interface Coupon {
  code: string;
  discount: number;
  maxUses: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const EVENT_MEDIA_BUCKET_ID = import.meta.env.VITE_EVENT_MEDIA_BUCKET_ID;
const HERO_FALLBACK_IMAGE = '/sino-background.png';

const THEME_GRADIENTS: Record<string, string> = {
  minimal: 'from-gray-900 to-gray-800',
  gradient: 'from-blue-600 to-purple-600',
  waves: 'from-cyan-600 to-blue-600',
  confetti: 'from-pink-500 to-yellow-500',
  corporate: 'from-gray-800 to-gray-700',
  dark: 'from-black to-gray-900',
};

// ─── Component ───────────────────────────────────────────────────────────────
const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [showRegisterPanel, setShowRegisterPanel] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const shareFeedbackTimeout = useRef<NodeJS.Timeout | null>(null);
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

  // Ticket & group state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeout.current) clearTimeout(shareFeedbackTimeout.current);
    };
  }, []);

  // Load Squadco payment widget script
  useEffect(() => {
    if (!document.getElementById('squadco-script')) {
      const script = document.createElement('script');
      script.id = 'squadco-script';
      script.src = 'https://checkout.squadco.com/widget/squad.min.js';
      script.async = true;
      script.onload = () => console.log('Squadco widget loaded');
      script.onerror = () => console.error('Failed to load Squadco widget');
      document.body.appendChild(script);
    }
    return () => {
      const script = document.getElementById('squadco-script');
      if (script) script.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHeroMedia = async () => {
      try {
        const storage = new Storage(appwriteClient);
        const fileList = await storage.listFiles(EVENT_MEDIA_BUCKET_ID);
        if (!isMounted) return;
        if (fileList?.files?.length) {
          const randomFile = fileList.files[Math.floor(Math.random() * fileList.files.length)];
          const preview = storage.getFilePreview(EVENT_MEDIA_BUCKET_ID, randomFile.$id, 2400, 1600);
          const previewUrl = (preview as any)?.toString?.();
          if (previewUrl) { setHeroImageUrl(previewUrl); return; }
          const view = storage.getFileView(EVENT_MEDIA_BUCKET_ID, randomFile.$id);
          const viewUrl = (view as any)?.toString?.();
          if (viewUrl) setHeroImageUrl(viewUrl);
        }
      } catch (mediaError) {
        if (isMounted) console.error('Error loading event imagery:', mediaError);
      }
    };
    fetchHeroMedia();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const eventData = await eventsApi.getEvent(eventId);
        setEvent(eventData as any);
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError('Event not found or no longer available');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Load Google Fonts dynamically
  useEffect(() => {
    if (!event?.font_family || event.font_family === 'Inter') return;
    const family = event.font_family;
    const linkId = `gfont-${family.replace(/\s/g, '-')}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [event?.font_family]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const accentColor = event?.primary_color || '#3B82F6';
  const fontFamily = event?.font_family || 'Inter';
  const pageBgColor = event?.bg_color || '#0f172a';
  const pageTextColor = event?.text_color || '#f1f5f9';
  const themeGradient = THEME_GRADIENTS[event?.theme || 'minimal'] || THEME_GRADIENTS.minimal;
  const hasCustomTheme = !!(event?.theme && event.theme !== 'minimal');

  const customQuestions: CustomQuestion[] = useMemo(() => {
    if (!event?.has_custom_questions || !event?.custom_questions) return [];
    try { return JSON.parse(event.custom_questions); } catch { return []; }
  }, [event?.has_custom_questions, event?.custom_questions]);

  const ticketTypes: TicketType[] = useMemo(() => {
    if (!event?.ticket_types) return [];
    try { return JSON.parse(event.ticket_types); } catch { return []; }
  }, [event?.ticket_types]);

  const coupons: Coupon[] = useMemo(() => {
    if (!event?.coupons) return [];
    try { return JSON.parse(event.coupons); } catch { return []; }
  }, [event?.coupons]);

  const allowGroupRegistration = event?.allow_group_registration || false;
  const maxGroupSize = event?.max_group_size || 10;

  // Auto-select first ticket
  useEffect(() => {
    if (ticketTypes.length > 0 && !selectedTicketId) {
      setSelectedTicketId(ticketTypes[0].id);
    }
  }, [ticketTypes, selectedTicketId]);

  const selectedTicket = useMemo(
    () => ticketTypes.find(t => t.id === selectedTicketId) || null,
    [ticketTypes, selectedTicketId]
  );

  const unitPrice = selectedTicket?.price ?? (event?.event_price || 0);
  const isPaid = unitPrice > 0;

  // Fee calculation: 1.6% gateway + 5% platform = 6.6% total
  const TOTAL_FEE_PERCENT = 6.6;
  const feeBearer = event?.fee_bearer || 'attendee';
  const feesApplyToAttendee = feeBearer === 'attendee' && isPaid;

  const discountPercent = appliedCoupon?.discount || 0;
  const subtotal = unitPrice * groupSize;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const feeAmount = feesApplyToAttendee ? Math.round(subtotalAfterDiscount * (TOTAL_FEE_PERCENT / 100)) : 0;
  const totalPrice = subtotalAfterDiscount + feeAmount;

  // ─── Format helpers ────────────────────────────────────────────────────────
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const pageUrl = useMemo(() => typeof window !== 'undefined' ? window.location.href : '', [eventId]);

  // ─── Share utilities ───────────────────────────────────────────────────────
  const showShareMessage = useCallback((message: string) => {
    if (shareFeedbackTimeout.current) clearTimeout(shareFeedbackTimeout.current);
    setShareFeedback(message);
    shareFeedbackTimeout.current = setTimeout(() => setShareFeedback(null), 2600);
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!pageUrl) return;
    try { await navigator.clipboard.writeText(pageUrl); showShareMessage('Link copied to clipboard'); }
    catch { showShareMessage('Unable to copy — link ready to share'); }
  }, [pageUrl, showShareMessage]);

  const openShareWindow = useCallback((url: string) => {
    if (url && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleEmailShare = useCallback(() => {
    if (!event || !pageUrl) return;
    const subject = encodeURIComponent(`Join me at ${event.event_name}`);
    const details = [event.event_description, event.virtual_status && event.event_url ? `Join link: ${event.event_url}` : '', `Event page: ${pageUrl}`].filter(Boolean).join('\n\n');
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(details)}`;
  }, [event, pageUrl]);

  const handleNativeShare = useCallback(() => {
    if (!event || !pageUrl) { handleCopyLink(); return; }
    if (navigator.share) {
      navigator.share({ title: event.event_name, text: event.event_description?.slice(0, 120) || 'Check out this event!', url: pageUrl }).catch(() => handleCopyLink());
    } else { handleCopyLink(); }
  }, [event, pageUrl, handleCopyLink]);

  const calendarLink = useMemo(() => {
    if (!event?.event_time || !pageUrl) return '';
    const toCalDate = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? '' : d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; };
    const start = toCalDate(event.event_time);
    if (!start) return '';
    const endSource = event.event_end_time || new Date(new Date(event.event_time).getTime() + 90 * 60000).toISOString();
    const end = toCalDate(endSource);
    if (!end) return '';
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({
      action: 'TEMPLATE', text: event.event_name,
      details: [event.event_description, `Event page: ${pageUrl}`].filter(Boolean).join('\n\n'),
      location: event.virtual_status ? (event.event_url || 'Online event') : (event.event_address || event.city),
      dates: `${start}/${end}`,
    }).toString()}`;
  }, [event, pageUrl]);

  const whatsappShareUrl = useMemo(() => {
    if (!pageUrl) return '';
    return `https://wa.me/?text=${encodeURIComponent([event?.event_name || 'Check out this event', event?.event_description ? `${event.event_description.slice(0, 120)}...` : '', pageUrl].filter(Boolean).join('\n'))}`;
  }, [event, pageUrl]);

  const twitterShareUrl = useMemo(() => {
    if (!pageUrl) return '';
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(event?.event_name || 'Join this event')}&url=${encodeURIComponent(pageUrl)}`;
  }, [event, pageUrl]);

  const linkedInShareUrl = useMemo(() => pageUrl ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}` : '', [pageUrl]);

  // ─── Coupon validation ─────────────────────────────────────────────────────
  const handleApplyCoupon = useCallback(() => {
    setCouponError('');
    if (!couponCode.trim()) { setCouponError('Enter a coupon code'); return; }
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!found) { setCouponError('Invalid coupon code'); return; }
    setAppliedCoupon(found);
    setCouponError('');
  }, [couponCode, coupons]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }, []);

  // ─── Custom response handler ───────────────────────────────────────────────
  const handleCustomResponseChange = useCallback((questionId: string, value: any) => {
    setCustomResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleToggleRegister = useCallback(() => {
    setShowRegisterPanel(prev => {
      if (!prev) setTimeout(() => document.getElementById('event-register-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      return !prev;
    });
  }, []);

  // ─── Registration handler ──────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setError(null);
    if (!event) return;

    try {
      const regId = generateRegistrationId();
      const finalPrice = isPaid ? totalPrice : 0;

      if (isPaid && finalPrice > 0) {
        setProcessingPayment(true);

        const attendee = await eventsApi.registerAttendee({
          event_id: eventId!,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone || '',
          registration_id: regId,
          paid: false,
          approved: false,
          verified: false,
          custom_responses: customQuestions.length > 0 ? JSON.stringify(customResponses) : undefined,
          ticket_type_id: selectedTicket?.id || undefined,
          ticket_name: selectedTicket?.name || undefined,
          amount_paid: finalPrice,
          coupon_code: appliedCoupon?.code || undefined,
          coupon_discount: appliedCoupon?.discount || undefined,
        });

        const paymentResponse = await initiateSquadcoPayment({
          amount: finalPrice,
          email,
          currency: 'NGN',
          attendeeId: attendee.$id,
          eventId: eventId!,
        });

        if (paymentResponse.success) {
          if (paymentResponse.data?.authorization_url || paymentResponse.data?.checkout_url) {
            window.location.href = paymentResponse.data.authorization_url || paymentResponse.data.checkout_url;
          } else if (paymentResponse.data?.reference) {
            if (typeof window.Squad !== 'undefined') {
              const squad = new window.Squad({
                onClose: () => setProcessingPayment(false),
                onLoad: () => {},
                onSuccess: () => {
                  window.location.href = `/payment/verify?transaction_ref=${paymentResponse.data!.reference}&eventId=${eventId}&registrationId=${attendee.$id}`;
                },
                key: 'pk_44c18aaa7b9dad6dbe10c3f95f2d85de6cad561d',
                email,
                amount: finalPrice * 100,
                transaction_ref: paymentResponse.data.reference,
              });
              squad.setup();
              squad.open();
            } else {
              setError('Payment system not ready. Please refresh and try again.');
              setProcessingPayment(false);
            }
          } else {
            await eventsApi.deleteAttendee(eventId!, attendee.$id);
            setError('Payment initialization incomplete. Please try again.');
            setProcessingPayment(false);
          }
        } else {
          await eventsApi.deleteAttendee(eventId!, attendee.$id);
          setError(paymentResponse.message || 'Failed to initialize payment. Please try again.');
          setProcessingPayment(false);
        }
      } else {
        // Free event
        const requiresApproval = event.auto_approve === false;

        await eventsApi.registerAttendee({
          event_id: eventId!,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone || '',
          registration_id: regId,
          paid: false,
          approved: !requiresApproval,
          verified: false,
          custom_responses: customQuestions.length > 0 ? JSON.stringify(customResponses) : undefined,
          ticket_type_id: selectedTicket?.id || undefined,
          ticket_name: selectedTicket?.name || undefined,
          amount_paid: 0,
          coupon_code: appliedCoupon?.code || undefined,
          coupon_discount: appliedCoupon?.discount || undefined,
        });

        if (!requiresApproval) {
          try {
            await sendRegistrationEmail({
              registrationId: regId, firstName, lastName, email,
              eventName: event.event_name, eventTime: event.event_time,
              eventEndTime: event.event_end_time, eventAddress: event.event_address,
              eventUrl: event.event_url, isVirtual: event.virtual_status,
              isPaid: false, city: event.city, eventPageUrl: eventId!,
            });
          } catch (emailError) {
            console.error('Email send failed but registration succeeded:', emailError);
          }
        }
        setRegistered(true);
      }
    } catch (err: any) {
      console.error('Error registering:', err);
      setError('Failed to register. Please try again.');
    } finally {
      if (!processingPayment) setRegistering(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/40" />
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin" />
        </div>
        <p className="mt-6 text-sm text-slate-400">Curating event details...</p>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error && !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center backdrop-blur-xl shadow-2xl">
          <div className="absolute -top-24 -right-10 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative z-10">
            <svg className="mx-auto mb-5 h-14 w-14 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Event not found</h2>
            <p className="mt-3 text-sm text-slate-300/80">{error}</p>
            <button onClick={() => navigate('/')} className="mt-8 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/15">
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const heroBackgroundUrl = heroImageUrl || HERO_FALLBACK_IMAGE;
  const startDateFormatted = formatDate(event.event_time);
  const startTimeFormatted = formatTime(event.event_time);
  const endTimeFormatted = event.event_end_time ? formatTime(event.event_end_time) : null;
  const showEventUrl = event.virtual_status && event.event_url;
  const requiresApproval = event.auto_approve === false;

  const registerButtonLabel = isPaid
    ? `Register • ₦${totalPrice.toLocaleString()}`
    : 'Register Free';

  const heroLead = (() => {
    if (!event.event_description) return 'Discover an experience crafted to inspire, connect, and elevate your journey.';
    const firstLine = event.event_description.split('\n').find(l => l.trim().length > 0);
    return firstLine || 'Discover an experience crafted to inspire, connect, and elevate your journey.';
  })();

  // Share buttons config (matching preview style exactly)
  const shareButtons = [
    {
      key: 'whatsapp', label: 'WhatsApp',
      color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      onClick: () => openShareWindow(whatsappShareUrl), disabled: !whatsappShareUrl,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12c0 1.8.479 3.503 1.387 5.027L2 22l5.086-1.35A9.953 9.953 0 0012 22c5.514 0 10-4.486 10-10S17.514 2 12 2z" /></svg>,
    },
    {
      key: 'twitter', label: 'X',
      color: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
      onClick: () => openShareWindow(twitterShareUrl), disabled: !twitterShareUrl,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    },
    {
      key: 'linkedin', label: 'LinkedIn',
      color: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      onClick: () => openShareWindow(linkedInShareUrl), disabled: !linkedInShareUrl,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
    },
    {
      key: 'email', label: 'Email',
      color: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      onClick: handleEmailShare, disabled: false,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9 6 9-6M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" /></svg>,
    },
    {
      key: 'calendar', label: 'Calendar',
      color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      onClick: () => openShareWindow(calendarLink), disabled: !calendarLink,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10" /><rect width="18" height="16" x="3" y="5" rx="2" ry="2" strokeWidth="2" /></svg>,
    },
    {
      key: 'copy', label: 'Copy link',
      color: 'bg-gray-500/15 border-gray-500/30 text-gray-400',
      onClick: handleCopyLink, disabled: false,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a3 3 0 01-3-3V6a3 3 0 013-3h6a3 3 0 013 3M16 7a3 3 0 013 3v8a3 3 0 01-3 3H10a3 3 0 01-3-3" /></svg>,
    },
  ];

  // ─── Success state ─────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ fontFamily, backgroundColor: pageBgColor, color: pageTextColor }}>
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-[0_30px_80px_-40px_rgba(59,130,246,0.65)]">
          <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative z-10 px-8 py-10">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${requiresApproval ? 'bg-amber-500/20 ring-1 ring-amber-400/40' : 'bg-emerald-500/20 ring-1 ring-emerald-400/40'}`}>
              {requiresApproval ? (
                <svg className="h-8 w-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="h-8 w-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white text-center">
              {requiresApproval ? 'Registration submitted' : 'Registration confirmed'}
            </h2>
            {requiresApproval ? (
              <div className="mt-6">
                <p className="text-sm text-slate-300/90 text-center">You've registered for <span className="font-medium text-white">{event.event_name}</span>.</p>
                <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⏳</span>
                    <div>
                      <p className="text-sm font-medium text-amber-200">Awaiting host approval</p>
                      <p className="mt-1 text-xs text-amber-200/70">You'll receive an email with your QR code and full event details once your spot is confirmed.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-slate-300/90 text-center">You're all set for <span className="font-medium text-white">{event.event_name}</span>. We've emailed your QR pass and event details to <strong>{email}</strong>.</p>
                <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-200/90">✅ <span className="font-medium text-emerald-200">You're confirmed!</span> Check your email for your registration ID and QR code.</p>
                </div>
                {showEventUrl && (
                  <div className="mt-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-200/80">Virtual access link</p>
                    <a href={event.event_url!} target="_blank" rel="noopener noreferrer" className="mt-2 block break-words text-sm font-medium text-blue-200 hover:text-blue-100">{event.event_url}</a>
                  </div>
                )}
              </div>
            )}

            {/* Share buttons on success */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-medium text-gray-400 mb-3 text-center">Share this event</p>
              <div className="flex flex-wrap justify-center gap-2">
                {shareButtons.map(btn => (
                  <button key={btn.key} onClick={btn.onClick} disabled={btn.disabled} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${btn.color} ${btn.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15'}`}>
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/')} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/15">Back to home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  MAIN PAGE — matches EventCreatorPage preview layout exactly
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ fontFamily, backgroundColor: pageBgColor, color: pageTextColor }}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">

        {/* ── Card wrapper (mirrors preview's rounded-2xl card) ── */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">

          {/* ── Hero / Theme header ── */}
          <div className={`relative p-8 sm:p-10 bg-gradient-to-br ${themeGradient}`}>
            {/* Confetti decoration */}
            {event.theme === 'confetti' && (
              <div className="absolute inset-0 overflow-hidden opacity-20">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="absolute w-2 h-2 rounded-full" style={{
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i % 6],
                    top: `${(i * 37 + 13) % 100}%`, left: `${(i * 53 + 7) % 100}%`,
                  }} />
                ))}
              </div>
            )}
            {/* Waves decoration */}
            {event.theme === 'waves' && (
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
                <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z" fill="white" />
                </svg>
              </div>
            )}

            {/* Hero without custom theme — fallback background */}
            {!hasCustomTheme && (
              <div className="absolute inset-0">
                <img src={heroBackgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/85" />
              </div>
            )}

            <div className="relative z-10">
              {event.logo_url && (
                <img src={event.logo_url} alt="Logo" className="w-12 h-12 rounded-xl mb-5 object-cover border border-white/20" onError={e => (e.currentTarget.style.display = 'none')} />
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide mb-4">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
                  {event.virtual_status ? 'Virtual' : 'In-person'}
                </span>
                {!event.public_status && (
                  <span className="rounded-full border border-purple-300/40 bg-purple-500/20 px-3 py-1 text-purple-200">Private</span>
                )}
                <span className={`rounded-full border px-3 py-1 ${isPaid ? 'border-amber-300/40 bg-amber-500/15 text-amber-100' : 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'}`}>
                  {isPaid ? `Paid` : 'Free'}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/80">{event.city}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily }}>{event.event_name}</h1>
              {heroLead && <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">{heroLead}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={handleToggleRegister} className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110" style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentColor}40` }}>
                  {registerButtonLabel}
                </button>
                <button onClick={handleNativeShare} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/15">
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* ── Content area (matches preview's bg-gray-900 section) ── */}
          <div className="p-6 sm:p-8 space-y-6" style={{ fontFamily, backgroundColor: pageBgColor, color: pageTextColor }}>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                <svg className="w-4 h-4" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{startDateFormatted}</p>
                <p className="text-xs text-gray-400">{startTimeFormatted}{endTimeFormatted ? ` — ${endTimeFormatted}` : ''}</p>
              </div>
            </div>

            {/* Location */}
            {!event.virtual_status && event.event_address && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                  <svg className="w-4 h-4" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{event.event_address}</p>
                  <p className="text-xs text-gray-400">{event.city}</p>
                </div>
              </div>
            )}
            {event.virtual_status && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                  <svg className="w-4 h-4" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Virtual Event</p>
                  <p className="text-xs text-gray-400">{event.event_address ? 'Also in-person' : 'Link provided after registration'}</p>
                </div>
              </div>
            )}

            {/* About */}
            {event.event_description && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-gray-400 mb-2">About</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300/90">{event.event_description}</p>
              </div>
            )}

            {/* Tickets section */}
            {ticketTypes.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-gray-400 mb-3">Select a Ticket</p>
                <div className="space-y-2">
                  {ticketTypes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        selectedTicketId === t.id
                          ? 'border-white/30 bg-white/[0.06] ring-1'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                      style={selectedTicketId === t.id ? { borderColor: `${accentColor}50` } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedTicketId === t.id ? '' : 'border-white/30'}`} style={selectedTicketId === t.id ? { borderColor: accentColor } : undefined}>
                          {selectedTicketId === t.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{t.name || 'Ticket'}</p>
                          {t.benefits && <p className="text-[10px] text-gray-500 mt-0.5">{t.benefits}</p>}
                          {t.quantity > 0 && <p className="text-[10px] text-gray-500">{t.quantity} spots available</p>}
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {t.price > 0 ? `₦${t.price.toLocaleString()}` : 'Free'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: no ticket_types but event has price */}
            {ticketTypes.length === 0 && event.paid && event.event_price && event.event_price > 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-sm font-medium text-white">General Admission</p>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>₦{event.event_price.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Group Registration */}
            {allowGroupRegistration && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-gray-400 mb-3">Group Registration</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-xs text-gray-300">Attendees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setGroupSize(Math.max(1, groupSize - 1))} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all text-lg font-bold">−</button>
                    <span className="text-sm font-semibold text-white w-8 text-center">{groupSize}</span>
                    <button type="button" onClick={() => setGroupSize(Math.min(maxGroupSize, groupSize + 1))} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all text-lg font-bold">+</button>
                  </div>
                  <span className="text-[10px] text-gray-500">Max {maxGroupSize}</span>
                </div>
              </div>
            )}

            {/* Coupon Code */}
            {coupons.length > 0 && isPaid && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-gray-400 mb-3">Have a coupon code?</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-medium text-emerald-300">{appliedCoupon.code}</span>
                      <span className="text-xs text-emerald-400/70">−{appliedCoupon.discount}% off</span>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 uppercase font-mono focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <button type="button" onClick={handleApplyCoupon} className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition" style={{ backgroundColor: accentColor }}>Apply</button>
                  </div>
                )}
                {couponError && <p className="mt-2 text-xs text-red-400">{couponError}</p>}
              </div>
            )}

            {/* Price summary (when paid) */}
            {isPaid && (
              <div className="pt-4 border-t border-white/10">
                <div className="space-y-2">
                  {selectedTicket && <div className="flex justify-between text-sm"><span className="text-gray-400">{selectedTicket.name}{groupSize > 1 ? ` × ${groupSize}` : ''}</span><span className="text-white">₦{subtotal.toLocaleString()}</span></div>}
                  {!selectedTicket && event.event_price && <div className="flex justify-between text-sm"><span className="text-gray-400">General Admission{groupSize > 1 ? ` × ${groupSize}` : ''}</span><span className="text-white">₦{subtotal.toLocaleString()}</span></div>}
                  {appliedCoupon && <div className="flex justify-between text-sm"><span className="text-emerald-400">Discount ({appliedCoupon.discount}%)</span><span className="text-emerald-400">−₦{discountAmount.toLocaleString()}</span></div>}
                  {feesApplyToAttendee && feeAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Transaction fees (6.6%)</span><span className="text-gray-400">₦{feeAmount.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5"><span className="text-white">Total</span><span style={{ color: accentColor }}>₦{totalPrice.toLocaleString()}</span></div>
                </div>
              </div>
            )}

            {/* ── Registration Form ── */}
            <div className="pt-4 border-t border-white/10" id="event-register-panel">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-gray-400">Registration</p>
                <button type="button" onClick={handleToggleRegister} className="text-xs font-medium transition" style={{ color: accentColor }}>
                  {showRegisterPanel ? 'Hide form' : 'Show form'}
                </button>
              </div>

              {!showRegisterPanel && (
                <button type="button" onClick={handleToggleRegister} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110" style={{ backgroundColor: accentColor }}>
                  {registerButtonLabel}
                </button>
              )}

              {showRegisterPanel && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1.5">First name *</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1.5">Last name *</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1.5">Email address *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1.5">Phone number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 xxx xxx xxxx" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>

                  {/* Custom questions */}
                  {customQuestions.length > 0 && (
                    <div className="space-y-4 pt-3 border-t border-white/10">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Additional questions</p>
                      {customQuestions.map(q => (
                        <div key={q.id}>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1.5">{q.label} {q.required && '*'}</label>
                          {q.type === 'textarea' ? (
                            <textarea value={customResponses[q.id] || ''} onChange={e => handleCustomResponseChange(q.id, e.target.value)} required={q.required} placeholder={q.placeholder || ''} rows={3} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                          ) : q.type === 'select' ? (
                            <select value={customResponses[q.id] || ''} onChange={e => handleCustomResponseChange(q.id, e.target.value)} required={q.required} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                              <option value="" className="bg-slate-900">{q.placeholder || 'Select an option'}</option>
                              {q.options?.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                            </select>
                          ) : q.type === 'radio' ? (
                            <div className="space-y-2">
                              {q.options?.map(opt => (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                  <input type="radio" name={`custom-${q.id}`} value={opt} checked={customResponses[q.id] === opt} onChange={() => handleCustomResponseChange(q.id, opt)} required={q.required} className="h-4 w-4 border-white/30 bg-white/5 text-blue-500 focus:ring-blue-500/40" />
                                  <span className="text-sm text-white/80">{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : q.type === 'checkbox' ? (
                            <div className="space-y-2">
                              {q.options?.map(opt => (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={Array.isArray(customResponses[q.id]) && customResponses[q.id].includes(opt)} onChange={e => {
                                    const current = Array.isArray(customResponses[q.id]) ? customResponses[q.id] : [];
                                    handleCustomResponseChange(q.id, e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt));
                                  }} className="h-4 w-4 rounded border-white/30 bg-white/5 text-blue-500 focus:ring-blue-500/40" />
                                  <span className="text-sm text-white/80">{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input type={q.type || 'text'} value={customResponses[q.id] || ''} onChange={e => handleCustomResponseChange(q.id, e.target.value)} required={q.required} placeholder={q.placeholder || ''} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment info */}
                  {isPaid && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                      <p className="font-semibold">Paid access</p>
                      <p className="mt-1 text-xs">Total: ₦{totalPrice.toLocaleString()} — secured via Squadco payments</p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
                  )}

                  <button type="submit" disabled={registering || processingPayment} className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentColor}40` }}>
                    {processingPayment ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z" /></svg>
                        Processing payment...
                      </span>
                    ) : registering ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z" /></svg>
                        Submitting registration...
                      </span>
                    ) : (
                      <span>{isPaid ? 'Continue to payment' : 'Submit registration'}</span>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-white/40">Confirmation emails typically arrive within minutes.</p>
                </form>
              )}
            </div>

            {/* ── Share & Save ── */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-medium text-gray-400 mb-3">Share & Save</p>
              <div className="flex flex-wrap gap-2">
                {shareButtons.map(btn => (
                  <button key={btn.key} type="button" onClick={btn.onClick} disabled={btn.disabled} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${btn.color} ${btn.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15'}`}>
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
              {shareFeedback && (
                <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
                  <svg className="h-3.5 w-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {shareFeedback}
                </div>
              )}
            </div>

            {/* Host info */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-wide text-white/40">Hosted by</p>
              <p className="text-sm font-medium text-white mt-1">{event.user_email}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white">
            Create your own event on Sinod'
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
