/**
 * EventReminders Component
 * Displays and manages reminders for an event.
 * Can be used in CreateEventModal (setup mode) or EventAnalyticsModal (manage mode).
 */

import React, { useState, useEffect } from 'react';
import {
  Reminder,
  ReminderPreset,
  getReminderPresets,
  listEventReminders,
  createRemindersBulk,
  createReminder,
  deleteReminder,
  cancelReminder,
  formatReminderOffset,
  getReminderStatusColor,
} from '../services/reminderApiService';

interface EventRemindersProps {
  eventId: string;
  userEmail: string;
  eventName?: string;
  mode: 'setup' | 'manage';
  onRemindersChange?: (presets: string[]) => void;
}

const EventReminders: React.FC<EventRemindersProps> = ({
  eventId,
  userEmail,
  eventName = 'Event',
  mode,
  onRemindersChange,
}) => {
  const [presets, setPresets] = useState<ReminderPreset[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['1_hour', '1_day']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(60);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Load existing reminders in manage mode
  useEffect(() => {
    if (mode === 'manage' && eventId) {
      loadReminders();
    }
  }, [mode, eventId]);

  // Notify parent of selected presets (for setup mode)
  useEffect(() => {
    if (mode === 'setup' && onRemindersChange) {
      onRemindersChange(selectedPresets);
    }
  }, [selectedPresets, mode, onRemindersChange]);

  const loadPresets = async () => {
    try {
      const data = await getReminderPresets();
      setPresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
      // Use fallback presets
      setPresets([
        { key: '15_minutes', label: '15 minutes before', minutes: 15 },
        { key: '30_minutes', label: '30 minutes before', minutes: 30 },
        { key: '1_hour', label: '1 hour before', minutes: 60 },
        { key: '2_hours', label: '2 hours before', minutes: 120 },
        { key: '1_day', label: '1 day before', minutes: 1440 },
        { key: '2_days', label: '2 days before', minutes: 2880 },
        { key: '1_week', label: '1 week before', minutes: 10080 },
      ]);
    }
  };

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await listEventReminders(eventId);
      setReminders(data.reminders);
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const togglePreset = (key: string) => {
    setSelectedPresets(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSaveReminders = async () => {
    if (selectedPresets.length === 0) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await createRemindersBulk({
        event_id: eventId,
        created_by: userEmail,
        presets: selectedPresets,
        custom_subject: customSubject || undefined,
        custom_message: customMessage || undefined,
      });
      await loadReminders();
      setSelectedPresets([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create reminders');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomReminder = async () => {
    if (customMinutes < 1) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await createReminder({
        event_id: eventId,
        created_by: userEmail,
        offset_type: 'before_start',
        offset_minutes: customMinutes,
        subject: customSubject || undefined,
        message: customMessage || undefined,
      });
      await loadReminders();
      setShowAddCustom(false);
      setCustomMinutes(60);
      setCustomSubject('');
      setCustomMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId, userEmail);
      setReminders(prev => prev.filter(r => r.$id !== reminderId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete reminder');
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    try {
      const updated = await cancelReminder(reminderId, userEmail);
      setReminders(prev => prev.map(r => (r.$id === reminderId ? updated : r)));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reminder');
    }
  };

  // Setup mode: show checkboxes for presets
  if (mode === 'setup') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Send Reminders
          </h4>
          <span className="text-xs text-gray-500">
            {selectedPresets.length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presets.map(preset => (
            <label
              key={preset.key}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                selectedPresets.includes(preset.key)
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPresets.includes(preset.key)}
                onChange={() => togglePreset(preset.key)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  selectedPresets.includes(preset.key)
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selectedPresets.includes(preset.key) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{preset.label}</span>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Reminders will be sent to all registered attendees at the selected times before the event.
        </p>
      </div>
    );
  }

  // Manage mode: show existing reminders with CRUD
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Event Reminders
        </h4>
        <button
          onClick={() => setShowAddCustom(true)}
          className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
        >
          + Add Reminder
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No reminders set for this event.</p>
          <button
            onClick={() => setShowAddCustom(true)}
            className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            Add your first reminder
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(reminder => (
            <div
              key={reminder.$id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatReminderOffset(reminder.offset_minutes)}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getReminderStatusColor(
                      reminder.status
                    )}`}
                  >
                    {reminder.status}
                  </span>
                </div>
                {reminder.subject && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {reminder.subject}
                  </p>
                )}
                {reminder.status === 'sent' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Sent to {reminder.sent_count} attendees
                    {reminder.failed_count > 0 && ` (${reminder.failed_count} failed)`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {reminder.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleCancelReminder(reminder.$id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.$id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick add from presets */}
      {!showAddCustom && reminders.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {presets
              .filter(p => !reminders.some(r => r.offset_minutes === p.minutes && r.status === 'pending'))
              .slice(0, 4)
              .map(preset => (
                <button
                  key={preset.key}
                  onClick={async () => {
                    try {
                      await createReminder({
                        event_id: eventId,
                        created_by: userEmail,
                        offset_type: 'before_start',
                        offset_minutes: preset.minutes,
                      });
                      await loadReminders();
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Add custom reminder modal */}
      {showAddCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Reminder
            </h3>

            <div className="space-y-4">
              {/* Preset buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  When to remind
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map(preset => (
                    <button
                      key={preset.key}
                      onClick={() => setCustomMinutes(preset.minutes)}
                      className={`p-2 text-sm rounded-lg border transition-all ${
                        customMinutes === preset.minutes
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Subject (optional)
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder={`Reminder: ${eventName}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to include in the reminder..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCustom(false);
                  setCustomMinutes(60);
                  setCustomSubject('');
                  setCustomMessage('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomReminder}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventReminders;
