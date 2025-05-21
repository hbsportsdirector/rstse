import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export const Popover: React.FC<PopoverProps> = ({ children, className }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className={cn("relative inline-block", className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, asChild = false }) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(!open);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ref: triggerRef,
      'aria-expanded': open,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      aria-expanded={open}
    >
      {children}
    </button>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  align = 'center',
  sideOffset = 4,
}) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  // Position the popover
  const updatePosition = () => {
    if (!contentRef.current || !triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    
    let top = triggerRect.bottom + sideOffset + window.scrollY;
    let left = 0;
    
    switch (align) {
      case 'start':
        left = triggerRect.left + window.scrollX;
        break;
      case 'center':
        left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2) + window.scrollX;
        break;
      case 'end':
        left = triggerRect.right - contentRect.width + window.scrollX;
        break;
    }
    
    // Ensure the popover stays within the viewport
    const rightEdge = left + contentRect.width;
    const viewportWidth = window.innerWidth;
    
    if (rightEdge > viewportWidth) {
      left = viewportWidth - contentRect.width - 10;
    }
    
    if (left < 10) {
      left = 10;
    }
    
    contentRef.current.style.top = `${top}px`;
    contentRef.current.style.left = `${left}px`;
  };
  
  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [open]);

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in-80",
        className
      )}
      style={{ position: 'absolute' }}
    >
      {children}
    </div>,
    document.body
  );
};
