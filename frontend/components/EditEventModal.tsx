import React, { useState, useCallback, useEffect } from 'react';
import * as eventsApi from '../services/eventsApiService';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
  event: {
    $id: string;
    event_name: string;
    event_description?: string;
    event_time: string;
    event_end_time?: string;
    virtual_status: boolean;
    public_status: boolean;
    event_address?: string;
    event_url?: string;
    city: string;
    paid: boolean;
    event_price?: number;
  };
}

interface TooltipProps {
  text: string;
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

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onEventUpdated, event }) => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [isVirtual, setIsVirtual] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [address, setAddress] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [eventPrice, setEventPrice] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form with existing event data
  useEffect(() => {
    if (event && isOpen) {
      setEventName(event.event_name);
      setDescription(event.event_description || '');
      setIsVirtual(event.virtual_status);
      setIsPublic(event.public_status);
      setAddress(event.event_address || '');
      setEventUrl(event.event_url || '');
      setCity(event.city);
      setIsPaid(event.paid);
      setEventPrice(event.event_price?.toString() || '');
      
      // Format datetime for input
      if (event.event_time) {
        const date = new Date(event.event_time);
        setEventTime(date.toISOString().slice(0, 16));
      }
      if (event.event_end_time) {
        const date = new Date(event.event_end_time);
        setEventEndTime(date.toISOString().slice(0, 16));
      }
    }
  }, [event, isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const eventData: eventsApi.UpdateEventData = {
        event_name: eventName,
        event_description: description,
        virtual_status: isVirtual,
        public_status: isPublic,
        event_time: eventTime,
        event_end_time: eventEndTime || undefined,
        paid: isPaid,
        event_price: isPaid ? parseInt(eventPrice) || 0 : 0,
        city: city,
        event_url: isVirtual ? (eventUrl || undefined) : undefined,
        event_address: !isVirtual ? address : undefined,
      };

      await eventsApi.updateEvent(event.$id, eventData);

      onEventUpdated?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to update event');
      console.error('Error updating event:', e);
    } finally {
      setLoading(false);
    }
  }, [eventName, description, isVirtual, isPublic, address, eventUrl, eventTime, eventEndTime, isPaid, eventPrice, city, event.$id, onClose, onEventUpdated]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                Edit Event
              </h2>
              <p className="text-sm text-gray-400 mt-1">Update your event details</p>
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
                  <Tooltip text="Give your event a clear, memorable name that attendees will recognize and remember" />
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="e.g., Tech Conference 2025"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                />
              </div>

              {/* City */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  City *
                  <Tooltip text="Specify the city to broadcast your event to local attendees and improve discoverability" />
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g., New York"
                  maxLength={40}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                />
              </div>

              {/* Event Start Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  Start Date & Time *
                  <Tooltip text="When your event begins - this helps attendees plan and ensures they join at the right time" />
                </label>
                <input
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                />
              </div>

              {/* Event End Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                  End Date & Time
                  <Tooltip text="When your event ends - helps attendees allocate their time and manage their schedule" />
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
                  <Tooltip text="Virtual events are online (require URL), physical events have a location (require address)" />
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={isVirtual}
                      onChange={() => setIsVirtual(true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Virtual</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      checked={!isVirtual}
                      onChange={() => setIsVirtual(false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Physical</span>
                  </label>
                </div>
              </div>

              {/* Virtual URL or Physical Address */}
              {isVirtual ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    Event URL
                    <Tooltip text="Link to your virtual event" />
                  </label>
                  <input
                    type="url"
                    value={eventUrl}
                    onChange={(e) => setEventUrl(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                  />
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    Event Address *
                    <Tooltip text="The physical location where your event will take place" />
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Building A, Floor 3"
                    required
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
                  <Tooltip text="Provide details about your event" />
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people what your event is about..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 resize-none"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                  Visibility *
                  <Tooltip text="Public events appear in search. Private events are invite-only" />
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

              {/* Paid Event */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">This is a paid event</span>
                  <Tooltip text="Enable if attendees need to pay" />
                </label>
                {isPaid && (
                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      Event Price *
                      <Tooltip text="Ticket price for your event" />
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                      />
                    </div>
                  </div>
                )}
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
              className="flex-1 px-6 py-3 rounded-lg border border-gray-600/50 bg-gray-800/30 text-gray-300 font-medium hover:bg-gray-800/50 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Updating...
                </span>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
