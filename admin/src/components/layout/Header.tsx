'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';

export default function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors relative">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
