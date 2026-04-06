"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type UpdatePayload = {
  documentId: string;
  content: string;
  updatedAt?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 20,
    });

    socket.on("connect", () => {
      setConnected(true);
      console.log("[socket] connected", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[socket] disconnected", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[socket] connection error", error.message);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const joinDocument = useCallback((documentId: string) => {
    if (!socketRef.current) {
      return () => undefined;
    }

    const socket = socketRef.current;
    const emitJoin = () => {
      console.log("[socket] emit join", { documentId });
      socket.emit("join", { documentId });
    };

    socket.on("connect", emitJoin);
    if (socket.connected) {
      emitJoin();
    }

    return () => {
      socket.off("connect", emitJoin);
    };
  }, []);

  const onUpdate = useCallback((handler: (payload: UpdatePayload) => void) => {
    if (!socketRef.current) {
      return () => undefined;
    }

    socketRef.current.on("update", handler);
    return () => socketRef.current?.off("update", handler);
  }, []);

  const editDocument = useCallback((documentId: string, content: string) => {
    if (!socketRef.current) return;
    const payload = { documentId, content };
    console.log("[socket] emit edit", payload);
    socketRef.current.emit("edit", payload);
  }, []);

  return {
    connected,
    joinDocument,
    onUpdate,
    editDocument,
  };
}
