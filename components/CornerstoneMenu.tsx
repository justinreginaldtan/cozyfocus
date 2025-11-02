import { AnimatePresence, motion } from "framer-motion";
import { X, Settings, Users, Info, Clock, Coffee, Droplets, UserCircle, LayoutGrid, Palette } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { COZY_AVATAR_COLORS } from "@/lib/utils";

// Props for the Players tab
type Participant = {
  id: string;
  name: string;
  color: string;
  isSelf?: boolean;
  isFocusing?: boolean;
};

// Combined props for the entire menu
type CornerstoneMenuProps = {
  open: boolean;
  onClose: () => void;
  // Settings props
  ambientVolume: number;
  onAmbientVolumeChange: (value: number) => void;
  focusSessionMinutes: number;
  onFocusSessionChange: (minutes: number) => void;
  breakSessionMinutes: number;
  onBreakSessionChange: (minutes: number) => void;
  // Players props
  participants: Participant[];
  // About props
  onlineCount: number;
  displayName: string;
  // Avatar props
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

// Avatar Tab Content
function AvatarContent({ initialName, initialColor, onConfirm, onClose }: Omit<CornerstoneMenuProps, 'open'>) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm({ displayName: trimmed, color });
    onClose(); // Close menu on save
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-4">
        <h3 className="text-lg font-semibold text-parchment mb-4">Your Appearance</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-left text-xs uppercase tracking-[0.28em] text-slate-200/70">
              Display Name
            </label>
            <input
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        </div>
      </div>
      <footer className="mt-6 flex-shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={name.trim().length === 0}
          className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Changes
        </button>
      </footer>
    </div>
  );
}


// About Tab Content
function AboutContent({ onlineCount, displayName }: { onlineCount: number; displayName: string }) {
  return (
    <div className="text-slate-300/90 leading-relaxed">
      <h3 className="text-lg font-semibold text-parchment">CozyFocus 🌙</h3>
      <p className="mt-4 text-sm" style={{ lineHeight: 1.7 }}>
        A quiet space to study together.
        <br />
        Just you, soft music, and gentle company.
      </p>
      <p className="mt-4 text-xs tracking-[0.18em] text-slate-300/70">
        {onlineCount === 1
          ? "Just you for now"
          : `${onlineCount - 1} ${onlineCount === 2 ? "other is" : "others are"} focusing nearby`}
      </p>
      <p className="mt-8 text-sm">
        Hey there, {displayName} · Tap anywhere to wander 🌙
      </p>
    </div>
  );
}

// Players Tab Content
function PlayersContent({ participants, onlineCount }: { participants: Participant[], onlineCount: number }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-parchment">
          {participants.length === 1 ? "Just you for now" : "In the lounge together"}
        </h3>
        <p className="text-xs text-slate-300/70">{onlineCount} {onlineCount === 1 ? 'person' : 'people'} online</p>
      </div>
      <ul className="space-y-3">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90 transition duration-150 hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <span
                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-800/80"
              >
                <span
                  className="absolute inset-0 opacity-50 blur-md"
                  style={{ backgroundColor: participant.color }}
                />
                <span
                  className="relative h-3 w-3 rounded-full"
                  style={{ background: participant.color }}
                />
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-slate-100">
                  {participant.name}
                  {participant.isSelf && (
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-slate-200">
                      You
                    </span>
                  )}
                </span>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-300/70">
                  {participant.isFocusing ? "Focusing" : "Drifting"}
                </span>
              </div>
            </div>
            <motion.span
              className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(252,211,119,0.55)]"
              style={{
                background: participant.isFocusing ? "#E8C877" : "#94a3b8",
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Settings Tab Content
function SettingsContent(props: Omit<CornerstoneMenuProps, 'open' | 'onClose' | 'participants' | 'onlineCount' | 'displayName' | 'initialName' | 'initialColor' | 'onConfirm'>) {
  return (
    <div className="h-full overflow-y-auto pr-4 text-sm">
      <section className="space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Ambient Volume</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Droplets className="h-3.5 w-3.5" />
              Ambient
            </span>
            <span>{Math.round(props.ambientVolume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={props.ambientVolume}
            onChange={(e) => props.onAmbientVolumeChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
      <section className="mt-8 space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Focus Time</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Clock className="h-3.5 w-3.5" />
              Focus
            </span>
            <span>{props.focusSessionMinutes} min</span>
          </div>
          <input
            type="range" min={5} max={90} step={5} value={props.focusSessionMinutes}
            onChange={(e) => props.onFocusSessionChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
      <section className="mt-6 space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Break Time</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Coffee className="h-3.5 w-3.5" />
              Break
            </span>
            <span>{props.breakSessionMinutes} min</span>
          </div>
          <input
            type="range" min={1} max={30} step={1} value={props.breakSessionMinutes}
            onChange={(e) => props.onBreakSessionChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
    </div>
  );
}

export function CornerstoneMenu(props: CornerstoneMenuProps) {
  const [activeTab, setActiveTab] = useState("players");

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          key="cornerstone-menu"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={props.onClose}
        >
          <motion.div
            className="relative flex h-[min(600px,90vh)] w-[min(800px,94vw)] flex-col rounded-glass border border-white/10 bg-slate-900/60 shadow-glass-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("players")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "players" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Users className="h-4 w-4" />
                  <span>Players</span>
                </button>
                <button
                  onClick={() => setActiveTab("avatar")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "avatar" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Palette className="h-4 w-4" />
                  <span>Avatar</span>
                </button>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "account" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <UserCircle className="h-4 w-4" />
                  <span>Account</span>
                </button>
                <button
                  onClick={() => setActiveTab("lobbies")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "lobbies" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <LayoutGrid className="h-4 w-4" />
                  <span>Lobbies</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "settings" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "about" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </button>
              </div>
              <button
                onClick={props.onClose}
                className="rounded-full p-2 text-slate-300/70 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <main className="flex-1 overflow-hidden p-6">
              {activeTab === "players" && <PlayersContent participants={props.participants} onlineCount={props.onlineCount} />}
              {activeTab === "avatar" && <AvatarContent {...props} />}
              {activeTab === "account" && <div className="text-slate-400">Account features coming soon.</div>}
              {activeTab === "lobbies" && <div className="text-slate-400">Lobby switching coming soon.</div>}
              {activeTab === "about" && <AboutContent onlineCount={props.onlineCount} displayName={props.displayName} />}
              {activeTab === "settings" && <SettingsContent {...props} />}
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
