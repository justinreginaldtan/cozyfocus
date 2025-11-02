import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeVariant = "twilight" | "dawn" | "night";
export type SessionPreset = 15 | 25 | 50;

type UIState = {
  theme: ThemeVariant;
  ambientVolume: number;
  focusSessionMinutes: SessionPreset;
  reducedMotion: boolean;
  highContrast: boolean;
  avatarColor: string;
  ambientPlaying: boolean;
  setTheme: (theme: ThemeVariant) => void;
  setAmbientVolume: (volume: number) => void;
  setFocusSessionMinutes: (minutes: SessionPreset) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setAvatarColor: (hex: string) => void;
  setAmbientPlaying: (playing: boolean) => void;
};

const DEFAULTS: Pick<
  UIState,
  | "theme"
  | "ambientVolume"
  | "focusSessionMinutes"
  | "reducedMotion"
  | "highContrast"
  | "avatarColor"
> = {
  theme: "twilight",
  ambientVolume: 0.65,
  focusSessionMinutes: 25,
  reducedMotion: false,
  highContrast: false,
  avatarColor: "#F8DCA4",
};

// Cached server snapshot to avoid infinite loops
const serverSnapshot: UIState = {
  ...DEFAULTS,
  ambientPlaying: false,
  setTheme: () => {},
  setAmbientVolume: () => {},
  setFocusSessionMinutes: () => {},
  setReducedMotion: () => {},
  setHighContrast: () => {},
  setAvatarColor: () => {},
  setAmbientPlaying: () => {},
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      ambientPlaying: false,
      setTheme: (theme) => set({ theme }),
      setAmbientVolume: (ambientVolume) =>
        set({
          ambientVolume: Math.max(0, Math.min(1, ambientVolume)),
        }),
      setFocusSessionMinutes: (focusSessionMinutes) =>
        set({ focusSessionMinutes }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setAmbientPlaying: (ambientPlaying) => set({ ambientPlaying }),
    }),
    {
      name: "cozyfocus.ui",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Add cached getServerSnapshot for React 19 useSyncExternalStore
// @ts-ignore - Adding getServerSnapshot for SSR support
useUIStore.getServerSnapshot = () => serverSnapshot;
