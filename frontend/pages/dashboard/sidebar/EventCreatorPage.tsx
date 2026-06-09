/**
 * EventCreatorPage — Split-pane event creation page
 * Left: Event settings (details, tickets, coupons, questions)
 * Center: Live preview of the public registration page
 * Right: Theme & customization (themes, colors, fonts, logo)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { generateEventId } from '../../../utils/idGenerator';
import * as eventsApi from '../../../services/eventsApiService';
import { createRemindersBulk } from '../../../services/reminderApiService';
import CountryCitySelector from '../../../components/CountryCitySelector';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EventCreatorPageProps {
  onBack: () => void;
  onCreated?: () => void;
}

interface CustomQuestion {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
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
const THEMES = [
  { id: 'minimal', name: 'Minimal', gradient: 'from-gray-900 to-gray-800', defaultBg: '#0f172a', defaultText: '#f1f5f9', defaultFont: 'Inter' },
  { id: 'gradient', name: 'Gradient', gradient: 'from-blue-600 to-purple-600', defaultBg: '#1e1b4b', defaultText: '#e0e7ff', defaultFont: 'Poppins' },
  { id: 'waves', name: 'Waves', gradient: 'from-cyan-600 to-blue-600', defaultBg: '#0c4a6e', defaultText: '#e0f2fe', defaultFont: 'Montserrat' },
  { id: 'confetti', name: 'Celebration', gradient: 'from-pink-500 to-yellow-500', defaultBg: '#4a044e', defaultText: '#fdf4ff', defaultFont: 'Poppins' },
  { id: 'corporate', name: 'Corporate', gradient: 'from-gray-800 to-gray-700', defaultBg: '#1e293b', defaultText: '#e2e8f0', defaultFont: 'Roboto' },
  { id: 'dark', name: 'Dark', gradient: 'from-black to-gray-900', defaultBg: '#030712', defaultText: '#d1d5db', defaultFont: 'Space Grotesk' },
];

const FONTS = ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Playfair Display', 'Space Grotesk', 'Lora', 'Raleway', 'Nunito', 'Outfit'];

const COLOR_PRESETS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Violet', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Lime', value: '#84CC16' },
  { label: 'Fuchsia', value: '#D946EF' },
  { label: 'Slate', value: '#64748B' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
];

// ─── Component ───────────────────────────────────────────────────────────────
const EventCreatorPage: React.FC<EventCreatorPageProps> = ({ onBack, onCreated }) => {
  const { currentUser, userDocumentId } = useAuth();

  // Mobile panel toggle
  const [mobilePanel, setMobilePanel] = useState<'settings' | 'preview' | 'theme'>('settings');

  // Event details
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'virtual' | 'physical' | 'hybrid'>('virtual');
  const [isPublic, setIsPublic] = useState(true);
  const [address, setAddress] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [city, setCity] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);

  // Tickets
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 'default', name: 'General Admission', price: 0, quantity: 0, benefits: '' },
  ]);
  const [allowGroupRegistration, setAllowGroupRegistration] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState(10);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Fee bearer: who pays the 1.6% gateway + 5% platform fee
  const [feeBearer, setFeeBearer] = useState<'host' | 'attendee'>('attendee');

  // Custom questions
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // Reminders
  const [selectedReminderPresets, setSelectedReminderPresets] = useState<string[]>(['1_hour', '1_day']);

  // Theme & Customization
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [textColor, setTextColor] = useState('#f1f5f9');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentDropdownOpen, setAccentDropdownOpen] = useState(false);
  const [bgDropdownOpen, setBgDropdownOpen] = useState(false);
  const [textDropdownOpen, setTextDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftSection, setLeftSection] = useState<'details' | 'tickets' | 'questions'>('details');

  // Derived
  const isPaid = useMemo(() => ticketTypes.some(t => t.price > 0), [ticketTypes]);

  // Load Google Fonts dynamically when fontFamily changes
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Inter') return;
    const linkId = `gfont-${fontFamily.replace(/\s/g, '-')}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const generateVirtualLink = useCallback(() => {
    const c = 'abcdefghijklmnopqrstuvwxyz';
    const seg = (n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
    return `https://meet.sinod.app/${seg(3)}-${seg(4)}-${seg(3)}`;
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const addTicket = () =>
    setTicketTypes(prev => [
      ...prev,
      { id: `t_${Date.now().toString(36)}`, name: '', price: 0, quantity: 0, benefits: '' },
    ]);

  const updateTicket = (id: string, patch: Partial<TicketType>) =>
    setTicketTypes(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const removeTicket = (id: string) =>
    setTicketTypes(prev => (prev.length > 1 ? prev.filter(t => t.id !== id) : prev));

  const addCoupon = () =>
    setCoupons(prev => [...prev, { code: '', discount: 10, maxUses: 50 }]);

  const updateCoupon = (idx: number, patch: Partial<Coupon>) =>
    setCoupons(prev => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const removeCoupon = (idx: number) =>
    setCoupons(prev => prev.filter((_, i) => i !== idx));

  const addQuestion = () =>
    setCustomQuestions(prev => [
      ...prev,
      { id: `q_${Date.now().toString(36)}`, type: 'text', label: '', required: false, options: [], placeholder: '' },
    ]);

  const updateQuestion = (id: string, patch: Partial<CustomQuestion>) =>
    setCustomQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id: string) =>
    setCustomQuestions(prev => prev.filter(q => q.id !== id));

  const handlePublish = useCallback(async () => {
    if (!currentUser?.email || !userDocumentId) {
      setError('Please sign in to create an event.');
      return;
    }
    if (!eventName.trim()) { setError('Event name is required'); return; }
    if (!city.trim()) { setError('City is required'); return; }
    if (!eventTime) { setError('Start date & time is required'); return; }

    setSaving(true);
    setError(null);

    try {
      const shortId = generateEventId();
      const hasPaid = ticketTypes.some(t => t.price > 0);
      const topPrice = Math.max(...ticketTypes.map(t => t.price), 0);

      const data: eventsApi.CreateEventData = {
        event_name: eventName,
        event_description: description || '',
        virtual_status: eventType === 'virtual' || eventType === 'hybrid',
        public_status: isPublic,
        event_time: eventTime,
        event_end_time: eventEndTime,
        paid: hasPaid,
        event_price: hasPaid ? topPrice : 0,
        city,
        user_email: currentUser.email,
        event_page_url: shortId,
        event_url: eventType !== 'physical' ? (eventUrl || generateVirtualLink()) : undefined,
        event_address: eventType !== 'virtual' ? address : undefined,
        auto_approve: autoApprove,
        has_custom_questions: customQuestions.length > 0,
        custom_questions: customQuestions.length > 0 ? JSON.stringify(customQuestions) : undefined,
        ticket_types: JSON.stringify(ticketTypes),
        allow_group_registration: allowGroupRegistration,
        max_group_size: allowGroupRegistration ? maxGroupSize : undefined,
        coupons: coupons.length > 0 ? JSON.stringify(coupons) : undefined,
        fee_bearer: hasPaid ? feeBearer : undefined,
        theme: selectedTheme,
        primary_color: primaryColor,
        font_family: fontFamily,
        logo_url: logoUrl || undefined,
        bg_color: bgColor,
        text_color: textColor,
      };

      await eventsApi.createEvent(data);

      if (selectedReminderPresets.length > 0) {
        try {
          await createRemindersBulk({
            event_id: shortId,
            created_by: currentUser.email,
            presets: selectedReminderPresets,
          });
        } catch {}
      }

      onCreated?.();
      onBack();
    } catch (e: any) {
      setError(e.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }, [
    currentUser, userDocumentId, eventName, description, eventType, isPublic, address, eventUrl,
    eventTime, eventEndTime, city, autoApprove, customQuestions, ticketTypes, allowGroupRegistration,
    maxGroupSize, coupons, feeBearer, selectedReminderPresets, selectedTheme, primaryColor, fontFamily, logoUrl,
    bgColor, textColor, generateVirtualLink, onBack, onCreated,
  ]);

  // ─── Format helpers ────────────────────────────────────────────────────────
  const fmtDate = (iso: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  };
  const fmtTime = (iso: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  // ─── Shared input styles ──────────────────────────────────────────────────
  const inputCls = 'w-full bg-white/5 text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 border border-white/10 transition-all';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';
  const sectionCls = 'space-y-4';

  // ═════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={onBack} className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-base font-bold text-white truncate">Create Sinod&apos;</h1>
              <p className="text-[10px] text-gray-500 truncate">Fill details on the left • Preview in the center • Customize on the right</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {error && (
              <span className="hidden lg:inline text-xs text-red-400 max-w-[200px] truncate">{error}</span>
            )}
            <button
              onClick={handlePublish}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all disabled:opacity-50"
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="hidden sm:inline">Publishing...</span></>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span className="hidden sm:inline">Publish Event</span><span className="sm:hidden">Publish</span></>
              )}
            </button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="flex md:hidden mt-3 gap-1 bg-white/5 rounded-xl p-1">
          {([
            { key: 'settings', label: 'Settings' },
            { key: 'preview', label: 'Preview' },
            { key: 'theme', label: 'Theme' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMobilePanel(tab.key)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${mobilePanel === tab.key ? 'bg-sky-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {error && <p className="lg:hidden text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══════════ LEFT PANEL — Settings ═══════════ */}
        <div className={`${mobilePanel === 'settings' ? 'flex' : 'hidden'} md:flex w-full md:w-72 lg:w-80 flex-shrink-0 flex-col border-r border-white/10 overflow-hidden bg-slate-900/30`}>
          {/* Section tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {([
              { key: 'details', label: 'Details' },
              { key: 'tickets', label: 'Tickets' },
              { key: 'questions', label: 'Questions' },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setLeftSection(s.key)}
                className={`flex-1 py-3 text-xs font-medium transition-all border-b-2 ${
                  leftSection === s.key
                    ? 'text-sky-400 border-sky-400 bg-sky-500/5'
                    : 'text-gray-500 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* ─── DETAILS SECTION ─── */}
            {leftSection === 'details' && (
              <div className={sectionCls}>
                <div>
                  <label className={labelCls}>Event Name *</label>
                  <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="My Awesome Sinod'" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this event about?" rows={3} className={`${inputCls} resize-none`} />
                </div>

                {/* Event type */}
                <div>
                  <label className={labelCls}>Event Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['virtual', 'physical', 'hybrid'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEventType(t)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          eventType === t
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                {eventType !== 'virtual' && (
                  <div>
                    <label className={labelCls}>Address *</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" className={inputCls} />
                  </div>
                )}
                {eventType !== 'physical' && (
                  <div>
                    <label className={labelCls}>Virtual Link</label>
                    <div className="flex gap-2">
                      <input value={eventUrl} onChange={e => setEventUrl(e.target.value)} placeholder="https://meet.google.com/..." className={`${inputCls} flex-1`} />
                      <button type="button" onClick={() => setEventUrl(generateVirtualLink())} className="px-3 py-2 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-medium hover:bg-sky-500/30 transition-all border border-sky-500/30 flex-shrink-0">
                        Generate
                      </button>
                    </div>
                  </div>
                )}

                {/* City (Global Country → City Selector) */}
                <CountryCitySelector
                  value={city}
                  onChange={setCity}
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                />

                {/* Date/Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start *</label>
                    <input type="datetime-local" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End</label>
                    <input type="datetime-local" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${isPublic ? 'bg-sky-500 justify-end' : 'bg-white/10 justify-start'}`}>
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
                    </div>
                    <span className="text-xs text-gray-300">Public event</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer" onClick={() => setAutoApprove(!autoApprove)}>
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${autoApprove ? 'bg-sky-500 justify-end' : 'bg-white/10 justify-start'}`}>
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
                    </div>
                    <span className="text-xs text-gray-300">Auto-approve attendees</span>
                  </label>
                </div>

                {/* Fee Bearer (only for paid events) */}
                {isPaid && (
                  <div>
                    <label className={labelCls}>Who pays transaction fees?</label>
                    <p className="text-[10px] text-gray-500 mb-2">1.6% payment gateway + 5% platform fee = 6.6% total</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFeeBearer('attendee')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          feeBearer === 'attendee'
                            ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        Attendees pay
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeeBearer('host')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          feeBearer === 'host'
                            ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        I'll absorb fees
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TICKETS SECTION ─── */}
            {leftSection === 'tickets' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Ticket Types</p>
                  <button onClick={addTicket} className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">+ Add Ticket</button>
                </div>
                {ticketTypes.map(ticket => (
                  <div key={ticket.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={ticket.name} onChange={e => updateTicket(ticket.id, { name: e.target.value })} placeholder="Ticket name" className={`${inputCls} flex-1`} />
                      {ticketTypes.length > 1 && (
                        <button onClick={() => removeTicket(ticket.id)} className="text-red-400 hover:text-red-300 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₦</span>
                        <input type="number" value={ticket.price || ''} onChange={e => updateTicket(ticket.id, { price: parseInt(e.target.value) || 0 })} placeholder="0 = Free" min="0" className={`${inputCls} pl-6`} />
                      </div>
                      <input type="number" value={ticket.quantity || ''} onChange={e => updateTicket(ticket.id, { quantity: parseInt(e.target.value) || 0 })} placeholder="Qty (0=∞)" min="0" className={inputCls} />
                    </div>
                    <input value={ticket.benefits} onChange={e => updateTicket(ticket.id, { benefits: e.target.value })} placeholder="Benefits (e.g., VIP seating)" className={inputCls} />
                  </div>
                ))}

                <hr className="border-white/10" />

                {/* Group Registration */}
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setAllowGroupRegistration(!allowGroupRegistration)}>
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${allowGroupRegistration ? 'bg-sky-500 justify-end' : 'bg-white/10 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
                  </div>
                  <span className="text-xs text-gray-300">Group registration</span>
                </label>
                {allowGroupRegistration && (
                  <div>
                    <label className={labelCls}>Max group size</label>
                    <input type="number" value={maxGroupSize} onChange={e => setMaxGroupSize(parseInt(e.target.value) || 2)} min={2} max={100} className={`${inputCls} w-24`} />
                  </div>
                )}

                <hr className="border-white/10" />

                {/* Coupons */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Discount Coupons</p>
                  <button onClick={addCoupon} className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">+ Add Coupon</button>
                </div>
                {coupons.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={c.code} onChange={e => updateCoupon(i, { code: e.target.value.toUpperCase() })} placeholder="CODE" className={`${inputCls} flex-1 uppercase`} />
                    <div className="relative w-20">
                      <input type="number" value={c.discount} onChange={e => updateCoupon(i, { discount: parseInt(e.target.value) || 0 })} min={1} max={100} className={`${inputCls} pr-6`} />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                    </div>
                    <button onClick={() => removeCoupon(i)} className="text-red-400 hover:text-red-300 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ─── QUESTIONS SECTION ─── */}
            {leftSection === 'questions' && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Custom Registration Questions</p>
                  <button onClick={addQuestion} className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">+ Add Question</button>
                </div>
                {customQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs">No custom questions yet</p>
                    <p className="text-[10px] text-gray-700 mt-1">Add questions that attendees will answer during registration</p>
                  </div>
                )}
                {customQuestions.map(q => (
                  <div key={q.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={q.label} onChange={e => updateQuestion(q.id, { label: e.target.value })} placeholder="Question label" className={`${inputCls} flex-1`} />
                      <button onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-300 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })} className={`${inputCls} w-32`}>
                        <option value="text">Text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="w-3.5 h-3.5 rounded" />
                        Required
                      </label>
                    </div>
                    {q.type === 'select' && (
                      <div className="space-y-1.5 pl-2">
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <input value={opt} onChange={e => {
                              const opts = [...(q.options || [])];
                              opts[oi] = e.target.value;
                              updateQuestion(q.id, { options: opts });
                            }} placeholder={`Option ${oi + 1}`} className={`${inputCls} flex-1`} />
                            <button onClick={() => updateQuestion(q.id, { options: (q.options || []).filter((_, i) => i !== oi) })} className="text-red-400 p-0.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        <button onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })} className="text-[10px] text-sky-400 hover:text-sky-300">+ Add option</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ CENTER — Live Preview ═══════════ */}
        <div className={`${mobilePanel === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden bg-slate-950`}>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto py-6 px-4">
              {/* Preview Chrome */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Preview header / Hero area */}
                <div
                  className={`relative p-8 bg-gradient-to-br ${THEMES.find(t => t.id === selectedTheme)?.gradient || 'from-gray-900 to-gray-800'}`}
                  style={{ fontFamily }}
                >
                  {/* Decorative dots for confetti theme */}
                  {selectedTheme === 'confetti' && (
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i % 6],
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Waves decoration */}
                  {selectedTheme === 'waves' && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
                      <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z" fill="white" />
                      </svg>
                    </div>
                  )}

                  <div className="relative z-10">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg mb-4 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily }}>
                      {eventName || 'Your Event Name'}
                    </h1>
                    {description && (
                      <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{description}</p>
                    )}
                  </div>
                </div>

                {/* Event info cards */}
                <div className="p-6 space-y-4" style={{ fontFamily, backgroundColor: bgColor, color: textColor }}>
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                      <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{eventTime ? fmtDate(eventTime) : 'Date TBD'}</p>
                      <p className="text-xs text-gray-400">
                        {eventTime ? fmtTime(eventTime) : ''}
                        {eventEndTime ? ` — ${fmtTime(eventEndTime)}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {eventType !== 'virtual' && address && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                        <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{address}</p>
                        <p className="text-xs text-gray-400">{city || 'City'}</p>
                      </div>
                    </div>
                  )}
                  {eventType !== 'physical' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                        <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Virtual Event</p>
                        <p className="text-xs text-gray-400">{eventType === 'hybrid' ? 'Also in-person' : 'Link provided after registration'}</p>
                      </div>
                    </div>
                  )}

                  {/* Tickets preview */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-400 mb-2">Tickets</p>
                    <div className="space-y-2">
                      {ticketTypes.map(t => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-white">{t.name || 'Unnamed Ticket'}</p>
                            {t.benefits && <p className="text-[10px] text-gray-500 mt-0.5">{t.benefits}</p>}
                          </div>
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>
                            {t.price > 0 ? `₦${t.price.toLocaleString()}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Registration form preview */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-medium text-gray-400 mb-3">Registration</p>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5"><span className="text-xs text-gray-500">First name *</span></div>
                        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5"><span className="text-xs text-gray-500">Last name *</span></div>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5"><span className="text-xs text-gray-500">Email address *</span></div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5"><span className="text-xs text-gray-500">Phone number</span></div>
                      {customQuestions.map(q => (
                        <div key={q.id} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                          <span className="text-xs text-gray-500">{q.label || 'Custom question'}{q.required ? ' *' : ''}</span>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isPaid ? 'Register & Pay' : 'Register Now'}
                      </button>
                    </div>
                  </div>

                  {/* Group registration indicator */}
                  {allowGroupRegistration && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>Group registration • Up to {maxGroupSize} people</span>
                      </div>
                    </div>
                  )}

                  {/* Coupons indicator */}
                  {coupons.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        <span>Have a coupon code?</span>
                      </div>
                    </div>
                  )}

                  {/* Share & Calendar buttons preview */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-medium text-gray-400 mb-3">Share & Save</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'WhatsApp', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12c0 1.8.479 3.503 1.387 5.027L2 22l5.086-1.35A9.953 9.953 0 0012 22c5.514 0 10-4.486 10-10S17.514 2 12 2z" /></svg> },
                        { label: 'X', color: 'bg-sky-500/15 border-sky-500/30 text-sky-400', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                        { label: 'LinkedIn', color: 'bg-blue-500/15 border-blue-500/30 text-blue-400', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                        { label: 'Email', color: 'bg-purple-500/15 border-purple-500/30 text-purple-400', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9 6 9-6M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" /></svg> },
                        { label: 'Calendar', color: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10" /><rect width="18" height="16" x="3" y="5" rx="2" ry="2" strokeWidth="2" /></svg> },
                        { label: 'Copy link', color: 'bg-gray-500/15 border-gray-500/30 text-gray-400', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a3 3 0 01-3-3V6a3 3 0 013-3h6a3 3 0 013 3M16 7a3 3 0 013 3v8a3 3 0 01-3 3H10a3 3 0 01-3-3" /></svg> },
                      ].map(btn => (
                        <div key={btn.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium ${btn.color}`}>
                          {btn.icon}
                          {btn.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL — Theme & Customization ═══════════ */}
        <div className={`${mobilePanel === 'theme' ? 'flex' : 'hidden'} md:flex w-full md:w-56 lg:w-64 flex-shrink-0 flex-col border-l border-white/10 overflow-hidden bg-slate-900/30`}>
          <div className="p-3 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Customize</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Theme presets */}
            <div>
              <label className={labelCls}>Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      setBgColor(theme.defaultBg);
                      setTextColor(theme.defaultText);
                      setFontFamily(theme.defaultFont);
                    }}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      selectedTheme === theme.id
                        ? 'border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-500/30'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`w-full h-6 rounded bg-gradient-to-r ${theme.gradient} mb-1.5`} />
                    <p className="text-[10px] font-medium text-white truncate">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Colors Section ── */}
            <div className="space-y-3">
              <label className={labelCls}>Colors</label>

              {/* Accent Color Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setAccentDropdownOpen(!accentDropdownOpen); setBgDropdownOpen(false); setTextDropdownOpen(false); }}
                  className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                    <span className="text-xs text-gray-300">Accent</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{primaryColor}</span>
                </button>
                {accentDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-gray-900 shadow-xl max-h-52 overflow-y-auto">
                    <button type="button" onClick={() => { /* keep open for custom */ }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 border-b border-white/5">
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                      <span>Custom Color</span>
                      <span className="ml-auto text-[10px] font-mono text-gray-500 uppercase">{primaryColor}</span>
                    </button>
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { setPrimaryColor(c.value); setAccentDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${primaryColor === c.value ? 'bg-sky-500/10 text-sky-300' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.value }} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Background Color Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setBgDropdownOpen(!bgDropdownOpen); setAccentDropdownOpen(false); setTextDropdownOpen(false); }}
                  className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: bgColor }} />
                    <span className="text-xs text-gray-300">Background</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{bgColor}</span>
                </button>
                {bgDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-gray-900 shadow-xl max-h-52 overflow-y-auto">
                    <button type="button" onClick={() => { /* keep open for custom */ }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 border-b border-white/5">
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                      <span>Custom Color</span>
                      <span className="ml-auto text-[10px] font-mono text-gray-500 uppercase">{bgColor}</span>
                    </button>
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { setBgColor(c.value); setBgDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${bgColor === c.value ? 'bg-sky-500/10 text-sky-300' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.value }} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Color Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setTextDropdownOpen(!textDropdownOpen); setAccentDropdownOpen(false); setBgDropdownOpen(false); }}
                  className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: textColor }} />
                    <span className="text-xs text-gray-300">Text</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{textColor}</span>
                </button>
                {textDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-gray-900 shadow-xl max-h-52 overflow-y-auto">
                    <button type="button" onClick={() => { /* keep open for custom */ }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 border-b border-white/5">
                      <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                      <span>Custom Color</span>
                      <span className="ml-auto text-[10px] font-mono text-gray-500 uppercase">{textColor}</span>
                    </button>
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { setTextColor(c.value); setTextDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${textColor === c.value ? 'bg-sky-500/10 text-sky-300' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.value }} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Font Family Dropdown ── */}
            <div className="relative">
              <label className={labelCls}>Font Family</label>
              <button
                type="button"
                onClick={() => { setFontDropdownOpen(!fontDropdownOpen); setAccentDropdownOpen(false); setBgDropdownOpen(false); setTextDropdownOpen(false); }}
                className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white hover:bg-white/[0.06] transition-all"
              >
                <span style={{ fontFamily }}>{fontFamily}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {fontDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-gray-900 shadow-xl max-h-52 overflow-y-auto">
                  {FONTS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => { setFontFamily(f); setFontDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-all ${fontFamily === f ? 'bg-sky-500/10 text-sky-300' : 'text-gray-300 hover:bg-white/5'}`}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className={labelCls}>Logo URL</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              {logoUrl && (
                <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-lg mt-2 object-cover border border-white/10" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCreatorPage;
