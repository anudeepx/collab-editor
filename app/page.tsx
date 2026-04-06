"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDocument = async () => {
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Start typing..." }),
      });

      if (!response.ok) throw new Error("Failed to create document");

      const doc = await response.json();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleViewDocuments = () => {
    router.push("/documents");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Collab Editor</h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time collaborative document editing
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "+ New Document"}
          </button>
          <button
            onClick={handleViewDocuments}
            className="px-8 py-3 rounded-lg bg-gray-200 text-gray-900 font-medium hover:bg-gray-300 transition-colors"
          >
            View All Documents
          </button>
        </div>

        <p className="mt-12 text-gray-600 text-sm max-w-md">
          Share documents with others via shareable links. Changes sync in
          real-time with WebSocket.
        </p>
      </div>
    </div>
  );
}
