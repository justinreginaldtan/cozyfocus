/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabaseClient";
import type { AvatarPresence } from "@/lib/types";
import { createGuestId, lerp, pickAvatarColor } from "@/lib/utils";

type RenderAvatar = {
  id: string;
  color: string;
  x: number;
  y: number;
  isSelf: boolean;
};

type RemoteAvatarState = {
  color: string;
  x: number; // current normalized x (0-1) the lerp loop eases toward targetX.
  y: number; // current normalized y (0-1) the lerp loop eases toward targetY.
  targetX: number;
  targetY: number;
};

const LOCAL_SMOOTHING = 0.18;
const REMOTE_SMOOTHING = 0.12;
const BROADCAST_INTERVAL_MS = 80;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function HomePage() {
  const guestId = useMemo(() => createGuestId(), []);
  const color = useMemo(() => pickAvatarColor(), []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const animationRef = useRef<number>();
  const lastBroadcastRef = useRef<number>(0);

  // Local position refs stay out of React state to avoid re-renders on every animation frame.
  const localNormalizedRef = useRef({ x: 0.5, y: 0.5 });
  const mouseTargetRef = useRef({ x: 0.5, y: 0.5 });

  // Remote avatars are kept in a ref so the animation loop can mutate them smoothly.
  const remoteAvatarsRef = useRef<Map<string, RemoteAvatarState>>(new Map());

  const [avatars, setAvatars] = useState<RenderAvatar[]>([]);

  const updatePointerTarget = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseTargetRef.current = {
        x: clamp01((clientX - rect.left) / rect.width),
        y: clamp01((clientY - rect.top) / rect.height),
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      updatePointerTarget(event.clientX, event.clientY);
    },
    [updatePointerTarget]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      updatePointerTarget(event.clientX, event.clientY);
    },
    [updatePointerTarget]
  );

  // Spin up the Supabase realtime channel once per guest session.
  useEffect(() => {
    const channel = supabase.channel("cozyfocus-room", {
      config: { presence: { key: guestId } },
    });

    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState<AvatarPresence>();
      const currentRemotes = remoteAvatarsRef.current;
      const nextRemotes = new Map<string, RemoteAvatarState>();

      Object.values(presenceState).forEach((connections) => {
        connections.forEach((presence) => {
          if (!presence?.id || presence.id === guestId) return;
          const existing = currentRemotes.get(presence.id);
          const hydrated: RemoteAvatarState = existing
            ? {
                ...existing,
                targetX: clamp01(presence.x),
                targetY: clamp01(presence.y),
                color: presence.color,
              }
            : {
                color: presence.color,
                x: clamp01(presence.x),
                y: clamp01(presence.y),
                targetX: clamp01(presence.x),
                targetY: clamp01(presence.y),
              };
          nextRemotes.set(presence.id, hydrated);
        });
      });

      remoteAvatarsRef.current = nextRemotes;
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({
          id: guestId,
          color,
          x: localNormalizedRef.current.x,
          y: localNormalizedRef.current.y,
          updatedAt: Date.now(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      remoteAvatarsRef.current.clear();
    };
  }, [guestId, color]);

  // Animation loop handles local smoothing, remote interpolation, and render list assembly.
  useEffect(() => {
    const tick = () => {
      const container = containerRef.current;
      const width =
        container?.clientWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1) ?? 1;
      const height =
        container?.clientHeight ?? (typeof window !== "undefined" ? window.innerHeight : 1) ?? 1;

      const localPosition = localNormalizedRef.current;
      const target = mouseTargetRef.current;

      // Ease the local avatar toward the latest pointer target.
      localPosition.x = lerp(localPosition.x, target.x, LOCAL_SMOOTHING);
      localPosition.y = lerp(localPosition.y, target.y, LOCAL_SMOOTHING);

      const now = performance.now();
      if (
        channelRef.current &&
        now - lastBroadcastRef.current > BROADCAST_INTERVAL_MS
      ) {
        // Broadcast the latest normalized position so every client stays in sync.
        channelRef.current.track({
          id: guestId,
          color,
          x: localPosition.x,
          y: localPosition.y,
          updatedAt: Date.now(),
        });
        lastBroadcastRef.current = now;
      }

      const renderList: RenderAvatar[] = [
        {
          id: guestId,
          color,
          x: localPosition.x * width,
          y: localPosition.y * height,
          isSelf: true,
        },
      ];

      // Ease remote avatars toward their most recently broadcast positions.
      remoteAvatarsRef.current.forEach((avatar, id) => {
        avatar.x = lerp(avatar.x, avatar.targetX, REMOTE_SMOOTHING);
        avatar.y = lerp(avatar.y, avatar.targetY, REMOTE_SMOOTHING);
        renderList.push({
          id,
          color: avatar.color,
          x: avatar.x * width,
          y: avatar.y * height,
          isSelf: false,
        });
      });

      setAvatars(renderList);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [guestId, color]);

  return (
    <main>
      <div
        ref={containerRef}
        className="scene"
        style={{ backgroundImage: "url('/lofi.gif')" }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      >
        <div className="avatar-layer">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`avatar${avatar.isSelf ? " avatar--self" : ""}`}
              style={{
                left: `${avatar.x}px`,
                top: `${avatar.y}px`,
                backgroundColor: avatar.color,
              }}
            />
          ))}
        </div>

        <div className="overlay-card">
          <h1>CozyFocus</h1>
          <p>Move your mouse to glide around this gentle shared space.</p>
          <div className="audio-control">
            <span>Need vibes?</span>
            <audio src="/lofi.mp3" loop controls preload="auto" />
          </div>
        </div>
      </div>
    </main>
  );
}
