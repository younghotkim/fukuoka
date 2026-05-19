export function JapanFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="일본 국기"
    >
      <rect width="60" height="40" fill="#ffffff" />
      <circle cx="30" cy="20" r="12" fill="#bc002d" />
    </svg>
  );
}
