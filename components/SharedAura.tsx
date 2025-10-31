import { useMemo } from "react";

import type { RenderAvatar } from "@/lib/types";

type SharedAuraProps = {
  active: boolean;
  participants: RenderAvatar[];
};

const POSITIONS = [
  { top: "18%", left: "22%", size: "22rem", color: "rgba(252, 211, 77, 0.12)" },
  { top: "32%", right: "18%", size: "24rem", color: "rgba(56, 189, 248, 0.14)" },
  { bottom: "20%", left: "38%", size: "26rem", color: "rgba(248, 113, 113, 0.12)" },
];

export function SharedAura({ active, participants }: SharedAuraProps) {
  const nodes = useMemo(() => POSITIONS, []);
  const dots = useMemo(() => participants.slice(0, 4), [participants]);
  const overflowCount = Math.max(0, participants.length - dots.length);

  return (
    <div
      className={`pointer-events-none absolute inset-0 transition duration-700 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      {nodes.map((node, index) => (
        <div
          key={index}
          className="absolute animate-breath rounded-full blur-3xl"
          style={{
            top: node.top,
            right: node.right,
            bottom: node.bottom,
            left: node.left,
            width: node.size,
            height: node.size,
            background: node.color,
          }}
        />
      ))}

      {active && dots.length > 0 && (
        <div className="absolute inset-x-0 top-12 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.62rem] uppercase tracking-[0.32em] text-slate-100/70 shadow-[0_14px_30px_rgba(10,18,35,0.35)]">
          {dots.map((avatar) => (
            <span
              key={avatar.id}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10"
            >
              <span
                className="h-3 w-3 rounded-full shadow-[0_0_10px_rgba(252,211,77,0.45)]"
                style={{ backgroundColor: avatar.color }}
              />
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="ml-2 text-[0.62rem] text-slate-100/70">+{overflowCount}</span>
          )}
        </div>
      )}
    </div>
  );
}
