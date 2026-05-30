import React from 'react';

export const Input = React.forwardRef(({
  label,
  id,
  type = 'text',
  placeholder = '',
  iconLeft,
  iconRight,
  error,
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block font-label-sm text-label-sm text-on-surface select-none"
        >
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none select-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          required={required}
          placeholder={placeholder}
          className={`
            w-full py-3 bg-surface-bright border border-outline-variant text-on-surface font-body-md text-body-md 
            focus:border-primary focus:ring-0 focus:outline-none transition-colors duration-150 rounded-DEFAULT
            ${iconLeft ? 'pl-10' : 'pl-4'}
            ${iconRight ? 'pr-10' : 'pr-4'}
            ${error ? 'border-error focus:border-error' : 'border-outline-variant'}
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none select-none">
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p className="font-label-sm text-label-sm text-error mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
