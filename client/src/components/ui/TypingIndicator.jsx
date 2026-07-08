export default function TypingIndicator({ label = 'Nexus is thinking' }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      <span className="flex items-center">
        <span className="nexus-typing-dot" />
        <span className="nexus-typing-dot" />
        <span className="nexus-typing-dot" />
      </span>
      <span>{label}</span>
    </div>
  );
}
