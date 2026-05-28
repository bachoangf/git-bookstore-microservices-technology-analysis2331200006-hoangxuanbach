/**
 * Product List Component
 * 
 * Displays a grid of all available products (books) in the inventory.
 * Each product is rendered as a ProductCard component.
 * 
 * Features:
 * - Shows product count badge
 * - Displays empty state message when no products exist
 * - Allows quick order creation via "Prefill Order" button on each card
 * - Allows product deletion via "Delete" button on each card
 * 
 * @param {Array} products - Array of product objects to display
 * @param {Function} onPrefillOrder - Callback function when user clicks "Prefill Order" on a product
 * @param {Function} onDelete - Callback function when user clicks "Delete" on a product
 */

import ProductCard from './ProductCard.jsx';

export default function ProductList({ products, onPrefillOrder, onDelete }) {
  return (
    <div className="rounded-3xl bg-slate-900/60 p-8 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          <p className="mt-1 text-sm text-slate-300">
            Browse available titles and jump into order creation quickly.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
          {products.length} titles
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPrefillOrder={onPrefillOrder}
            onDelete={onDelete}
          />
        ))}
        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-800/50 p-10 text-center text-slate-400">
            <p>No products yet. Add your first book below!</p>
          </div>
        )}
      </div>
    </div>
  );
}

