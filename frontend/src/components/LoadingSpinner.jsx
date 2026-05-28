/**
 * Loading Spinner Component
 * 
 * Displays an animated loading spinner to indicate that data is being fetched
 * or an operation is in progress.
 * 
 * Used during initial app load and when waiting for API responses.
 */

export default function LoadingSpinner() {
  return (
    <div className="mt-12 flex flex-1 items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
    </div>
  );
}

