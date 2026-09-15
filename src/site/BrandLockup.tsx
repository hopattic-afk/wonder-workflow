type Variant = "paper" | "ink";

export function BrandLockup({
  variant = "paper",
  className = "ww-brand-lockup",
}: {
  variant?: Variant;
  className?: string;
}) {
  const text = variant === "ink" ? "#FAFAF8" : "#20232B";
  return (
    <svg
      className={className}
      viewBox="0 0 753 287"
      role="img"
      aria-label="Wonder & Workflow"
      data-variant={variant}
    >
      {variant === "ink" ? (
        <rect width="753" height="287" fill="#20232B" />
      ) : null}
      <g
        fontFamily="IBM Plex Sans, Inter, system-ui, sans-serif"
        fontWeight={600}
        fontSize={100}
        fill={text}
      >
        <text x="257" y="126">
          Wonder &amp;
        </text>
        <text x="257" y="234">
          Workflow
        </text>
      </g>
      <g fill="#7BA1AF">
        <rect x="48" y="178.23" width="60.77" height="60.77" />
        <rect x="113.11" y="113.11" width="60.77" height="60.77" />
        <rect x="178.23" y="48" width="60.77" height="60.77" />
      </g>
    </svg>
  );
}

export function BrandAvatar({
  className = "ww-brand-avatar",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 124 124"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="#7BA1AF">
        <rect x="18" y="78" width="28" height="28" />
        <rect x="48" y="48" width="28" height="28" />
        <rect x="78" y="18" width="28" height="28" />
      </g>
    </svg>
  );
}
