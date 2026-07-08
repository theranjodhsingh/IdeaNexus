import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightSlot,
    id,
    className = '',
    inputClassName = '',
    ...rest
  },
  ref,
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  const hasError = Boolean(error);
  return (
    <div className={['flex flex-col gap-1.5 w-full', className].join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {label}
        </label>
      )}
      <div
        className={[
          'flex items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--color-surface-2)] px-3 transition-colors',
          hasError
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)]',
        ].join(' ')}
      >
        {leftIcon && (
          <span className="shrink-0 text-[var(--color-text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-transparent py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:outline-none',
            inputClassName,
          ].join(' ')}
          {...rest}
        />
        {rightSlot && (
          <span className="shrink-0 text-[var(--color-text-muted)]">
            {rightSlot}
          </span>
        )}
      </div>
      {(error || hint) && (
        <p
          className={[
            'text-xs',
            hasError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Input;
