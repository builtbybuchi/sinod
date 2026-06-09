import React from 'react';

interface ToolsPageProps {
  onNavigate: (page: string) => void;
}

const ToolsPage: React.FC<ToolsPageProps> = ({ onNavigate }) => {
  const tools = [
    {
      key: 'documents',
      label: 'Documents',
      description: 'Collaborate on documents in real-time',
      color: 'sky',
      icon: (
        <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'whiteboard',
      label: 'Whiteboards',
      description: 'Draw, brainstorm, and collaborate visually',
      color: 'purple',
      icon: (
        <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
  ];

  const colorMap: Record<string, string> = {
    sky: 'border-sky-500/30 hover:border-sky-500/50',
    purple: 'border-purple-500/30 hover:border-purple-500/50',
  };

  const bgMap: Record<string, string> = {
    sky: 'bg-sky-500/15',
    purple: 'bg-purple-500/15',
  };

  return (
    <div className="min-h-full bg-slate-950 text-white pb-24 md:pb-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white">Tools</h1>
          <p className="text-sm text-gray-400 mt-1">Access your collaboration tools</p>
        </div>
        <div className="space-y-3">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => onNavigate(tool.key)}
              className={`w-full flex items-center gap-4 rounded-2xl border bg-white/5 p-5 transition-all hover:bg-white/10 active:scale-[0.98] ${colorMap[tool.color]}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgMap[tool.color]}`}>
                {tool.icon}
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-white">{tool.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
              </div>
              <svg className="ml-auto w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
