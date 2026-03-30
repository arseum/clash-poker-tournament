import React from 'react';

interface CRCardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  onClick?: () => void;
}

export function CRCard({ children, className = '', gold = false, onClick }: CRCardProps) {
  const borderClass = gold
    ? 'border-2 border-[#f4c842] shadow-[0_0_20px_rgba(244,200,66,0.3)]'
    : 'border border-[#2a4a7a]';

  return (
    <div
      className={`bg-[#1a2d4a]/85 backdrop-blur-sm rounded-xl p-4 ${borderClass} ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
