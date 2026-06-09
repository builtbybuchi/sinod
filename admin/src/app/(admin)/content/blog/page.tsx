'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Save, X, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPost {
    $id: string;
    title: string;
    slug: string;
    content_html: string;
    excerpt: string;
    author: string;
    status: string;
    featured_image: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    published_at: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showEditor, setShowEditor] = useState(false);
    const [editing, setEditing] = useState<BlogPost | null>(null);
    const [form, setForm] = useState({
        title: '', slug: '', content_html: '', excerpt: '', author: 'Admin',
        status: 'draft', featured_image: '', tags: '',
    });
    const LIMIT = 10;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: LIMIT.toString(), offset: (page * LIMIT).toString() });
            const res = await fetch(`/api/admin/data/blog-posts?${params}`);
            const data = await res.json();
            setPosts(data.documents || []);
            setTotal(data.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const handleSave = async () => {
        const now = new Date().toISOString();
        const data = {
            ...form,
            slug: form.slug || generateSlug(form.title),
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            created_at: editing?.created_at || now,
            updated_at: now,
            published_at: form.status === 'published' ? (editing?.published_at || now) : '',
        };

        try {
            if (editing) {
                // For update, we'd need to use a different endpoint; for now, delete + recreate
                await fetch('/api/admin/data/blog-posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: editing.$id }) });
            }
            await fetch('/api/admin/data/blog-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            setShowEditor(false);
            setEditing(null);
            setForm({ title: '', slug: '', content_html: '', excerpt: '', author: 'Admin', status: 'draft', featured_image: '', tags: '' });
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const handleEdit = (post: BlogPost) => {
        setEditing(post);
        setForm({
            title: post.title,
            slug: post.slug,
            content_html: post.content_html,
            excerpt: post.excerpt,
            author: post.author,
            status: post.status,
            featured_image: post.featured_image || '',
            tags: (post.tags || []).join(', '),
        });
        setShowEditor(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this blog post?')) return;
        await fetch('/api/admin/data/blog-posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: id }) });
        fetchPosts();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Blog & News</h1>
                    <p className="text-zinc-500 mt-1">{total} posts</p>
                </div>
                <button onClick={() => { setShowEditor(true); setEditing(null); setForm({ title: '', slug: '', content_html: '', excerpt: '', author: 'Admin', status: 'draft', featured_image: '', tags: '' }); }} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Post
                </button>
            </div>

            {/* Editor */}
            {showEditor && (
                <div className="admin-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Post' : 'New Post'}</h2>
                        <button onClick={() => { setShowEditor(false); setEditing(null); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Post Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} className="admin-input" />
                        <input placeholder="Slug (auto-generated)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input" />
                        <input placeholder="Featured Image URL" value={form.featured_image} onChange={(e) => setForm({ ...form, featured_image: e.target.value })} className="admin-input" />
                        <input placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="admin-input" />
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="admin-input" />
                    </div>
                    <textarea placeholder="Excerpt (short preview)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="admin-input" rows={2} />
                    <textarea placeholder="Content (HTML supported)" value={form.content_html} onChange={(e) => setForm({ ...form, content_html: e.target.value })} className="admin-input font-mono text-xs" rows={12} />
                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}</button>
                        <button onClick={() => setShowEditor(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            {/* Posts Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Tags</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Loading...</td></tr>
                            ) : posts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-zinc-600">
                                    <Newspaper className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                                    No blog posts yet — click &quot;New Post&quot; to create one
                                </td></tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post.$id}>
                                        <td className="font-medium text-white max-w-[250px] truncate">{post.title}</td>
                                        <td className="text-xs">{post.author}</td>
                                        <td><span className={`badge ${post.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{post.status}</span></td>
                                        <td className="text-xs">{(post.tags || []).slice(0, 3).join(', ') || '—'}</td>
                                        <td className="text-xs whitespace-nowrap">{post.created_at ? new Date(post.created_at).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(post)} className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(post.$id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {total > LIMIT && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
                        <p className="text-sm text-zinc-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPage(page + 1)} disabled={(page + 1) * LIMIT >= total} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
