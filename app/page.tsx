"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { AvatarSprite } from "@/components/AvatarSprite";
import { PomodoroPanel } from "@/components/PomodoroPanel";
import { SharedAura } from "@/components/SharedAura";
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

type RemoteAvatarState = {
  color: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

const FOCUS_DURATION_MS = 25 * 60 * 1000;
const BREAK_DURATION_MS = 5 * 60 * 1000;

const MOVE_SPEED = 0.65; // normalized units per second
const REMOTE_SMOOTHING = 0.18;
const PRESENCE_BROADCAST_INTERVAL_MS = 120;
const TIMER_BROADCAST_INTERVAL_MS = 1000;

const clampNormalized = (value: number) => Math.min(1, Math.max(0, value));
const IDENTITY_STORAGE_KEY = "cozyfocus.identity";

const createInitialTimerState = (mode: TimerState["mode"] = "solo"): TimerState => ({
  mode,
  phase: "focus",
  remainingMs: FOCUS_DURATION_MS,
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

  const [avatars, setAvatars] = useState<RenderAvatar[]>([]);
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);

  const [timerState, setTimerState] = useState<TimerState>(() =>
    createInitialTimerState("solo")
  );
  const timerRef = useRef<TimerState>(timerState);
  const sharedTimerSnapshotRef = useRef<TimerState | null>(null);

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

  useEffect(() => {
    timerRef.current = timerState;
  }, [timerState]);

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

  const handleToggleMode = useCallback(() => {
    if (!identity || showWelcome) return;
    const requesterId = identity.guestId;
    const previousSnapshot = sharedTimerSnapshotRef.current;
    const next = updateTimerState(
      (prev) => {
        if (prev.mode === "shared") {
          return createInitialTimerState("solo");
        }
        const snapshot = sharedTimerSnapshotRef.current;
        if (snapshot) {
          return { ...snapshot, mode: "shared" };
        }
        return createInitialTimerState("shared");
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
  }, [identity, showWelcome, updateTimerState]);

  const handleStartStop = useCallback(() => {
    updateTimerState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));
  }, [updateTimerState]);

  const handleResetTimer = useCallback(() => {
    updateTimerState(
      (prev) => ({
        ...prev,
        phase: "focus",
        remainingMs: FOCUS_DURATION_MS,
        isRunning: false,
      }),
      { broadcast: true }
    );
  }, [updateTimerState]);

  const handleSkipPhase = useCallback(() => {
    updateTimerState((prev) => {
      const nextPhase = prev.phase === "focus" ? "break" : "focus";
      const duration =
        nextPhase === "focus" ? FOCUS_DURATION_MS : BREAK_DURATION_MS;
      return {
        ...prev,
        phase: nextPhase,
        remainingMs: duration,
      };
    });
  }, [updateTimerState]);

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
      setTargetFromPoint(event.clientX, event.clientY);
    },
    [setTargetFromPoint]
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
      let participantCount = 0;

      Object.values(presenceState).forEach((connections) => {
        participantCount += connections.length;
        connections.forEach((presence) => {
          if (!presence?.id || presence.id === resolvedGuestId) return;
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
              phase === "focus" ? FOCUS_DURATION_MS : BREAK_DURATION_MS;
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
  }, [identity, setTimerState, showWelcome]);

  const onlineLabel = `${onlineCount} online`;
  const sharedActive = timerState.mode === "shared" && !showWelcome;
  const sharedParticipants = useMemo(
    () => avatars.filter((avatar) => !avatar.isSelf),
    [avatars]
  );

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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.35em] text-slate-100/80 shadow-glass-sm">
            <span className="h-2 w-2 rounded-full bg-twilight-ember/90 animate-pulse-soft shadow-[0_0_10px_rgba(252,211,77,0.65)]" />
            {onlineLabel}
          </div>
          <div className="rounded-glass border border-white/10 bg-[rgba(15,23,42,0.78)] p-6 shadow-glass-lg backdrop-blur-lounge">
            <h1 className="text-lg font-semibold tracking-[0.08em] text-parchment md:text-xl">
              CozyFocus
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-100/80">
              A lofi study lounge where gentle avatars drift together, share focus
              energy, and wander a twilight room inspired by Orbis.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-200/70">
              You are {displayName}. Click to roam.
            </p>
            <div className="mt-5 space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100/70 backdrop-blur-lounge">
              <span className="block text-[0.7rem] uppercase tracking-[0.3em] text-slate-100">
                Ambient Session
              </span>
              <span className="block text-[0.7rem] leading-relaxed text-slate-200/70">
                Leave the music running for steady, soft focus.
              </span>
              <audio
                className="mt-2 w-full rounded-lg bg-white/5"
                src="/lofi.mp3"
                loop
                controls
                preload="auto"
              />
            </div>
          </div>
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

        <div className="absolute bottom-12 right-8 w-full max-w-xs md:bottom-16 md:right-16">
          <PomodoroPanel
            mode={timerState.mode}
            phase={timerState.phase}
            remainingMs={timerState.remainingMs}
            focusDurationMs={FOCUS_DURATION_MS}
            breakDurationMs={BREAK_DURATION_MS}
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
      {identity && (
        <WelcomeModal
          open={showWelcome}
          initialName={identity.displayName}
          initialColor={identity.color}
          onConfirm={handleWelcomeConfirm}
        />
      )}
    </main>
  );
}
