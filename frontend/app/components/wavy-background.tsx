export function WavyBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute -left-1/4 top-0 h-full w-[150%] opacity-[0.06] sm:opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="monad-waves"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 60 Q30 40 60 60 T120 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-900"
            />
            <path
              d="M0 80 Q30 60 60 80 T120 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-900"
            />
            <path
              d="M0 100 Q30 80 60 100 T120 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-900"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#monad-waves)" />
      </svg>
    </div>
  );
}
