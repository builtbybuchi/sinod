'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    BrainCircuit,
    Mail,
    DollarSign,
    Newspaper,
    Image,
    Video,
    Clock,
    Headphones,
    ChevronLeft,
    ChevronRight,
    Send,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';

const navSections = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Users', href: '/users', icon: Users },
        ],
    },
    {
        label: 'Content',
        items: [
            { name: 'Events', href: '/events', icon: Calendar },
            { name: 'Forms', href: '/forms', icon: FileText },
            { name: 'Quizzes', href: '/quizzes', icon: BrainCircuit },
            { name: 'Newsletters', href: '/newsletters', icon: Send },
        ],
    },
    {
        label: 'Publishing',
        items: [
            { name: 'Blog & News', href: '/content/blog', icon: Newspaper },
            { name: 'Media Library', href: '/content/media', icon: Image },
            { name: 'Videos', href: '/content/videos', icon: Video },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { name: 'Financials', href: '/financials', icon: DollarSign },
            { name: 'Refunds', href: '/refunds', icon: RotateCcw },
            { name: 'Emails', href: '/emails', icon: Mail },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Automated Tasks', href: '/automated-tasks', icon: Clock },
            { name: 'Customer Service', href: '/customer-service', icon: Headphones },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`${collapsed ? 'w-[72px]' : 'w-64'
                } h-screen bg-zinc-950 border-r border-zinc-800/50 flex flex-col transition-all duration-300 ease-in-out shrink-0 sticky top-0`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/50">
                {!collapsed && (
                    <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://sinod.app/sinod-logo.png" alt="Sinod" className="w-8 h-8 rounded-lg object-contain" />
                        <span className="font-bold text-white text-lg tracking-tight">
                            Sinod&apos;
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 uppercase tracking-wider">
                            Admin
                        </span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
                {navSections.map((section) => (
                    <div key={section.label}>
                        {!collapsed && (
                            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-2">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                const Icon = item.icon;
                                const isDisabled = item.name === 'Customer Service';

                                return (
                                    <Link
                                        key={item.href}
                                        href={isDisabled ? '#' : item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                      ${isActive
                                                ? 'bg-gradient-to-r from-violet-600/20 to-blue-600/10 text-violet-400 border border-violet-500/20'
                                                : isDisabled
                                                    ? 'text-zinc-700 cursor-not-allowed'
                                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                                            }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                                        title={collapsed ? item.name : undefined}
                                    >
                                        <Icon
                                            className={`w-[18px] h-[18px] shrink-0 ${isActive
                                                ? 'text-violet-400'
                                                : isDisabled
                                                    ? 'text-zinc-700'
                                                    : 'text-zinc-500 group-hover:text-zinc-300'
                                                }`}
                                        />
                                        {!collapsed && <span>{item.name}</span>}
                                        {!collapsed && isDisabled && (
                                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600">
                                                Soon
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Version */}
            {!collapsed && (
                <div className="p-4 border-t border-zinc-800/50">
                    <p className="text-[10px] text-zinc-700 text-center">
                        Sinod&apos; Admin v1.0
                    </p>
                </div>
            )}
        </aside>
    );
}
