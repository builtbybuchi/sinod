import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as eventsApi from '../../../services/eventsApiService';
import * as formsApi from '../../../services/formsApiService';
import * as quizzesApi from '../../../services/quizzesApiService';

interface DashboardHomePageProps {
  onNavigate: (page: string) => void;
  onCreateEvent: () => void;
  onCreateQuiz: () => void;
  onCreateForm: () => void;
}

interface QuickEvent {
  $id: string;
  event_name: string;
  event_description?: string;
  event_time: string;
  event_end_time?: string;
  virtual_status: boolean;
  paid: boolean;
  event_price?: number;
  event_page_url?: string;
  event_url?: string;
}

const DashboardHomePage: React.FC<DashboardHomePageProps> = ({
  onNavigate,
  onCreateEvent,
  onCreateQuiz,
  onCreateForm,
}) => {
  const { currentUser } = useAuth();
  const [activeEvents, setActiveEvents] = useState<QuickEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!currentUser?.email) return;
    const load = async () => {
      try {
        setLoadingEvents(true);

        // Current month boundaries
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Fetch events, forms, and quizzes in parallel
        const [eventsResp, formsResp, quizzesResp] = await Promise.all([
          eventsApi.listUserEvents(currentUser.email, 50, 0),
          formsApi.listForms({ created_by: currentUser.email, limit: 100 }),
          quizzesApi.listQuizzes({ created_by: currentUser.email, limit: 100 }),
        ]);

        const allEvents = eventsResp.documents || [];
        const allForms = formsResp.documents || [];
        const allQuizzes = quizzesResp.documents || [];

        // Filter events to current month (by event_time or created date)
        const currentMonthEvents = allEvents.filter((evt: any) => {
          const eventDate = new Date(evt.event_time || evt.$createdAt);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });

        // Filter forms to current month
        const currentMonthForms = allForms.filter((f: any) => {
          const created = new Date(f.created_at || f.$createdAt);
          return created >= monthStart && created <= monthEnd;
        });

        // Filter quizzes to current month
        const currentMonthQuizzes = allQuizzes.filter((q: any) => {
          const created = new Date(q.created_at || q.$createdAt);
          return created >= monthStart && created <= monthEnd;
        });

        setTotalEvents(currentMonthEvents.length);

        // Sum response_count across current month's forms and quizzes
        const formResponses = currentMonthForms.reduce((sum: number, f: any) => sum + (f.response_count || 0), 0);
        const quizResponses = currentMonthQuizzes.reduce((sum: number, q: any) => sum + (q.response_count || 0), 0);
        setTotalResponses(formResponses + quizResponses);

        // Show recent events for the Active Events table (not filtered by month)
        setActiveEvents(allEvents.slice(0, 5) as any);
      } catch {
        setActiveEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, [currentUser?.email]);

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getEventStatus = (evt: QuickEvent) => {
    const now = new Date();
    const start = new Date(evt.event_time);
    const end = evt.event_end_time ? new Date(evt.event_end_time) : null;

    if (end && now >= start && now <= end) {
      return { label: 'STREAMING LIVE', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    const diff = start.getTime() - now.getTime();
    if (diff > 0 && diff < 3600000) {
      return { label: 'STARTS SOON', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    }
    if (diff > 0) {
      return { label: 'PLANNING', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    }
    return { label: 'ENDED', color: 'bg-gray-500/20 text-gray-400 border-gray-500/20' };
  };

  return (
    <div className="min-h-full bg-slate-950 text-white pb-24 md:pb-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Create Event */}
            <button
              onClick={onCreateEvent}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-transparent p-5 text-left transition-all hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Create Event</h3>
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed hidden md:block">Launch a new live experience or webinar in minutes.</p>
              </div>
            </button>

            {/* Create Quiz */}
            <button
              onClick={onCreateQuiz}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-400/5 to-transparent p-5 text-left transition-all hover:border-sky-400/40 hover:shadow-lg hover:shadow-sky-400/10 active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/15 border border-sky-400/25">
                <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Create Quiz</h3>
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed hidden md:block">Boost audience engagement with real-time gamification.</p>
              </div>
            </button>

            {/* Create Form */}
            <button
              onClick={onCreateForm}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-5 text-left transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-400/10 active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/25">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Create Form</h3>
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed hidden md:block">Gather feedback and registrations with custom data fields.</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Performance Snapshot + Collaboration Hub ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Performance Snapshot — takes 3 cols */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              Performance Snapshot
              <span className="text-xs font-medium text-gray-500">· {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Active Events */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Active Events</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{totalEvents}</span>
                </div>
              </div>
              {/* Responses */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Responses</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {totalResponses >= 1000 ? `${(totalResponses / 1000).toFixed(1)}k` : totalResponses > 0 ? totalResponses.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              {/* Email Credits */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Credits</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">1,450</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collaboration Hub — takes 2 cols */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              Collaboration Hub
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
              <button
                onClick={() => onNavigate('chat')}
                className="flex items-center gap-3 w-full p-4 transition-all hover:bg-white/5 rounded-t-2xl text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Team Chat</p>
                  <p className="text-xs text-gray-500">5 unread messages</p>
                </div>
              </button>
              <button
                onClick={() => onNavigate('whiteboard')}
                className="flex items-center gap-3 w-full p-4 transition-all hover:bg-white/5 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Whiteboard</p>
                  <p className="text-xs text-gray-500">2 active canvases</p>
                </div>
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="flex items-center gap-3 w-full p-4 transition-all hover:bg-white/5 rounded-b-2xl text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Shared Docs</p>
                  <p className="text-xs text-gray-500">Recently updated</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Events ── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              Active Events
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              View All Schedule
            </button>
          </div>

          {loadingEvents ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No active events yet</p>
              <button
                onClick={onCreateEvent}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create your first event
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {/* Table header — desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <div className="col-span-4">Event Name</div>
                <div className="col-span-3">Date &amp; Time</div>
                <div className="col-span-2">Participants</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Event rows */}
              {activeEvents.map((evt) => {
                const status = getEventStatus(evt);
                return (
                  <div
                    key={evt.$id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-4 md:px-6 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Event name */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
                        <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-white truncate">{evt.event_name}</span>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-3 text-sm text-gray-400">
                      {formatEventDate(evt.event_time)}
                    </div>

                    {/* Participants (placeholder circles) */}
                    <div className="md:col-span-2 flex items-center">
                      <div className="flex -space-x-2">
                        <div className="h-7 w-7 rounded-full bg-gray-600 border-2 border-slate-950" />
                        <div className="h-7 w-7 rounded-full bg-gray-500 border-2 border-slate-950" />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-1">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      {status.label === 'STREAMING LIVE' || status.label === 'STARTS SOON' ? (
                        <button
                          onClick={() => evt.event_url && window.open(evt.event_url, '_blank')}
                          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 transition-colors"
                        >
                          Join
                        </button>
                      ) : (
                        <button className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-default">
                          Join
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('calendar')}
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardHomePage;
