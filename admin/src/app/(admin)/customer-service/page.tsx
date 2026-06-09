import { Headphones, Bot, MessageSquare, Sparkles } from 'lucide-react';

export default function CustomerServicePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Customer Service</h1>
                <p className="text-zinc-500 mt-1">AI-powered customer support integration</p>
            </div>

            <div className="admin-card p-12 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 mb-6 border border-violet-500/10">
                    <Bot className="w-10 h-10 text-violet-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">AI Customer Service</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                    An intelligent AI assistant that handles customer inquiries, provides instant responses,
                    and escalates complex issues. Coming soon to your admin panel.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                        <MessageSquare className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">Live Chat</p>
                        <p className="text-xs text-zinc-500 mt-1">Real-time customer messaging</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                        <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">AI Responses</p>
                        <p className="text-xs text-zinc-500 mt-1">Gemini-powered smart replies</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                        <Headphones className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">Escalation</p>
                        <p className="text-xs text-zinc-500 mt-1">Auto-escalate complex issues</p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Coming Soon — Integration in Progress
                </div>
            </div>
        </div>
    );
}
