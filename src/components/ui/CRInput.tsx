import React from 'react';

interface CRInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function CRInput({ label, className = '', ...props }: CRInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-cr-blue-light tracking-widest uppercase">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          bg-cr-darker border border-cr-card-border rounded-lg px-3 py-2.5
          text-[#e0ddd8] placeholder-[#3a3848]
          focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold/20
          transition-colors
          ${className}
        `}
      />
    </div>
  );
}
