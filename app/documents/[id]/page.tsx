"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useSocket } from "@/app/hooks/useSocket";
import { authClient } from "@/lib/auth-client";

type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
};

type RealtimeUpdate = {
  documentId: string;
  content: string;
  updatedAt: string;
  currentVersion: number;
};

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "offline"
  | "error"
  | "conflict";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const EDIT_DEBOUNCE_MS = 320;
const TITLE_DEBOUNCE_MS = 600;

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const { data: session, isPending } = authClient.useSession();

  const { joinDocument, onUpdate, onPresence, editDocument, connected } =
    useSocket();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [activeUsers, setActiveUsers] = useState(1);
  const [conflictUpdate, setConflictUpdate] = useState<RealtimeUpdate | null>(
    null,
  );

  const contentRef = useRef("");
  const titleRef = useRef("");
  const versionRef = useRef(1);
  const pendingContentRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const applyRemoteUpdateRef = useRef(false);

  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/");
    }
  }, [isPending, router, session]);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchDocument = async () => {
      try {
        const response = await fetch(`${API_URL}/documents/${documentId}`, {
          credentials: "include",
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error("Document not found or access denied");
        }

        const doc: Document = await response.json();
        setContent(doc.content);
        setTitle(doc.title);
        contentRef.current = doc.content;
        titleRef.current = doc.title;
        versionRef.current = doc.currentVersion;
        setError(null);
      } catch (fetchError) {
        if (abortController.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load document",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchDocument();

    return () => {
      abortController.abort();
    };
  }, [documentId, session]);

  const applyRemoteUpdate = useCallback((payload: RealtimeUpdate) => {
    applyRemoteUpdateRef.current = true;
    setContent(payload.content);
    contentRef.current = payload.content;
    versionRef.current = payload.currentVersion;
    applyRemoteUpdateRef.current = false;
  }, []);

  const flushContentSave = useCallback(async () => {
    if (!pendingContentRef.current || saveInFlightRef.current) {
      return;
    }

    if (!connected) {
      setSaveState("offline");
      return;
    }

    saveInFlightRef.current = true;
    setSaveState("saving");

    const currentContent = contentRef.current;
    const baseVersion = versionRef.current;
    const ack = await editDocument(documentId, currentContent, baseVersion);
    saveInFlightRef.current = false;

    if (!ack.ok) {
      if (ack.error === "VERSION_CONFLICT" && ack.latest) {
        setConflictUpdate(ack.latest);
        setSaveState("conflict");
        pendingContentRef.current = true;
        toast.error("Document changed elsewhere. Review conflict state.");
        return;
      }

      if (ack.error === "DISCONNECTED" || ack.error === "TIMEOUT") {
        setSaveState("offline");
        return;
      }

      if (ack.error === "RATE_LIMITED") {
        setSaveState("saving");
        editTimeoutRef.current = setTimeout(() => {
          void flushContentSave();
        }, EDIT_DEBOUNCE_MS);
        return;
      }

      setSaveState("error");
      toast.error("Save failed. Try again.");
      return;
    }

    pendingContentRef.current = false;
    setConflictUpdate(null);
    versionRef.current = ack.update.currentVersion;
    setSaveState("saved");
  }, [connected, documentId, editDocument]);

  useEffect(() => {
    if (!documentId || !session?.user) return;

    const unsubscribeJoin = joinDocument(documentId);
    const unsubscribeUpdate = onUpdate((payload) => {
      if (payload.documentId !== documentId) {
        return;
      }

      if (payload.currentVersion <= versionRef.current) {
        return;
      }

      if (pendingContentRef.current && payload.content !== contentRef.current) {
        setConflictUpdate(payload);
        setSaveState("conflict");
        return;
      }

      applyRemoteUpdate(payload);
      setSaveState("saved");
    });

    const unsubscribePresence = onPresence((payload) => {
      if (payload.documentId !== documentId) {
        return;
      }

      setActiveUsers(Math.max(1, payload.activeUsers));
    });

    return () => {
      unsubscribePresence();
      unsubscribeUpdate();
      unsubscribeJoin();
    };
  }, [
    applyRemoteUpdate,
    documentId,
    joinDocument,
    onPresence,
    onUpdate,
    session,
  ]);

  useEffect(() => {
    if (!connected && pendingContentRef.current) {
      setSaveState("offline");
      return;
    }

    if (connected && pendingContentRef.current) {
      void flushContentSave();
      return;
    }

    if (connected && saveState === "offline") {
      setSaveState("idle");
    }
  }, [connected, flushContentSave, saveState]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (applyRemoteUpdateRef.current) {
        return;
      }

      setContent(newContent);
      contentRef.current = newContent;
      pendingContentRef.current = true;
      setSaveState(connected ? "saving" : "offline");
      setConflictUpdate(null);

      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }

      editTimeoutRef.current = setTimeout(() => {
        void flushContentSave();
      }, EDIT_DEBOUNCE_MS);
    },
    [connected, flushContentSave],
  );

  const saveTitle = useCallback(
    async (nextTitle: string) => {
      try {
        const response = await fetch(`${API_URL}/documents/${documentId}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: nextTitle }),
        });

        if (!response.ok) {
          throw new Error("Failed to save title");
        }

        const updated: Document = await response.json();
        setTitle(updated.title);
        titleRef.current = updated.title;
        versionRef.current = updated.currentVersion;
      } catch (titleError) {
        toast.error(
          titleError instanceof Error ? titleError.message : "Failed to save title",
        );
      }
    },
    [documentId],
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;

    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }

    titleTimeoutRef.current = setTimeout(() => {
      void saveTitle(titleRef.current);
    }, TITLE_DEBOUNCE_MS);
  };

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/documents/${documentId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleApplyLatest = () => {
    if (!conflictUpdate) return;

    applyRemoteUpdate(conflictUpdate);
    setConflictUpdate(null);
    pendingContentRef.current = false;
    setSaveState("saved");
  };

  const handleRetrySave = () => {
    if (!conflictUpdate) return;

    versionRef.current = conflictUpdate.currentVersion;
    setConflictUpdate(null);
    pendingContentRef.current = true;
    void flushContentSave();
  };

  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }

      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current);
      }
    };
  }, []);

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "offline"
          ? "Offline - changes pending"
          : saveState === "conflict"
            ? "Conflict detected"
            : saveState === "error"
              ? "Save failed"
              : "Idle";

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Checking session...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

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
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/documents"
                className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
              >
                Back
              </Link>
              <input
                type="text"
                aria-label="Document title"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                className="flex-1 min-w-0 text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
                placeholder="Untitled document"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div
                role="status"
                aria-live="polite"
                className="text-xs text-gray-600"
                title={connected ? "Connected" : "Disconnected"}
              >
                <span
                  className={`inline-block mr-2 h-2 w-2 rounded-full ${
                    connected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                {activeUsers} active
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <span
                aria-live="polite"
                role="status"
                className="text-xs text-gray-500 min-w-28 text-right"
              >
                {saveLabel}
              </span>
            </div>
          </div>

          {conflictUpdate && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Remote changes were saved while you were editing.
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyLatest}
                  className="rounded bg-white px-2 py-1 text-amber-900 border border-amber-300 hover:bg-amber-100"
                >
                  Load latest
                </button>
                <button
                  type="button"
                  onClick={handleRetrySave}
                  className="rounded bg-amber-600 px-2 py-1 text-white hover:bg-amber-700"
                >
                  Retry my save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            aria-label="Document editor"
            className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-6 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            placeholder="Start typing... Changes save automatically."
          />
        </div>
      </div>
    </div>
  );
}
