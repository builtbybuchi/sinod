import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as campaignApi from '../../../services/campaignApiService';
import type { Campaign, MailingList, SendType } from '../../../services/campaignApiService';

interface CampaignEditorPageProps {
  campaignId?: string | null;
  onBack: () => void;
  onSent?: () => void;
}

// Email block types for drag-and-drop
type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'social';

interface SocialLink {
  platform: string;
  url: string;
}

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: Record<string, string>;
  socialLinks?: SocialLink[];
}

// Social platform definitions with SVG icons for email HTML
const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'F' },
  { key: 'twitter', label: 'X (Twitter)', color: '#000000', icon: '𝕏' },
  { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'IG' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: 'in' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: '▶' },
  { key: 'tiktok', label: 'TikTok', color: '#000000', icon: '♪' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: 'WA' },
  { key: 'telegram', label: 'Telegram', color: '#26A5E4', icon: 'TG' },
  { key: 'pinterest', label: 'Pinterest', color: '#BD081C', icon: 'P' },
  { key: 'snapchat', label: 'Snapchat', color: '#FFFC00', icon: '👻' },
  { key: 'threads', label: 'Threads', color: '#000000', icon: '@' },
  { key: 'website', label: 'Website', color: '#4A90D9', icon: '🌐' },
] as const;

const CampaignEditorPage: React.FC<CampaignEditorPageProps> = ({
  campaignId,
  onBack,
  onSent,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(!!campaignId);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Campaign data
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderLogoUrl, setSenderLogoUrl] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  // Email styling
  const [emailBgColor, setEmailBgColor] = useState('#f5f5f5');
  const [contentBgColor, setContentBgColor] = useState('#ffffff');

  // Email content
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    { id: '1', type: 'heading', content: 'Your Newsletter Title', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333' } },
    { id: '2', type: 'text', content: 'Write your newsletter content here. Click on any block to edit it.', styles: { fontSize: '16px', color: '#666666' } },
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Lists
  const [mailingLists, setMailingLists] = useState<MailingList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  // Send modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendType, setSendType] = useState<SendType>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [spamAcknowledged, setSpamAcknowledged] = useState(false);

  // Mobile view toggle
  const [mobileView, setMobileView] = useState<'editor' | 'preview' | 'settings'>('editor');

  // Fetch campaign if editing
  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      const campaign = await campaignApi.getCampaign(campaignId);
      setTitle(campaign.title);
      setSubject(campaign.subject);
      setSenderName(campaign.sender_name);
      setSenderLogoUrl(campaign.sender_logo_url || '');
      setReplyToEmail(campaign.reply_to_email || '');
      setSelectedLists(campaign.recipient_list_ids);
      
      // Parse content_json if available
      if (campaign.content_json) {
        try {
          const parsed = JSON.parse(campaign.content_json);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            setBlocks(parsed.blocks);
            if (parsed.emailBgColor) setEmailBgColor(parsed.emailBgColor);
            if (parsed.contentBgColor) setContentBgColor(parsed.contentBgColor);
          } else if (Array.isArray(parsed)) {
            setBlocks(parsed);
          }
        } catch {
          // If JSON parsing fails, keep default blocks
        }
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Fetch mailing lists
  const fetchLists = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setListsLoading(true);
      const lists = await campaignApi.getMailingLists(currentUser.email);
      setMailingLists(lists);
    } catch (err) {
      console.error('Error fetching lists:', err);
    } finally {
      setListsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchCampaign();
    fetchLists();
  }, [fetchCampaign, fetchLists]);

  // Check for pre-filled follow-up data from event analytics
  useEffect(() => {
    if (campaignId) return; // Only for new campaigns
    const raw = localStorage.getItem('campaign:followup');
    if (raw) {
      try {
        const followup = JSON.parse(raw);
        if (followup.title) setTitle(followup.title);
        if (followup.subject) setSubject(followup.subject);
        if (followup.eventName) {
          setBlocks([
            { id: '1', type: 'heading', content: `Thank you for attending ${followup.eventName}!`, styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333' } },
            { id: '2', type: 'text', content: `We truly appreciate your participation in ${followup.eventName}. Your presence made the event special, and we hope you found it valuable.`, styles: { fontSize: '16px', color: '#666666' } },
            { id: '3', type: 'text', content: 'We would love to hear your feedback. Please reply to this email with any thoughts or suggestions.', styles: { fontSize: '16px', color: '#666666' } },
          ]);
        }
      } catch {
        // ignore parse errors
      } finally {
        localStorage.removeItem('campaign:followup');
      }
    }
  }, [campaignId]);

  // Generate HTML from blocks
  const generateHTML = useCallback(() => {
    const bodyContent = blocks.map((block) => {
      const align = block.styles.textAlign || 'left';
      switch (block.type) {
        case 'heading':
          return `<h1 style="margin: 0 0 16px 0; font-size: ${block.styles.fontSize || '28px'}; font-weight: ${block.styles.fontWeight || 'bold'}; color: ${block.styles.color || '#333333'}; text-align: ${align};">${block.content}</h1>`;
        case 'text':
          return `<p style="margin: 0 0 16px 0; font-size: ${block.styles.fontSize || '16px'}; color: ${block.styles.color || '#666666'}; line-height: 1.6; text-align: ${align};">${block.content}</p>`;
        case 'image': {
          const imgAlign = align === 'center' ? 'margin: 0 auto 16px auto;' 
                         : align === 'right' ? 'margin: 0 0 16px auto;' 
                         : 'margin: 0 16px 16px 0;';
          return block.content 
            ? `<div style="text-align: ${align};"><img src="${block.content}" style="max-width: 100%; height: auto; display: ${align === 'center' ? 'block' : 'inline-block'}; ${imgAlign} border-radius: 8px;" /></div>`
            : '';
        }
        case 'button':
          return `<div style="text-align: ${align}; margin: 24px 0;"><a href="${block.styles.href || '#'}" style="display: inline-block; padding: 14px 28px; background: ${block.styles.background || '#0ea5e9'}; color: ${block.styles.color || '#ffffff'}; text-decoration: none; border-radius: 8px; font-weight: 600;">${block.content}</a></div>`;
        case 'divider':
          return `<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />`;
        case 'spacer':
          return `<div style="height: ${block.styles.height || '24px'};"></div>`;
        case 'social': {
          const links = block.socialLinks || [];
          const iconSize = block.styles.iconSize || '36px';
          const socialHtml = links
            .filter(l => l.url.trim())
            .map(l => {
              const plat = SOCIAL_PLATFORMS.find(p => p.key === l.platform);
              if (!plat) return '';
              return `<a href="${l.url}" style="display: inline-block; width: ${iconSize}; height: ${iconSize}; line-height: ${iconSize}; background: ${plat.color}; color: #ffffff; text-align: center; text-decoration: none; border-radius: 50%; font-size: 14px; font-weight: bold; margin: 0 4px;" title="${plat.label}">${plat.icon}</a>`;
            })
            .join('');
          return socialHtml 
            ? `<div style="text-align: ${align}; margin: 24px 0;">${socialHtml}</div>` 
            : '';
        }
        default:
          return '';
      }
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${emailBgColor};">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: ${contentBgColor}; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      ${bodyContent}
    </div>
  </div>
</body>
</html>`;
  }, [blocks, emailBgColor, contentBgColor]);

  // Save campaign - returns the campaign ID
  const handleSave = async (silent = false): Promise<string | null> => {
    if (!currentUser?.email || !title.trim() || !subject.trim() || !senderName.trim()) {
      alert('Please fill in all required fields');
      return null;
    }

    try {
      setSaving(true);
      const html = generateHTML();
      const contentJson = JSON.stringify({ blocks, emailBgColor, contentBgColor });

      if (campaignId) {
        await campaignApi.updateCampaign(campaignId, {
          title: title.trim(),
          subject: subject.trim(),
          sender_name: senderName.trim(),
          sender_logo_url: senderLogoUrl.trim() || undefined,
          reply_to_email: replyToEmail.trim() || undefined,
          content_html: html,
          content_json: contentJson,
          recipient_list_ids: selectedLists,
        });
        if (!silent) alert('Campaign saved!');
        return campaignId;
      } else {
        const created = await campaignApi.createCampaign(currentUser.email, {
          title: title.trim(),
          subject: subject.trim(),
          sender_name: senderName.trim(),
          sender_logo_url: senderLogoUrl.trim() || undefined,
          reply_to_email: replyToEmail.trim() || undefined,
          content_html: html,
          content_json: contentJson,
          recipient_list_ids: selectedLists,
        });
        if (!silent) alert('Campaign saved!');
        return (created as any).$id || created.id || null;
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      alert('Failed to save campaign');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Send campaign
  const handleSend = async () => {
    if (selectedLists.length === 0) {
      alert('Please select at least one mailing list');
      return;
    }

    if (!spamAcknowledged) {
      alert('You must acknowledge the spam warning');
      return;
    }

    try {
      setSending(true);

      // Always save first (auto-creates if new campaign)
      const savedId = await handleSave(true);
      if (!savedId) {
        // handleSave already showed an error
        setSending(false);
        return;
      }

      // Build scheduled datetime if needed
      let scheduledAt: string | undefined;
      if (sendType === 'scheduled') {
        if (!scheduledDate || !scheduledTime) {
          alert('Please select a date and time for scheduling');
          setSending(false);
          return;
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      await campaignApi.sendCampaign(savedId, { scheduled_at: scheduledAt }, true);
      
      setShowSendModal(false);
      alert(sendType === 'scheduled' ? 'Campaign scheduled!' : 'Campaign is being sent!');
      onSent?.();
    } catch (err: any) {
      console.error('Error sending campaign:', err);
      alert(err.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  // Block operations
  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'New Heading' 
             : type === 'text' ? 'Your text here...'
             : type === 'button' ? 'Click Here'
             : type === 'social' ? ''
             : '',
      styles: type === 'heading' ? { fontSize: '24px', fontWeight: 'bold', color: '#333333', textAlign: 'left' }
            : type === 'text' ? { fontSize: '16px', color: '#666666', textAlign: 'left' }
            : type === 'button' ? { background: '#0ea5e9', color: '#ffffff', href: '#', textAlign: 'center' }
            : type === 'image' ? { textAlign: 'center' }
            : type === 'spacer' ? { height: '24px' }
            : type === 'social' ? { textAlign: 'center', iconSize: '36px' }
            : {},
      ...(type === 'social' ? { socialLinks: [{ platform: 'facebook', url: '' }, { platform: 'twitter', url: '' }, { platform: 'instagram', url: '' }] } : {}),
    };

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks(blocks.map((b) => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex((b) => b.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const selectedBlock = selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Block item icons
  const blockIcons: Record<BlockType, React.ReactNode> = {
    heading: <span className="text-lg font-bold">H</span>,
    text: <span className="text-sm">T</span>,
    image: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    button: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="2" strokeWidth="2" /></svg>,
    divider: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M4 12h16" /></svg>,
    spacer: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>,
    social: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Campaign Title"
              className="flex-1 min-w-0 text-base md:text-lg font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden mt-3 gap-1 bg-white/5 rounded-xl p-1">
          {[
            { key: 'editor', label: 'Editor' },
            { key: 'preview', label: 'Preview' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileView(tab.key as any)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                mobileView === tab.key
                  ? 'bg-sky-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block Palette - Desktop only or mobile editor view */}
        <div className={`${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex w-full md:w-56 lg:w-64 flex-shrink-0 flex-col border-r border-white/10 overflow-hidden`}>
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Add Blocks</h3>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
              {([
                { type: 'heading' as BlockType, label: 'Heading' },
                { type: 'text' as BlockType, label: 'Text' },
                { type: 'image' as BlockType, label: 'Image' },
                { type: 'button' as BlockType, label: 'Button' },
                { type: 'divider' as BlockType, label: 'Divider' },
                { type: 'spacer' as BlockType, label: 'Spacer' },
                { type: 'social' as BlockType, label: 'Social' },
              ]).map((item) => (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-sky-500/30 transition-all active:scale-95"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-300">
                    {blockIcons[item.type]}
                  </span>
                  <span className="text-[10px] text-gray-400">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Blocks list */}
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-4 mb-2">Your Blocks</h3>
            <div className="space-y-1.5">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedBlockId === block.id
                      ? 'bg-sky-500/20 border border-sky-500/40'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-gray-400 text-xs">
                    {blockIcons[block.type]}
                  </span>
                  <span className="flex-1 text-xs text-gray-300 truncate">
                    {block.type === 'divider' ? 'Divider' : block.type === 'spacer' ? 'Spacer' : block.type === 'social' ? 'Social Links' : block.content.slice(0, 20) || block.type}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                      disabled={index === 0}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                      disabled={index === blocks.length - 1}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Block Properties (when selected) */}
            {selectedBlock && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Block Properties</h3>
                <div className="space-y-3">
                  {/* Alignment */}
                  {['heading', 'text', 'image', 'button', 'social'].includes(selectedBlock.type) && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Alignment</label>
                      <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                        {[
                          { value: 'left', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M3 6h18M3 12h10M3 18h14" /></svg> },
                          { value: 'center', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M3 6h18M7 12h10M5 18h14" /></svg> },
                          { value: 'right', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M3 6h18M11 12h10M7 18h14" /></svg> },
                          { value: 'justify', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M3 6h18M3 12h18M3 18h18" /></svg> },
                        ].map((a) => (
                          <button
                            key={a.value}
                            onClick={() => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, textAlign: a.value } })}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${
                              (selectedBlock.styles.textAlign || 'left') === a.value
                                ? 'bg-sky-500/20 text-sky-400'
                                : 'text-gray-500 hover:text-white hover:bg-white/10'
                            }`}
                            title={a.value.charAt(0).toUpperCase() + a.value.slice(1)}
                          >
                            {a.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  {['heading', 'text', 'button'].includes(selectedBlock.type) && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Content</label>
                      <textarea
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 resize-none"
                      />
                    </div>
                  )}

                  {/* Image URL */}
                  {selectedBlock.type === 'image' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      />
                    </div>
                  )}

                  {/* Button href */}
                  {selectedBlock.type === 'button' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Button Link</label>
                      <input
                        type="url"
                        value={selectedBlock.styles.href || ''}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, href: e.target.value } })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      />
                    </div>
                  )}

                  {/* Font size */}
                  {['heading', 'text'].includes(selectedBlock.type) && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                      <select
                        value={selectedBlock.styles.fontSize || '16px'}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, fontSize: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      >
                        {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'].map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color */}
                  {['heading', 'text', 'button'].includes(selectedBlock.type) && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                      <div className="flex gap-2 items-center">
                        <div className="relative">
                          <input
                            type="color"
                            value={selectedBlock.styles.color || '#333333'}
                            onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, color: e.target.value } })}
                            className="w-12 h-10 rounded-lg cursor-pointer border-2 border-white/20 shadow-lg"
                            style={{ backgroundColor: selectedBlock.styles.color || '#333333' }}
                          />
                          <div 
                            className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-white/10"
                            style={{ backgroundColor: selectedBlock.styles.color || '#333333' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedBlock.styles.color || '#333333'}
                          onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, color: e.target.value } })}
                          className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Button background */}
                  {selectedBlock.type === 'button' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Button Color</label>
                      <div className="flex gap-2 items-center">
                        <div className="relative">
                          <input
                            type="color"
                            value={selectedBlock.styles.background || '#0ea5e9'}
                            onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, background: e.target.value } })}
                            className="w-12 h-10 rounded-lg cursor-pointer border-2 border-white/20 shadow-lg"
                            style={{ backgroundColor: selectedBlock.styles.background || '#0ea5e9' }}
                          />
                          <div 
                            className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-white/10"
                            style={{ backgroundColor: selectedBlock.styles.background || '#0ea5e9' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedBlock.styles.background || '#0ea5e9'}
                          onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, background: e.target.value } })}
                          className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Spacer height */}
                  {selectedBlock.type === 'spacer' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <select
                        value={selectedBlock.styles.height || '24px'}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, height: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      >
                        {['8px', '16px', '24px', '32px', '48px', '64px'].map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Social Links */}
                  {selectedBlock.type === 'social' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Icon Size</label>
                      <select
                        value={selectedBlock.styles.iconSize || '36px'}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, iconSize: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50 mb-3"
                      >
                        {['28px', '32px', '36px', '40px', '48px'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <label className="block text-xs text-gray-500 mb-2">Social Links</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(selectedBlock.socialLinks || []).map((link, i) => (
                          <div key={i} className="flex gap-1.5 items-center">
                            <select
                              value={link.platform}
                              onChange={(e) => {
                                const newLinks = [...(selectedBlock.socialLinks || [])];
                                newLinks[i] = { ...newLinks[i], platform: e.target.value };
                                updateBlock(selectedBlock.id, { socialLinks: newLinks });
                              }}
                              className="w-24 flex-shrink-0 px-2 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                            >
                              {SOCIAL_PLATFORMS.map((p) => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                              ))}
                            </select>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...(selectedBlock.socialLinks || [])];
                                newLinks[i] = { ...newLinks[i], url: e.target.value };
                                updateBlock(selectedBlock.id, { socialLinks: newLinks });
                              }}
                              placeholder="https://..."
                              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                            />
                            <button
                              onClick={() => {
                                const newLinks = (selectedBlock.socialLinks || []).filter((_, idx) => idx !== i);
                                updateBlock(selectedBlock.id, { socialLinks: newLinks });
                              }}
                              className="w-6 h-6 flex-shrink-0 rounded flex items-center justify-center text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const newLinks = [...(selectedBlock.socialLinks || []), { platform: 'facebook', url: '' }];
                          updateBlock(selectedBlock.id, { socialLinks: newLinks });
                        }}
                        className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-white/20 text-xs text-gray-400 hover:border-sky-500/40 hover:text-sky-400 transition-all"
                      >
                        + Add Platform
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save button - mobile only */}
          <div className="flex-shrink-0 p-3 border-t border-white/10 sm:hidden">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>

        {/* Center: Email Preview */}
        <div className={`${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
          <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{ backgroundColor: emailBgColor }}>
            <div 
              className="max-w-[600px] mx-auto rounded-xl shadow-lg overflow-hidden"
              style={{ backgroundColor: contentBgColor }}
            >
              <div className="p-6 md:p-8">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="mb-2">No blocks yet</p>
                    <p className="text-sm">Add blocks from the left panel</p>
                  </div>
                ) : (
                  blocks.map((block, index) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative cursor-pointer transition-all group ${
                        selectedBlockId === block.id ? 'ring-2 ring-sky-500 ring-offset-2 rounded' : 'hover:ring-1 hover:ring-sky-300/50 hover:ring-offset-1 rounded'
                      }`}
                      style={{ ringOffsetColor: contentBgColor } as any}
                    >
                      {/* Block Content */}
                      {block.type === 'heading' && (
                        <h1 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => setSelectedBlockId(block.id)}
                          style={{ 
                            fontSize: block.styles.fontSize, 
                            fontWeight: block.styles.fontWeight as any,
                            color: block.styles.color,
                            textAlign: (block.styles.textAlign as any) || 'left',
                            margin: '0 0 16px 0',
                            outline: 'none',
                            cursor: 'text',
                          }}
                        >
                          {block.content}
                        </h1>
                      )}
                      {block.type === 'text' && (
                        <p 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => setSelectedBlockId(block.id)}
                          style={{
                            fontSize: block.styles.fontSize,
                            color: block.styles.color,
                            textAlign: (block.styles.textAlign as any) || 'left',
                            margin: '0 0 16px 0',
                            lineHeight: 1.6,
                            outline: 'none',
                            cursor: 'text',
                          }}
                        >
                          {block.content}
                        </p>
                      )}
                      {block.type === 'image' && (
                        <div className="mb-4" style={{ textAlign: (block.styles.textAlign as any) || 'center' }}>
                          {block.content ? (
                            <img src={block.content} alt="" className="max-w-full h-auto rounded-lg" style={{ display: block.styles.textAlign === 'center' ? 'block' : 'inline-block', margin: block.styles.textAlign === 'center' ? '0 auto' : block.styles.textAlign === 'right' ? '0 0 0 auto' : '0' }} />
                          ) : (
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                              Click to add image URL in properties
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === 'button' && (
                        <div className="my-6" style={{ textAlign: (block.styles.textAlign as any) || 'center' }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={() => setSelectedBlockId(block.id)}
                            style={{
                              display: 'inline-block',
                              padding: '14px 28px',
                              background: block.styles.background,
                              color: block.styles.color,
                              borderRadius: '8px',
                              fontWeight: 600,
                              outline: 'none',
                              cursor: 'text',
                            }}
                          >
                            {block.content}
                          </span>
                        </div>
                      )}
                      {block.type === 'divider' && (
                        <hr className="border-t border-gray-200 my-6" />
                      )}
                      {block.type === 'spacer' && (
                        <div style={{ height: block.styles.height }} className="bg-gray-50/30 border border-dashed border-gray-200 rounded group-hover:border-sky-300" />
                      )}
                      {block.type === 'social' && (
                        <div className="my-6" style={{ textAlign: (block.styles.textAlign as any) || 'center' }}>
                          {(block.socialLinks || []).filter(l => l.url.trim()).length > 0 ? (
                            (block.socialLinks || []).filter(l => l.url.trim()).map((link, i) => {
                              const plat = SOCIAL_PLATFORMS.find(p => p.key === link.platform);
                              if (!plat) return null;
                              return (
                                <span
                                  key={i}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: block.styles.iconSize || '36px',
                                    height: block.styles.iconSize || '36px',
                                    background: plat.color,
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    margin: '0 4px',
                                  }}
                                  title={plat.label}
                                >
                                  {plat.icon}
                                </span>
                              );
                            })
                          ) : (
                            <div className="py-4 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                              Add social links in properties
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings - Desktop only or mobile settings view */}
        <div className={`${mobileView === 'settings' ? 'flex' : 'hidden'} md:flex w-full md:w-56 lg:w-64 flex-shrink-0 flex-col border-l border-white/10 overflow-hidden`}>
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Email Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your Organization"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
              </div>

              {/* Sender Logo */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sender Avatar URL <span className="text-gray-600">(optional)</span></label>
                <input
                  type="url"
                  value={senderLogoUrl}
                  onChange={(e) => setSenderLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
                {senderLogoUrl && (
                  <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                    <img
                      src={senderLogoUrl}
                      alt="Avatar preview"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                    />
                    <button
                      onClick={() => setSenderLogoUrl('')}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-600">Avatar shown next to sender name in email apps like Gmail</p>
              </div>

              {/* Reply-to Email */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reply-to Email <span className="text-gray-600">(optional)</span></label>
                <input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="replies@yourteam.com"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
                <p className="mt-1 text-xs text-gray-600">Where replies go when recipients respond to this email</p>
              </div>

              {/* Background Colors */}
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Background Colors</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email Background</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={emailBgColor}
                          onChange={(e) => setEmailBgColor(e.target.value)}
                          className="w-12 h-10 rounded-lg cursor-pointer border-2 border-white/20 shadow-lg"
                          style={{ backgroundColor: emailBgColor }}
                        />
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-white/10"
                          style={{ backgroundColor: emailBgColor }}
                        />
                      </div>
                      <input
                        type="text"
                        value={emailBgColor}
                        onChange={(e) => setEmailBgColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Content Background</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={contentBgColor}
                          onChange={(e) => setContentBgColor(e.target.value)}
                          className="w-12 h-10 rounded-lg cursor-pointer border-2 border-white/20 shadow-lg"
                          style={{ backgroundColor: contentBgColor }}
                        />
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-white/10"
                          style={{ backgroundColor: contentBgColor }}
                        />
                      </div>
                      <input
                        type="text"
                        value={contentBgColor}
                        onChange={(e) => setContentBgColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mailing Lists */}
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Mailing Lists</h4>
                {listsLoading ? (
                  <p className="text-xs text-gray-600">Loading...</p>
                ) : mailingLists.length === 0 ? (
                  <p className="text-xs text-gray-600">No lists available</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mailingLists.map((list) => (
                      <label key={list.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={selectedLists.includes(list.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLists([...selectedLists, list.id]);
                            } else {
                              setSelectedLists(selectedLists.filter((id) => id !== list.id));
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500/50"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-300 truncate block">{list.name}</span>
                          <span className="text-xs text-gray-600">{list.subscriber_count} subscribers</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Send Campaign</h3>

            {/* Send Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">When to send?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSendType('immediate')}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    sendType === 'immediate'
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Send Now
                </button>
                <button
                  onClick={() => setSendType('scheduled')}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    sendType === 'scheduled'
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Schedule
                </button>
              </div>
            </div>

            {/* Schedule inputs */}
            {sendType === 'scheduled' && (
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Lists:</span>
                <span className="text-white">{selectedLists.length} selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total subscribers:</span>
                <span className="text-white">
                  {mailingLists.filter((l) => selectedLists.includes(l.id)).reduce((sum, l) => sum + l.subscriber_count, 0)}
                </span>
              </div>
            </div>

            {/* Spam Warning */}
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spamAcknowledged}
                  onChange={(e) => setSpamAcknowledged(e.target.checked)}
                  className="mt-1 rounded border-yellow-500/30 bg-yellow-500/10 text-yellow-500 focus:ring-yellow-500/50"
                />
                <span className="text-sm text-yellow-400">
                  I confirm that all recipients have agreed to receive emails from me. I understand my account may be banned if emails are flagged as spam.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!spamAcknowledged || sending}
                className="px-6 py-2 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-all disabled:opacity-50"
              >
                {sending ? 'Sending...' : sendType === 'scheduled' ? 'Schedule' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignEditorPage;
