/**
 * Campaign/Newsletter API Service - Frontend
 * Handles all newsletter campaign operations through Python backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Enums
export type SubscriberSource = 'manual' | 'csv' | 'event' | 'team';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type SendType = 'immediate' | 'scheduled';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

// Mailing List
export interface MailingList {
  id: string;
  owner_email: string;
  name: string;
  description: string;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMailingListData {
  name: string;
  description?: string;
}

export interface UpdateMailingListData {
  name?: string;
  description?: string;
}

// Subscriber
export interface Subscriber {
  id: string;
  list_id: string;
  email: string;
  name: string;
  subscribed: boolean;
  source: SubscriberSource;
  event_id?: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  unsubscribe_reason?: string;
}

export interface CreateSubscriberData {
  email: string;
  name?: string;
  subscribed?: boolean;
  source?: SubscriberSource;
  event_id?: string;
}

export interface BulkSubscribersData {
  subscribers: CreateSubscriberData[];
}

export interface CSVImportResult {
  total_rows: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
}

// Campaign
export interface Campaign {
  id: string;
  owner_email: string;
  title: string;
  subject: string;
  sender_name: string;
  sender_logo_url?: string;
  reply_to_email?: string;
  content_html: string;
  content_json?: string;
  status: CampaignStatus;
  recipient_list_ids: string[];
  recipient_event_ids: string[];
  recipient_filter: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  title: string;
  subject: string;
  sender_name: string;
  sender_logo_url?: string;
  reply_to_email?: string;
  content_html: string;
  content_json?: string;
  recipient_list_ids?: string[];
  recipient_event_ids?: string[];
  recipient_filter?: string;
  scheduled_at?: string;
}

export interface UpdateCampaignData {
  title?: string;
  subject?: string;
  sender_name?: string;
  sender_logo_url?: string;
  reply_to_email?: string;
  content_html?: string;
  content_json?: string;
  recipient_list_ids?: string[];
  recipient_event_ids?: string[];
  recipient_filter?: string;
  scheduled_at?: string;
  status?: CampaignStatus;
}

export interface SendCampaignRequest {
  scheduled_at?: string; // If set, schedule; otherwise send immediately
}

export interface SendCampaignResponse {
  campaign_id: string;
  status: CampaignStatus;
  total_recipients: number;
  message: string;
}

// Recipient
export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  email: string;
  name: string;
  status: RecipientStatus;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  open_count: number;
  clicked_at?: string;
  click_count: number;
  bounced_at?: string;
  bounce_reason?: string;
  unsubscribed_at?: string;
}

// Analytics
export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  unique_opens: number;
  clicked_count: number;
  unique_clicks: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  last_updated: string;
}

// Audience
export interface EventAudienceFilter {
  event_ids: string[];
  include_registered?: boolean;
  include_approved?: boolean;
  include_verified?: boolean;
}

export interface AudienceSelection {
  list_ids?: string[];
  manual_emails?: CreateSubscriberData[];
  event_filter?: EventAudienceFilter;
  include_team?: boolean;
}

export interface AudiencePreview {
  total_count: number;
  from_lists: number;
  from_events: number;
  from_manual: number;
  from_team: number;
  duplicate_removed: number;
  emails_preview: string[];
}

// Template
export interface CampaignTemplate {
  id: string;
  owner_email: string;
  name: string;
  description: string;
  content_json: string;
  content_html?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  content_json: string;
  content_html?: string;
  is_public?: boolean;
}

// Unsubscribe
export interface UnsubscribeRequest {
  reason?: string;
  details?: string;
}

// ============================================================================
// MAILING LIST API
// ============================================================================

/**
 * Get all mailing lists for a user
 */
export async function getMailingLists(ownerEmail: string): Promise<MailingList[]> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists?owner_email=${encodeURIComponent(ownerEmail)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to fetch mailing lists');
  }

  return response.json();
}

/**
 * Create a new mailing list
 */
export async function createMailingList(
  ownerEmail: string,
  data: CreateMailingListData
): Promise<MailingList> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists?owner_email=${encodeURIComponent(ownerEmail)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to create mailing list');
  }

  return response.json();
}

/**
 * Get a single mailing list
 */
export async function getMailingList(listId: string): Promise<MailingList> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch mailing list');
  }

  return response.json();
}

/**
 * Update a mailing list
 */
export async function updateMailingList(
  listId: string,
  data: UpdateMailingListData
): Promise<MailingList> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to update mailing list');
  }

  return response.json();
}

/**
 * Delete a mailing list
 */
export async function deleteMailingList(listId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete mailing list');
  }
}

// ============================================================================
// SUBSCRIBER API
// ============================================================================

/**
 * Get subscribers for a mailing list
 */
export async function getListSubscribers(
  listId: string,
  subscribedOnly: boolean = true,
  limit: number = 100,
  offset: number = 0
): Promise<Subscriber[]> {
  const params = new URLSearchParams({
    subscribed_only: subscribedOnly.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/subscribers?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch subscribers');
  }

  return response.json();
}

/**
 * Add a single subscriber to a mailing list
 */
export async function addSubscriber(
  listId: string,
  data: CreateSubscriberData
): Promise<Subscriber> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/subscribers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to add subscriber');
  }

  return response.json();
}

/**
 * Add multiple subscribers in bulk
 */
export async function addSubscribersBulk(
  listId: string,
  data: BulkSubscribersData
): Promise<{ success: boolean; added: number; duplicates: number; errors: string[] }> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/subscribers/bulk`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add subscribers');
  }

  return response.json();
}

/**
 * Import subscribers from CSV
 * @param listId - Mailing list ID
 * @param csvContent - Base64 encoded CSV content
 */
export async function importCSVSubscribers(
  listId: string,
  csvContent: string
): Promise<CSVImportResult> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/import-csv`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv_content: csvContent,
        list_id: listId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to import CSV');
  }

  return response.json();
}

/**
 * Import subscribers from events
 */
export async function importFromEvents(
  listId: string,
  eventFilter: EventAudienceFilter
): Promise<{ success: boolean; added: number; duplicates: number }> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/import-from-events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventFilter),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to import from events');
  }

  return response.json();
}

/**
 * Remove a subscriber from a mailing list
 */
export async function removeSubscriber(listId: string, subscriberId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/mailing-lists/${listId}/subscribers/${subscriberId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to remove subscriber');
  }
}

// ============================================================================
// CAMPAIGN API
// ============================================================================

/**
 * Get all campaigns for a user
 */
export async function getCampaigns(
  ownerEmail: string,
  status?: CampaignStatus
): Promise<Campaign[]> {
  const params = new URLSearchParams({
    owner_email: ownerEmail,
  });
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch campaigns');
  }

  return response.json();
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  ownerEmail: string,
  data: CreateCampaignData
): Promise<Campaign> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/?owner_email=${encodeURIComponent(ownerEmail)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to create campaign');
  }

  return response.json();
}

/**
 * Get a single campaign
 */
export async function getCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch campaign');
  }

  return response.json();
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  campaignId: string,
  data: UpdateCampaignData
): Promise<Campaign> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to update campaign');
  }

  return response.json();
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete campaign');
  }
}

/**
 * Duplicate a campaign as a new draft (for resending)
 */
export async function duplicateCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}/duplicate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to duplicate campaign');
  }

  return response.json();
}

/**
 * Preview audience for a campaign
 */
export async function previewAudience(
  campaignId: string,
  audience: AudienceSelection
): Promise<AudiencePreview> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}/preview-audience`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audience),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to preview audience');
  }

  return response.json();
}

/**
 * Send a campaign
 * @param acknowledged - User has acknowledged spam warning
 */
export async function sendCampaign(
  campaignId: string,
  sendRequest: SendCampaignRequest,
  acknowledged: boolean = true
): Promise<SendCampaignResponse> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}/send?acknowledged=${acknowledged}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendRequest),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to send campaign');
  }

  return response.json();
}

// ============================================================================
// ANALYTICS API
// ============================================================================

/**
 * Get analytics for a campaign
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}/analytics`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}

/**
 * Get recipients for a campaign
 */
export async function getCampaignRecipients(
  campaignId: string,
  status?: RecipientStatus,
  limit: number = 100,
  offset: number = 0
): Promise<CampaignRecipient[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/${campaignId}/recipients?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recipients');
  }

  return response.json();
}

// ============================================================================
// TEMPLATE API
// ============================================================================

/**
 * Get email templates
 */
export async function getTemplates(
  ownerEmail: string,
  includePublic: boolean = true
): Promise<CampaignTemplate[]> {
  const params = new URLSearchParams({
    owner_email: ownerEmail,
    include_public: includePublic.toString(),
  });

  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/templates?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

/**
 * Create a new template
 */
export async function createTemplate(
  ownerEmail: string,
  data: CreateTemplateData
): Promise<CampaignTemplate> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/templates?owner_email=${encodeURIComponent(ownerEmail)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to create template');
  }

  return response.json();
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/templates/${templateId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete template');
  }
}

// ============================================================================
// UNSUBSCRIBE API (for public unsubscribe page)
// ============================================================================

/**
 * Process unsubscribe request
 */
export async function processUnsubscribe(
  campaignId: string,
  listId: string,
  recipientHash: string,
  data: UnsubscribeRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${BACKEND_URL}/api/campaigns/unsubscribe/${campaignId}/${listId}/${recipientHash}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to process unsubscribe');
  }

  return response.json();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format date for display
 */
export function formatCampaignDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color
 */
export function getStatusColor(status: CampaignStatus): string {
  const colors: Record<CampaignStatus, string> = {
    draft: 'bg-gray-500/10 text-gray-400',
    scheduled: 'bg-blue-500/10 text-blue-400',
    sending: 'bg-yellow-500/10 text-yellow-400',
    sent: 'bg-green-500/10 text-green-400',
    failed: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-gray-500/10 text-gray-400',
  };
  return colors[status] || colors.draft;
}
