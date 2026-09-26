export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#b3001b" />
        </linearGradient>
      </defs>
      <path d="M32 4 56 16v20c0 12-10 21-24 24C18 57 8 48 8 36V16Z" fill="url(#logo-g)" />
      <path d="m22 33 7 7 14-15" fill="none" stroke="#fef3c7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
