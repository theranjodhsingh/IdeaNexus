import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'bg-[var(--color-accent)] text-white border-[var(--color-accent)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border-[var(--color-border-strong)] hover:border-[var(--color-text-subtle)]',
  ghost:
    'bg-transparent text-[var(--color-text-primary)] border-transparent hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border)]',
  danger:
    'bg-transparent text-[var(--color-danger)] border-[var(--color-border)] hover:bg-[var(--color-danger-soft)] hover:border-[var(--color-danger)]',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'nexus-focus whitespace-nowrap',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

export default Button;
