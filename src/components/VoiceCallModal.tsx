"use client";

import { useState, useCallback, useEffect } from "react";
import { getCsrfToken } from "../lib/csrf";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  DisconnectButton,
  BarVisualizer,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

interface VoiceCallModalProps {
  onClose: () => void;
}

interface TokenResponse {
  token: string;
  url: string;
  roomName: string;
}

function CallControls({ onClose }: { onClose: () => void }) {
  const connectionState = useConnectionState();
  const { state, audioTrack } = useVoiceAssistant();

  const statusText =
    connectionState === ConnectionState.Connecting
      ? "Connecting…"
      : connectionState === ConnectionState.Connected
        ? state === "listening"
          ? "Listening…"
          : state === "speaking"
            ? "Speaking…"
            : state === "thinking"
              ? "Thinking…"
              : "Connected"
        : "Disconnected";

  useEffect(() => {
    if (connectionState === ConnectionState.Disconnected) {
      const timer = setTimeout(onClose, 1000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, onClose]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Audio visualizer */}
      <div className="w-24 h-24 flex items-center justify-center">
        <BarVisualizer
          state={state}
          trackRef={audioTrack}
          barCount={5}
          className="voice-visualizer"
        />
      </div>

      <p className="text-sm opacity-60">{statusText}</p>

      {/* Hang up button */}
      <DisconnectButton className="px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
        End Call
      </DisconnectButton>
    </div>
  );
}

export function VoiceCallModal({ onClose }: VoiceCallModalProps) {
  const [micAllowed, setMicAllowed] = useState(false);
  const [checkingMic, setCheckingMic] = useState(true);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, check if mic permission was already granted.
  // If so, skip the gate and go straight to connecting.
  useEffect(() => {
    async function checkPermission() {
      try {
        // Permissions API (Chrome, Edge) — doesn't trigger a prompt
        const status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (status.state === "granted") {
          setMicAllowed(true);
        }
      } catch {
        // Safari/Firefox don't support querying microphone — stay gated
      } finally {
        setCheckingMic(false);
      }
    }
    checkPermission();
  }, []);

  // Request mic permission (must be called from a user click)
  const requestMic = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release tracks — LiveKit will acquire its own stream once connected.
      stream.getTracks().forEach((t) => t.stop());
      setMicAllowed(true);
    } catch {
      setError(
        "Microphone access is required for voice calls. Please allow microphone permission and try again."
      );
    }
  }, []);

  // Phase 2: Once mic is granted, fetch token and connect
  useEffect(() => {
    if (!micAllowed) return;

    let cancelled = false;

    async function connect() {
      try {
        setLoading(true);
        setError(null);

        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to start voice call.");
        }
        const data: TokenResponse = await res.json();
        if (!cancelled) setTokenData(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to start voice call."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    connect();
    return () => {
      cancelled = true;
    };
  }, [micAllowed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — no onClick, must use X or End Call */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface-light dark:bg-surface-dark rounded-2xl p-8 shadow-xl border border-black/10 dark:border-white/[0.06] min-w-[300px]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full opacity-40 hover:opacity-70 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-center text-sm font-medium mb-6 opacity-60">
          Voice Call
        </h2>

        {/* Phase 1: Mic permission gate */}
        {!micAllowed && !error && !checkingMic && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
            </div>
            <p className="text-sm opacity-50 text-center max-w-[240px]">
              Microphone access is needed to talk with Andr3s
            </p>
            <button
              onClick={requestMic}
              className="px-6 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Call
            </button>
            <p className="text-xs opacity-35 text-center max-w-[240px]">
              The first connection may take a moment while the voice agent wakes up
            </p>
          </div>
        )}

        {/* Loading: checking permission or connecting */}
        {(checkingMic || (micAllowed && loading)) && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-sm opacity-50">
              {checkingMic ? "Starting call…" : "Connecting…"}
            </p>
            <p className="text-xs opacity-35 text-center max-w-[240px]">
              This may take a moment if the voice agent is waking up
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={micAllowed ? () => setMicAllowed(false) : requestMic}
              className="text-sm text-accent underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Phase 3: Connected */}
        {tokenData && !loading && !error && (
          <LiveKitRoom
            serverUrl={tokenData.url}
            token={tokenData.token}
            connect={true}
            audio={true}
            video={false}
          >
            <RoomAudioRenderer />
            <CallControls onClose={onClose} />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
