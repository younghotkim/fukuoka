// Torii (鳥居) gate spinner — a small SVG that rotates while loading.
// Drop-in replacement for <Loader2 /> when we want a Japanese motif.

export function ToriiSpinner({ size = 16 }: { size?: number }) {
  return (
    <span className="torii-spinner" style={{ width: size, height: size }} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* upper crossbar (kasagi) */}
        <path d="M3 6 L21 6 L19 4 L5 4 Z" fill="currentColor" stroke="none" />
        {/* lower crossbar (nuki) */}
        <line x1="5" y1="10" x2="19" y2="10" />
        {/* two pillars (hashira) */}
        <line x1="7" y1="6" x2="7" y2="21" />
        <line x1="17" y1="6" x2="17" y2="21" />
      </svg>
    </span>
  );
}
