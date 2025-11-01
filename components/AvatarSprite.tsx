import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type CompanionState = "idle" | "shared" | "break" | "complete";

type AvatarSpriteProps = {
  x: number;
  y: number;
  color: string;
  name: string;
  isSelf: boolean;
  isHovered: boolean;
  onHoverChange?: (hovered: boolean) => void;
  spiritState?: CompanionState;
};

const CANVAS_SIZE = 32;
const DISPLAY_SCALE = 4;
const DISPLAY_SIZE = CANVAS_SIZE * DISPLAY_SCALE;

const PALETTE = {
  base: "#d8b7ff",
  highlight: "#f7b7b7",
  aura: "#f9d7a5",
};

const OUTLINE = "#7e5cbc";
const SHADOW_COLOR = "rgba(90, 62, 128, 0.18)";

const FRAME_SEQUENCE = [0, 1, 2];
const FRAME_DURATION_MS = 320;

const STATE_CONFIG: Record<
  CompanionState,
  {
    floatDistance: number;
    floatDuration: number;
    flickerMin: number;
    flickerMax: number;
    brightness: number;
  }
> = {
  idle: {
    floatDistance: 2,
    floatDuration: 4,
    flickerMin: 0.94,
    flickerMax: 1,
    brightness: 1,
  },
  shared: {
    floatDistance: 2.2,
    floatDuration: 3.4,
    flickerMin: 0.96,
    flickerMax: 1.06,
    brightness: 1.08,
  },
  break: {
    floatDistance: 1.6,
    floatDuration: 4.6,
    flickerMin: 0.92,
    flickerMax: 0.98,
    brightness: 0.93,
  },
  complete: {
    floatDistance: 2.4,
    floatDuration: 3.2,
    flickerMin: 0.98,
    flickerMax: 1.08,
    brightness: 1.12,
  },
};

const FRAME_SETTINGS = [
  { offsetY: -1, highlightBias: 1 },
  { offsetY: 0, highlightBias: 0.9 },
  { offsetY: 1, highlightBias: 1.1 },
];

function hexToRgba(hex: string, alpha = 255) {
  const normalized = hex.replace("#", "");
  const intVal = parseInt(normalized, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
    a: alpha,
  };
}

function setPixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  rgb: { r: number; g: number; b: number; a?: number }
) {
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
  const index = (y * CANVAS_SIZE + x) * 4;
  data[index] = rgb.r;
  data[index + 1] = rgb.g;
  data[index + 2] = rgb.b;
  data[index + 3] = rgb.a ?? 255;
}

function drawFrame(ctx: CanvasRenderingContext2D, frameIndex: number, blink: boolean) {
  const { offsetY, highlightBias } = FRAME_SETTINGS[frameIndex];
  const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;

  const centerX = 16;
  const centerY = 16 + offsetY;
  const bodyRadius = 9.5;

  const baseColor = hexToRgba(PALETTE.base);
  const highlightColor = hexToRgba(PALETTE.highlight);
  const auraColor = hexToRgba(PALETTE.aura, 120);
  const outlineColor = hexToRgba(OUTLINE);

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const dx = x - centerX;
      const dy = y - centerY;

      const normalizedY = dy / bodyRadius;
      const topTaper = normalizedY < 0 ? Math.abs(normalizedY) * 4 : 0;
      const tailFactor = normalizedY > 0.3 ? (normalizedY - 0.3) * 3 : 0;
      const effectiveRadius = bodyRadius - topTaper + tailFactor;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= effectiveRadius + 2.2) {
        setPixel(data, x, y, auraColor);
      }

      if (distance <= effectiveRadius) {
        let color = baseColor;

        if (distance >= effectiveRadius - 0.6) {
          color = outlineColor;
        } else if (dx + dy * highlightBias < -4 && dy < 1) {
          color = highlightColor;
        } else if (distance <= effectiveRadius * 0.55 && dy < 0) {
          color = highlightColor;
        }

        setPixel(data, x, y, color);
      }
    }
  }

  // Wisp tail pixels
  setPixel(data, centerX - 1, centerY + 9, baseColor);
  setPixel(data, centerX, centerY + 10, baseColor);
  setPixel(data, centerX + 1, centerY + 11, outlineColor);

  if (blink) {
    for (let ix = 0; ix < 4; ix++) {
      setPixel(data, 13 + ix, centerY - 1, outlineColor);
      setPixel(data, 19 + ix, centerY - 1, outlineColor);
    }
  } else {
    setPixel(data, 14, centerY - 2, outlineColor);
    setPixel(data, 14, centerY - 1, outlineColor);
    setPixel(data, 20, centerY - 2, outlineColor);
    setPixel(data, 20, centerY - 1, outlineColor);
  }

  ctx.putImageData(imageData, 0, 0);
}

function AvatarSpriteComponent({
  x,
  y,
  name,
  isHovered,
  onHoverChange,
  spiritState = "idle",
}: AvatarSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [blink, setBlink] = useState(false);
  const labelId = useMemo(() => `${name.replace(/\s+/g, "-")}-label`, [name]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawFrame(ctx, FRAME_SEQUENCE[frameIndex], blink);
  }, [frameIndex, blink]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAME_SEQUENCE.length);
    }, FRAME_DURATION_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setBlink(true);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setBlink(false);
      }, 140);
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const stateStyle = STATE_CONFIG[spiritState];

  const containerStyle: CSSProperties = {
    left: `${x}px`,
    top: `${y}px`,
    filter: `brightness(${stateStyle.brightness})`,
  };
  (containerStyle as any)["--float-distance"] = `${stateStyle.floatDistance}px`;
  (containerStyle as any)["--float-duration"] = `${stateStyle.floatDuration}s`;
  (containerStyle as any)["--flicker-min"] = stateStyle.flickerMin;
  (containerStyle as any)["--flicker-max"] = stateStyle.flickerMax;

  return (
    <div
      className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 transform transition duration-200 hover:scale-[1.05] focus-visible:scale-[1.05] focus-visible:outline-none"
      style={containerStyle}
      aria-labelledby={labelId}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      tabIndex={0}
    >
      <div className="focus-spirit__motion">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            width: DISPLAY_SIZE,
            height: DISPLAY_SIZE,
            imageRendering: "pixelated",
          }}
          className="focus-spirit__canvas"
          aria-hidden="true"
        />
      </div>
      <span className="focus-spirit__shadow" aria-hidden="true" />
      <div
        id={labelId}
        className={`pointer-events-none absolute bottom-[70px] left-1/2 -translate-x-1/2 rounded-full bg-[rgba(15,23,42,0.9)] px-2.5 py-1 text-[0.72rem] font-medium text-slate-50 shadow-[0_12px_24px_rgba(10,18,35,0.45)] transition duration-200 ${
          isHovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {name}
      </div>
      <style jsx>{`
        .focus-spirit__motion {
          display: flex;
          justify-content: center;
          animation: focusSpiritFloat var(--float-duration, 4s) ease-in-out infinite;
        }

        .focus-spirit__canvas {
          animation: focusSpiritFlicker 2.4s ease-in-out infinite;
        }

        .focus-spirit__shadow {
          display: block;
          width: 40px;
          height: 3px;
          margin: 6px auto 0;
          border-radius: 9999px;
          background: ${SHADOW_COLOR};
        }

        @keyframes focusSpiritFloat {
          0%,
          100% {
            transform: translateY(calc(var(--float-distance, 2px) * -1));
          }
          50% {
            transform: translateY(var(--float-distance, 2px));
          }
        }

        @keyframes focusSpiritFlicker {
          0%,
          100% {
            opacity: var(--flicker-max, 1);
          }
          60% {
            opacity: var(--flicker-min, 0.94);
          }
        }
      `}</style>
    </div>
  );
}

export const AvatarSprite = memo(AvatarSpriteComponent);
