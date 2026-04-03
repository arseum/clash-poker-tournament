import React from 'react';

interface CRBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'blue' | 'red' | 'green' | 'purple';
  className?: string;
}

const variants = {
  gold:   'bg-cr-gold/15 text-cr-gold border-cr-gold/30',
  blue:   'bg-cr-blue-mid/25 text-cr-blue-light border-cr-blue-mid/40',
  red:    'bg-cr-red/15 text-cr-red border-cr-red/30',
  green:  'bg-cr-green/15 text-cr-green border-cr-green/30',
  purple: 'bg-cr-purple/15 text-cr-purple border-cr-purple/30',
};

export function CRBadge({ children, variant = 'blue', className = '' }: CRBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
