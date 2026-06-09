'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ExternalLink, Video, X, Save } from 'lucide-react';

interface VideoItem {
    $id: string;
    title: string;
    youtube_url: string;
    description: string;
    thumbnail_url: string;
    added_by: string;
    created_at: string;
}

function getYouTubeId(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
}

function getYouTubeThumbnail(url: string): string {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

export default function VideosPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', youtube_url: '', description: '' });

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/data/videos?limit=50');
            const data = await res.json();
            setVideos(data.documents || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    const handleSave = async () => {
        try {
            const thumbnail = getYouTubeThumbnail(form.youtube_url);
            const payload: Record<string, string> = {
                title: form.title,
                youtube_url: form.youtube_url,
                description: form.description,
                added_by: 'admin',
                created_at: new Date().toISOString(),
            };
            // Only include thumbnail_url if it's a valid URL (Appwrite rejects empty strings)
            if (thumbnail) {
                payload.thumbnail_url = thumbnail;
            }
            await fetch('/api/admin/data/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setShowForm(false);
            setForm({ title: '', youtube_url: '', description: '' });
            fetchVideos();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this video entry?')) return;
        await fetch('/api/admin/data/videos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: id }) });
        fetchVideos();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Videos</h1>
                    <p className="text-zinc-500 mt-1">{videos.length} video links</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Video
                </button>
            </div>

            {showForm && (
                <div className="admin-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Add YouTube Video</h2>
                        <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Video Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
                        <input placeholder="YouTube URL" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} className="admin-input" />
                    </div>
                    <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" rows={3} />
                    {form.youtube_url && getYouTubeId(form.youtube_url) && (
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getYouTubeThumbnail(form.youtube_url)} alt="Thumbnail preview" className="w-32 rounded-lg" />
                            <span className="text-xs text-zinc-500">Thumbnail auto-detected</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Video</button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-zinc-600">Loading videos...</div>
            ) : videos.length === 0 ? (
                <div className="admin-card p-12 text-center">
                    <Video className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No videos yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Add YouTube video links to manage them</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {videos.map((video) => (
                        <div key={video.$id} className="admin-card overflow-hidden group">
                            <div className="aspect-video bg-zinc-800 relative">
                                {video.thumbnail_url || getYouTubeThumbnail(video.youtube_url) ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={video.thumbnail_url || getYouTubeThumbnail(video.youtube_url)} alt={video.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 text-zinc-700" /></div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a href={video.youtube_url} target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors text-white">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-white text-sm mb-1 truncate">{video.title}</h3>
                                <p className="text-xs text-zinc-500 line-clamp-2">{video.description || 'No description'}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-zinc-600">{video.created_at ? new Date(video.created_at).toLocaleDateString() : ''}</span>
                                    <button onClick={() => handleDelete(video.$id)} className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
