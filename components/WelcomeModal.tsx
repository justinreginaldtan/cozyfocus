import { useEffect, useMemo, useRef, useState } from "react";

import { COZY_AVATAR_COLORS } from "@/lib/utils";

type WelcomeModalProps = {
  open: boolean;
  initialName: string;
  initialColor: string;
  onConfirm: (identity: { displayName: string; color: string }) => void;
};

const COLOR_NAMES: Record<string, string> = {
  "#FDE68A": "Sun Glow",
  "#FCA5A5": "Dusk Rose",
  "#BFDBFE": "Sky Mist",
  "#C4B5FD": "Twilight Lilac",
  "#BBF7D0": "Fern Whisper",
  "#FBCFE8": "Petal Haze",
  "#FDBA74": "Amber Ember",
  "#A5F3FC": "Lagoon Drift",
};

export function WelcomeModal({ open, initialName, initialColor, onConfirm }: WelcomeModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
  }, [initialName, initialColor]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const disabled = useMemo(() => name.trim().length === 0, [name]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm({ displayName: trimmed, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,14,24,0.78)] backdrop-blur-[22px]">
      <div className="pointer-events-none absolute inset-0 -m-[30%] animate-aurora-drift bg-[radial-gradient(circle_at_22%_25%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(96,165,250,0.22),transparent_55%),radial-gradient(circle_at_50%_75%,rgba(248,113,113,0.2),transparent_50%)] blur-[48px] opacity-90" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[min(92vw,420px)] space-y-6 rounded-glass border border-white/15 bg-[rgba(15,23,42,0.95)] p-8 shadow-glass-lg backdrop-blur-lounge"
      >
        <header className="space-y-2 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-slate-100/70">Welcome</span>
          <h2 className="text-2xl font-semibold tracking-[0.06em] text-parchment md:text-3xl">
            Settle into the lounge
          </h2>
          <p className="text-sm leading-relaxed text-slate-100/80">
            Choose the name and glow you want to bring into tonight’s study circle.
          </p>
        </header>

        <div className="space-y-3">
          <label className="block text-left text-xs uppercase tracking-[0.28em] text-slate-200/70">
            Display Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Soft Birch"
            className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-300/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            maxLength={40}
          />
        </div>

        <fieldset className="space-y-3 text-left">
          <legend className="text-xs uppercase tracking-[0.28em] text-slate-200/70">
            Avatar Glow
          </legend>
          <div className="grid grid-cols-4 gap-3">
            {COZY_AVATAR_COLORS.map((option) => {
              const selected = option === color;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`group relative flex h-16 flex-col items-center justify-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    selected
                      ? "border-white/60 bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                  }`}
                  aria-pressed={selected}
                >
                  <span
                    className="mb-1 h-6 w-6 rounded-full"
                    style={{ backgroundColor: option }}
                  />
                  <span className="text-[0.65rem] font-medium tracking-[0.15em] text-slate-100/80">
                    {COLOR_NAMES[option] ?? "Glow"}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2 text-center text-[0.75rem] leading-relaxed text-slate-100/70">
          <p>We keep this space kind. Choose a name you feel cozy carrying.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enter the lounge
          </button>
          <span className="text-center text-[0.68rem] uppercase tracking-[0.32em] text-slate-200/60">
            Press Enter to continue
          </span>
        </div>
      </form>
    </div>
  );
}
