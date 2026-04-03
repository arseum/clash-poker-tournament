import React from 'react';

interface CRCardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  onClick?: () => void;
}

export function CRCard({ children, className = '', gold = false, onClick }: CRCardProps) {
  return (
    <div
      className={`
        bg-cr-card/90 backdrop-blur-sm rounded-xl p-5 cr-card-bg
        ${gold ? 'card-gold-glow' : 'border border-cr-card-border'}
        ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
