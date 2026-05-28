/**
 * Order Form Component
 * 
 * Form for creating new orders.
 * 
 * Fields:
 * - Product ID: ID of the product to order (required, can be prefilled from product list)
 * - Quantity: Number of items to order (required, minimum 1)
 * 
 * On successful order creation, the form quantity is reset to 1 and the order list is refreshed.
 * The form can be scrolled into view programmatically when prefilled from a product card.
 * 
 * @param {Object} orderForm - Form state object with productId and quantity
 * @param {string} orderStatus - Status message (success/error) from order creation
 * @param {Function} onOrderFormChange - Handler for form field changes
 * @param {Function} onSubmit - Handler for form submission
 */

export default function OrderForm({
  orderForm,
  orderStatus,
  onOrderFormChange,
  onSubmit
}) {
  return (
    <div className="rounded-3xl bg-slate-900/60 p-8 shadow-xl">
      <h2 className="text-xl font-semibold">Place an order</h2>
      <p className="mt-1 text-sm text-slate-300">
        Use a product id and quantity to trigger the order flow.
      </p>
      <form id="order-form" onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-slate-400">Product ID</span>
          <input
            value={orderForm.productId}
            onChange={onOrderFormChange('productId')}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            placeholder="Type or prefill from inventory"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-slate-400">Quantity</span>
          <input
            type="number"
            min="1"
            value={orderForm.quantity}
            onChange={onOrderFormChange('quantity')}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Place order
        </button>
        {orderStatus && (
          <div className="text-sm text-slate-300">{orderStatus}</div>
        )}
      </form>
    </div>
  );
}

