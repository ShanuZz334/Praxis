import React from 'react';

interface UniversalCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  wrapperClassName?: string;
}

export const UniversalCheckbox = React.forwardRef<HTMLInputElement, UniversalCheckboxProps>(
  ({ className = '', wrapperClassName = '', ...props }, ref) => {
    return (
      <label className={`praxis-checkbox-wrapper ${wrapperClassName}`}>
        <input 
          type="checkbox" 
          ref={ref}
          {...props} 
        />
        <div className={`praxis-checkmark ${className}`}></div>
      </label>
    );
  }
);

UniversalCheckbox.displayName = 'UniversalCheckbox';
