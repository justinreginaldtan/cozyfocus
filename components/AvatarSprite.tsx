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

  return (
    <div
      className={`avatar avatar-sprite${isSelf ? " avatar--self" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      aria-labelledby={labelId}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      tabIndex={0}
    >
      <svg
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
        className={`avatar-label${isHovered ? " avatar-label--visible" : ""}`}
      >
        {name}
      </div>
    </div>
  );
}

// Memoizing keeps React from re-rendering the sprite unless visual props change.
export const AvatarSprite = memo(AvatarSpriteComponent);
