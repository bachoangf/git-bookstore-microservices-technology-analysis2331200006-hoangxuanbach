/**
 * Header Component
 * 
 * This component displays the application header with:
 * - Application title and branding
 * - User authentication status
 * - Login/Logout button
 * - Real-time notifications bell with dropdown
 * 
 * The notification bell shows a badge with the count of unseen notifications
 * and displays a dropdown panel with all notifications when clicked.
 */

import { trackClick } from '../utils/api.js';

export default function Header({ 
  user, 
  onLogout, 
  onOpenAuth, 
  notifications, 
  isNotificationOpen, 
  setNotificationOpen, 
  unseenCount, 
  onMarkAsSeen 
}) {
  const heroSubtitle = user
    ? `Welcome back, ${user.username}! Manage inventory and orders below.`
    : 'Browse books, manage inventory, and keep an eye on fresh orders.';

  return (
    <header className="flex flex-col gap-6 rounded-3xl bg-slate-900/70 p-8 shadow-lg lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3 text-3xl font-bold">
          <span role="img" aria-label="books">📚</span>
          <span className="font-display tracking-tight">Microservices Bookstore</span>
        </div>
        <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-base">{heroSubtitle}</p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="rounded-full bg-slate-800/70 px-4 py-2 text-sm text-slate-200">
          {user ? `Signed in as ${user.username}` : 'Not signed in'}
        </div>
        {user && (
          <div className="relative notification-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                trackClick('notification-bell-button', {}, user?.id || user?.username || 'anonymous');
                setNotificationOpen(!isNotificationOpen);
                if (!isNotificationOpen) {
                  onMarkAsSeen();
                }
              }}
              className="relative inline-flex items-center justify-center rounded-full bg-slate-800/70 p-2 text-slate-200 transition hover:bg-slate-700/70"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </button>
            {isNotificationOpen && (
              <div 
                className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-700/60">
                  <h3 className="text-lg font-semibold text-slate-50">Notifications</h3>
                </div>
                <div className="divide-y divide-slate-700/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition ${
                          !notification.seen
                            ? 'bg-emerald-500/10 border-l-4 border-emerald-500'
                            : 'bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-50">{notification.title}</h4>
                            <p className="mt-1 text-sm text-slate-300">{notification.body}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.seen && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {user ? (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => {
              trackClick('open-login-dialog-button');
              onOpenAuth();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Login / Register
          </button>
        )}
      </div>
    </header>
  );
}

