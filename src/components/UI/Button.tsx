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
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-primary text-white hover:bg-primary-dark focus:ring-primary': variant === 'default',
          'bg-transparent border border-gray-300 hover:bg-gray-100 focus:ring-gray-400': variant === 'outline',
          'bg-transparent hover:bg-gray-100 focus:ring-gray-400': variant === 'ghost',
          'bg-transparent underline-offset-4 hover:underline text-primary focus:ring-primary': variant === 'link',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600': variant === 'destructive',
          'h-10 px-4 py-2': size === 'default',
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-8': size === 'lg',
          'h-10 w-10': size === 'icon',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
