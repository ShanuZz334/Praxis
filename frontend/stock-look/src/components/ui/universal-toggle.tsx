import React from 'react';

interface UniversalToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  wrapperClassName?: string;
}

export const UniversalToggle = React.forwardRef<HTMLInputElement, UniversalToggleProps>(
  ({ className = '', wrapperClassName = '', ...props }, ref) => {
    return (
      <label className={`praxis-switch ${wrapperClassName}`}>
        <input 
          type="checkbox" 
          className={`praxis-toggle ${className}`} 
          ref={ref}
          {...props} 
        />
        <span className="praxis-slider"></span>
      </label>
    );
  }
);

UniversalToggle.displayName = 'UniversalToggle';
