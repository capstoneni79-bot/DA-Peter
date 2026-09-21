import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Phone } from 'lucide-react';

export const CONTACT_NUMBER_ERROR_MESSAGE = 'Contact number must contain exactly 11 digits.';

export interface ContactNumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  showStatusIndicator?: boolean;
  className?: string;
  errorOverride?: string | null;
  onValidate?: (isValid: boolean) => void;
}

/**
 * Validates that the input contains exactly 11 numeric digits (0-9).
 * Rejects letters, spaces, hyphens, plus signs, symbols, and decimal points.
 */
export const isValidContactNumber = (val: string): boolean => {
  return /^\d{11}$/.test(val);
};

export const ContactNumberInput: React.FC<ContactNumberInputProps> = ({
  id = 'farmer-contact-number',
  value,
  onChange,
  label = 'Contact Number',
  required = true,
  placeholder = '09123456789',
  helpText,
  disabled = false,
  showStatusIndicator = true,
  className = '',
  errorOverride,
  onValidate,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = isValidContactNumber(value);

  useEffect(() => {
    if (onValidate) {
      onValidate(isValid);
    }
  }, [isValid, onValidate]);

  // Sync validation error
  useEffect(() => {
    if (errorOverride !== undefined) {
      setInternalError(errorOverride);
    } else if (touched) {
      if (!isValid) {
        setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      } else {
        setInternalError(null);
      }
    }
  }, [value, touched, isValid, errorOverride]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow keyboard navigation & commands (Ctrl/Cmd combinations, navigation keys)
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(
        e.key
      )
    ) {
      return;
    }

    // Only allow digits 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setTouched(true);
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      return;
    }

    // Check if input is already at 11 digits and not replacing a selection
    const target = e.currentTarget;
    const hasSelection = (target.selectionEnd || 0) - (target.selectionStart || 0) > 0;
    if (target.value.length >= 11 && !hasSelection) {
      e.preventDefault();
      setTouched(true);
      if (target.value.length !== 11) {
        setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setTouched(true);

    const pastedText = e.clipboardData.getData('text') || '';
    // Extract only numeric digits, max 11 digits
    const numericOnly = pastedText.replace(/\D/g, '').slice(0, 11);

    onChange(numericOnly);

    // If pasted text had prohibited non-digits or resulting length is not 11
    if (numericOnly.length !== 11 || /\D/.test(pastedText)) {
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
    } else {
      setInternalError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly strip any non-numeric characters and cap at 11 digits
    const rawVal = e.target.value;
    const numericOnly = rawVal.replace(/\D/g, '').slice(0, 11);

    onChange(numericOnly);

    if (touched) {
      if (numericOnly.length !== 11) {
        setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
      } else {
        setInternalError(null);
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (!isValidContactNumber(value)) {
      setInternalError(CONTACT_NUMBER_ERROR_MESSAGE);
    } else {
      setInternalError(null);
    }
  };

  const activeError = errorOverride || (touched && !isValid ? CONTACT_NUMBER_ERROR_MESSAGE : internalError);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block font-bold text-stone-700 text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showStatusIndicator && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition ${
              isValid
                ? 'bg-emerald-100 text-emerald-800'
                : value.length > 0
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-400'
            }`}
          >
            {value.length}/11 digits
          </span>
        )}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{11}"
          autoComplete="tel"
          maxLength={11}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium transition focus:outline-hidden ${
            activeError
              ? 'border-red-500 bg-red-50/20 text-red-950 focus:ring-2 focus:ring-red-400'
              : isValid
              ? 'border-emerald-500 bg-emerald-50/10 text-emerald-950 focus:ring-2 focus:ring-emerald-500'
              : 'border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600'
          } disabled:bg-stone-100 disabled:text-stone-500`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : activeError ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-stone-400" />
          )}
        </div>
      </div>

      {activeError ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span>{CONTACT_NUMBER_ERROR_MESSAGE}</span>
        </p>
      ) : helpText ? (
        <p className="text-[11px] text-stone-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
};
