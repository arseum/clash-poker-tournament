import React from 'react';

interface CRInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function CRInput({ label, className = '', ...props }: CRInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#4a8fd4] tracking-wide">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          bg-[#0d1b2a] border border-[#2a4a7a] rounded-lg px-3 py-2
          text-white placeholder-[#4a5568]
          focus:outline-none focus:border-[#f4c842] focus:ring-1 focus:ring-[#f4c842]/30
          transition-colors
          ${className}
        `}
      />
    </div>
  );
}
