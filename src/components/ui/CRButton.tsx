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
  gold: 'bg-[#f4c842] text-[#0d1b2a] hover:bg-[#ffd966] active:bg-[#c49a1e] font-bold shadow-[0_4px_0_#c49a1e]',
  blue: 'bg-[#2456a4] text-white hover:bg-[#4a8fd4] active:bg-[#1a3a6b] font-bold shadow-[0_4px_0_#1a3a6b]',
  red: 'bg-[#c0392b] text-white hover:bg-[#e74c3c] active:bg-[#922b21] font-bold shadow-[0_4px_0_#7b241c]',
  green: 'bg-[#27ae60] text-white hover:bg-[#2ecc71] active:bg-[#1e8449] font-bold shadow-[0_4px_0_#145a32]',
  ghost: 'bg-transparent text-[#e8e8e8] hover:bg-[#1a2d4a] border border-[#2a4a7a]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
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
