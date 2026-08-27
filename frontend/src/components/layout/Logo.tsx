export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span translate="no" className={`font-display text-[21px] font-bold leading-none tracking-tight ${className}`}>
      Budget<span className="text-brand">X</span>
    </span>
  );
}

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#10B981" />
      <path d="M10 22.5V9.5h6.2a3.9 3.9 0 0 1 0 7.8H10" stroke="#06251C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="m18.2 20.4 6-6m0 0h-4.6m4.6 0v4.6" stroke="#06251C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
