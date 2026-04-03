"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type DocumentResponse = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const socketRef = useRef<Socket | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("document-updated", (doc: DocumentResponse) => {
      if (!doc?.id) {
        return;
      }

      setDocumentId(doc.id);
      setContent(doc.content ?? "");
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  async function createDocument() {
    const response = await fetch(`${API_URL}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      setStatus("Failed to create document");
      return;
    }

    const doc: DocumentResponse = await response.json();
    setDocumentId(doc.id);
    setContent(doc.content ?? "");
    socketRef.current?.emit("join-document", { documentId: doc.id });
    setStatus(`Created document ${doc.id}`);
  }

  async function loadDocument() {
    if (!documentId.trim()) {
      setStatus("Document ID is required");
      return;
    }

    const response = await fetch(`${API_URL}/documents/${documentId}`);

    if (!response.ok) {
      setStatus("Failed to load document");
      return;
    }

    const doc: DocumentResponse = await response.json();
    setContent(doc.content ?? "");
    socketRef.current?.emit("join-document", { documentId: doc.id });
    setStatus(`Loaded document ${doc.id}`);
  }

  async function saveDocument() {
    if (!documentId.trim()) {
      setStatus("Document ID is required");
      return;
    }

    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      setStatus("Failed to save document");
      return;
    }

    setStatus(`Saved document ${documentId}`);
  }

  function handleEditorChange(value: string) {
    setContent(value);

    if (!documentId.trim()) {
      return;
    }

    socketRef.current?.emit("edit-document", {
      documentId,
      content: value,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6 text-zinc-900">
      <main className="flex w-full max-w-5xl flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Collaborative Editor</h1>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            type="text"
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            placeholder="Document ID"
            className="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-zinc-500"
          />
          <button
            onClick={createDocument}
            className="h-11 rounded-md bg-zinc-900 px-4 font-medium text-white"
          >
            Create Document
          </button>
          <button
            onClick={loadDocument}
            className="h-11 rounded-md bg-zinc-700 px-4 font-medium text-white"
          >
            Load Document
          </button>
          <button
            onClick={saveDocument}
            className="h-11 rounded-md bg-zinc-600 px-4 font-medium text-white"
          >
            Save Changes
          </button>
        </div>

        <textarea
          value={content}
          onChange={(event) => handleEditorChange(event.target.value)}
          className="min-h-[420px] w-full resize-y rounded-md border border-zinc-300 p-3 font-mono text-sm outline-none focus:border-zinc-500"
          placeholder="Start typing here..."
        />

        <p className="text-sm text-zinc-600">{status}</p>
      </main>
    </div>
  );
}
