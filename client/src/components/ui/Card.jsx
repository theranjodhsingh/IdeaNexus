import { forwardRef } from 'react';

const Card = forwardRef(function Card(
  { children, className = '', hoverable = false, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6',
        hoverable
          ? 'transition-colors duration-150 hover:border-[var(--color-border-strong)]'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
