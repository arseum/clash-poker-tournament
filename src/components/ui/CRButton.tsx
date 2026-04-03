import React from 'react';

interface CRButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'gold' | 'blue' | 'red' | 'green' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  gold:  'bg-cr-gold text-cr-darker hover:brightness-110 active:brightness-95 font-semibold border border-cr-gold',
  blue:  'bg-cr-blue-mid text-white hover:brightness-110 active:brightness-95 font-semibold border border-cr-blue-mid',
  red:   'bg-cr-red text-white hover:brightness-110 active:brightness-95 font-semibold border border-cr-red',
  green: 'bg-cr-green text-white hover:brightness-110 active:brightness-95 font-semibold border border-cr-green',
  ghost: 'bg-transparent text-[#c8c4be] hover:bg-cr-card/80 border border-cr-card-border',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export function CRButton({
  children,
  onClick,
  variant = 'gold',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: CRButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ borderRadius: 'var(--theme-btn-radius, 0.5rem)' }}
      className={`
        ${variants[variant]} ${sizes[size]}
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        font-cinzel tracking-wide select-none
        ${className}
      `}
    >
      {children}
    </button>
  );
}
