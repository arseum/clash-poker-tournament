import React from 'react';

interface CRBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'blue' | 'red' | 'green' | 'purple';
  className?: string;
}

const variants = {
  gold:   'bg-cr-gold/20 text-cr-gold border-cr-gold/50',
  blue:   'bg-cr-blue-mid/30 text-cr-blue-light border-cr-blue-mid/50',
  red:    'bg-cr-red/20 text-cr-red border-cr-red/50',
  green:  'bg-cr-green/20 text-cr-green border-cr-green/50',
  purple: 'bg-cr-purple/20 text-cr-purple border-cr-purple/50',
};

export function CRBadge({ children, variant = 'blue', className = '' }: CRBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
