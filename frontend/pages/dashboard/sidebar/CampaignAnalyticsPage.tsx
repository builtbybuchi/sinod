import React, { useState, useEffect, useCallback } from 'react';
import * as campaignApi from '../../../services/campaignApiService';
import type { Campaign, CampaignAnalytics, CampaignRecipient, RecipientStatus } from '../../../services/campaignApiService';

interface CampaignAnalyticsPageProps {
  campaignId: string;
  onBack: () => void;
}

const CampaignAnalyticsPage: React.FC<CampaignAnalyticsPageProps> = ({
  campaignId,
  onBack,
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientFilter, setRecipientFilter] = useState<RecipientStatus | ''>('');
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [campaignData, analyticsData] = await Promise.all([
        campaignApi.getCampaign(campaignId),
        campaignApi.getCampaignAnalytics(campaignId),
      ]);
      setCampaign(campaignData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const fetchRecipients = useCallback(async () => {
    try {
      setRecipientsLoading(true);
      const data = await campaignApi.getCampaignRecipients(
        campaignId,
        recipientFilter || undefined,
        100,
        0
      );
      setRecipients(data);
    } catch (err) {
      console.error('Error fetching recipients:', err);
    } finally {
      setRecipientsLoading(false);
    }
  }, [campaignId, recipientFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      fetchRecipients();
    }
  }, [fetchRecipients, loading]);

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: RecipientStatus) => {
    const colors: Record<RecipientStatus, string> = {
      pending: 'text-gray-400 bg-gray-500/10',
      sent: 'text-blue-400 bg-blue-500/10',
      delivered: 'text-green-400 bg-green-500/10',
      opened: 'text-purple-400 bg-purple-500/10',
      clicked: 'text-sky-400 bg-sky-500/10',
      bounced: 'text-red-400 bg-red-500/10',
      unsubscribed: 'text-yellow-400 bg-yellow-500/10',
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{campaign?.title || 'Campaign Analytics'}</h1>
            <p className="text-sm text-gray-400 mt-1">
              Subject: {campaign?.subject} • Sent {formatDate(campaign?.sent_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Sent */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Sent</span>
            </div>
            <div className="text-3xl font-bold text-white">{analytics?.sent_count || 0}</div>
            <div className="text-xs text-gray-500 mt-1">of {analytics?.total_recipients || 0} recipients</div>
          </div>

          {/* Opens */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Open Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatPercent(analytics?.open_rate)}</div>
            <div className="text-xs text-gray-500 mt-1">{analytics?.unique_opens || 0} unique opens</div>
          </div>

          {/* Clicks */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Click Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatPercent(analytics?.click_rate)}</div>
            <div className="text-xs text-gray-500 mt-1">{analytics?.unique_clicks || 0} unique clicks</div>
          </div>

          {/* Bounced */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Bounce Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatPercent(analytics?.bounce_rate)}</div>
            <div className="text-xs text-gray-500 mt-1">{analytics?.bounced_count || 0} bounced</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Opens</p>
                <p className="text-2xl font-bold text-white">{analytics?.opened_count || 0}</p>
              </div>
              <div className="text-xs text-gray-500">
                Avg {((analytics?.opened_count || 0) / Math.max(analytics?.unique_opens || 1, 1)).toFixed(1)} per user
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Clicks</p>
                <p className="text-2xl font-bold text-white">{analytics?.clicked_count || 0}</p>
              </div>
              <div className="text-xs text-gray-500">
                Avg {((analytics?.clicked_count || 0) / Math.max(analytics?.unique_clicks || 1, 1)).toFixed(1)} per user
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unsubscribes</p>
                <p className="text-2xl font-bold text-white">{analytics?.unsubscribed_count || 0}</p>
              </div>
              <div className="text-xs text-gray-500">
                {formatPercent(((analytics?.unsubscribed_count || 0) / Math.max(analytics?.sent_count || 1, 1)) * 100)} rate
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recipients</h3>
            <div className="flex items-center gap-3">
              <select
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value as RecipientStatus | '')}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="bounced">Bounced</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
          </div>

          {recipientsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recipients.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No recipients found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Sent</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Opened</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recipients.map((recipient) => (
                    <tr key={recipient.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm text-white">{recipient.name || 'No name'}</p>
                          <p className="text-xs text-gray-500">{recipient.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(recipient.status)}`}>
                          {recipient.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {recipient.sent_at ? formatDate(recipient.sent_at) : '-'}
                      </td>
                      <td className="px-5 py-3">
                        {recipient.opened_at ? (
                          <div>
                            <p className="text-sm text-white">{recipient.open_count}x</p>
                            <p className="text-xs text-gray-500">{formatDate(recipient.opened_at)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {recipient.clicked_at ? (
                          <div>
                            <p className="text-sm text-white">{recipient.click_count}x</p>
                            <p className="text-xs text-gray-500">{formatDate(recipient.clicked_at)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalyticsPage;
