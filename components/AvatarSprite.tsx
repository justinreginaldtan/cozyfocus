import { memo, useMemo } from "react";

type AvatarSpriteProps = {
  x: number;
  y: number;
  color: string;
  name: string;
  isSelf: boolean;
  isHovered: boolean;
  onHoverChange?: (hovered: boolean) => void;
};

const FACE_SHADOW = "rgba(15, 23, 42, 0.18)";

function AvatarSpriteComponent({
  x,
  y,
  color,
  name,
  isSelf,
  isHovered,
  onHoverChange,
}: AvatarSpriteProps) {
  const labelId = useMemo(() => `${name.replace(/\s+/g, "-")}-label`, [name]);

  const filter = isSelf
    ? "drop-shadow(0 16px 34px rgba(252, 211, 77, 0.55))"
    : "drop-shadow(0 12px 24px rgba(15, 23, 42, 0.35))";

  return (
    <div
      className={`absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 transform transition duration-200 hover:scale-[1.05] focus-visible:scale-[1.05] focus-visible:outline-none`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        filter,
      }}
      aria-labelledby={labelId}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      tabIndex={0}
    >
      <svg
        className="animate-breath"
        width="56"
        height="64"
        viewBox="0 0 56 64"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="blur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <g filter="url(#blur)">
          <ellipse
            cx="28"
            cy="58"
            rx="16"
            ry="4"
            fill={FACE_SHADOW}
            opacity="0.5"
          />
        </g>
        <rect
          x="14"
          y="18"
          width="28"
          height="32"
          rx="14"
          fill="url(#bodyGradient)"
        />
        <circle cx="28" cy="18" r="16" fill={color} />
        <circle cx="20.5" cy="18.5" r="3" fill="#0f172a" />
        <circle cx="35.5" cy="18.5" r="3" fill="#0f172a" />
        <path
          d="M22 25 C25 28, 31 28, 34 25"
          stroke="#0f172a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <rect
          x="6"
          y="30"
          width="10"
          height="18"
          rx="5"
          fill={color}
          opacity="0.65"
        />
        <rect
          x="40"
          y="30"
          width="10"
          height="18"
          rx="5"
          fill={color}
          opacity="0.65"
        />
      </svg>
      <div
        id={labelId}
        className={`pointer-events-none absolute bottom-[70px] left-1/2 -translate-x-1/2 rounded-full bg-[rgba(15,23,42,0.9)] px-2.5 py-1 text-[0.72rem] font-medium text-slate-50 shadow-[0_12px_24px_rgba(10,18,35,0.45)] transition duration-200 ${
          isHovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {name}
      </div>
    </div>
  );
}

// Memoizing keeps React from re-rendering the sprite unless visual props change.
export const AvatarSprite = memo(AvatarSpriteComponent);
