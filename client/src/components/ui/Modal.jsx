import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  closeOnBackdrop = true,
  ...props
}) => {
  // Hook to handle escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Uses React Portals to render clean semantic overlays on the document root body
  return ReactDOM.createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile md:p-gutter bg-[#000101]/40 backdrop-blur-sm transition-all duration-300"
    >
      <div
        className={`
          w-full max-w-lg bg-surface border border-outline-variant rounded-DEFAULT 
          flex flex-col relative transition-all duration-300 transform scale-100
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant">
          {title && (
            <h3 className="font-headline-md text-headline-md text-primary font-semibold">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-1 hover:bg-surface-container rounded"
          >
            <span className="material-symbols-outlined font-normal text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto max-h-[70vh] custom-scrollbar font-body-md text-body-md text-on-surface-variant">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
