"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useShallow } from "zustand/react/shallow";
import { Settings2 } from "lucide-react";

import { AmbientPlayer, AmbientPlayerHandle } from "@/components/AmbientPlayer";
import { AvatarDrawer } from "@/components/AvatarDrawer";
import { AvatarSprite } from "@/components/AvatarSprite";
import { PlayerListModal } from "@/components/PlayerListModal";
import { PomodoroPanel } from "@/components/PomodoroPanel";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { SharedAura } from "@/components/SharedAura";
import { Toast } from "@/components/Toast";
import { WelcomeModal } from "@/components/WelcomeModal";
import { supabase } from "@/lib/supabaseClient";
import type { AvatarPresence, RenderAvatar, TimerState } from "@/lib/types";
import {
  approach,
  createDisplayName,
  createGuestId,
  lerp,
  pickAvatarColor,
} from "@/lib/utils";
import { useUIStore } from "@/lib/state/uiStore";

type RemoteAvatarState = {
  color: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000;
const MOVE_SPEED = 0.65; // normalized units per second
const REMOTE_SMOOTHING = 0.18;
const PRESENCE_BROADCAST_INTERVAL_MS = 120;
const TIMER_BROADCAST_INTERVAL_MS = 1000;

const clampNormalized = (value: number) => Math.min(1, Math.max(0, value));
const IDENTITY_STORAGE_KEY = "cozyfocus.identity";
const INFO_PANEL_DISMISSED_KEY = "cozyfocus.infoPanelDismissed";

const createInitialTimerState = (
  mode: TimerState["mode"] = "solo",
  focusDuration: number = DEFAULT_FOCUS_DURATION_MS
): TimerState => ({
  mode,
  phase: "focus",
  remainingMs: focusDuration,
  isRunning: false,
  lastUpdatedAt: Date.now(),
});

export default function HomePage() {
  const [identity, setIdentity] = useState<{
    guestId: string;
    displayName: string;
    color: string;
  } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const displayName = identity?.displayName ?? "Settling Wanderer";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceReadyRef = useRef(false);

  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastPresenceBroadcastRef = useRef(0);
  const lastTimerBroadcastRef = useRef(0);

  const localPositionRef = useRef({ x: 0.5, y: 0.68 });
  const targetPositionRef = useRef({ x: 0.5, y: 0.68 });
  const remoteAvatarsRef = useRef<Map<string, RemoteAvatarState>>(new Map());

  const hoveredAvatarRef = useRef<string | null>(null);
  const syncingColorRef = useRef(false);

  const [avatars, setAvatars] = useState<RenderAvatar[]>([]);
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAvatarDrawerOpen, setIsAvatarDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const parallaxTargetRef = useRef({ x: 0, y: 0 });
  const parallaxFrameRef = useRef<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<string | undefined>(undefined);
  const [toastVisible, setToastVisible] = useState(false);
  const previousPresenceIdsRef = useRef<Set<string>>(new Set());

  const {
    avatarColor,
    setAvatarColor,
    ambientVolume,
    setAmbientVolume,
    focusSessionMinutes,
    setFocusSessionMinutes,
    breakSessionMinutes,
    setBreakSessionMinutes,
  } = useUIStore(
    useShallow((state) => ({
      avatarColor: state.avatarColor,
      setAvatarColor: state.setAvatarColor,
      ambientVolume: state.ambientVolume,
      setAmbientVolume: state.setAmbientVolume,
      focusSessionMinutes: state.focusSessionMinutes,
      setFocusSessionMinutes: state.setFocusSessionMinutes,
      breakSessionMinutes: state.breakSessionMinutes,
      setBreakSessionMinutes: state.setBreakSessionMinutes,
    }))
  );
  const focusDurationMs = focusSessionMinutes * 60 * 1000;
  const breakDurationMs = breakSessionMinutes * 60 * 1000;

  const [timerState, setTimerState] = useState<TimerState>(() =>
    createInitialTimerState("solo", focusDurationMs)
  );
  const timerRef = useRef<TimerState>(timerState);
  const sharedTimerSnapshotRef = useRef<TimerState | null>(null);
  const ambientPlayerRef = useRef<AmbientPlayerHandle | null>(null);

  useEffect(() => {
    hoveredAvatarRef.current = hoveredAvatarId;
  }, [hoveredAvatarId]);

  useEffect(() => {
    if (identity !== null) return;
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          guestId: string;
          displayName: string;
          color: string;
        };
        if (parsed?.guestId && parsed?.displayName && parsed?.color) {
          setIdentity(parsed);
          setShowWelcome(false);
          return;
        }
      } catch (error) {
        console.warn("Failed to parse stored identity", error);
      }
    }

    setIdentity({
      guestId: createGuestId(),
      displayName: createDisplayName(),
      color: pickAvatarColor(),
    });
    setShowWelcome(true);
  }, [identity]);

  useEffect(() => {
    if (!identity || typeof window === "undefined") return;
    if (showWelcome) return;
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  }, [identity, showWelcome]);

  // Check if info panel was previously dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(INFO_PANEL_DISMISSED_KEY);
    if (dismissed === "true") {
      setShowInfoPanel(false);
    }
  }, []);

  // Auto-detect system accessibility preferences
  useEffect(() => {
    if (typeof window === "undefined") return;

    const body = document.body;
    body.dataset.theme = "twilight"; // Fixed theme

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      body.dataset.motion = reducedMotionQuery.matches ? "reduced" : "full";
    };
    updateReducedMotion();
    reducedMotionQuery.addEventListener("change", updateReducedMotion);

    // Detect contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: more)");
    const updateContrast = () => {
      body.dataset.contrast = contrastQuery.matches ? "high" : "normal";
    };
    updateContrast();
    contrastQuery.addEventListener("change", updateContrast);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateReducedMotion);
      contrastQuery.removeEventListener("change", updateContrast);
    };
  }, []);

  // Sync identity.color → avatarColor only when a new identity loads (track by guestId)
  const hasSyncedIdentityColorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!identity?.color || !identity.guestId) return;
    // Only sync once per identity guestId to avoid loops
    if (hasSyncedIdentityColorRef.current === identity.guestId) return;
    if (identity.color.toLowerCase() !== avatarColor.toLowerCase()) {
      setAvatarColor(identity.color);
    }
    hasSyncedIdentityColorRef.current = identity.guestId;
  }, [identity?.guestId, setAvatarColor]); // Only depend on guestId changing (new identity), not color

  // Sync avatarColor → identity.color (when user changes avatar color via drawer/settings)
  useEffect(() => {
    if (!identity || syncingColorRef.current) return;
    if (identity.color.toLowerCase() === avatarColor.toLowerCase()) {
      return;
    }
    // Only update if colors don't match and we're not currently syncing
    syncingColorRef.current = true;
    setIdentity((prev) => {
      if (!prev) {
        syncingColorRef.current = false;
        return prev;
      }
      syncingColorRef.current = false;
      return { ...prev, color: avatarColor };
    });
  }, [avatarColor]); // Only depend on avatarColor, not identity

  useEffect(() => {
    timerRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    setTimerState((prev) => {
      if (prev.phase !== "focus") return prev;
      const targetRemaining = prev.isRunning
        ? Math.min(prev.remainingMs, focusDurationMs)
        : focusDurationMs;
      if (targetRemaining === prev.remainingMs) {
        return prev;
      }
      const next: TimerState = {
        ...prev,
        remainingMs: targetRemaining,
        lastUpdatedAt: Date.now(),
      };
      timerRef.current = next;
      if (next.mode === "shared") {
        sharedTimerSnapshotRef.current = next;
      }
      return next;
    });
  }, [focusDurationMs]);


  const updateTimerState = useCallback(
    (
      updater: (prev: TimerState) => TimerState,
      options: { broadcast?: boolean } = {}
    ) => {
      const shouldBroadcast = options.broadcast ?? true;
      const base = { ...timerRef.current };
      let next = updater(base);
      const stamped = { ...next, lastUpdatedAt: Date.now() };
      timerRef.current = stamped;
      setTimerState(stamped);
      if (shouldBroadcast && stamped.mode === "shared") {
        sharedTimerSnapshotRef.current = stamped;
        lastTimerBroadcastRef.current = stamped.lastUpdatedAt;
        channelRef.current?.send({
          type: "broadcast",
          event: "timer:update",
          payload: stamped,
        });
      }
      return stamped;
    },
    []
  );

  const ensureAmbientPlayback = useCallback(() => {
    void ambientPlayerRef.current?.ensurePlayback();
  }, []);

  const handleToggleMode = useCallback(() => {
    if (!identity || showWelcome) return;
    const requesterId = identity.guestId;
    const previousSnapshot = sharedTimerSnapshotRef.current;
    const next = updateTimerState(
      (prev) => {
        if (prev.mode === "shared") {
          return createInitialTimerState("solo", focusDurationMs);
        }
        const snapshot = sharedTimerSnapshotRef.current;
        if (snapshot) {
          return { ...snapshot, mode: "shared" };
        }
        return createInitialTimerState("shared", focusDurationMs);
      },
      { broadcast: false }
    );

    if (next.mode === "shared") {
      const hadSnapshot = Boolean(previousSnapshot);
      sharedTimerSnapshotRef.current = next;
      channelRef.current?.send({
        type: "broadcast",
        event: "timer:request-sync",
        payload: { requesterId },
      });

      if (!hadSnapshot) {
        channelRef.current?.send({
          type: "broadcast",
          event: "timer:update",
          payload: next,
        });
      }
    } else {
      sharedTimerSnapshotRef.current = null;
    }
  }, [focusDurationMs, identity, showWelcome, updateTimerState]);

  const handleStartStop = useCallback(() => {
    ensureAmbientPlayback();
    updateTimerState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));
  }, [ensureAmbientPlayback, updateTimerState]);

  const handleResetTimer = useCallback(() => {
    updateTimerState(
      (prev) => ({
        ...prev,
        phase: "focus",
        remainingMs: focusDurationMs,
        isRunning: false,
      }),
      { broadcast: true }
    );
  }, [focusDurationMs, updateTimerState]);

  const handleSkipPhase = useCallback(() => {
    updateTimerState((prev) => {
      const nextPhase = prev.phase === "focus" ? "break" : "focus";
      const duration =
        nextPhase === "focus" ? focusDurationMs : breakDurationMs;
      return {
        ...prev,
        phase: nextPhase,
        remainingMs: duration,
      };
    });
  }, [breakDurationMs, focusDurationMs, updateTimerState]);

  const setTargetFromPoint = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    targetPositionRef.current = {
      x: clampNormalized((clientX - rect.left) / rect.width),
      y: clampNormalized((clientY - rect.top) / rect.height),
    };
  }, []);

  const handleScenePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      ensureAmbientPlayback();
      setTargetFromPoint(event.clientX, event.clientY);
    },
    [ensureAmbientPlayback, setTargetFromPoint]
  );

  const handleScenePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.buttons & 1) === 1 || event.pointerType === "touch") {
        setTargetFromPoint(event.clientX, event.clientY);
      }
    },
    [setTargetFromPoint]
  );

  const handleHoverChange = useCallback((avatarId: string, hovering: boolean) => {
    setHoveredAvatarId((prev) => {
      if (hovering) {
        return avatarId;
      }
      return prev === avatarId ? null : prev;
    });
  }, []);

  // Establish Supabase realtime channel for presence and timer sync.
  useEffect(() => {
    if (!identity || showWelcome) {
      return;
    }

    const { guestId: resolvedGuestId, displayName: resolvedName, color: resolvedColor } = identity;

    const channel = supabase.channel("cozyfocus-room", {
      config: { presence: { key: resolvedGuestId } },
    });

    channelRef.current = channel;

    const handlePresenceSync = () => {
      const presenceState = channel.presenceState<AvatarPresence>();
      const nextRemotes = new Map<string, RemoteAvatarState>();
      const currentPresenceIds = new Set<string>();
      let participantCount = 0;

      Object.values(presenceState).forEach((connections) => {
        participantCount += connections.length;
        connections.forEach((presence) => {
          if (!presence?.id || presence.id === resolvedGuestId) return;
          currentPresenceIds.add(presence.id);
          const normalizedX = clampNormalized(presence.x);
          const normalizedY = clampNormalized(presence.y);
          const existing = remoteAvatarsRef.current.get(presence.id);
          nextRemotes.set(
            presence.id,
            existing
              ? {
                  ...existing,
                  color: presence.color,
                  name: presence.name ?? "Wanderer",
                  targetX: normalizedX,
                  targetY: normalizedY,
                }
              : {
                  color: presence.color,
                  name: presence.name ?? "Wanderer",
                  x: normalizedX,
                  y: normalizedY,
                  targetX: normalizedX,
                  targetY: normalizedY,
                }
          );
        });
      });

      // Detect joins and leaves (only after initial load)
      if (previousPresenceIdsRef.current.size > 0) {
        // Check for new joins
        currentPresenceIds.forEach((id) => {
          if (!previousPresenceIdsRef.current.has(id)) {
            const newcomer = nextRemotes.get(id);
            if (newcomer) {
              setToastMessage(`${newcomer.name} joined 💛`);
              setToastColor(newcomer.color);
              setToastVisible(true);
            }
          }
        });

        // Check for leaves
        previousPresenceIdsRef.current.forEach((id) => {
          if (!currentPresenceIds.has(id)) {
            const leaver = remoteAvatarsRef.current.get(id);
            if (leaver) {
              setToastMessage(`${leaver.name} left`);
              setToastColor(leaver.color);
              setToastVisible(true);
            }
          }
        });
      }

      previousPresenceIdsRef.current = currentPresenceIds;
      remoteAvatarsRef.current = nextRemotes;
      setOnlineCount(participantCount > 0 ? participantCount : 1);
    };

    channel.on("presence", { event: "sync" }, handlePresenceSync);

    channel.on("broadcast", { event: "timer:update" }, ({ payload }) => {
      if (!payload) return;
      const incoming = payload as TimerState;
      const normalized: TimerState = {
        ...incoming,
        mode: "shared",
        lastUpdatedAt: Date.now(),
      };
      sharedTimerSnapshotRef.current = normalized;
      if (timerRef.current.mode === "shared") {
        timerRef.current = normalized;
        setTimerState(normalized);
      }
    });

    channel.on("broadcast", { event: "timer:request-sync" }, () => {
      if (timerRef.current.mode === "shared") {
        const snapshot = { ...timerRef.current, lastUpdatedAt: Date.now() };
        sharedTimerSnapshotRef.current = snapshot;
        lastTimerBroadcastRef.current = snapshot.lastUpdatedAt;
        channel.send({
          type: "broadcast",
          event: "timer:update",
          payload: snapshot,
        });
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .track({
            id: resolvedGuestId,
            name: resolvedName,
            color: resolvedColor,
            x: localPositionRef.current.x,
            y: localPositionRef.current.y,
            updatedAt: Date.now(),
          })
          .then(() => {
            presenceReadyRef.current = true;
          });
      }
    });

    return () => {
      presenceReadyRef.current = false;
      channel.unsubscribe();
      channelRef.current = null;
      remoteAvatarsRef.current.clear();
    };
  }, [identity, setTimerState, showWelcome]);

  // Main animation loop: movement, presence broadcast, remote interpolation, timer ticking.
  useEffect(() => {
    if (!identity || showWelcome) {
      return;
    }

    const { guestId: resolvedGuestId, displayName: resolvedName, color: resolvedColor } = identity;

    const tick = (frameTime: number) => {
      const previous = lastFrameRef.current ?? frameTime;
      const deltaSeconds = Math.min(0.12, (frameTime - previous) / 1000);
      lastFrameRef.current = frameTime;

      const container = containerRef.current;
      const width =
        container?.clientWidth ??
        (typeof window !== "undefined" ? window.innerWidth : 1);
      const height =
        container?.clientHeight ??
        (typeof window !== "undefined" ? window.innerHeight : 1);

      const localPosition = localPositionRef.current;
      const target = targetPositionRef.current;

      if (deltaSeconds > 0) {
        localPosition.x = approach(
          localPosition.x,
          target.x,
          MOVE_SPEED * deltaSeconds
        );
        localPosition.y = approach(
          localPosition.y,
          target.y,
          MOVE_SPEED * deltaSeconds
        );
      }

      const nowMs = Date.now();
      if (
        presenceReadyRef.current &&
        channelRef.current &&
        nowMs - lastPresenceBroadcastRef.current > PRESENCE_BROADCAST_INTERVAL_MS
      ) {
        channelRef.current.track({
          id: resolvedGuestId,
          name: resolvedName,
          color: resolvedColor,
          x: localPosition.x,
          y: localPosition.y,
          updatedAt: nowMs,
        });
        lastPresenceBroadcastRef.current = nowMs;
      }

      const hoveredId = hoveredAvatarRef.current;
      const renderList: RenderAvatar[] = [
        {
          id: resolvedGuestId,
          color: resolvedColor,
          name: resolvedName,
          x: localPosition.x * width,
          y: localPosition.y * height,
          isSelf: true,
          isHovered: hoveredId === resolvedGuestId,
        },
      ];

      remoteAvatarsRef.current.forEach((avatar, id) => {
        avatar.x = lerp(avatar.x, avatar.targetX, REMOTE_SMOOTHING);
        avatar.y = lerp(avatar.y, avatar.targetY, REMOTE_SMOOTHING);
        renderList.push({
          id,
          color: avatar.color,
          name: avatar.name,
          x: avatar.x * width,
          y: avatar.y * height,
          isSelf: false,
          isHovered: hoveredId === id,
        });
      });

      setAvatars(renderList);

      const timer = timerRef.current;
      if (timer.isRunning) {
        const elapsed = nowMs - timer.lastUpdatedAt;
        if (elapsed >= 250) {
          let remaining = Math.max(0, timer.remainingMs - elapsed);
          let phase = timer.phase;
          if (remaining === 0) {
            phase = timer.phase === "focus" ? "break" : "focus";
            remaining =
              phase === "focus" ? focusDurationMs : breakDurationMs;
          }
          const updatedTimer: TimerState = {
            ...timer,
            remainingMs: remaining,
            phase,
            lastUpdatedAt: nowMs,
          };
          timerRef.current = updatedTimer;
          setTimerState(updatedTimer);
          if (
            updatedTimer.mode === "shared" &&
            nowMs - lastTimerBroadcastRef.current >=
              TIMER_BROADCAST_INTERVAL_MS
          ) {
            lastTimerBroadcastRef.current = nowMs;
            sharedTimerSnapshotRef.current = updatedTimer;
            channelRef.current?.send({
              type: "broadcast",
              event: "timer:update",
              payload: updatedTimer,
            });
          }
        }
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [breakDurationMs, focusDurationMs, identity, setTimerState, showWelcome]);

  const onlineLabel = `${onlineCount} online`;
  const sharedActive = timerState.mode === "shared" && !showWelcome;
  const sharedParticipants = useMemo(
    () => avatars.filter((avatar) => !avatar.isSelf),
    [avatars]
  );
  const playerList = useMemo(() => {
    const isSharedFocus =
      timerState.isRunning && timerState.phase === "focus" && sharedActive;
    const isSoloFocus =
      timerState.isRunning && timerState.phase === "focus" && !sharedActive;
    return avatars.map((avatar) => ({
      id: avatar.id,
      name: avatar.name,
      color: avatar.color,
      isSelf: avatar.isSelf,
      isFocusing: isSharedFocus || (isSoloFocus && avatar.isSelf),
    }));
  }, [avatars, sharedActive, timerState]);

  const handleWelcomeConfirm = useCallback(
    ({ displayName: nextName, color: nextColor }: { displayName: string; color: string }) => {
      const trimmedName = nextName.trim();
      if (!trimmedName) return;
      setIdentity((prev) => {
        const base = prev ?? {
          guestId: createGuestId(),
          displayName: trimmedName,
          color: nextColor,
        };
        const nextIdentity = {
          ...base,
          displayName: trimmedName,
          color: nextColor,
        };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(nextIdentity));
        }
        return nextIdentity;
      });
      setShowWelcome(false);
    },
    []
  );

  const handleDismissInfoPanel = useCallback(() => {
    setShowInfoPanel(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INFO_PANEL_DISMISSED_KEY, "true");
    }
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-twilight text-slate-100">
      <div
        ref={containerRef}
        className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center transition duration-500 ${
          showWelcome ? "pointer-events-none scale-[0.98] blur-[1.5px]" : ""
        }`}
        style={{ backgroundImage: "url('/lofi.gif')" }}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerDown}
        role="application"
        aria-label="Cozy shared space. Click to move your avatar."
        aria-hidden={showWelcome}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.85)_0%,rgba(15,23,42,0.55)_35%,rgba(15,23,42,0.85)_100%)] mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 -m-[30%] animate-aurora-drift bg-[radial-gradient(circle_at_22%_25%,rgba(251,191,36,0.14),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(96,165,250,0.2),transparent_55%),radial-gradient(circle_at_50%_75%,rgba(248,113,113,0.18),transparent_50%)] blur-[40px] opacity-85" />

        <div className="pointer-events-none absolute left-[18%] top-[12%] h-64 w-64 rounded-full bg-[#fcd34d1a] blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-[28%] h-72 w-72 rounded-full bg-[#38bdf81a] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[18%] left-[30%] h-80 w-80 rounded-full bg-[#f973af1a] blur-3xl" />

        <div className="absolute left-12 top-12 flex w-[min(360px,90vw)] flex-col gap-6 text-sm md:left-16 md:top-14">
          <button
            type="button"
            onClick={() => setIsPlayerModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-slate-100/85 shadow-glass-sm transition duration-200 hover:border-white/20 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <span className="h-2 w-2 rounded-full bg-twilight-ember/90 animate-pulse-soft shadow-[0_0_10px_rgba(252,211,77,0.65)]" />
            {onlineLabel}
          </button>
          {showInfoPanel && (
          <div className="relative rounded-glass border border-white/10 bg-[rgba(15,23,42,0.78)] p-6 shadow-glass-lg backdrop-blur-lounge">
            <button
              type="button"
              onClick={handleDismissInfoPanel}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-300/60 transition hover:bg-white/10 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Dismiss welcome panel"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold tracking-[0.08em] text-parchment md:text-xl">
              CozyFocus 🌙
            </h1>
            <p className="mt-3 text-xs tracking-[0.18em] text-slate-300/70">
              {onlineCount === 1
                ? "Just you for now"
                : `${onlineCount - 1} ${onlineCount === 2 ? 'other is' : 'others are'} focusing nearby`}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-100/80" style={{ lineHeight: 1.6 }}>
              A quiet space to study together.
              <br />
              Just you, soft music, and gentle company.
            </p>
            <p className="mt-4 text-xs tracking-[0.18em] text-slate-300/70">
              Hey there, {displayName} · Tap anywhere to wander 🌙
            </p>
          </div>
          )}
        </div>

        {/* Settings button - bottom left */}
        <button
          type="button"
          onClick={() => setIsSettingsDrawerOpen(true)}
          className="group absolute bottom-12 left-8 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100 shadow-glass-sm transition duration-150 hover:border-white/25 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:bottom-16 md:left-16"
        >
          <Settings2 className="h-4 w-4 transition duration-150 group-hover:text-[#E8C877]" />
          <span className="text-[0.68rem] uppercase tracking-[0.26em]">
            Settings
          </span>
        </button>

        {/* Music player - bottom center */}
        <div className="pointer-events-auto absolute bottom-8 left-1/2 w-full max-w-lg -translate-x-1/2 px-4 md:bottom-12">
          <AmbientPlayer
            ref={ambientPlayerRef}
            src="/lofi.mp3"
            songName="Lofi Study Beats"
          />
        </div>

        <SharedAura active={sharedActive} participants={avatars} />

        <div className="pointer-events-none absolute inset-0">
          {avatars.map((avatar) => (
            <AvatarSprite
              key={avatar.id}
              x={avatar.x}
              y={avatar.y}
              color={avatar.color}
              name={avatar.name}
              isSelf={avatar.isSelf}
              isHovered={avatar.isHovered}
              onHoverChange={(hovering) =>
                handleHoverChange(avatar.id, hovering)
              }
            />
          ))}
        </div>

        {/* Timer - top right */}
        <div className="absolute right-12 top-12 w-full max-w-xs md:right-16 md:top-14">
          <PomodoroPanel
            mode={timerState.mode}
            phase={timerState.phase}
            remainingMs={timerState.remainingMs}
            focusDurationMs={focusDurationMs}
            breakDurationMs={breakDurationMs}
            isRunning={timerState.isRunning}
            onToggleMode={handleToggleMode}
            onStartStop={handleStartStop}
            onReset={handleResetTimer}
            onSkipPhase={handleSkipPhase}
            sharedActive={sharedActive}
            companionCount={onlineCount}
            sharedParticipants={sharedParticipants.map(({ id, color }) => ({ id, color }))}
          />
        </div>
      </div>
      <PlayerListModal
        open={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        participants={playerList}
      />
      <AvatarDrawer
        open={isAvatarDrawerOpen}
        onClose={() => setIsAvatarDrawerOpen(false)}
        initialColor={avatarColor}
        onSave={(hex) => setAvatarColor(hex)}
        onRandomize={() => pickAvatarColor()}
      />
      <SettingsDrawer
        open={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        ambientVolume={ambientVolume}
        onAmbientVolumeChange={setAmbientVolume}
        focusSessionMinutes={focusSessionMinutes}
        onFocusSessionChange={setFocusSessionMinutes}
        breakSessionMinutes={breakSessionMinutes}
        onBreakSessionChange={setBreakSessionMinutes}
      />
      {identity && (
        <WelcomeModal
          open={showWelcome}
          initialName={identity.displayName}
          initialColor={identity.color}
          onConfirm={handleWelcomeConfirm}
        />
      )}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        color={toastColor}
        duration={3000}
      />
    </main>
  );
}
