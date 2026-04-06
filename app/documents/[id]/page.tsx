"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/app/hooks/useSocket";
import Link from "next/link";

type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function EditorPage() {
  const params = useParams();
  const documentId = params.id as string;

  const { joinDocument, onUpdate, editDocument, connected } = useSocket();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const contentRef = useRef("");
  const applyRemoteUpdateRef = useRef(false);
  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Load document on mount
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`${API_URL}/documents/${documentId}`);
        if (!response.ok) throw new Error("Document not found");

        const doc: Document = await response.json();
        setContent(doc.content);
        contentRef.current = doc.content;
        setTitle(doc.title);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  // Join document room + listen for socket updates.
  useEffect(() => {
    if (!documentId) return;

    const leaveReconnectHandler = joinDocument(documentId);
    const unsubscribeUpdate = onUpdate((payload) => {
      if (payload.documentId !== documentId) {
        return;
      }

      if (payload.content === contentRef.current) {
        return;
      }

      console.log("[editor] received update", payload);
      applyRemoteUpdateRef.current = true;
      setContent(payload.content);
      contentRef.current = payload.content;
      applyRemoteUpdateRef.current = false;
    });

    return () => {
      unsubscribeUpdate();
      leaveReconnectHandler();
    };
  }, [documentId, joinDocument, onUpdate]);

  // Debounced content update
  const handleContentChange = useCallback(
    (newContent: string) => {
      if (applyRemoteUpdateRef.current) {
        return;
      }

      setContent(newContent);
      contentRef.current = newContent;
      setUnsavedChanges(true);

      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }

      editTimeoutRef.current = setTimeout(() => {
        editDocument(documentId, newContent);
        setUnsavedChanges(false);
      }, 180);
    },
    [documentId, editDocument],
  );

  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // In a real app, you'd want to update title in DB too
    // For now, just update locally
  };

  const copyLink = () => {
    const url = `${window.location.origin}/documents/${documentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-medium">{error}</div>
        <Link href="/documents">
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Back to Documents
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/documents"
                className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
              >
                Back
              </Link>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 min-w-0 text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
                placeholder="Untitled document"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Connection Status */}
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-gray-400"
                }`}
                title={connected ? "Connected" : "Disconnected"}
              />

              {/* Copy Link Button */}
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>

              {/* Unsaved Indicator */}
              {unsavedChanges && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-6 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            placeholder="Start typing... Your changes will be saved automatically."
          />
        </div>
      </div>
    </div>
  );
}

