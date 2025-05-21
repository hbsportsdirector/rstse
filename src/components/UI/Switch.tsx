import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  className,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  return (
    <label
      className={cn(
        "relative inline-flex items-center cursor-pointer",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "w-11 h-6 bg-gray-200 rounded-full peer",
          "peer-focus:ring-4 peer-focus:ring-blue-300",
          "peer-checked:after:translate-x-full peer-checked:after:border-white",
          "after:content-[''] after:absolute after:top-0.5 after:left-[2px]",
          "after:bg-white after:border-gray-300 after:border after:rounded-full",
          "after:h-5 after:w-5 after:transition-all",
          "peer-checked:bg-blue-600"
        )}
      ></div>
    </label>
  );
};
