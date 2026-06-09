import React from 'react';

type Provider = 'google' | 'facebook' | 'microsoft' | 'apple';

interface SocialAuthButtonsProps {
  onClick?: (provider: Provider) => void;
  className?: string;
}

const providers: { id: Provider; label: string; bg: string; hover: string; text?: string }[] = [
  { id: 'google', label: 'Google', bg: 'bg-white text-gray-800 border border-gray-300', hover: 'hover:bg-gray-50' },
  { id: 'facebook', label: 'Facebook', bg: 'bg-[#1877F2] text-white', hover: 'hover:bg-[#0f5ebd]' },
  { id: 'microsoft', label: 'Microsoft', bg: 'bg-[#2F2F2F] text-white', hover: 'hover:bg-black' },
  { id: 'apple', label: 'Apple', bg: 'bg-black text-white', hover: 'hover:bg-gray-900' },
];

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onClick, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {providers.map(p => (
        <button
          key={p.id}
            type="button"
            onClick={() => onClick?.(p.id)}
            className={`group relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${p.bg} ${p.hover}`}
            aria-label={`Continue with ${p.label}`}
        >
          <span className="text-base leading-none">
            {p.id === 'apple' ? '' : p.label[0]}
          </span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SocialAuthButtons;
