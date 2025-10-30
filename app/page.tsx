"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { AvatarSprite } from "@/components/AvatarSprite";
import { PomodoroPanel } from "@/components/PomodoroPanel";
import { supabase } from "@/lib/supabaseClient";
import type { AvatarPresence, TimerState } from "@/lib/types";
import {
  approach,
  createDisplayName,
  createGuestId,
  lerp,
  pickAvatarColor,
} from "@/lib/utils";

type RenderAvatar = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
  isSelf: boolean;
  isHovered: boolean;
};

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

const createInitialTimerState = (mode: TimerState["mode"] = "solo"): TimerState => ({
  mode,
  phase: "focus",
  remainingMs: FOCUS_DURATION_MS,
  isRunning: false,
  lastUpdatedAt: Date.now(),
});

export default function HomePage() {
  const guestId = useMemo(() => createGuestId(), []);
  const displayName = useMemo(() => createDisplayName(), []);
  const color = useMemo(() => pickAvatarColor(), []);

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
        payload: { requesterId: guestId },
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
  }, [guestId, updateTimerState]);

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
    const channel = supabase.channel("cozyfocus-room", {
      config: { presence: { key: guestId } },
    });

    channelRef.current = channel;

    const handlePresenceSync = () => {
      const presenceState = channel.presenceState<AvatarPresence>();
      const nextRemotes = new Map<string, RemoteAvatarState>();
      let participantCount = 0;

      Object.values(presenceState).forEach((connections) => {
        participantCount += connections.length;
        connections.forEach((presence) => {
          if (!presence?.id || presence.id === guestId) return;
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
            id: guestId,
            name: displayName,
            color,
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
  }, [guestId, color, displayName, setTimerState]);

  // Main animation loop: movement, presence broadcast, remote interpolation, timer ticking.
  useEffect(() => {
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
          id: guestId,
          name: displayName,
          color,
          x: localPosition.x,
          y: localPosition.y,
          updatedAt: nowMs,
        });
        lastPresenceBroadcastRef.current = nowMs;
      }

      const hoveredId = hoveredAvatarRef.current;
      const renderList: RenderAvatar[] = [
        {
          id: guestId,
          color,
          name: displayName,
          x: localPosition.x * width,
          y: localPosition.y * height,
          isSelf: true,
          isHovered: hoveredId === guestId,
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
  }, [guestId, color, displayName, setTimerState]);

  const onlineLabel = `${onlineCount} online`;

  return (
    <main>
      <div
        ref={containerRef}
        className="scene"
        style={{ backgroundImage: "url('/lofi.gif')" }}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerDown}
        role="application"
        aria-label="Cozy shared space. Click to move your avatar."
      >
        <div className="floating-orb" style={{ top: "12%", left: "18%" }} />
        <div className="floating-orb floating-orb--2" style={{ top: "28%", right: "12%" }} />
        <div className="floating-orb floating-orb--3" style={{ bottom: "18%", left: "30%" }} />

        <div className="hud">
          <div className="user-count-badge">
            <span className="user-count-badge__dot" />
            {onlineLabel}
          </div>
          <div className="info-card">
            <h1>CozyFocus</h1>
            <p>
              A lofi study lounge where gentle avatars drift together, share
              focus energy, and wander a twilight room inspired by Orbis.
            </p>
            <p className="info-card__hint">You are {displayName}. Click to roam.</p>
            <div className="ambient-control">
              <span className="ambient-control__title">Ambient Session</span>
              <span className="ambient-control__hint">
                Leave the music running for steady, soft focus.
              </span>
              <audio src="/lofi.mp3" loop controls preload="auto" />
            </div>
          </div>
        </div>

        <div className="avatar-layer">
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
        />
      </div>
    </main>
  );
}
