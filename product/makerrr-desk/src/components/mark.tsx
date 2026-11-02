export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="8" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16" y="10" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8 V4 H23 V10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
