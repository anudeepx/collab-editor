"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type UpdatePayload = {
  documentId: string;
  content: string;
  updatedAt: string;
  currentVersion: number;
};

type PresencePayload = {
  documentId: string;
  activeUsers: number;
};

type EditAck =
  | {
      ok: true;
      update: UpdatePayload;
    }
  | {
      ok: false;
      error:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "VERSION_CONFLICT"
        | "RATE_LIMITED"
        | "INTERNAL_ERROR"
        | "TIMEOUT"
        | "DISCONNECTED";
      latest?: UpdatePayload;
    };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  API_URL;

const ACK_TIMEOUT_MS = 4000;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(WS_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 20,
    });

    socket.on("connect", () => {
      connectedRef.current = true;
      setConnected(true);
    });

    socket.on("disconnect", () => {
      connectedRef.current = false;
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      connectedRef.current = false;
    };
  }, []);

  const joinDocument = useCallback((documentId: string) => {
    const socket = socketRef.current;
    if (!socket) {
      return () => undefined;
    }

    const emitJoin = () => {
      socket.timeout(ACK_TIMEOUT_MS).emit("join", { documentId }, () => undefined);
    };

    socket.on("connect", emitJoin);
    if (socket.connected) {
      emitJoin();
    }

    return () => {
      socket.off("connect", emitJoin);
      if (socket.connected) {
        socket.emit("leave", { documentId }, () => undefined);
      }
    };
  }, []);

  const onUpdate = useCallback((handler: (payload: UpdatePayload) => void) => {
    const socket = socketRef.current;
    if (!socket) {
      return () => undefined;
    }

    socket.on("update", handler);
    return () => socket.off("update", handler);
  }, []);

  const onPresence = useCallback(
    (handler: (payload: PresencePayload) => void) => {
      const socket = socketRef.current;
      if (!socket) {
        return () => undefined;
      }

      socket.on("presence", handler);
      return () => socket.off("presence", handler);
    },
    [],
  );

  const editDocument = useCallback(
    (documentId: string, content: string, baseVersion: number) =>
      new Promise<EditAck>((resolve) => {
        const socket = socketRef.current;
        if (!socket || !connectedRef.current) {
          resolve({ ok: false, error: "DISCONNECTED" });
          return;
        }

        socket
          .timeout(ACK_TIMEOUT_MS)
          .emit(
            "edit",
            { documentId, content, baseVersion },
            (err: unknown, response: EditAck) => {
              if (err) {
                resolve({ ok: false, error: "TIMEOUT" });
                return;
              }

              resolve(response);
            },
          );
      }),
    [],
  );

  return {
    connected,
    joinDocument,
    onUpdate,
    onPresence,
    editDocument,
  };
}
