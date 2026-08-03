import React from 'react';

/**
 * Reusable Badge element for categorizing status & priority
 * @param {object} props
 * @param {React.ReactNode} props.children Label text
 * @param {string} props.type Badge style class ('low', 'medium', 'high', 'completed', 'pending', 'missed')
 * @param {React.ReactNode} [props.icon] Optional icon component to display
 * @param {string} [props.className] Optional custom class
 */
export const Badge = ({ children, type, icon, className = '' }) => {
  return (
    <span className={`badge badge-${type} ${className}`}>
      {icon && <span className="badge-icon-wrap">{icon}</span>}
      {children}
    </span>
  );
};
