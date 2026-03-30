import React from 'react';

interface CRBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'blue' | 'red' | 'green' | 'purple';
  className?: string;
}

const variants = {
  gold: 'bg-[#f4c842]/20 text-[#f4c842] border-[#f4c842]/50',
  blue: 'bg-[#2456a4]/30 text-[#4a8fd4] border-[#2456a4]/50',
  red: 'bg-[#c0392b]/20 text-[#e74c3c] border-[#c0392b]/50',
  green: 'bg-[#27ae60]/20 text-[#2ecc71] border-[#27ae60]/50',
  purple: 'bg-[#6b2fa0]/20 text-[#9b59b6] border-[#6b2fa0]/50',
};

export function CRBadge({ children, variant = 'blue', className = '' }: CRBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
