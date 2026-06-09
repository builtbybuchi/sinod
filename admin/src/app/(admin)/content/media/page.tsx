'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface MediaItem {
    $id: string;
    file_id: string;
    url: string;
    alt_text: string;
    uploaded_by: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}

export default function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [altText, setAltText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/data/media?limit=50');
            const data = await res.json();
            setMedia(data.documents || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    const copyUrl = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('alt_text', altText || file.name);

            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            if (res.ok) {
                setShowUpload(false);
                setAltText('');
                fetchMedia();
            } else {
                const err = await res.json();
                alert(err.error || 'Upload failed');
            }
        } catch (err) { console.error(err); alert('Upload failed'); }
        finally { setUploading(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this media item?')) return;
        await fetch('/api/admin/data/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: id }),
        });
        fetchMedia();
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Media Library</h1>
                    <p className="text-zinc-500 mt-1">{media.length} files</p>
                </div>
                <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Image
                </button>
            </div>

            {/* Upload Panel */}
            {showUpload && (
                <div className="admin-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Upload Image</h2>
                        <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        placeholder="Alt text / description"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        className="admin-input"
                    />

                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dragOver
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-3" />
                                <p className="text-sm text-zinc-400">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-zinc-600 mb-3" />
                                <p className="text-sm text-zinc-400">
                                    <span className="text-violet-400 font-medium">Click to browse</span> or drag & drop
                                </p>
                                <p className="text-xs text-zinc-600 mt-1">PNG, JPG, GIF, SVG, WebP up to 10MB</p>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}

            {/* Media Grid */}
            {loading ? (
                <div className="text-center py-12 text-zinc-600">Loading media...</div>
            ) : media.length === 0 ? (
                <div className="admin-card p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No media files yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Click &quot;Upload Image&quot; to add images to your library</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {media.map((item) => (
                        <div key={item.$id} className="admin-card overflow-hidden group">
                            <div className="aspect-square bg-zinc-800 relative">
                                {item.url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={item.url} alt={item.alt_text || 'Media'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => copyUrl(item.url, item.$id)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                                        title="Copy URL">
                                        {copiedId === item.$id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleDelete(item.$id)}
                                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
                                        title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs text-zinc-400 truncate">{item.alt_text || 'Untitled'}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-zinc-600">{formatSize(item.file_size)}</p>
                                    <p className="text-[10px] text-zinc-600">{item.mime_type?.split('/')[1]?.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
