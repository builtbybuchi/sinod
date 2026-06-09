import React, { useState } from 'react';

const RecordingsPage: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'recent' | 'shared'>('all');

  const recordings = [
    {
      id: 1,
      title: 'Product Review Meeting',
      duration: '45:32',
      date: '2 hours ago',
      thumbnail: 'https://via.placeholder.com/300x180/1e293b/3b82f6?text=Recording',
      participants: ['Alex Chen', 'Sarah Kim', 'Mike Johnson'],
      size: '2.1 GB',
      isShared: true,
    },
    {
      id: 2,
      title: 'Design System Workshop',
      duration: '1:23:15',
      date: '1 day ago',
      thumbnail: 'https://via.placeholder.com/300x180/1e293b/10b981?text=Recording',
      participants: ['Sarah Kim', 'Emma Davis', 'Tom Wilson'],
      size: '3.8 GB',
      isShared: false,
    },
    {
      id: 3,
      title: 'Client Demo - Q4 Features',
      duration: '32:18',
      date: '3 days ago',
      thumbnail: 'https://via.placeholder.com/300x180/1e293b/f59e0b?text=Recording',
      participants: ['Alex Chen', 'Mike Johnson', 'Lisa Brown'],
      size: '1.5 GB',
      isShared: true,
    },
    {
      id: 4,
      title: 'Sprint Planning Session',
      duration: '58:45',
      date: '1 week ago',
      thumbnail: 'https://via.placeholder.com/300x180/1e293b/8b5cf6?text=Recording',
      participants: ['Team Alpha'],
      size: '2.7 GB',
      isShared: false,
    },
  ];

  const filteredRecordings = recordings.filter((recording) => {
    if (filter === 'recent') return recording.date.includes('hour') || recording.date.includes('day');
    if (filter === 'shared') return recording.isShared;
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Recordings Header */}
      <div className="border-b border-white/10 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Recordings</h1>
            <p className="text-sm text-white/60">Access your meeting recordings and transcripts</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-white outline-none focus:border-sky-500"
            >
              <option value="all">All Recordings</option>
              <option value="recent">Recent</option>
              <option value="shared">Shared</option>
            </select>
            <div className="flex rounded-lg border border-white/15 bg-white/5">
              <button
                onClick={() => setView('grid')}
                className={`rounded-l-lg px-3 py-2 text-sm transition-colors ${
                  view === 'grid' ? 'bg-sky-500 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-r-lg px-3 py-2 text-sm transition-colors ${
                  view === 'list' ? 'bg-sky-500 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-all hover:bg-white/10 hover:scale-[1.02]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  <img
                    src={recording.thumbnail}
                    alt={recording.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="rounded-full bg-sky-500 p-3 text-white shadow-lg hover:bg-sky-600">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    {recording.duration}
                  </div>
                  {recording.isShared && (
                    <div className="absolute top-2 right-2 rounded-full bg-sky-500 p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2">{recording.title}</h3>
                  <p className="text-sm text-white/60 mb-3">{recording.date}</p>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{recording.participants.length} participants</span>
                    <span>{recording.size}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded bg-sky-500/20 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/30">
                      Play
                    </button>
                    <button className="flex-1 rounded bg-white/10 py-1 text-xs font-medium text-white hover:bg-white/20">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-white/60 border-b border-white/10">
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border border-white/5 bg-white/5 transition-colors hover:bg-white/10"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative h-12 w-16 rounded bg-gray-800 overflow-hidden">
                    <img
                      src={recording.thumbnail}
                      alt={recording.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white">{recording.title}</p>
                    <p className="text-xs text-white/50">{recording.participants.length} participants</p>
                  </div>
                  {recording.isShared && (
                    <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  )}
                </div>
                <div className="col-span-2 text-sm text-white/60">{recording.duration}</div>
                <div className="col-span-2 text-sm text-white/60">{recording.date}</div>
                <div className="col-span-2 text-sm text-white/60">{recording.size}</div>
                <div className="col-span-2 flex gap-2">
                  <button className="text-xs text-sky-300 hover:text-sky-200">Play</button>
                  <button className="text-xs text-white/60 hover:text-white">Download</button>
                  <button className="text-xs text-white/60 hover:text-white">Share</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRecordings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-white/70 mb-2">No recordings found</h3>
            <p className="text-sm text-white/50">Start a meeting to create your first recording</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingsPage;