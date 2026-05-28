/**
 * Order Card Component
 * 
 * Displays a single order as a card with:
 * - Order ID and status badge
 * - Product ID and quantity
 * - Creation timestamp (if available)
 * 
 * @param {Object} order - Order object with id, product_id, quantity, status, created_at
 */

export default function OrderCard({ order }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 px-4 py-3 text-sm text-slate-200 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold text-slate-50">Order #{order.id}</div>
        <div className="rounded-full bg-slate-700/60 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
          {order.status}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-300 sm:text-sm">
        <div className="font-mono">Product: #{order.product_id}</div>
        <div>Quantity: {order.quantity}</div>
        {order.created_at && (
          <div className="text-slate-400">
            {new Date(order.created_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

