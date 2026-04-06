"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${API_URL}/documents`);
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleCreateDocument = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Start typing..." }),
      });

      if (!response.ok) throw new Error("Failed to create document");

      const doc: Document = await response.json();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="mt-1 text-gray-600">Your collaborative documents</p>
            </div>
            <button
              onClick={handleCreateDocument}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              + New Document
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first collaborative document
            </p>
            <button
              onClick={handleCreateDocument}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <div className="block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {doc.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {doc.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {formatDate(doc.createdAt)}</span>
                    <span className="text-blue-600 font-medium">Open →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
