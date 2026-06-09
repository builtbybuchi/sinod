import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateEventId } from '../utils/idGenerator';
import * as eventsApi from '../services/eventsApiService';
import { createRemindersBulk } from '../services/reminderApiService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

interface TooltipProps {
  text: string;
}

interface CustomQuestion {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <div className="group relative inline-flex">
    <svg className="w-4 h-4 text-gray-400 cursor-help hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48 border border-gray-700 z-50 shadow-xl">
      {text}
      <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
    </div>
  </div>
);

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
  const { currentUser, userDocumentId } = useAuth();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'virtual' | 'physical' | 'hybrid'>('virtual');
  const [isPublic, setIsPublic] = useState(true);
  const [address, setAddress] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [eventPrice, setEventPrice] = useState('');
  const [city, setCity] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Ticket Types
  interface TicketType {
    id: string;
    name: string;
    price: number; // 0 = free
    quantity: number; // 0 = unlimited
    benefits: string;
  }
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 'default', name: 'General Admission', price: 0, quantity: 0, benefits: '' }
  ]);
  const [allowGroupRegistration, setAllowGroupRegistration] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState(10);
  const [coupons, setCoupons] = useState<{ code: string; discount: number; maxUses: number }[]>([]);
  const [selectedReminderPresets, setSelectedReminderPresets] = useState<string[]>(['1_hour', '1_day']);
  const [showReminders, setShowReminders] = useState(true);

  // Theme & Customization
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [logoUrl, setLogoUrl] = useState('');

  const THEMES = [
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple', gradient: 'from-gray-900 to-gray-800' },
    { id: 'gradient', name: 'Gradient', description: 'Colorful gradient bg', gradient: 'from-blue-600 to-purple-600' },
    { id: 'particles', name: 'Particles', description: 'Animated particles', gradient: 'from-slate-900 to-blue-900' },
    { id: 'waves', name: 'Waves', description: 'Flowing wave animation', gradient: 'from-cyan-600 to-blue-600' },
    { id: 'confetti', name: 'Confetti', description: 'Celebration style', gradient: 'from-pink-500 to-yellow-500' },
    { id: 'corporate', name: 'Corporate', description: 'Professional and clean', gradient: 'from-gray-800 to-gray-700' },
  ];

  const FONTS = ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Playfair Display', 'Space Grotesk'];

  const COLOR_PRESETS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#10B981', '#06B6D4', '#6366F1', '#000000', '#FFFFFF',
  ];

  const generateVirtualLink = useCallback(() => {
    // Generate a Google Meet-style link
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const seg = (len: number) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
  }, []);

  const validateRequiredFields = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!eventName.trim()) errors.eventName = 'Event name is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!eventTime) errors.eventTime = 'Start date & time is required';
    if ((eventType === 'physical' || eventType === 'hybrid') && !address.trim()) errors.address = 'Address is required for physical/hybrid events';
    if (isPaid && (!eventPrice || parseInt(eventPrice) <= 0)) errors.eventPrice = 'Price is required for paid events';
    return errors;
  }, [eventName, city, eventTime, eventType, address, isPaid, eventPrice]);

  const handleToggleQuestions = useCallback(() => {
    if (!showQuestions) {
      const errors = validateRequiredFields();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please fill in all required fields before adding custom questions.');
        return;
      }
      setValidationErrors({});
      setError(null);
    }
    setShowQuestions(prev => !prev);
  }, [showQuestions, validateRequiredFields]);

  const addQuestion = useCallback(() => {
    setCustomQuestions(prev => [
      ...prev,
      {
        id: `q_${Date.now().toString(36)}`,
        type: 'text',
        label: '',
        required: false,
        options: [],
        placeholder: '',
      },
    ]);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<CustomQuestion>) => {
    setCustomQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const addOption = useCallback((questionId: string) => {
    setCustomQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    );
  }, []);

  const updateOption = useCallback((questionId: string, index: number, value: string) => {
    setCustomQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, options: (q.options || []).map((o, i) => (i === index ? value : o)) }
          : q
      )
    );
  }, []);

  const removeOption = useCallback((questionId: string, index: number) => {
    setCustomQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, options: (q.options || []).filter((_, i) => i !== index) }
          : q
      )
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate user is logged in with document ID
      if (!userDocumentId) {
        setError('User not properly authenticated. Please sign out and sign in again.');
        setLoading(false);
        return;
      }

      // Generate short unique event ID (e.g., "a3f-k9z-2b7")
      const shortEventId = generateEventId();
      
      // Derive paid status from ticket types
      const hasPaidTickets = ticketTypes.some(t => t.price > 0);
      const highestPrice = Math.max(...ticketTypes.map(t => t.price), 0);

      const eventData: eventsApi.CreateEventData = {
        event_name: eventName,
        event_description: description || '',
        virtual_status: eventType === 'virtual' || eventType === 'hybrid',
        public_status: isPublic,
        event_time: eventTime,
        event_end_time: eventEndTime,
        paid: hasPaidTickets,
        event_price: hasPaidTickets ? highestPrice : 0,
        city: city,
        user_email: currentUser.email,
        event_page_url: shortEventId,
        event_url: (eventType === 'virtual' || eventType === 'hybrid') ? (eventUrl || generateVirtualLink()) : undefined,
        event_address: (eventType === 'physical' || eventType === 'hybrid') ? address : undefined,
        auto_approve: autoApprove,
        has_custom_questions: customQuestions.length > 0,
        custom_questions: customQuestions.length > 0 ? JSON.stringify(customQuestions) : undefined,
        ticket_types: JSON.stringify(ticketTypes),
        allow_group_registration: allowGroupRegistration,
        max_group_size: allowGroupRegistration ? maxGroupSize : undefined,
        coupons: coupons.length > 0 ? JSON.stringify(coupons) : undefined,
        theme: selectedTheme,
        primary_color: primaryColor,
        font_family: fontFamily,
        logo_url: logoUrl || undefined,
      };

      await eventsApi.createEvent(eventData);

      // Create reminders if any presets selected
      if (selectedReminderPresets.length > 0) {
        try {
          await createRemindersBulk({
            event_id: shortEventId,
            created_by: currentUser.email,
            presets: selectedReminderPresets,
          });
        } catch (reminderErr) {
          // Don't fail the whole event creation if reminders fail
          console.error('Failed to create reminders:', reminderErr);
        }
      }

      // Reset form
      setEventName('');
      setDescription('');
      setEventType('virtual');
      setIsPublic(true);
      setAddress('');
      setEventUrl('');
      setEventTime('');
      setEventEndTime('');
      setIsPaid(false);
      setEventPrice('');
      setCity('');
      setAutoApprove(true);
      setCustomQuestions([]);
      setShowQuestions(false);
      setValidationErrors({});
      setSelectedReminderPresets(['1_hour', '1_day']);
      setShowReminders(true);
      setTicketTypes([{ id: 'default', name: 'General Admission', price: 0, quantity: 0, benefits: '' }]);
      setAllowGroupRegistration(false);
      setMaxGroupSize(10);
      setCoupons([]);
      setSelectedTheme('minimal');
      setPrimaryColor('#3B82F6');
      setFontFamily('Inter');
      setLogoUrl('');
      
      onEventCreated?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create event');
      console.error('Error creating event:', e);
    } finally {
      setLoading(false);
    }
  }, [eventName, description, eventType, isPublic, address, eventUrl, eventTime, eventEndTime, isPaid, eventPrice, city, userDocumentId, onClose, onEventCreated, generateVirtualLink, ticketTypes, allowGroupRegistration, maxGroupSize, coupons, selectedTheme, primaryColor, fontFamily, logoUrl]);

  if (!isOpen) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-5xl mx-auto rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                Create New Sinod'
              </h2>
              <p className="text-sm text-gray-400 mt-1">Fill in the details below to create your Sinod'</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  Event Name *
                  <Tooltip text="Catchy name for your Sinod' event. " />
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => { setEventName(e.target.value); setValidationErrors(prev => { const { eventName, ...rest } = prev; return rest; }); }}
                  required
                  placeholder="e.g., Sinod' Conf 2080"
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 ${validationErrors.eventName ? 'border-red-500/70 ring-1 ring-red-500/30' : 'border-gray-700/50'}`}
                />
              </div>

              {/* City */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  City *
                  <Tooltip text="Which city will the Sinod' be? This is used to share to potential attendees, helping you reach targeted audiences." />
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setValidationErrors(prev => { const { city, ...rest } = prev; return rest; }); }}
                  required
                  placeholder="e.g., Harare"
                  maxLength={40}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 ${validationErrors.city ? 'border-red-500/70 ring-1 ring-red-500/30' : 'border-gray-700/50'}`}
                />
              </div>

              {/* Event Start Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  Start Date & Time *
                  <Tooltip text="When will the Sinod' start?" />
                </label>
                <input
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => { setEventTime(e.target.value); setValidationErrors(prev => { const { eventTime, ...rest } = prev; return rest; }); }}
                  required
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 ${validationErrors.eventTime ? 'border-red-500/70 ring-1 ring-red-500/30' : 'border-gray-700/50'}`}
                />
              </div>

              {/* Event End Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  End Date & Time
                  <Tooltip text="When will the Sinod' end?" />
                </label>
                <input
                  type="datetime-local"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                  Event Type *
                  <Tooltip text="Virtual events are online, physical events have a location, hybrid events have both" />
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={eventType === 'virtual'}
                      onChange={() => setEventType('virtual')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Virtual</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={eventType === 'physical'}
                      onChange={() => setEventType('physical')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Physical</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={eventType === 'hybrid'}
                      onChange={() => setEventType('hybrid')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Hybrid</span>
                  </label>
                </div>
              </div>

              {/* Virtual URL or Physical Address or Both for Hybrid */}
              {(eventType === 'virtual' || eventType === 'hybrid') && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    Event URL
                    <Tooltip text="Link to your virtual event. Leave empty to auto-generate a Google Meet link" />
                  </label>
                  <input
                    type="url"
                    value={eventUrl}
                    onChange={(e) => setEventUrl(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxx-xxx (optional)"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                  />
                  <p className="text-xs text-gray-500 mt-2">Leave empty to auto-generate a Google Meet link</p>
                </div>
              )}
              {(eventType === 'physical' || eventType === 'hybrid') && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    Event Address *
                    <Tooltip text="The physical location where your event will take place - include full address for easy navigation" />
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="90 Dis St, Building GenZ, Floor 3"
                    required={eventType === 'physical' || eventType === 'hybrid'}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  Description
                  <Tooltip text="Provide details about your event including agenda, speakers, topics, and what attendees can expect" />
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people what your Sinod' is about, who should attend, and what they'll learn..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 resize-none"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                  Visibility *
                  <Tooltip text="Public Sinod' appear in search and can be joined by anyone. Private Sinod' are invite-only" />
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Public</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Private</span>
                  </label>
                </div>
              </div>

              {/* Ticket Types */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
                    Ticket Types
                    <Tooltip text="Add multiple ticket types with different prices and benefits. Set price to 0 for free tickets." />
                  </label>
                  <button
                    type="button"
                    onClick={() => setTicketTypes(prev => [...prev, {
                      id: `ticket_${Date.now().toString(36)}`,
                      name: '',
                      price: 0,
                      quantity: 0,
                      benefits: ''
                    }])}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    + Add Ticket Type
                  </button>
                </div>
                <div className="space-y-3">
                  {ticketTypes.map((ticket, idx) => (
                    <div key={ticket.id} className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) => setTicketTypes(prev => prev.map(t => t.id === ticket.id ? {...t, name: e.target.value} : t))}
                          placeholder="Ticket name (e.g., VIP, Early Bird)"
                          className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {ticketTypes.length > 1 && (
                          <button type="button" onClick={() => setTicketTypes(prev => prev.filter(t => t.id !== ticket.id))} className="text-red-400 hover:text-red-300 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₦</span>
                          <input
                            type="number"
                            value={ticket.price || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setTicketTypes(prev => prev.map(t => t.id === ticket.id ? {...t, price: val} : t));
                              setIsPaid(ticketTypes.some(t => t.id === ticket.id ? val > 0 : t.price > 0));
                            }}
                            placeholder="0 = Free"
                            min="0"
                            className="w-full pl-7 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          type="number"
                          value={ticket.quantity || ''}
                          onChange={(e) => setTicketTypes(prev => prev.map(t => t.id === ticket.id ? {...t, quantity: parseInt(e.target.value) || 0} : t))}
                          placeholder="Qty (0=unlimited)"
                          min="0"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={ticket.benefits}
                        onChange={(e) => setTicketTypes(prev => prev.map(t => t.id === ticket.id ? {...t, benefits: e.target.value} : t))}
                        placeholder="Benefits (e.g., Front row seating, Lunch included)"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Registration */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <label className="flex items-center gap-2 mb-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={allowGroupRegistration}
                    onChange={(e) => setAllowGroupRegistration(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Allow group registration</span>
                  <Tooltip text="Allow attendees to register as a group with multiple people at once" />
                </label>
                {allowGroupRegistration && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-400 mb-1 block">Max group size</label>
                    <input
                      type="number"
                      value={maxGroupSize}
                      onChange={(e) => setMaxGroupSize(parseInt(e.target.value) || 2)}
                      min="2"
                      max="100"
                      className="w-32 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Coupon Management */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
                    Discount Coupons
                    <Tooltip text="Create coupon codes for discounted or free registration" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCoupons(prev => [...prev, { code: '', discount: 10, maxUses: 50 }])}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    + Add Coupon
                  </button>
                </div>
                {coupons.length > 0 && (
                  <div className="space-y-2">
                    {coupons.map((coupon, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={coupon.code}
                          onChange={(e) => setCoupons(prev => prev.map((c, i) => i === idx ? {...c, code: e.target.value.toUpperCase()} : c))}
                          placeholder="CODE"
                          className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                        <div className="relative w-24">
                          <input
                            type="number"
                            value={coupon.discount}
                            onChange={(e) => setCoupons(prev => prev.map((c, i) => i === idx ? {...c, discount: parseInt(e.target.value) || 0} : c))}
                            placeholder="%"
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 pr-7 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        </div>
                        <input
                          type="number"
                          value={coupon.maxUses}
                          onChange={(e) => setCoupons(prev => prev.map((c, i) => i === idx ? {...c, maxUses: parseInt(e.target.value) || 0} : c))}
                          placeholder="Uses"
                          min="1"
                          className="w-20 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => setCoupons(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Approve Registrations */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Auto-approve registrations</span>
                  <Tooltip text="When enabled, attendees are automatically approved upon registration and receive full event details immediately. When disabled, you'll need to manually approve each registration" />
                </label>
              </div>
            </div>
          </div>

          {/* Custom Registration Questions */}
          <div className="mt-8 border-t border-gray-700/50 pt-6">
            <button
              type="button"
              onClick={handleToggleQuestions}
              className={`flex items-center gap-3 w-full rounded-xl border p-4 text-left transition-all ${
                showQuestions
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                showQuestions ? 'bg-blue-500/20' : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${showQuestions ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white">Add Custom Registration Questions</span>
                <p className="text-xs text-gray-400 mt-0.5">Ask attendees additional questions during registration</p>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showQuestions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              {customQuestions.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {customQuestions.length}
                </span>
              )}
            </button>

            {/* Questions Builder Panel */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showQuestions ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/20 p-5 space-y-4">
                {customQuestions.length === 0 && (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">No custom questions yet</p>
                    <p className="text-xs text-gray-500">Add questions to collect extra info from attendees</p>
                  </div>
                )}

                {customQuestions.map((q, qIndex) => (
                  <div key={q.id} className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Question {qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Question Label */}
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      {/* Question Type */}
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, { type: e.target.value as CustomQuestion['type'] })}
                          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="select">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                      </div>

                      {/* Required Toggle */}
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Required?</label>
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, { required: !q.required })}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            q.required
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                              : 'border-gray-700/50 bg-gray-900/50 text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            q.required ? 'border-blue-400 bg-blue-500' : 'border-gray-600'
                          }`}>
                            {q.required && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {q.required ? 'Yes' : 'No'}
                        </button>
                      </div>
                    </div>

                    {/* Placeholder */}
                    {(q.type === 'text' || q.type === 'textarea') && (
                      <input
                        type="text"
                        value={q.placeholder || ''}
                        onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                        placeholder="Placeholder text (optional)"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    )}

                    {/* Options for select type */}
                    {q.type === 'select' && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Options</label>
                        {(q.options || []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, optIndex)}
                              className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors py-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Add option
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-gray-600 text-sm font-medium text-gray-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>
            </div>
          </div>

          {/* Event Reminders */}
          <div className="mt-6 border-t border-gray-700/50 pt-6">
            <button
              type="button"
              onClick={() => setShowReminders(!showReminders)}
              className={`flex items-center gap-3 w-full rounded-xl border p-4 text-left transition-all ${
                showReminders
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                showReminders ? 'bg-purple-500/20' : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${showReminders ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white">Set Event Reminders</span>
                <p className="text-xs text-gray-400 mt-0.5">Send automatic reminders to attendees before the event</p>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showReminders ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              {selectedReminderPresets.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                  {selectedReminderPresets.length}
                </span>
              )}
            </button>

            {/* Reminder Presets Panel */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showReminders ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/20 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: '15_minutes', label: '15 minutes before' },
                    { key: '30_minutes', label: '30 minutes before' },
                    { key: '1_hour', label: '1 hour before' },
                    { key: '2_hours', label: '2 hours before' },
                    { key: '1_day', label: '1 day before' },
                    { key: '2_days', label: '2 days before' },
                    { key: '1_week', label: '1 week before' },
                  ].map(preset => (
                    <label
                      key={preset.key}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReminderPresets.includes(preset.key)
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReminderPresets.includes(preset.key)}
                        onChange={() => {
                          setSelectedReminderPresets(prev =>
                            prev.includes(preset.key)
                              ? prev.filter(k => k !== preset.key)
                              : [...prev, preset.key]
                          );
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                          selectedReminderPresets.includes(preset.key)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-500'
                        }`}
                      >
                        {selectedReminderPresets.includes(preset.key) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-300">{preset.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Reminders will be sent to all registered attendees at the selected times before the event starts.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Theme & Customization Section */}
          {/* ============================================================ */}
          <div className="mt-8 border-t border-gray-700/50 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Theme & Branding
            </h3>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-300 mb-3 block">Event Page Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative p-4 rounded-xl border transition-all text-left ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/10'
                        : 'border-gray-700/50 hover:border-gray-600 bg-gray-800/30'
                    }`}
                  >
                    <div className={`h-8 rounded-md bg-gradient-to-r ${theme.gradient} mb-2`} />
                    <p className="text-sm font-medium text-white">{theme.name}</p>
                    <p className="text-xs text-gray-400">{theme.description}</p>
                    {selectedTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Primary Color */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Primary Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        primaryColor === color ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONTS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Logo URL */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Logo URL (optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Add your organization's logo to the event page</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 mt-8 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-gray-600/50 bg-gray-800/30 text-gray-300 font-medium hover:bg-gray-800/50 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
