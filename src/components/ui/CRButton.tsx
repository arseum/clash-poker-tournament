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
  gold:  'bg-cr-gold text-cr-darker hover:brightness-[1.18] hover:shadow-[0_0_16px_rgba(200,168,106,0.4)] active:brightness-90 font-semibold border border-cr-gold/70',
  blue:  'bg-cr-blue-mid text-white hover:brightness-[1.25] hover:shadow-[0_0_12px_rgba(42,80,112,0.5)] active:brightness-90 font-semibold border border-cr-blue-mid/70',
  red:   'bg-cr-red text-white hover:brightness-[1.25] hover:shadow-[0_0_12px_rgba(146,72,72,0.5)] active:brightness-90 font-semibold border border-cr-red/70',
  green: 'bg-cr-green text-white hover:brightness-[1.25] hover:shadow-[0_0_12px_rgba(72,138,98,0.5)] active:brightness-90 font-semibold border border-cr-green/70',
  ghost: 'bg-transparent text-[#9090a8] hover:bg-cr-card hover:text-[#e0ddd8] hover:border-cr-blue-light/50 active:brightness-90 border border-cr-card-border',
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
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
        font-cinzel tracking-wide select-none
        ${className}
      `}
    >
      {children}
    </button>
  );
}
