import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    byline?: boolean;
    onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, byline = false, onClick }) => {
    const isClickable = !!onClick;
    const Component = isClickable ? 'button' : 'div';

    return (
        <Component onClick={onClick} className={`flex items-center ${className} ${isClickable ? 'cursor-pointer' : ''}`}>
            <div className="flex items-center">
                <img 
                    src="/lyperos.png" 
                    alt="Sinod' Logo" 
                    className="h-10 w-auto"
                />
                {showText && (
                    <span className="text-3xl font-extrabold tracking-tighter text-white ml-0">Sinod'</span>
                )}
            </div>
            {showText && byline && (
                <p className="text-xs font-semibold text-gray-400 tracking-wider ml-2">by LEXRUNIT</p>
            )}
        </Component>
    );
};

export default Logo;