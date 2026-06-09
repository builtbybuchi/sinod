import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import EventAnalyticsModal from '../../../components/EventAnalyticsModal';
import EditEventModal from '../../../components/EditEventModal';
import { Event, Attendee, EventAnalytics, EventType, EventVisibility, TOP_CITIES } from '../../../types';
import {
  fetchAttendeesForEvent,
  approveAttendee,
  bulkApproveAttendees,
  updateAttendeeVerification,
  exportAttendeesToCSV,
  sendBulkCertificates,
  rejectAttendee,
  AttendeeDocument,
} from '../../../services/attendeeService';
import * as eventsApi from '../../../services/eventsApiService';

interface AppwriteEvent {
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
  event_page_url?: string;
  user_email: string;
}

type ViewMode = 'grid' | 'list';

const EventsPage: React.FC = () => {
  const { currentUser, userDocumentId } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'my-events' | 'registered'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [events, setEvents] = useState<AppwriteEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<AppwriteEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AppwriteEvent | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 12;
  const [attendees, setAttendees] = useState<AttendeeDocument[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  // Refund state
  const [refundingEventId, setRefundingEventId] = useState<string | null>(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundEvent, setRefundEvent] = useState<AppwriteEvent | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundStatuses, setRefundStatuses] = useState<Record<string, { has_refund: boolean; status?: string; amount?: number }>>({});

  // Fetch events when activeTab changes with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const loadEvents = async () => {
      if (isMounted) {
        await fetchEvents(true);
      }
    };
    
    loadEvents();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.city-dropdown-container')) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch refund statuses when registered tab events load
  useEffect(() => {
    if (activeTab === 'registered' && events.length > 0 && currentUser?.email) {
      const fetchRefundStatuses = async () => {
        const statuses: Record<string, { has_refund: boolean; status?: string; amount?: number }> = {};
        await Promise.all(
          events.filter(e => e.paid && e.event_page_url).map(async (event) => {
            try {
              const result = await eventsApi.checkRefundStatus(currentUser!.email!, event.event_page_url!);
              if (result.success) {
                statuses[event.event_page_url!] = {
                  has_refund: result.has_refund,
                  status: result.status,
                  amount: result.amount,
                };
              }
            } catch { /* ignore */ }
          })
        );
        setRefundStatuses(statuses);
      };
      fetchRefundStatuses();
    }
  }, [activeTab, events, currentUser?.email]);

  const handleRequestRefund = async () => {
    if (!refundEvent?.event_page_url || !currentUser?.email) return;
    setRefundingEventId(refundEvent.event_page_url);
    try {
      const result = await eventsApi.requestRefund({
        attendee_email: currentUser.email,
        event_id: refundEvent.event_page_url,
        reason: refundReason,
      });
      if (result.success) {
        setRefundStatuses(prev => ({
          ...prev,
          [refundEvent.event_page_url!]: {
            has_refund: true,
            status: result.status,
            amount: result.amount,
          }
        }));
        alert(result.message);
      } else {
        alert(result.error || result.message || 'Failed to request refund');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to request refund');
    } finally {
      setRefundingEventId(null);
      setShowRefundConfirm(false);
      setRefundEvent(null);
      setRefundReason('');
    }
  };

  const fetchEvents = async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
        setEvents([]);
        setLastId(null);
        setHasMore(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }

      let newEvents: AppwriteEvent[] = [];

      if (activeTab === 'registered') {
        // Fetch registered events using backend API
        if (!currentUser?.email) {
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const response = await eventsApi.listRegisteredEvents(
          currentUser.email,
          25,
          initial ? 0 : events.length
        );
        newEvents = response.documents as unknown as AppwriteEvent[];
        setHasMore(newEvents.length === 25);
      } else {
        // Fetch other tabs using backend API
        if (activeTab === 'my-events') {
          if (!currentUser?.email) {
            setLoading(false);
            setLoadingMore(false);
            return;
          }
          const response = await eventsApi.listUserEvents(currentUser.email, 25, initial ? 0 : events.length);
          newEvents = response.documents as unknown as AppwriteEvent[];
          setHasMore(newEvents.length === 25);
        } else {
          // Public events
          const response = await eventsApi.exploreEvents({
            limit: 25,
            offset: initial ? 0 : events.length
          });
          newEvents = response.documents as unknown as AppwriteEvent[];
          setHasMore(newEvents.length === 25);
        }
      }
      
      if (initial) {
        setEvents(newEvents);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
      }

      if (newEvents.length > 0 && activeTab !== 'registered') {
        setLastId(newEvents[newEvents.length - 1].$id);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Use useMemo to prevent filtering on every render and avoid flashing
  const filteredEvents = useMemo(() => {
    // Don't filter if still loading initial data
    if (loading && events.length === 0) {
      return [];
    }

    const normalizeCity = (city: string) => city.toLowerCase().replace(/\s+/g, '-');
    
    return events.filter(event => {
      const eventCity = event.city ? normalizeCity(event.city) : '';
      const selectedCityNormalized = selectedCity === 'all' ? 'all' : normalizeCity(selectedCity);
      
      const eventDate = new Date(event.event_time);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isUpcoming = eventDate >= today;
      
      const matchesCity = selectedCity === 'all' || eventCity === selectedCityNormalized;
      const matchesSearch = !searchQuery || 
        event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.event_description && event.event_description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCity && matchesSearch && isUpcoming;
    });
  }, [events, selectedCity, searchQuery, loading]);

  const { totalPages, paginatedEvents } = useMemo(() => {
    const total = Math.ceil(filteredEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const paginated = filteredEvents.slice(startIndex, endIndex);
    
    return { totalPages: total, paginatedEvents: paginated };
  }, [filteredEvents, currentPage, eventsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, searchQuery, activeTab]);

  const handleViewAnalytics = async (event: AppwriteEvent) => {
    const eventForAnalytics: Event = {
        id: event.$id,
        title: event.event_name,
        description: event.event_description || '',
        type: event.virtual_status ? EventType.VIRTUAL : EventType.PHYSICAL,
        visibility: event.public_status ? EventVisibility.PUBLIC : EventVisibility.PRIVATE,
        address: event.event_address,
        virtualLink: event.event_url,
        startDate: new Date(event.event_time),
        endDate: event.event_end_time ? new Date(event.event_end_time) : new Date(event.event_time),
        createdBy: event.user_email || '', // Use user_email as creator identifier
        attendees: [],
        status: new Date(event.event_time) < new Date() ? 'completed' : 'published',
        eventPageUrl: event.event_page_url, // Add event page URL for verification
        paid: event.paid, // Include paid status for withdrawals tab
        eventPrice: event.event_price, // Include event price
      };
    setSelectedEvent(eventForAnalytics);
    
    // Fetch real attendees for this event BEFORE opening the modal
    if (event.event_page_url) {
      setLoadingAttendees(true);
      try {
        const fetchedAttendees = await fetchAttendeesForEvent(event.event_page_url);
        setAttendees(fetchedAttendees);
      } catch (error) {
        console.error('Failed to fetch attendees:', error);
        setAttendees([]);
      } finally {
        setLoadingAttendees(false);
      }
    } else {
      // No event page URL, reset attendees to empty
      setAttendees([]);
    }
    
    // Open analytics view after attendees are fetched (or immediately if no event_page_url)
    setIsAnalyticsOpen(true);
  };

  const handleApproveAttendee = async (attendeeId: string, customMessage?: string) => {
    if (!selectedEvent) return;

    try {
      const attendee = attendees.find((a) => a.$id === attendeeId);
      if (!attendee) {
        alert('Attendee not found');
        return;
      }

      if (attendee.approved) {
        alert('Attendee is already approved');
        return;
      }

      const eventLocation = selectedEvent.address || selectedEvent.virtualLink || '';
      const eventTime = selectedEvent.startDate.toLocaleString();
      const eventPageUrl = selectedEvent.eventPageUrl || '';

      await approveAttendee(
        attendee,
        selectedEvent.title,
        eventTime,
        eventLocation,
        eventPageUrl,
        currentUser?.email,
        customMessage
      );

      // Refresh attendees list
      setAttendees((prev) =>
        prev.map((a) => (a.$id === attendeeId ? { ...a, approved: true } : a))
      );

      alert(`Approved ${attendee.first_name} ${attendee.last_name} and sent approval email!`);
    } catch (error) {
      console.error('Error approving attendee:', error);
      alert('Failed to approve attendee. Please try again.');
    }
  };

  const handleSendApprovalEmails = async () => {
    if (!selectedEvent) return;

    const unapprovedAttendees = attendees.filter((a) => !a.approved && a.paid);
    
    if (unapprovedAttendees.length === 0) {
      alert('No unapproved paid attendees to approve');
      return;
    }

    const confirmed = confirm(
      `This will approve ${unapprovedAttendees.length} attendees and send them approval emails. Continue?`
    );
    
    if (!confirmed) return;

    try {
      const eventLocation = selectedEvent.address || selectedEvent.virtualLink || '';
      const eventTime = selectedEvent.startDate.toLocaleString();
      const eventPageUrl = selectedEvent.eventPageUrl || '';

      const result = await bulkApproveAttendees(
        unapprovedAttendees,
        selectedEvent.title,
        eventTime,
        eventLocation,
        eventPageUrl,
        currentUser?.email
      );

      // Refresh attendees list
      setAttendees((prev) =>
        prev.map((a) =>
          unapprovedAttendees.find((u) => u.$id === a.$id)
            ? { ...a, approved: true }
            : a
        )
      );

      if (result.failed > 0) {
        alert(
          `Approved ${result.successful} attendees. Failed: ${result.failed}\n\nErrors:\n${result.errors.join('\n')}`
        );
      } else {
        alert(`Successfully approved ${result.successful} attendees and sent approval emails!`);
      }
    } catch (error) {
      console.error('Error sending approval emails:', error);
      alert('Failed to send approval emails. Please try again.');
    }
  };

  const handleVerifyAttendee = async (attendeeId: string) => {
    try {
      const attendee = attendees.find((a) => a.$id === attendeeId);
      if (!attendee) {
        alert('Attendee not found');
        return;
      }

      if (attendee.verified) {
        alert('Attendee is already verified');
        return;
      }

      await updateAttendeeVerification(attendeeId, true, selectedEvent?.eventPageUrl);

      // Refresh attendees list
      setAttendees((prev) =>
        prev.map((a) =>
          a.$id === attendeeId
            ? { ...a, verified: true, verified_at: new Date().toISOString() }
            : a
        )
      );

      alert(`Verified ${attendee.first_name} ${attendee.last_name}!`);
    } catch (error) {
      console.error('Error verifying attendee:', error);
      alert('Failed to verify attendee. Please try again.');
    }
  };

  const handleExportCSV = (verifiedOnly: boolean = false) => {
    if (!selectedEvent) return;
    
    if (attendees.length === 0) {
      alert('No attendees to export');
      return;
    }

    exportAttendeesToCSV(attendees, selectedEvent.title, verifiedOnly);
  };

  const handleSendCertificates = async () => {
    if (!selectedEvent) return;

    const verifiedAttendees = attendees.filter((a) => a.verified);
    
    if (verifiedAttendees.length === 0) {
      alert('No verified attendees to send certificates to');
      return;
    }

    const confirmed = confirm(
      `This will send certificates to ${verifiedAttendees.length} verified attendees. Continue?`
    );
    
    if (!confirmed) return;

    try {
      const eventDate = selectedEvent.startDate.toLocaleDateString();
      
      const result = await sendBulkCertificates({
        event_name: selectedEvent.title,
        event_id: selectedEvent.eventPageUrl,
        attendees: verifiedAttendees.map((a) => ({
          email: a.email,
          name: `${a.first_name} ${a.last_name}`,
          event_date: eventDate,
          event_id: selectedEvent.eventPageUrl,
        })),
      });

      alert(
        `Certificates sent!\n\nSuccessful: ${result.sent_count}\nFailed: ${result.failed_count}`
      );
    } catch (error) {
      console.error('Error sending certificates:', error);
      alert('Failed to send certificates. Please try again.');
    }
  };

  const handleRejectAttendee = async (attendeeId: string) => {
    if (!selectedEvent) return;

    try {
      const attendee = attendees.find((a) => a.$id === attendeeId);
      if (!attendee) {
        alert('Attendee not found');
        return;
      }

      const reason = prompt(
        `Reject ${attendee.first_name} ${attendee.last_name}?\n\nOptionally, enter a reason for rejection:`,
        'The event has reached maximum capacity.'
      );

      // User cancelled the prompt
      if (reason === null) return;

      await rejectAttendee(
        attendeeId,
        `${attendee.first_name} ${attendee.last_name}`,
        attendee.email,
        selectedEvent.title,
        reason || undefined
      );

      // Remove from attendees list
      setAttendees((prev) => prev.filter((a) => a.$id !== attendeeId));

      alert(`Rejected ${attendee.first_name} ${attendee.last_name} and sent rejection email.`);
    } catch (error) {
      console.error('Error rejecting attendee:', error);
      alert('Failed to reject attendee. Please try again.');
    }
  };

  const handleEditEvent = (event: AppwriteEvent) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
  };

  const handleEventUpdated = () => {
    fetchEvents(true);
  };

  const handleUpdateEvent = async (updates: Partial<Event>) => {
    if (!selectedEvent) return;
    try {
      await eventsApi.updateEvent(selectedEvent.id, {
        event_name: updates.title,
        event_description: updates.description,
        event_address: updates.address,
        event_time: updates.startDate ? updates.startDate.toISOString() : undefined,
        event_end_time: updates.endDate ? updates.endDate.toISOString() : undefined,
        virtual_status: updates.type ? updates.type === EventType.VIRTUAL : undefined,
        public_status: updates.visibility ? updates.visibility === EventVisibility.PUBLIC : undefined,
        event_url: updates.virtualLink,
        city: updates.address ? undefined : updates['city'] as any,
      });
      alert('Event updated successfully');
      fetchEvents(true);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };

  const handleDeleteEvent = async (reason: string) => {
    if (!selectedEvent || !currentUser?.email) return;
    setDeletingEventId(selectedEvent.id);
    try {
      await eventsApi.deleteEvent(selectedEvent.id, currentUser.email, reason);
      setEvents(prev => prev.filter(e => e.$id !== selectedEvent.id));
      setIsAnalyticsOpen(false);
      setSelectedEvent(null);
      setAttendees([]);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  // Convert AttendeeDocument to Attendee type for the modal
  const convertedAttendees: Attendee[] = attendees.map((attendee) => ({
    id: attendee.$id,
    eventId: attendee.event_id,
    userId: attendee.email, // Using email as userId since we don't have a separate userId
    name: `${attendee.first_name} ${attendee.last_name}`,
    email: attendee.email,
    status: attendee.verified
      ? 'attended'
      : attendee.approved
      ? 'approved'
      : 'pending', // Not approved yet = pending (awaiting host approval)
    registrationDate: new Date(attendee.$createdAt),
    approvalDate: attendee.approved ? new Date(attendee.$createdAt) : undefined,
  }));

  // Calculate analytics from real attendees
  const eventAnalytics: EventAnalytics = {
    eventId: selectedEvent?.id || '',
    totalRegistrations: attendees.length,
    approvedAttendees: attendees.filter((a) => a.approved).length,
    rejectedAttendees: 0, // Rejected attendees are removed from database, so always 0 in the list
    attendedCount: attendees.filter((a) => a.verified).length,
    registrationTrend: [], // Can be calculated if needed
    attendanceByTime: [],
  };

  if (selectedEvent && isAnalyticsOpen) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <EventAnalyticsModal
            isOpen={isAnalyticsOpen}
            mode="page"
            onClose={() => {
              setIsAnalyticsOpen(false);
              setTimeout(() => {
                setAttendees([]);
                setSelectedEvent(null);
              }, 100);
            }}
            event={selectedEvent}
            analytics={eventAnalytics}
            attendees={convertedAttendees}
            onApproveAttendee={handleApproveAttendee}
            onSendApprovalEmails={handleSendApprovalEmails}
            onVerifyAttendee={handleVerifyAttendee}
            onRejectAttendee={handleRejectAttendee}
            onExportCSV={handleExportCSV}
            onSendCertificates={handleSendCertificates}
            loadingAttendees={loadingAttendees}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Events
            </h1>
            <p className="text-sm text-gray-400 mt-1">Discover, create, and manage your events</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: { page: 'event-creator' } }))}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>

        {/* Tabs and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="inline-flex rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-white/5">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveTab('my-events')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'my-events'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'registered'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Registered
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-4 py-2 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2 transition-all ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-2xl px-6 py-4 text-white placeholder-gray-500 transition-all duration-300 group-hover:bg-gray-800/80"
            />
            <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats and Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {selectedCity === 'all' ? 'All Events' : `Events in ${selectedCity}`}
            </h2>
            <div className="px-4 py-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg">
              <span className="text-sm font-semibold text-sky-300">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium mb-2">No events found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or create a new event</p>
            </div>
          ) : (
            <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEvents.map((event, index) => (
                  <div
                    key={event.$id}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fade-in 0.5s ease-out forwards'
                    }}
                  >
                    {/* Gradient Accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5 group-hover:from-sky-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                    
                    <div className="relative p-6">
                      {/* Top Row - Badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            event.virtual_status 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                              : 'bg-green-500/20 text-green-300 border border-green-400/30'
                          }`}>
                            {event.virtual_status ? '🌐 Virtual' : '📍 Physical'}
                          </span>
                          {event.paid && event.event_price && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                              ₦{event.event_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {event.city && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-gray-300 border border-slate-600/50">
                            {event.city}
                          </span>
                        )}
                      </div>
                      
                      {/* Event Name */}
                      <h3 className="text-xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-400 transition-all duration-300 line-clamp-2 leading-tight">
                        {event.event_name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {event.event_description || 'No description provided'}
                      </p>
                      
                      {/* Date Info */}
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
                          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Event Date</div>
                          <div className="font-semibold text-white">
                            {new Date(event.event_time).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        {activeTab === 'my-events' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewAnalytics(event); }}
                              className="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-semibold transition-all"
                            >
                              View Details
                            </button>
                          </>
                        )}
                        {activeTab === 'registered' && (
                          <>
                            {event.event_page_url && (
                              <a
                                href={`/event/${event.event_page_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 rounded-lg text-sky-300 text-xs font-semibold transition-all text-center"
                              >
                                View Event
                              </a>
                            )}
                            {event.paid && event.event_page_url && (() => {
                              const refundInfo = refundStatuses[event.event_page_url];
                              if (refundInfo?.has_refund) {
                                return (
                                  <span className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-center ${
                                    refundInfo.status === 'approved' || refundInfo.status === 'completed'
                                      ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                                      : refundInfo.status === 'rejected'
                                      ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                      : refundInfo.status === 'partial_approved'
                                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                      : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                                  }`}>
                                    {refundInfo.status === 'partial_approved' ? '40% Refunded · Full pending' : `Refund ${refundInfo.status}`}
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRefundEvent(event);
                                    setShowRefundConfirm(true);
                                  }}
                                  disabled={refundingEventId === event.event_page_url}
                                  className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-300 text-xs font-semibold transition-all disabled:opacity-50"
                                >
                                  {refundingEventId === event.event_page_url ? 'Processing...' : 'Request Refund'}
                                </button>
                              );
                            })()}
                          </>
                        )}
                        {activeTab === 'all' && event.event_page_url && (
                          <a
                            href={`/event/${event.event_page_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 rounded-lg text-sky-300 text-xs font-semibold transition-all text-center"
                          >
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {paginatedEvents.map((event, index) => (
                  <div
                    key={event.$id}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/20"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      animation: 'slide-up 0.4s ease-out forwards'
                    }}
                  >
                    {/* Gradient Accent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-transparent to-blue-500/5 group-hover:from-sky-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                    
                    <div className="relative p-6">
                      <div className="flex items-start gap-6">
                        {/* Left: Date Box */}
                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-sky-600/20 to-blue-600/20 border border-sky-500/30 rounded-xl flex flex-col items-center justify-center group-hover:border-sky-400/50 group-hover:shadow-lg group-hover:shadow-sky-500/20 transition-all">
                          <span className="text-3xl font-black text-white">
                            {new Date(event.event_time).getDate()}
                          </span>
                          <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                            {new Date(event.event_time).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(event.event_time).getFullYear()}
                          </span>
                        </div>

                        {/* Middle: Event Info */}
                        <div className="flex-1 min-w-0">
                          {/* Badges Row */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              event.virtual_status 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                                : 'bg-green-500/20 text-green-300 border border-green-400/30'
                            }`}>
                              {event.virtual_status ? '🌐 Virtual' : '📍 Physical'}
                            </span>
                            {event.city && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-gray-300 border border-slate-600/50">
                                {event.city}
                              </span>
                            )}
                            {event.paid && event.event_price ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                                ₦{event.event_price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                Free
                              </span>
                            )}
                            {!event.public_status && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                                Private
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-400 transition-all duration-300 line-clamp-1">
                            {event.event_name}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">
                            {event.event_description || 'No description provided'}
                          </p>

                          {/* Time and Location Row */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{new Date(event.event_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                            </div>
                            {event.event_address && !event.virtual_status && (
                              <div className="flex items-center gap-2 text-gray-400 line-clamp-1 flex-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="truncate">{event.event_address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {activeTab === 'my-events' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewAnalytics(event); }}
                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-emerald-300 text-sm font-semibold transition-all"
                                title="View Details"
                              >
                                View Details
                              </button>
                            </>
                          )}
                          {activeTab === 'registered' && (
                            <>
                              {event.event_page_url && (
                                <a
                                  href={`/event/${event.event_page_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 rounded-lg text-sky-300 text-sm font-semibold transition-all"
                                >
                                  View Event
                                </a>
                              )}
                              {event.paid && event.event_page_url && (() => {
                                const refundInfo = refundStatuses[event.event_page_url];
                                if (refundInfo?.has_refund) {
                                  return (
                                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                      refundInfo.status === 'approved' || refundInfo.status === 'completed'
                                        ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                                        : refundInfo.status === 'rejected'
                                        ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                        : refundInfo.status === 'partial_approved'
                                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                        : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                                    }`}>
                                      {refundInfo.status === 'partial_approved' ? '40% Refunded · Full pending' : `Refund ${refundInfo.status}`}
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRefundEvent(event);
                                      setShowRefundConfirm(true);
                                    }}
                                    disabled={refundingEventId === event.event_page_url}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-300 text-sm font-semibold transition-all disabled:opacity-50"
                                  >
                                    {refundingEventId === event.event_page_url ? 'Processing...' : 'Request Refund'}
                                  </button>
                                );
                              })()}
                            </>
                          )}
                          {activeTab === 'all' && event.event_page_url && (
                            <a
                              href={`/event/${event.event_page_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 rounded-lg text-sky-300 text-sm font-semibold transition-all flex items-center gap-2"
                            >
                              View Details
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800/60 rounded-lg disabled:opacity-50">
                  Previous
                </button>
                <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800/60 rounded-lg disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
            </>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={() => fetchEvents(false)}
                disabled={loadingMore}
                className="px-8 py-4 bg-gray-800/80 rounded-xl disabled:opacity-50">
                {loadingMore ? 'Loading...' : 'Load More Events'}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && isAnalyticsOpen && (
        <EventAnalyticsModal
          isOpen={isAnalyticsOpen}
          mode="page"
          onClose={() => {
            setIsAnalyticsOpen(false);
            setTimeout(() => {
              setAttendees([]);
              setSelectedEvent(null);
            }, 100);
          }}
          event={selectedEvent}
          analytics={eventAnalytics}
          attendees={convertedAttendees}
          onApproveAttendee={handleApproveAttendee}
          onSendApprovalEmails={handleSendApprovalEmails}
          onVerifyAttendee={handleVerifyAttendee}
          onRejectAttendee={handleRejectAttendee}
          onExportCSV={handleExportCSV}
          onSendCertificates={handleSendCertificates}
          loadingAttendees={loadingAttendees}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onSendFollowUp={(evt, emails) => {
            // Store follow-up data for campaign editor pre-fill
            localStorage.setItem('campaign:followup', JSON.stringify({
              eventName: evt.title,
              eventId: evt.eventPageUrl || evt.id,
              attendeeEmails: emails,
              subject: `Thank you for attending ${evt.title}!`,
              title: `Follow-up: ${evt.title}`,
            }));
            // Dispatch navigation event for Dashboard
            window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: { page: 'campaign-editor' } }));
          }}
        />
      )}

      {eventToEdit && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEventToEdit(null); }}
          onEventUpdated={handleEventUpdated}
          event={eventToEdit}
        />
      )}

      {/* Refund Confirmation Modal */}
      {showRefundConfirm && refundEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowRefundConfirm(false); setRefundEvent(null); setRefundReason(''); }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Request Refund</h3>
                <p className="text-sm text-gray-400">{refundEvent.event_name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-white font-semibold">Ticket price:</span> ₦{refundEvent.event_price?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  Within 24 hours of registration you get a <span className="text-emerald-400 font-semibold">100% full refund</span> including all fees. After that, a 6.6% transaction fee is non-refundable.
                </p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                  <li><span className="text-emerald-300">Within 24hrs of registration:</span> 100% full refund, auto-approved.</li>
                  <li><span className="text-gray-300">More than 48hrs before event:</span> 40% refunded immediately. Provide a reason to request the remaining 60% (requires admin approval).</li>
                  <li><span className="text-gray-300">48hrs or less before event:</span> A reason is required. All requests need admin approval.</li>
                  <li><span className="text-gray-300">Deadline:</span> Refund requests must be made within 12 hours after the event starts.</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason for refund</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you are requesting a refund. A reason is required for full refunds and for requests within 48 hours of the event."
                  rows={3}
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequestRefund}
                disabled={!!refundingEventId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {refundingEventId ? 'Processing...' : 'Confirm Refund Request'}
              </button>
              <button
                onClick={() => { setShowRefundConfirm(false); setRefundEvent(null); setRefundReason(''); }}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EventsPage;