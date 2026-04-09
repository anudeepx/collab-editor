"use client";

type DocumentsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DocumentsError({ error, reset }: DocumentsErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">Failed to load documents</h2>
        <p className="mt-2 text-sm text-gray-700">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
