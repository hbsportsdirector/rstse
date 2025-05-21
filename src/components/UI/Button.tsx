import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md hover:-translate-y-px',
        
        // Variant styles
        variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        variant === 'outline' && 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary bg-transparent',
        variant === 'ghost' && 'hover:bg-primary/10 text-primary focus:ring-primary bg-transparent',
        variant === 'link' && 'bg-transparent underline-offset-4 hover:underline text-primary focus:ring-primary',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
        
        // Size styles
        size === 'default' && 'px-4 py-2 text-sm', 
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'lg' && 'px-6 py-2.5 text-base',
        size === 'icon' && 'h-10 w-10',
        
        className // User-provided className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
