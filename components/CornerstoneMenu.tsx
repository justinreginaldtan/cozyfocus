import { AnimatePresence, motion } from "framer-motion";
import { X, Settings, Users, Info, Clock, Coffee, Droplets } from "lucide-react";
import { useState } from "react";

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
};

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
function PlayersContent({ participants }: { participants: Participant[] }) {
  return (
    <div className="h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-parchment mb-4">
        {participants.length === 1 ? "Just you for now" : "In the lounge together"}
      </h3>
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
function SettingsContent(props: Omit<CornerstoneMenuProps, "open" | "onClose" | "participants" | "onlineCount" | "displayName">) {
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
  const [activeTab, setActiveTab] = useState("settings");

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
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "settings" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab("players")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "players" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Users className="h-4 w-4" />
                  <span>Players</span>
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
              {activeTab === "settings" && <SettingsContent {...props} />}
              {activeTab === "players" && <PlayersContent participants={props.participants} />}
              {activeTab === "about" && <AboutContent onlineCount={props.onlineCount} displayName={props.displayName} />}
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
