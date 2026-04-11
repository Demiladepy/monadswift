type MonadLogoProps = {
  className?: string;
  size?: number;
};

export function MonadLogo({ className = "", size = 36 }: MonadLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="var(--color-monad, #7b52ff)" />
      <path
        d="M11 27V13h4.4l4.6 7.8 4.6-7.8H29v14h-3.8V17.2L19.8 27h-2.1l-5.4-9.8V27H11z"
        fill="white"
      />
    </svg>
  );
}
