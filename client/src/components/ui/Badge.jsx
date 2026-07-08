const VARIANT_CLASSES = {
  default:
    'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  accent:
    'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-transparent',
  amber:
    'bg-[var(--color-amber-soft)] text-[var(--color-amber)] border-transparent',
  danger:
    'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-transparent',
  outline:
    'bg-transparent text-[var(--color-text-primary)] border-[var(--color-border)]',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...rest
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
