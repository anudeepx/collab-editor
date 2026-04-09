export default function DocumentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-10 w-56 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`document-loading-${index}`}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
