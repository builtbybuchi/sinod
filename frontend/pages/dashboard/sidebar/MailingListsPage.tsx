import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as campaignApi from '../../../services/campaignApiService';
import { listUserEvents } from '../../../services/eventsApiService';
import type { Event } from '../../../services/eventsApiService';
import type { MailingList, Subscriber, CSVImportResult } from '../../../services/campaignApiService';

interface MailingListsPageProps {
  onBack: () => void;
}

const MailingListsPage: React.FC<MailingListsPageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState<MailingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  // Create list modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Add subscriber modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // CSV import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // Event import modal
  const [showEventImportModal, setShowEventImportModal] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [importingEvents, setImportingEvents] = useState(false);
  const [eventImportResult, setEventImportResult] = useState<{ added: number; duplicates: number } | null>(null);

  const fetchLists = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const result = await campaignApi.getMailingLists(currentUser.email);
      setLists(result);
    } catch (err) {
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  const fetchSubscribers = useCallback(async (listId: string) => {
    try {
      setSubscribersLoading(true);
      const result = await campaignApi.getListSubscribers(listId, false);
      setSubscribers(result);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setSubscribersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (selectedList) {
      fetchSubscribers(selectedList.id);
    }
  }, [selectedList, fetchSubscribers]);

  const handleCreateList = async () => {
    if (!currentUser?.email || !newListName.trim()) return;
    try {
      setCreating(true);
      await campaignApi.createMailingList(currentUser.email, {
        name: newListName.trim(),
        description: newListDesc.trim(),
      });
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
      fetchLists();
    } catch (err) {
      console.error('Error creating list:', err);
      alert('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Delete this list and all its subscribers?')) return;
    try {
      await campaignApi.deleteMailingList(listId);
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setSubscribers([]);
      }
      fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
      alert('Failed to delete list');
    }
  };

  const handleAddSubscriber = async () => {
    if (!selectedList || !newSubEmail.trim()) return;
    try {
      setAdding(true);
      setAddError(null);
      await campaignApi.addSubscriber(selectedList.id, {
        email: newSubEmail.trim().toLowerCase(),
        name: newSubName.trim(),
      });
      setNewSubEmail('');
      setNewSubName('');
      setShowAddModal(false);
      fetchSubscribers(selectedList.id);
      fetchLists(); // Update count
    } catch (err: any) {
      console.error('Error adding subscriber:', err);
      const message = err.message || 'Failed to add subscriber';
      // Show user-friendly message for duplicate
      if (message.toLowerCase().includes('already exists')) {
        setAddError('This email is already subscribed to this list.');
      } else {
        setAddError(message);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSubscriber = async (subscriberId: string) => {
    if (!selectedList) return;
    if (!confirm('Remove this subscriber?')) return;
    try {
      await campaignApi.removeSubscriber(selectedList.id, subscriberId);
      fetchSubscribers(selectedList.id);
      fetchLists(); // Update count
    } catch (err) {
      console.error('Error removing subscriber:', err);
    }
  };

  const handleCSVImport = async (file: File) => {
    if (!selectedList) return;
    try {
      setImporting(true);
      setImportResult(null);
      const base64 = await campaignApi.fileToBase64(file);
      const result = await campaignApi.importCSVSubscribers(selectedList.id, base64);
      setImportResult(result);
      fetchSubscribers(selectedList.id);
      fetchLists(); // Update count
    } catch (err: any) {
      console.error('Error importing CSV:', err);
      alert(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenEventImport = async () => {
    if (!currentUser?.email) return;
    setShowEventImportModal(true);
    setSelectedEventIds([]);
    setEventImportResult(null);
    try {
      setEventsLoading(true);
      const result = await listUserEvents(currentUser.email, 100);
      setUserEvents(result.documents || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleEventImport = async () => {
    if (!selectedList || selectedEventIds.length === 0) return;
    try {
      setImportingEvents(true);
      setEventImportResult(null);
      const result = await campaignApi.importFromEvents(selectedList.id, {
        event_ids: selectedEventIds,
        include_registered: true,
        include_approved: true,
        include_verified: true,
      });
      setEventImportResult(result);
      fetchSubscribers(selectedList.id);
      fetchLists();
    } catch (err: any) {
      console.error('Error importing from events:', err);
      alert(err.message || 'Failed to import from events');
    } finally {
      setImportingEvents(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Mailing Lists</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your subscriber lists</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 md:px-8 pb-6">
        <div className="flex gap-6 h-full">
          {/* Lists Column */}
          <div className="w-80 flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Your Lists</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New List
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No lists yet</p>
                </div>
              ) : (
                lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      selectedList?.id === list.id
                        ? 'border-sky-500/50 bg-sky-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white truncate">{list.name}</h3>
                        {list.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">{list.description}</p>
                        )}
                      </div>
                      <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                        {list.subscriber_count} sub{list.subscriber_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Subscribers Column */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {selectedList ? (
              <>
                {/* List Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedList.name}</h2>
                      <p className="text-sm text-gray-500">{selectedList.subscriber_count} subscribers</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenEventImport}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        From Events
                      </button>
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import CSV
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                      <button
                        onClick={() => handleDeleteList(selectedList.id)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subscribers List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {subscribersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">No subscribers yet</p>
                      <p className="text-xs text-gray-600 mt-1">Add subscribers or import from CSV</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subscribers.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                              {(sub.name || sub.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {sub.name || 'No name'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{sub.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              sub.subscribed
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {sub.subscribed ? 'Active' : 'Unsubscribed'}
                            </span>
                            <span className="text-xs text-gray-600 capitalize">{sub.source}</span>
                            <button
                              onClick={() => handleRemoveSubscriber(sub.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a list to view subscribers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create Mailing List</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Newsletter Subscribers"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description (optional)</label>
                <textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim() || creating}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-all disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Subscriber</h3>
            
            {/* Error Message */}
            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{addError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={newSubEmail}
                  onChange={(e) => { setNewSubEmail(e.target.value); setAddError(null); }}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Name (optional)</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setAddError(null); }}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscriber}
                disabled={!newSubEmail.trim() || adding}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-all disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Import from CSV</h3>
            
            {/* Instructions */}
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400 mb-2">Expected CSV format:</p>
              <p className="text-xs text-gray-400 font-mono">name,email,subscribed</p>
              <p className="text-xs text-gray-500 mt-2">
                • Headers are case-insensitive<br />
                • <strong>email</strong> is required<br />
                • <strong>subscribed</strong> defaults to TRUE if omitted
              </p>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl hover:border-sky-500/50 cursor-pointer transition-all">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-400">
                    {importing ? 'Importing...' : 'Click to upload CSV'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCSVImport(file);
                  }}
                />
              </label>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-2">Import Results</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total rows:</span>
                    <span className="text-white">{importResult.total_rows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Imported:</span>
                    <span className="text-green-400">{importResult.imported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duplicates:</span>
                    <span className="text-yellow-400">{importResult.duplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invalid:</span>
                    <span className="text-red-400">{importResult.invalid}</span>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-3 text-xs text-red-400">
                    {importResult.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Events Modal */}
      {showEventImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-slate-900 p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-1">Import from Events</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select events to import their attendees into <span className="text-sky-400">{selectedList?.name}</span>
            </p>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {eventsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">You haven't hosted any events yet</p>
                </div>
              ) : (
                userEvents.map((event) => (
                  <button
                    key={event.$id || event.event_page_url}
                    onClick={() => toggleEventSelection(event.event_page_url)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      selectedEventIds.includes(event.event_page_url)
                        ? 'border-sky-500/50 bg-sky-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedEventIds.includes(event.event_page_url)
                          ? 'border-sky-500 bg-sky-500'
                          : 'border-gray-600'
                      }`}>
                        {selectedEventIds.includes(event.event_page_url) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-white truncate">{event.event_name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.event_time).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Import Result */}
            {eventImportResult && (
              <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Added: </span>
                    <span className="text-green-400 font-medium">{eventImportResult.added}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duplicates skipped: </span>
                    <span className="text-yellow-400 font-medium">{eventImportResult.duplicates}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEventImportModal(false);
                  setEventImportResult(null);
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                {eventImportResult ? 'Done' : 'Cancel'}
              </button>
              {!eventImportResult && (
                <button
                  onClick={handleEventImport}
                  disabled={selectedEventIds.length === 0 || importingEvents}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-all disabled:opacity-50"
                >
                  {importingEvents ? 'Importing...' : `Import from ${selectedEventIds.length} event${selectedEventIds.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailingListsPage;
