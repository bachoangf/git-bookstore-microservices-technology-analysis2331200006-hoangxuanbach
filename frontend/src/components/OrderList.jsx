/**
 * Order List Component
 * 
 * Displays a list of all orders in the system.
 * Orders are shown in a vertical list, with the most recent orders first.
 * 
 * Features:
 * - Shows order count badge
 * - Displays empty state message when no orders exist
 * - Each order is rendered as an OrderCard component
 * 
 * @param {Array} orders - Array of order objects to display
 */

import OrderCard from './OrderCard.jsx';

export default function OrderList({ orders }) {
  return (
    <div className="rounded-3xl bg-slate-900/60 p-8 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent orders</h2>
          <p className="mt-1 text-sm text-slate-300">
            Live snapshot of order traffic across services.
          </p>
        </div>
        <span className="rounded-full bg-indigo-500/20 px-4 py-3 text-xs font-semibold text-indigo-200">
          {orders.length}
        </span>
      </div>
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-800/50 p-6 text-center text-slate-400">
            No orders yet. Once you place an order it will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

