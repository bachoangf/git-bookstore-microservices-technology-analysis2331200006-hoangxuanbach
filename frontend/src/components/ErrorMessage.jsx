/**
 * Error Message Component
 * 
 * Displays error messages to the user in a styled error container.
 * Returns null if no message is provided (doesn't render anything).
 * 
 * Used for displaying data fetching errors and other application errors.
 * 
 * @param {string} message - Error message to display (optional, component returns null if not provided)
 */

export default function ErrorMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {message}
    </div>
  );
}

