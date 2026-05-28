/**
 * Authentication Modal Component
 * 
 * This component displays a modal dialog for user authentication:
 * - Login: Authenticates existing users
 * - Register: Creates new user accounts
 * - Uses the same form for both operations (username and password)
 * - Displays status messages for success/error feedback
 * - Tracks user interactions for analytics
 */

import { trackClick } from '../utils/api.js';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  authForm, 
  authMessage, 
  onAuthInput, 
  onLogin 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Access your account</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Use the same credentials for both login and registration flows.
        </p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Username</span>
            <input
              value={authForm.username}
              onChange={onAuthInput('username')}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
              placeholder="jane@example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
            <input
              type="password"
              value={authForm.password}
              onChange={onAuthInput('password')}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>
          {authMessage && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {authMessage}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                trackClick('login-button');
                onLogin('login');
              }}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Login
            </button>
            <button
              onClick={() => {
                trackClick('register-button');
                onLogin('register');
              }}
              className="flex-1 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Register & login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

