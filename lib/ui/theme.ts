export type ThemeToken = {
  name: string;
  background: string;
  overlay: string;
  accent: string;
  secondary: string;
  text: string;
  subtleText: string;
  border: string;
};

export const THEME_TOKENS: Record<string, ThemeToken> = {
  twilight: {
    name: "Twilight",
    background: "linear-gradient(180deg, #0b1220 0%, #141d31 100%)",
    overlay: "rgba(11, 18, 32, 0.8)",
    accent: "#E8C877",
    secondary: "rgba(255,255,255,0.08)",
    text: "rgba(248, 250, 252, 0.96)",
    subtleText: "rgba(203, 213, 225, 0.75)",
    border: "rgba(255,255,255,0.12)",
  },
  dawn: {
    name: "Dawn",
    background: "linear-gradient(180deg, #f8ede1 0%, #f7d4c1 100%)",
    overlay: "rgba(255, 245, 235, 0.78)",
    accent: "#F6A87A",
    secondary: "rgba(255, 255, 255, 0.45)",
    text: "rgba(63, 35, 21, 0.92)",
    subtleText: "rgba(115, 71, 49, 0.7)",
    border: "rgba(115, 71, 49, 0.2)",
  },
  night: {
    name: "Night",
    background: "linear-gradient(180deg, #050716 0%, #0e1024 100%)",
    overlay: "rgba(5, 7, 22, 0.88)",
    accent: "#8EA5FF",
    secondary: "rgba(36, 39, 78, 0.5)",
    text: "rgba(230, 239, 255, 0.96)",
    subtleText: "rgba(176, 190, 228, 0.75)",
    border: "rgba(142, 165, 255, 0.35)",
  },
};

export const PASTEL_PALETTE = [
  "#F8DCA4",
  "#F9A8D4",
  "#A5B4FC",
  "#FECACA",
  "#BBF7D0",
  "#FBCFE8",
  "#FCD34D",
  "#FDE68A",
  "#C7D2FE",
  "#FDBA74",
  "#FCA5A5",
];
