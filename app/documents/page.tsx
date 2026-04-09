"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type DocumentSummary = {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/");
    }
  }, [isPending, router, session]);

  const fetchDocuments = useCallback(
    async (signal?: AbortSignal) => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/documents?limit=20`, {
          credentials: "include",
          signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data: DocumentSummary[] = await response.json();
        setDocuments(data);
        setError(null);
      } catch (fetchError) {
        if (signal?.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch documents",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [session?.user],
  );

  useEffect(() => {
    const abortController = new AbortController();
    void fetchDocuments(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchDocuments]);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await authClient.signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      setCreateLoading(true);
      const response = await fetch(`${API_URL}/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const doc: { id: string } = await response.json();
      router.push(`/documents/${doc.id}`);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create document";
      setError(message);
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = useMemo(
    () => (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking session...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="mt-1 text-gray-600">
                {session.user.email ?? "Your collaborative documents"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreateDocument}
                disabled={createLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createLoading ? "Creating..." : "+ New Document"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
        aria-busy={loading}
      >
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div>Error: {error}</div>
            <button
              type="button"
              onClick={() => void fetchDocuments()}
              className="mt-3 rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-800 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first collaborative document
            </p>
            <button
              type="button"
              onClick={handleCreateDocument}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="block">
                <article className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h2>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {doc.preview || "No content yet"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Updated {formatDate(doc.updatedAt)}</span>
                    <span className="text-blue-600 font-medium">Open &rarr;</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
