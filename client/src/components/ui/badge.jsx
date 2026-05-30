import React from 'react';

export const Badge = ({
  children,
  variant = 'review',
  className = '',
  ...props
}) => {
  // Base styling: small, uppercase, bold tracking from design system
  const baseClasses = 'inline-flex items-center justify-center font-label-sm text-label-sm px-2.5 py-1 select-none font-semibold rounded-DEFAULT uppercase tracking-wider border';

  // Variant mappings based on DESIGN.md
  const variants = {
    'in-progress': 'bg-secondary-container text-on-secondary-container border-secondary-container',
    'review': 'bg-transparent text-on-surface-variant border-outline-variant',
    'paid': 'bg-secondary text-on-secondary border-secondary',
    'overdue': 'bg-error-container text-on-error-container border-error-container',
    'planned': 'bg-surface-container-highest text-on-surface border-surface-container-highest',
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
