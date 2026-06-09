import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as campaignApi from '../../../services/campaignApiService';
import type { Campaign, CampaignStatus } from '../../../services/campaignApiService';

type TabKey = 'all' | 'draft' | 'sent' | 'scheduled';

interface NewsletterPageProps {
  onCreateCampaign: () => void;
  onEditCampaign: (campaignId: string) => void;
  onViewAnalytics: (campaignId: string) => void;
  onManageLists: () => void;
}

const NewsletterPage: React.FC<NewsletterPageProps> = ({
  onCreateCampaign,
  onEditCampaign,
  onViewAnalytics,
  onManageLists,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const result = await campaignApi.getCampaigns(currentUser.email);
      setCampaigns(result);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Tab filter
    if (activeTab === 'draft') {
      filtered = filtered.filter((c) => c.status === 'draft');
    } else if (activeTab === 'sent') {
      filtered = filtered.filter((c) => c.status === 'sent');
    } else if (activeTab === 'scheduled') {
      filtered = filtered.filter((c) => c.status === 'scheduled');
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [campaigns, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    all: campaigns.length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    sent: campaigns.filter((c) => c.status === 'sent').length,
    scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
  }), [campaigns]);

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      setDeletingId(campaignId);
      await campaignApi.deleteCampaign(campaignId);
      fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Failed to delete campaign');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResend = async (campaignId: string) => {
    try {
      const newCampaign = await campaignApi.duplicateCampaign(campaignId);
      onEditCampaign(newCampaign.id);
    } catch (err) {
      console.error('Error duplicating campaign:', err);
      alert('Failed to duplicate campaign');
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const styles: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Draft' },
      scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Scheduled' },
      sending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Sending...' },
      sent: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Sent' },
      failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed' },
      cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Cancelled' },
    };
    const s = styles[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Newsletter</h1>
            <p className="text-sm text-gray-400 mt-1">Create and manage email campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onManageLists}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mailing Lists
            </button>
            <button
              onClick={onCreateCampaign}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex-shrink-0 px-4 md:px-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
            {(['all', 'draft', 'sent', 'scheduled'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs opacity-60">({counts[tab]})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No campaigns yet</h3>
            <p className="text-sm text-gray-400 mb-4">Create your first email campaign to get started</p>
            <button
              onClick={onCreateCampaign}
              className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/20 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">{campaign.title}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-gray-400 mb-3 truncate">
                      Subject: {campaign.subject}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        From: {campaign.sender_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {campaign.sent_at ? `Sent ${timeAgo(campaign.sent_at)}` : 
                         campaign.scheduled_at ? `Scheduled: ${formatDate(campaign.scheduled_at)}` :
                         `Created ${timeAgo(campaign.created_at)}`}
                      </span>
                      {campaign.recipient_list_ids.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {campaign.recipient_list_ids.length} list{campaign.recipient_list_ids.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {campaign.status === 'sent' && (
                      <>
                        <button
                          onClick={() => onViewAnalytics(campaign.id)}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Analytics
                        </button>
                        <button
                          onClick={() => handleResend(campaign.id)}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Resend
                        </button>
                      </>
                    )}
                    {campaign.status === 'failed' && (
                      <button
                        onClick={() => handleResend(campaign.id)}
                        className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/20 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </button>
                    )}
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => onEditCampaign(campaign.id)}
                        className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-3 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      disabled={deletingId === campaign.id}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {deletingId === campaign.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterPage;
