"use client";

import Link from "next/link";

type EditorErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EditorError({ error, reset }: EditorErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">Failed to load editor</h2>
        <p className="mt-2 text-sm text-gray-700">{error.message}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try again
          </button>
          <Link
            href="/documents"
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Back to documents
          </Link>
        </div>
      </div>
    </div>
  );
}
