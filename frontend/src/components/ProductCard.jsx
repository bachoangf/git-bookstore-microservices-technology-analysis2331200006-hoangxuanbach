/**
 * Product Card Component
 * 
 * Displays a single product (book) as a card with:
 * - Product title and author
 * - Product ID, price, and stock information
 * - "Prefill Order" button to quickly create an order for this product
 * - "Delete" button to delete the product
 * 
 * The card has hover effects and transitions for better UX.
 * 
 * @param {Object} product - Product object with id, title, author, price, stock
 * @param {Function} onPrefillOrder - Callback function when "Prefill Order" button is clicked
 * @param {Function} onDelete - Callback function when "Delete" button is clicked
 */

import { currency } from '../utils/constants.js';

export default function ProductCard({ product, onPrefillOrder, onDelete }) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-md transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-xl">
      <div>
        <h3 className="text-lg font-semibold text-slate-50">{product.title}</h3>
        <p className="mt-1 text-sm text-slate-300">by {product.author}</p>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-slate-200">
        <div className="flex justify-between">
          <dt>Product ID</dt>
          <dd className="font-mono">#{product.id}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Price</dt>
          <dd>{currency.format(product.price)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Stock</dt>
          <dd>{product.stock}</dd>
        </div>
      </dl>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => onPrefillOrder(product.id)}
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Prefill Order
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
          title="Delete product"
        >
          🗑️
        </button>
      </div>
    </article>
  );
}

