import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  iconLeft,
  iconRight,
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  // Base classes that are common to all buttons
  const baseClasses = 'inline-flex items-center justify-center font-label-md text-label-md transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none gap-2 select-none cursor-pointer';

  // Variant-specific styles based on DESIGN.md
  const variants = {
    primary: 'bg-primary text-on-primary border border-primary hover:bg-tertiary-container hover:border-tertiary-container active:bg-primary-container',
    secondary: 'bg-transparent text-primary border border-outline hover:bg-surface-container-low hover:text-primary active:bg-surface-container',
    ghost: 'bg-transparent text-secondary hover:text-primary uppercase tracking-wider font-semibold',
  };

  // Border radius & padding based on DESIGN.md
  // Primary/Secondary use custom padding; ghost does not require padding borders
  const paddingClasses = variant === 'ghost' ? 'py-2 px-1' : 'py-3.5 px-6 rounded-DEFAULT';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${paddingClasses} ${className}`}
      {...props}
    >
      {iconLeft && (
        <span className="material-symbols-outlined text-[18px] leading-none">{iconLeft}</span>
      )}
      <span>{children}</span>
      {iconRight && (
        <span className="material-symbols-outlined text-[18px] leading-none">{iconRight}</span>
      )}
    </button>
  );
};

export default Button;
