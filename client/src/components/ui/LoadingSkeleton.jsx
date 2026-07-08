export default function LoadingSkeleton({ className = '', count = 1 }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={['nexus-skeleton h-24 w-full', className].join(' ')}
        />
      ))}
    </div>
  );
}
