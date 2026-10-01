'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  themeVariant?: 'emerald' | 'indigo' | 'sky' | 'slate' | 'rose';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  disabled?: boolean;
}

const themeStyles = {
  emerald: {
    activeBorder: 'focus:border-emerald-500 focus:ring-emerald-500/25',
    activeOption:
      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 font-bold',
    checkColor: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
  },
  indigo: {
    activeBorder: 'focus:border-indigo-500 focus:ring-indigo-500/25',
    activeOption:
      'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100 font-bold',
    checkColor: 'text-indigo-600 dark:text-indigo-400',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
  },
  sky: {
    activeBorder: 'focus:border-sky-500 focus:ring-sky-500/25',
    activeOption:
      'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800/80 text-sky-950 dark:text-sky-100 font-bold',
    checkColor: 'text-sky-600 dark:text-sky-400',
    hover: 'hover:border-sky-300 dark:hover:border-sky-700/60',
  },
  rose: {
    activeBorder: 'focus:border-rose-500 focus:ring-rose-500/25',
    activeOption:
      'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 font-bold',
    checkColor: 'text-rose-600 dark:text-rose-400',
    hover: 'hover:border-rose-300 dark:hover:border-rose-700/60',
  },
  slate: {
    activeBorder: 'focus:border-slate-500 focus:ring-slate-500/25',
    activeOption:
      'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold',
    checkColor: 'text-slate-700 dark:text-slate-300',
    hover: 'hover:border-slate-300 dark:hover:border-slate-600',
  },
};

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  themeVariant = 'emerald',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'md',
  align = 'left',
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const theme = themeStyles[themeVariant] || themeStyles.emerald;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-3.5 py-2.5 text-xs rounded-xl',
    lg: 'px-4 py-3 text-sm rounded-2xl',
  }[size];

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold transition-all shadow-xs outline-none cursor-pointer focus:ring-2 active:scale-[0.995] disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${theme.activeBorder} ${theme.hover} ${buttonClassName}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 text-left mr-2">
          {selectedOption?.icon && (
            <div className="shrink-0 flex items-center">{selectedOption.icon}</div>
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-slate-900 dark:text-slate-100">
              {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
            </span>
            {selectedOption?.subLabel && (
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {selectedOption.subLabel}
              </span>
            )}
          </div>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 w-full min-w-[200px] bg-white/90 dark:bg-[#0b111e]/90 border border-white/80 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          <div className="p-1.5 max-h-64 overflow-y-auto space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? `${theme.activeOption} shadow-xs`
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                    {option.icon && (
                      <div className="shrink-0 flex items-center">{option.icon}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                        {option.label}
                      </span>
                      {option.subLabel && (
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {option.subLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {option.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className={`w-4 h-4 ${theme.checkColor}`} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
