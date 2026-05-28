/**
 * Welcome Message Component
 * 
 * Displays a welcome message and call-to-action for unauthenticated users.
 * Shown when the user is not logged in, encouraging them to sign in or register.
 * 
 * Features:
 * - Welcome message explaining the application
 * - Button to open the authentication modal
 * - Tracks button clicks for analytics
 * 
 * @param {Function} onOpenAuth - Callback function to open the authentication modal
 */

import { trackClick } from '../utils/api.js';

export default function WelcomeMessage({ onOpenAuth }) {
  return (
    <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center text-slate-300">
      <div className="max-w-lg rounded-3xl border border-slate-700/60 bg-slate-900/60 p-10 shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-50">
          Sign in to manage the bookstore
        </h2>
        <p className="mt-3 text-sm">
          Create an account or log in to browse the catalog, manage inventory, and monitor orders across services.
        </p>
        <button
          onClick={() => {
            trackClick('open-login-dialog-button');
            onOpenAuth();
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Open login dialog
        </button>
      </div>
    </div>
  );
}

