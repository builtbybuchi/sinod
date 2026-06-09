import React, { useState } from 'react';

const DeveloperPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api' | 'webhooks' | 'logs' | 'settings'>('api');

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/meetings', description: 'List all meetings' },
    { method: 'POST', path: '/api/v1/meetings', description: 'Create a new meeting' },
    { method: 'GET', path: '/api/v1/meetings/{id}', description: 'Get meeting details' },
    { method: 'DELETE', path: '/api/v1/meetings/{id}', description: 'Delete a meeting' },
    { method: 'GET', path: '/api/v1/recordings', description: 'List recordings' },
    { method: 'POST', path: '/api/v1/webhooks', description: 'Create webhook' },
  ];

  const webhooks = [
    { id: 1, url: 'https://api.example.com/webhook', events: ['meeting.started', 'meeting.ended'], status: 'active' },
    { id: 2, url: 'https://hooks.example.com/lexrunit', events: ['recording.ready'], status: 'active' },
    { id: 3, url: 'https://dev.example.com/webhook', events: ['participant.joined'], status: 'inactive' },
  ];

  const logs = [
    { id: 1, timestamp: '2025-10-03 14:32:15', level: 'INFO', message: 'Meeting created: meet-abc123' },
    { id: 2, timestamp: '2025-10-03 14:30:42', level: 'SUCCESS', message: 'Webhook delivered to https://api.example.com/webhook' },
    { id: 3, timestamp: '2025-10-03 14:28:11', level: 'ERROR', message: 'Failed to deliver webhook: timeout' },
    { id: 4, timestamp: '2025-10-03 14:25:33', level: 'INFO', message: 'Recording processing started' },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400 bg-blue-400/20';
      case 'POST': return 'text-green-400 bg-green-400/20';
      case 'DELETE': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-400/20';
      case 'SUCCESS': return 'text-green-400 bg-green-400/20';
      case 'INFO': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Developer Header */}
      <div className="border-b border-white/10 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Developer Console</h1>
            <p className="text-sm text-white/60">API keys, webhooks, and integration tools</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600">
              Generate API Key
            </button>
            <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
              View Docs
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {[
            { key: 'api', label: 'API Reference' },
            { key: 'webhooks', label: 'Webhooks' },
            { key: 'logs', label: 'API Logs' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">API Endpoints</h2>
              <div className="space-y-3">
                {apiEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="font-mono text-white">{endpoint.path}</code>
                    </div>
                    <p className="text-sm text-white/60">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">API Key</h4>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded bg-slate-800 px-3 py-2 font-mono text-sm text-white">
                      lex_api_key_••••••••••••••••
                    </code>
                    <button className="rounded bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Usage</h4>
                  <pre className="rounded bg-slate-800 p-4 text-sm text-green-400 overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.lexrunit.com/v1/meetings`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Webhook Endpoints</h2>
              <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600">
                + Add Webhook
              </button>
            </div>

            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-white">{webhook.url}</code>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          webhook.status === 'active' 
                            ? 'bg-green-400/20 text-green-400' 
                            : 'bg-gray-400/20 text-gray-400'
                        }`}>
                          {webhook.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-white/60">Events: </span>
                        {webhook.events.map((event, index) => (
                          <span
                            key={event}
                            className="inline-block rounded bg-sky-500/20 px-2 py-1 text-xs text-sky-300 mr-2"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-sky-300 hover:text-sky-200">Edit</button>
                      <button className="text-sm text-red-300 hover:text-red-200">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">API Activity Logs</h2>
              <div className="flex gap-2">
                <select className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
                  <option>All Levels</option>
                  <option>Errors Only</option>
                  <option>Success Only</option>
                </select>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                  Export
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-white/5 bg-white/5 p-4 font-mono text-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/50">{log.timestamp}</span>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-white">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Developer Settings</h2>
            
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Rate Limit</label>
                  <select className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white">
                    <option>1000 requests/hour</option>
                    <option>5000 requests/hour</option>
                    <option>10000 requests/hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Webhook Timeout</label>
                  <select className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white">
                    <option>5 seconds</option>
                    <option>10 seconds</option>
                    <option>30 seconds</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-4">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Two-factor Authentication</h4>
                    <p className="text-sm text-white/60">Add an extra layer of security to your API access</p>
                  </div>
                  <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">IP Restrictions</h4>
                    <p className="text-sm text-white/60">Restrict API access to specific IP addresses</p>
                  </div>
                  <button className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperPage;