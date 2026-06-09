'use client';

import { useState } from 'react';
import { Clock, Play, CheckCircle, AlertCircle, Calendar, BrainCircuit, RefreshCw } from 'lucide-react';

interface CronJob {
    id: string;
    name: string;
    description: string;
    schedule: string;
    icon: React.ComponentType<{ className?: string }>;
    lastRun: string | null;
    status: 'idle' | 'running' | 'success' | 'error';
    endpoint: string;
}

export default function AutomatedTasksPage() {
    const [jobs, setJobs] = useState<CronJob[]>([
        {
            id: 'city-events',
            name: 'City Event Notifications',
            description: 'Emails users about events in their city for the upcoming week. Runs Sunday & Monday nights.',
            schedule: 'Sun/Mon @ 9:00 PM',
            icon: Calendar,
            lastRun: null,
            status: 'idle',
            endpoint: '/api/admin/cron/city-events',
        },
        {
            id: 'quiz-reengagement',
            name: 'Quiz Re-engagement',
            description: 'Sends quiz suggestions to past participants and a random selection of users. Runs Wednesday nights.',
            schedule: 'Wed @ 9:00 PM',
            icon: BrainCircuit,
            lastRun: null,
            status: 'idle',
            endpoint: '/api/admin/cron/quiz-reengagement',
        },
    ]);

    const triggerJob = async (jobId: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'running' as const } : j));

        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) return;

            // This would call the newsletter service in production
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${apiUrl}${job.endpoint}`, { method: 'POST' });

            if (res.ok) {
                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'success' as const, lastRun: new Date().toISOString() } : j));
            } else {
                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error' as const } : j));
            }
        } catch {
            // Expected in dev — newsletter service might not be running
            setJobs(prev => prev.map(j => j.id === jobId ? {
                ...j,
                status: 'error' as const,
                lastRun: new Date().toISOString(),
            } : j));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running': return { class: 'badge-info', label: 'Running', icon: RefreshCw };
            case 'success': return { class: 'badge-success', label: 'Completed', icon: CheckCircle };
            case 'error': return { class: 'badge-danger', label: 'Failed', icon: AlertCircle };
            default: return { class: 'badge-neutral', label: 'Idle', icon: Clock };
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Automated Tasks</h1>
                <p className="text-zinc-500 mt-1">Manage scheduled cron jobs for email automation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => {
                    const Icon = job.icon;
                    const statusInfo = getStatusBadge(job.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={job.id} className="admin-card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-violet-500/10">
                                        <Icon className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{job.name}</h3>
                                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" /> {job.schedule}
                                        </p>
                                    </div>
                                </div>
                                <span className={`badge ${statusInfo.class} flex items-center gap-1`}>
                                    <StatusIcon className={`w-3 h-3 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                                    {statusInfo.label}
                                </span>
                            </div>

                            <p className="text-sm text-zinc-400 mb-4">{job.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                                <div className="text-xs text-zinc-600">
                                    {job.lastRun
                                        ? `Last run: ${new Date(job.lastRun).toLocaleString()}`
                                        : 'Never run'}
                                </div>
                                <button
                                    onClick={() => triggerJob(job.id)}
                                    disabled={job.status === 'running'}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 text-violet-400 rounded-xl hover:bg-violet-600/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/20"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    Run Now
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Panel */}
            <div className="admin-card p-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">How It Works</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                        <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-white font-medium">City Event Notifications</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Queries upcoming events (next 7 days), groups by city, and emails each user about
                                events in their area. If no events in their city, sends an encouragement email to create one.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30">
                        <BrainCircuit className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-white font-medium">Quiz Re-engagement</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Collects past quiz respondents and adds 25% random users from the platform.
                                Selects 5 random active quizzes and sends a &quot;Try these quizzes!&quot; email to boost engagement.
                            </p>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-zinc-600 mt-4">
                    Tasks are triggered via the newsletter microservice on the Digital Ocean droplet.
                    In production, these run automatically on schedule using the built-in scheduler.
                </p>
            </div>
        </div>
    );
}
