import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * Reusable Dialog Modal
 */
export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container glass-panel" ref={modalRef} role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};
