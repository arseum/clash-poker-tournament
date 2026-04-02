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
  gold:  'bg-cr-gold text-cr-dark hover:brightness-110 active:brightness-90 font-bold shadow-[0_4px_0_var(--color-cr-gold-dark)]',
  blue:  'bg-cr-blue-mid text-white hover:brightness-110 active:brightness-90 font-bold shadow-[0_4px_0_var(--color-cr-blue)]',
  red:   'bg-cr-red text-white hover:brightness-110 active:brightness-90 font-bold shadow-[0_4px_0_rgba(0,0,0,0.4)]',
  green: 'bg-cr-green text-white hover:brightness-110 active:brightness-90 font-bold shadow-[0_4px_0_rgba(0,0,0,0.4)]',
  ghost: 'bg-transparent text-[#e8e8e8] hover:bg-cr-card border border-cr-card-border',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg',
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
      style={{ borderRadius: 'var(--theme-btn-radius, 0.75rem)' }}
      className={`
        ${variants[variant]} ${sizes[size]}
        transition-all duration-150 active:translate-y-1 active:shadow-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0
        font-cinzel tracking-wide select-none
        ${className}
      `}
    >
      {children}
    </button>
  );
}
