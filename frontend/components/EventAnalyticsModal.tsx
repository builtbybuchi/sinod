import React, { useState, useEffect } from 'react';
import { Event, Attendee, EventAnalytics as EventAnalyticsType } from '../types';
import QRCodeScanner from './QRCodeScanner';
import ApprovalModal from './ApprovalModal';
import EventReminders from './EventReminders';
import { verifyAttendeeByRegistrationId } from '../services/attendeeService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.VITE_BACKEND_URL;

interface EventAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  analytics: EventAnalyticsType;
  attendees: Attendee[];
  onApproveAttendee: (attendeeId: string, customMessage?: string) => void;
  onSendApprovalEmails: () => void;
  onVerifyAttendee: (attendeeId: string) => void;
  onRejectAttendee?: (attendeeId: string) => void;
  onExportCSV?: (verifiedOnly: boolean) => void;
  onSendCertificates?: () => void;
  onUpdateEvent?: (updates: Partial<Event>) => Promise<void> | void;
  onDeleteEvent?: (reason: string) => Promise<void> | void;
  onSendFollowUp?: (event: Event, attendeeEmails: string[]) => void;
  loadingAttendees?: boolean;
  mode?: 'modal' | 'page';
}

type TabKey = 'analytics' | 'attendees' | 'verification' | 'reminders' | 'withdrawals' | 'edit';

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
  color: string;
  paidOnly?: boolean;
}

const TAB_DEFS: TabDef[] = [
  { key: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'blue' },
  { key: 'attendees', label: 'Attendees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', color: 'blue' },
  { key: 'verification', label: 'Verify', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'blue' },
  { key: 'reminders', label: 'Reminders', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'purple' },
  { key: 'withdrawals', label: 'Withdrawals', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'blue', paidOnly: true },
  { key: 'edit', label: 'Edit', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'amber' },
];

/* ── Small SVG icon helper ──────────────────────────────────── */
const I = ({ d, c = 'w-4 h-4' }: { d: string; c?: string }) => (
  <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
  </svg>
);

const EventAnalyticsModal: React.FC<EventAnalyticsModalProps> = ({
  isOpen, onClose, event, analytics, attendees,
  onApproveAttendee, onSendApprovalEmails, onVerifyAttendee,
  onRejectAttendee, onExportCSV, onSendCertificates,
  loadingAttendees = false, onUpdateEvent, onDeleteEvent,
  onSendFollowUp, mode = 'modal',
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('analytics');

  /* Scanner state */
  const [isScanning, setIsScanning] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<Array<{ name: string; time: string; success: boolean }>>([]);

  /* Approval modal */
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedAttendeeForApproval, setSelectedAttendeeForApproval] = useState<Attendee | null>(null);

  /* Withdrawal */
  const [withdrawalBalance, setWithdrawalBalance] = useState<any>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [loadingWithdrawal, setLoadingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  /* Manual verify */
  const [manualRegistrationId, setManualRegistrationId] = useState('');
  const [manualVerifying, setManualVerifying] = useState(false);

  /* Edit / Delete */
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title, description: event.description,
    address: event.address || '', virtualLink: event.virtualLink || '',
    startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
    endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    visibility: event.visibility, type: event.type, city: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isModal = mode === 'modal';

  /* ── Effects ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || activeTab !== 'verification') {
      setIsScanning(false); setVerificationMessage(null);
      setManualRegistrationId(''); setManualVerifying(false);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'withdrawals' && event.paid && currentUser) loadWithdrawalData();
  }, [isOpen, activeTab, event, currentUser]);

  useEffect(() => {
    setEditForm({
      title: event.title, description: event.description,
      address: event.address || '', virtualLink: event.virtualLink || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      visibility: event.visibility, type: event.type, city: '',
    });
    setDeleteReason('');
  }, [event]);

  /* ── QR / Manual verify ─────────────────────────────────────── */
  const addVerification = (name: string, success: boolean) =>
    setRecentVerifications(prev => [{ name, time: new Date().toLocaleTimeString(), success }, ...prev.slice(0, 9)]);

  const handleQRCodeScan = async (decoded: string) => {
    setVerificationMessage(null);
    try {
      const r = await verifyAttendeeByRegistrationId(decoded, event.eventPageUrl);
      if (r.success && r.attendee) {
        setVerificationMessage({ type: 'success', text: r.message });
        addVerification(`${r.attendee.first_name} ${r.attendee.last_name}`, true);
        try { const a = new Audio('/success-sound.mp3'); a.volume = 0.3; a.play().catch(() => {}); } catch {}
        if (onVerifyAttendee) onVerifyAttendee(r.attendee.$id);
        setTimeout(() => setVerificationMessage(null), 3000);
      } else {
        setVerificationMessage({ type: 'error', text: r.message });
        if (r.attendee) addVerification(`${r.attendee.first_name} ${r.attendee.last_name}`, false);
        setTimeout(() => setVerificationMessage(null), 5000);
      }
    } catch {
      setVerificationMessage({ type: 'error', text: 'Verification error. Please try again.' });
      setTimeout(() => setVerificationMessage(null), 5000);
    }
  };

  const handleManualVerify = async () => {
    const id = manualRegistrationId.trim();
    if (!id) { setVerificationMessage({ type: 'error', text: 'Please enter a registration ID.' }); return; }
    setManualVerifying(true); setVerificationMessage(null);
    try {
      const r = await verifyAttendeeByRegistrationId(id, event.eventPageUrl);
      if (r.success && r.attendee) {
        setVerificationMessage({ type: 'success', text: r.message });
        addVerification(`${r.attendee.first_name} ${r.attendee.last_name}`, true);
        if (onVerifyAttendee) onVerifyAttendee(r.attendee.$id);
        setManualRegistrationId('');
        setTimeout(() => setVerificationMessage(null), 3000);
      } else {
        setVerificationMessage({ type: 'error', text: r.message });
        if (r.attendee) addVerification(`${r.attendee.first_name} ${r.attendee.last_name}`, false);
        setTimeout(() => setVerificationMessage(null), 5000);
      }
    } catch {
      setVerificationMessage({ type: 'error', text: 'Verification error. Please try again.' });
      setTimeout(() => setVerificationMessage(null), 5000);
    } finally { setManualVerifying(false); }
  };

  /* ── Withdrawal ─────────────────────────────────────────────── */
  const loadWithdrawalData = async () => {
    setLoadingWithdrawal(true); setWithdrawalError(null);
    try {
      const body = JSON.stringify({ user_email: currentUser?.email, event_id: event.eventPageUrl });
      const hdr = { 'Content-Type': 'application/json' };
      const [bRes, hRes] = await Promise.all([
        fetch(`${BACKEND_URL}/withdrawal/available`, { method: 'POST', headers: hdr, body }),
        fetch(`${BACKEND_URL}/withdrawal/history`, { method: 'POST', headers: hdr, body }),
      ]);
      if (bRes.ok) setWithdrawalBalance(await bRes.json());
      if (hRes.ok) { const d = await hRes.json(); setWithdrawalHistory(d.withdrawals || []); }
    } catch { setWithdrawalError('Failed to load withdrawal data'); }
    finally { setLoadingWithdrawal(false); }
  };

  const handleInitiateWithdrawal = async () => {
    if (!withdrawAmount || !bankCode || !accountNumber || !accountName) { setWithdrawalError('Please fill all fields'); return; }
    setLoadingWithdrawal(true); setWithdrawalError(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/withdrawal/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUser?.email, amount: parseFloat(withdrawAmount), bank_code: bankCode, account_number: accountNumber, account_name: accountName, event_id: event.eventPageUrl }),
      });
      const data = await resp.json();
      if (data.success) {
        setShowWithdrawForm(false); setWithdrawAmount(''); setBankCode(''); setAccountNumber(''); setAccountName('');
        await loadWithdrawalData(); alert('Withdrawal initiated successfully!');
      } else { setWithdrawalError(data.error || 'Withdrawal failed'); }
    } catch { setWithdrawalError('Failed to initiate withdrawal'); }
    finally { setLoadingWithdrawal(false); }
  };

  /* ── Report ─────────────────────────────────────────────────── */
  const handleDownloadReport = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/report/generate-and-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizer_email: currentUser?.email || 'organizer@example.com',
          organizer_name: currentUser?.name || 'Event Organizer',
          analytics_data: {
            totalRegistrations: analytics.totalRegistrations, approvedAttendees: analytics.approvedAttendees,
            attendedCount: analytics.attendedCount, registrationTrend: analytics.registrationTrend,
            eventName: event.title,
            eventDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            eventLocation: event.address || event.virtualLink || 'Virtual Event',
          },
        }),
      });
      const result = await resp.json();
      alert(result.success ? 'Report generated and emailed successfully!' : 'Failed: ' + (result.error || 'Unknown error'));
    } catch { alert('Failed to generate report. Please try again.'); }
  };

  /* ── Guard ──────────────────────────────────────────────────── */
  if (!isOpen) return null;

  const pending = attendees.filter(a => a.status === 'pending');
  const approved = attendees.filter(a => a.status === 'approved');
  const attended = attendees.filter(a => a.status === 'attended').length;
  const tabs = TAB_DEFS.filter(t => !t.paidOnly || event.paid);

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4' : 'w-full'}>
      {isModal && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />}

      <div className={`${isModal ? 'relative max-w-7xl w-full max-h-[95vh] rounded-2xl shadow-2xl' : 'relative w-full'} border border-gray-700/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 backdrop-blur-xl overflow-hidden`}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 shrink-0">
                <I d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" c="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              Event Analytics
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">{event.title}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button onClick={handleDownloadReport} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-500/20">
              <I d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <span className="hidden sm:inline">Download Report</span><span className="sm:hidden">Report</span>
            </button>
            {isModal ? (
              <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all">
                <I d="M6 18L18 6M6 6l12 12" c="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : (
              <button onClick={onClose} className="flex items-center gap-1.5 text-gray-300 hover:text-white px-3 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 transition-all text-xs sm:text-sm">
                <I d="M10 19l-7-7 7-7M3 12h18" c="w-4 h-4 sm:w-5 sm:h-5" />
                Back
              </button>
            )}
          </div>
        </div>

        {/* ─── TABS (scrollable on mobile) ───────────────────── */}
        <div className="border-b border-gray-700/50 bg-gray-900/50 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex min-w-max">
            {tabs.map(tab => {
              const active = activeTab === tab.key;
              const cls = active
                ? tab.color === 'amber' ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                  : tab.color === 'purple' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                  : 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5';
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${cls}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <I d={tab.icon} c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {tab.label}
                    {tab.key === 'attendees' && <span className="text-[10px] sm:text-xs opacity-70">({attendees.length})</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CONTENT ───────────────────────────────────────── */}
        <div className={`p-4 sm:p-6 lg:p-8 ${isModal ? 'overflow-y-auto max-h-[calc(95vh-140px)]' : ''}`}>

          {/* ═══════ ANALYTICS ═══════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { label: 'Total Registrations', val: analytics.totalRegistrations, sub: 'All sign-ups', bg: 'from-blue-500/10 to-blue-600/10', border: 'border-blue-500/30 hover:border-blue-400/50', txt: 'text-blue-300', sub2: 'text-blue-400/70', iconBg: 'bg-blue-500/20', iconTxt: 'text-blue-400', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { label: 'Approved', val: analytics.approvedAttendees, sub: '✓ QR codes sent', bg: 'from-green-500/10 to-green-600/10', border: 'border-green-500/30 hover:border-green-400/50', txt: 'text-green-300', sub2: 'text-green-400/70', iconBg: 'bg-green-500/20', iconTxt: 'text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Attended', val: analytics.attendedCount, sub: '✓ Verified', bg: 'from-purple-500/10 to-purple-600/10', border: 'border-purple-500/30 hover:border-purple-400/50', txt: 'text-purple-300', sub2: 'text-purple-400/70', iconBg: 'bg-purple-500/20', iconTxt: 'text-purple-400', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                  { label: 'Pending', val: analytics.totalRegistrations - analytics.approvedAttendees, sub: '⏳ Awaiting', bg: 'from-yellow-500/10 to-yellow-600/10', border: 'border-yellow-500/30 hover:border-yellow-400/50', txt: 'text-yellow-300', sub2: 'text-yellow-400/70', iconBg: 'bg-yellow-500/20', iconTxt: 'text-yellow-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map(c => (
                  <div key={c.label} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl p-4 sm:p-6 transition-all`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] sm:text-sm font-medium ${c.txt}`}>{c.label}</p>
                        <p className="text-xl sm:text-3xl font-bold text-white mt-1">{c.val}</p>
                        <p className={`text-[10px] sm:text-xs ${c.sub2} mt-1 hidden sm:block`}>{c.sub}</p>
                      </div>
                      <div className={`p-2 sm:p-3 ${c.iconBg} rounded-lg hidden sm:block`}>
                        <I d={c.icon} c={`w-5 h-5 sm:w-6 sm:h-6 ${c.iconTxt}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <I d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" c="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Registration Trend
                  </h3>
                  <div className="h-52 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.registrationTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                        <YAxis stroke="#9CA3AF" fontSize={10} width={30} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB', fontSize: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <I d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" c="w-4 h-4 sm:w-5 sm:h-5 text-green-400" /> Attendance Status
                  </h3>
                  <div className="h-52 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Attended', value: analytics.attendedCount, color: '#8B5CF6' },
                          { name: 'Approved', value: analytics.approvedAttendees - analytics.attendedCount, color: '#10B981' },
                          { name: 'Pending', value: analytics.totalRegistrations - analytics.approvedAttendees, color: '#F59E0B' },
                        ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                          {['#8B5CF6', '#10B981', '#F59E0B'].map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                    {[
                      { color: 'bg-purple-500', label: 'Attended', val: analytics.attendedCount },
                      { color: 'bg-green-500', label: 'Approved', val: analytics.approvedAttendees - analytics.attendedCount },
                      { color: 'bg-yellow-500', label: 'Pending', val: analytics.totalRegistrations - analytics.approvedAttendees },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${l.color} rounded-full`} />
                        <span className="text-xs sm:text-sm text-gray-300">{l.label} ({l.val})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rate cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {[
                  { label: 'Conversion Rate', val: analytics.totalRegistrations > 0 ? Math.round((analytics.attendedCount / analytics.totalRegistrations) * 100) : 0, sub: 'Attended vs Registered' },
                  { label: 'Approval Rate', val: analytics.totalRegistrations > 0 ? Math.round((analytics.approvedAttendees / analytics.totalRegistrations) * 100) : 0, sub: 'Approved vs Registered' },
                  { label: 'Check-in Rate', val: analytics.approvedAttendees > 0 ? Math.round((analytics.attendedCount / analytics.approvedAttendees) * 100) : 0, sub: 'Attended vs Approved' },
                ].map(r => (
                  <div key={r.label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2">{r.label}</h4>
                    <p className="text-xl sm:text-2xl font-bold text-white">{r.val}%</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{r.sub}</p>
                  </div>
                ))}
              </div>

              {/* Follow-up */}
              {onSendFollowUp && attendees.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                        <I d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" c="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        Send Follow-up Email
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Send a follow-up to {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => onSendFollowUp(event, attendees.filter(a => a.email).map(a => a.email))}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto">
                      <I d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /> Compose
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ ATTENDEES ═══════ */}
          {activeTab === 'attendees' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                        <I d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" c="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      Attendee Management
                    </h3>
                    <p className="text-gray-300 mt-1 sm:mt-2 text-xs sm:text-sm">Manage registrations, approve, and track status</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { v: attendees.length, l: 'Total', color: 'text-blue-400' },
                      { v: pending.length, l: 'Pending', color: 'text-yellow-400' },
                      { v: approved.length, l: 'Approved', color: 'text-green-400' },
                      { v: attended, l: 'Attended', color: 'text-purple-400' },
                    ].map(s => (
                      <div key={s.l} className="text-center">
                        <div className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.v}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {onExportCSV && (
                  <>
                    <button onClick={() => onExportCSV(false)} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 rounded-lg text-xs sm:text-sm font-medium transition-all">
                      <I d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Export All
                    </button>
                    <button onClick={() => onExportCSV(true)} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 rounded-lg text-xs sm:text-sm font-medium transition-all">
                      <I d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Export Verified
                    </button>
                  </>
                )}
                <button onClick={onSendApprovalEmails} disabled={pending.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-xs sm:text-sm">
                  <I d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Approve All ({pending.length})
                </button>
                {onSendCertificates && (
                  <button onClick={onSendCertificates} disabled={attended === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 text-xs sm:text-sm">
                    <I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Certificates ({attended})
                  </button>
                )}
              </div>

              {/* Approval info banner */}
              {!loadingAttendees && attendees.length > 0 && pending.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 mt-0.5 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <I d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" c="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-blue-300 font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Approval Process</h4>
                      <p className="text-blue-200/90 text-xs sm:text-sm leading-relaxed mb-3">
                        <strong className="text-white">{pending.length} pending</strong> registration{pending.length !== 1 ? 's' : ''}.
                        Approved attendees get an <strong className="text-white">email with their QR code</strong>.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1.5 sm:py-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full" /><span className="text-yellow-300 text-xs sm:text-sm font-medium">Pending</span>
                        </div>
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5 sm:py-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full" /><span className="text-green-300 text-xs sm:text-sm font-medium">Approved</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-1.5 sm:py-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full" /><span className="text-purple-300 text-xs sm:text-sm font-medium">Attended</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees list */}
              {loadingAttendees ? (
                <div className="flex items-center justify-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-400 text-sm sm:text-lg">Loading attendees...</p>
                  </div>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <I d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" c="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
                  </div>
                  <h3 className="text-gray-400 text-sm sm:text-lg font-medium mb-1 sm:mb-2">No attendees yet</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Registrations will appear here once people sign up.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {attendees.map(att => (
                    <div key={att.id} className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-xl p-4 sm:p-6 hover:border-gray-500/50 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-gray-600/50">
                              <span className="text-white font-semibold text-sm sm:text-lg">{att.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold text-sm sm:text-lg truncate">{att.name}</h4>
                              <p className="text-gray-400 text-xs sm:text-sm truncate mb-1 sm:mb-2">{att.email}</p>
                              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500">
                                <span className="flex items-center gap-1"><I d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" c="w-3 h-3" />{att.registrationDate.toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><I d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" c="w-3 h-3" />{att.registrationDate.toLocaleTimeString()}</span>
                              </div>
                              <div className="mt-2 sm:mt-3">
                                {att.status === 'pending' && <span className="text-yellow-400 text-xs sm:text-sm font-medium">⏳ Awaiting approval</span>}
                                {att.status === 'approved' && <span className="text-green-400 text-xs sm:text-sm font-medium">✓ Approved – QR sent</span>}
                                {att.status === 'attended' && <span className="text-purple-400 text-xs sm:text-sm font-medium">✓ Verified at event</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-13 sm:pl-0">
                          <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                            att.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : att.status === 'attended' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : att.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {att.status === 'pending' ? 'Pending' : att.status === 'approved' ? 'Approved' : att.status === 'attended' ? 'Attended' : 'Rejected'}
                          </span>
                          <div className="flex gap-1.5 sm:gap-2">
                            {att.status === 'pending' && (
                              <>
                                <button onClick={() => { setSelectedAttendeeForApproval(att); setIsApprovalModalOpen(true); }}
                                  className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-[10px] sm:text-sm font-medium rounded-lg transition-all" title="Approve">
                                  <I d="M5 13l4 4L19 7" c="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Approve</span>
                                </button>
                                {onRejectAttendee && (
                                  <button onClick={() => onRejectAttendee(att.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-[10px] sm:text-sm font-medium rounded-lg transition-all" title="Reject">
                                    <I d="M6 18L18 6M6 6l12 12" c="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Reject</span>
                                  </button>
                                )}
                              </>
                            )}
                            {att.status === 'approved' && (
                              <button onClick={() => onVerifyAttendee(att.id)}
                                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-[10px] sm:text-sm font-medium rounded-lg transition-all" title="Mark Attended">
                                <I d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Mark Attended</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════ VERIFICATION ═══════ */}
          {activeTab === 'verification' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                    <I d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Event Check-in</h3>
                    <p className="text-gray-300 mt-1 text-xs sm:text-sm">Scan QR codes to verify attendance</p>
                  </div>
                </div>
              </div>

              {verificationMessage && (
                <div className={`rounded-xl p-4 sm:p-6 border ${verificationMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' : verificationMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${verificationMessage.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <I d={verificationMessage.type === 'success' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} c={`w-5 h-5 sm:w-6 sm:h-6 ${verificationMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <div>
                      <h4 className={`text-sm sm:text-lg font-semibold mb-1 ${verificationMessage.type === 'success' ? 'text-green-300' : verificationMessage.type === 'error' ? 'text-red-300' : 'text-blue-300'}`}>
                        {verificationMessage.type === 'success' ? '✅ Check-in Successful' : verificationMessage.type === 'error' ? '❌ Verification Failed' : 'ℹ️ Information'}
                      </h4>
                      <p className={`text-xs sm:text-sm ${verificationMessage.type === 'success' ? 'text-green-200' : verificationMessage.type === 'error' ? 'text-red-200' : 'text-blue-200'}`}>{verificationMessage.text}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Scanner */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 sm:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">QR Code Scanner</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Position the QR code within the camera frame</p>
                </div>
                <div className="flex justify-center">
                  <div className="bg-black/50 rounded-lg p-3 sm:p-4 border border-gray-700/50 w-full max-w-sm">
                    <QRCodeScanner onScanSuccess={handleQRCodeScan} onScanError={(err) => setVerificationMessage({ type: 'error', text: err })} isScanning={isScanning} onToggleScanning={() => { setIsScanning(p => !p); setVerificationMessage(null); }} />
                  </div>
                </div>
                {!isScanning && (
                  <div className="text-center mt-4">
                    <button onClick={() => { setIsScanning(true); setVerificationMessage(null); }} className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-500/20">
                      <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" c="w-4 h-4 sm:w-5 sm:h-5" /> Start Scanning
                    </button>
                  </div>
                )}
              </div>

              {/* Manual verify */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                      <I d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    Verify by Registration ID
                  </h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Enter a registration ID to manually verify</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" c="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    </div>
                    <input type="text" value={manualRegistrationId} onChange={e => setManualRegistrationId(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !manualVerifying) handleManualVerify(); }}
                      placeholder="Enter registration ID..." disabled={manualVerifying}
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm" />
                  </div>
                  <button onClick={handleManualVerify} disabled={manualVerifying || !manualRegistrationId.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all">
                    {manualVerifying ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Verifying...</> : <><I d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="w-4 h-4 sm:w-5 sm:h-5" />Verify</>}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {[
                  { label: 'Verified', val: attendees.filter(a => a.status === 'attended').length, sub: '✓ Checked in', bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/30', txt: 'text-green-300', sub2: 'text-green-400/70', iconBg: 'bg-green-500/20', iconTxt: 'text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Pending Check-in', val: attendees.filter(a => a.status === 'approved').length, sub: '⏳ Approved', bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', txt: 'text-blue-300', sub2: 'text-blue-400/70', iconBg: 'bg-blue-500/20', iconTxt: 'text-blue-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Total Registered', val: attendees.length, sub: '📝 All sign-ups', bg: 'from-purple-500/10 to-indigo-500/10', border: 'border-purple-500/30', txt: 'text-purple-300', sub2: 'text-purple-400/70', iconBg: 'bg-purple-500/20', iconTxt: 'text-purple-400', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                ].map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-xl p-4 sm:p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm font-medium ${s.txt}`}>{s.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{s.val}</p>
                        <p className={`text-[10px] sm:text-xs ${s.sub2} mt-1`}>{s.sub}</p>
                      </div>
                      <div className={`p-3 sm:p-4 ${s.iconBg} rounded-lg`}><I d={s.icon} c={`w-6 h-6 sm:w-8 sm:h-8 ${s.iconTxt}`} /></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent check-ins */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 sm:p-6">
                <h4 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                    <I d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" c="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  Recent Check-ins
                </h4>
                {recentVerifications.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentVerifications.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${v.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <I d={v.success ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} c="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div><p className="text-white text-sm sm:text-base font-medium">{v.name}</p><p className="text-gray-400 text-xs sm:text-sm">{v.time}</p></div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${v.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {v.success ? 'Verified ✓' : 'Failed ✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <I d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
                    </div>
                    <h3 className="text-gray-400 text-sm sm:text-lg font-medium mb-1 sm:mb-2">No check-ins yet</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">Verified attendees appear here once you scan QR codes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ REMINDERS ═══════ */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-xl p-4 sm:p-6">
                {event.eventPageUrl ? (
                  <EventReminders eventId={event.eventPageUrl} userEmail={currentUser?.email || ''} eventName={event.title} mode="manage" />
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <I d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" c="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
                    </div>
                    <h3 className="text-gray-400 text-sm sm:text-lg font-medium mb-1 sm:mb-2">Reminders Unavailable</h3>
                    <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">This event does not have an event page URL configured. Reminders require it to function.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ EDIT & DELETE ═══════ */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <button className="w-full flex items-center justify-between px-4 py-3 text-left text-white" onClick={() => setEditOpen(!editOpen)}>
                  <span className="font-semibold text-sm sm:text-base">Edit event details</span>
                  <span className="text-gray-400">{editOpen ? '▲' : '▼'}</span>
                </button>
                {editOpen && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Title</label><input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Visibility</label><select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.visibility} onChange={e => setEditForm({ ...editForm, visibility: e.target.value as any })}><option value="public">Public</option><option value="private">Private</option></select></div>
                    </div>
                    <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Description</label><textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Start</label><input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} /></div>
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">End</label><input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Location</label><input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                      <div><label className="block text-xs sm:text-sm text-gray-300 mb-1">Virtual link</label><input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={editForm.virtualLink} onChange={e => setEditForm({ ...editForm, virtualLink: e.target.value })} /></div>
                    </div>
                    <div className="flex justify-end">
                      <button disabled={savingEdit} onClick={async () => {
                        if (!onUpdateEvent) return; setSavingEdit(true);
                        try { await onUpdateEvent({ title: editForm.title, description: editForm.description, address: editForm.address, virtualLink: editForm.virtualLink, startDate: editForm.startDate ? new Date(editForm.startDate) : undefined, endDate: editForm.endDate ? new Date(editForm.endDate) : undefined, visibility: editForm.visibility as any, type: editForm.type }); } finally { setSavingEdit(false); }
                      }} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-60">
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400">Note: Event amount and paid/free status cannot be edited.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <button className="w-full flex items-center justify-between px-4 py-3 text-left text-white" onClick={() => setDeleteOpen(!deleteOpen)}>
                  <span className="font-semibold text-red-300 text-sm sm:text-base">Delete event (irreversible)</span>
                  <span className="text-gray-400">{deleteOpen ? '▲' : '▼'}</span>
                </button>
                {deleteOpen && (
                  <div className="px-4 pb-4 space-y-4">
                    <p className="text-xs sm:text-sm text-gray-300">This action cannot be undone. Please tell us why you are deleting this event.</p>
                    <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" rows={4} value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Reason for deletion" />
                    <div className="flex justify-end gap-3">
                      <button disabled={deleting} onClick={() => setDeleteReason('')} className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm">Clear</button>
                      <button disabled={deleting || !deleteReason.trim()} onClick={async () => {
                        if (!onDeleteEvent) return; setDeleting(true);
                        try { await onDeleteEvent(deleteReason.trim()); } finally { setDeleting(false); }
                      }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60">
                        {deleting ? 'Deleting...' : 'Delete Event'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ WITHDRAWALS ═══════ */}
          {activeTab === 'withdrawals' && event.paid && (
            <div className="space-y-6 sm:space-y-8">
              {loadingWithdrawal ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-block h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mb-3 sm:mb-4" />
                  <p className="text-gray-400 text-sm">Loading withdrawal data...</p>
                </div>
              ) : (
                <>
                  {/* Balance */}
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-300 mb-1">Available Balance</p>
                        <p className="text-3xl sm:text-5xl font-bold text-white">₦{withdrawalBalance?.available_balance?.toLocaleString() || '0'}</p>
                        <p className="text-xs sm:text-sm text-green-400/70 mt-1 sm:mt-2">Ready to withdraw</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-green-500/20 rounded-xl self-start sm:self-auto">
                        <I d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" c="w-8 h-8 sm:w-12 sm:h-12 text-green-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-green-500/20">
                      <div><p className="text-[10px] sm:text-xs text-green-300/70 mb-1">Pending (&lt;48hrs)</p><p className="text-sm sm:text-lg font-semibold text-white">₦{withdrawalBalance?.pending_amount?.toLocaleString() || '0'}</p></div>
                      <div><p className="text-[10px] sm:text-xs text-green-300/70 mb-1">In Escrow (40%)</p><p className="text-sm sm:text-lg font-semibold text-yellow-300">₦{withdrawalBalance?.escrowed_amount?.toLocaleString() || '0'}</p></div>
                      <div><p className="text-[10px] sm:text-xs text-green-300/70 mb-1">Already Withdrawn</p><p className="text-sm sm:text-lg font-semibold text-white">₦{withdrawalBalance?.withdrawn_amount?.toLocaleString() || '0'}</p></div>
                      <div><p className="text-[10px] sm:text-xs text-green-300/70 mb-1">Platform Fee (5%)</p><p className="text-sm sm:text-lg font-semibold text-white">₦{withdrawalBalance?.platform_fee?.toLocaleString() || '0'}</p></div>
                    </div>
                    {withdrawalBalance?.available_balance > 0 && !showWithdrawForm && (
                      <button onClick={() => setShowWithdrawForm(true)} className="mt-4 sm:mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base">Withdraw Funds</button>
                    )}
                  </div>

                  {/* Withdraw form */}
                  {showWithdrawForm && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6">
                      <h3 className="text-white font-semibold text-base sm:text-lg mb-4">Withdraw to Bank Account</h3>
                      {withdrawalError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs sm:text-sm">{withdrawalError}</div>}
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Amount (₦)</label>
                          <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} max={withdrawalBalance?.available_balance || 0} className="w-full bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm" placeholder="Enter amount" />
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Max: ₦{withdrawalBalance?.available_balance?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Bank</label>
                          <select value={bankCode} onChange={e => setBankCode(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm">
                            <option value="">Select Bank</option>
                            <option value="058">GTBank</option><option value="044">Access Bank</option><option value="033">UBA</option>
                            <option value="011">First Bank</option><option value="057">Zenith Bank</option><option value="214">FCMB</option><option value="221">Stanbic IBTC</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Account Number</label>
                          <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} maxLength={10} className="w-full bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm" placeholder="0123456789" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Account Name</label>
                          <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm" placeholder="John Doe" />
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                          <button onClick={handleInitiateWithdrawal} disabled={loadingWithdrawal} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors disabled:opacity-50 text-sm">{loadingWithdrawal ? 'Processing...' : 'Confirm Withdrawal'}</button>
                          <button onClick={() => { setShowWithdrawForm(false); setWithdrawalError(null); }} className="px-4 sm:px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Withdrawal history */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-4">Withdrawal History</h3>
                    {withdrawalHistory.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {withdrawalHistory.map(w => (
                          <div key={w.$id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-gray-700/30 gap-2">
                            <div>
                              <p className="text-white font-medium text-sm">₦{w.net_amount?.toLocaleString()}</p>
                              <p className="text-xs sm:text-sm text-gray-400">{new Date(w.withdrawn_at).toLocaleDateString()}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Ref: {w.transfer_reference}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${w.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>{w.status}</span>
                              <span className="text-[10px] sm:text-xs text-gray-500">Fee: ₦{w.platform_fee?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8"><p className="text-gray-400 text-sm">No withdrawals yet</p></div>
                    )}
                  </div>

                  {/* Policy info */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6">
                    <div className="flex gap-2 sm:gap-3">
                      <I d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" c="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-blue-300">
                        <p className="font-semibold mb-1 sm:mb-2">Withdrawal Policy</p>
                        <ul className="space-y-0.5 sm:space-y-1 text-blue-300/80">
                          <li>• Funds available 48 hours after registration</li>
                          <li>• 60% available immediately; 40% held in escrow</li>
                          <li>• Escrow released 26 hours after event ends</li>
                          <li>• 5% platform fee auto-deducted (+ 1.6% gateway if host bears fees)</li>
                          <li>• Minimum withdrawal: ₦100</li>
                          <li>• Transfers complete within 24 hours</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {selectedAttendeeForApproval && (
        <ApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => { setIsApprovalModalOpen(false); setSelectedAttendeeForApproval(null); }}
          onApprove={async (customMessage) => { if (selectedAttendeeForApproval) await onApproveAttendee(selectedAttendeeForApproval.id, customMessage); }}
          attendeeName={selectedAttendeeForApproval.name}
        />
      )}
    </div>
  );
};

export default EventAnalyticsModal;
