/**
 * Product Form Component
 * 
 * Form for creating new products (books) in the inventory.
 * 
 * Fields:
 * - Title: Product/book title (required)
 * - Author: Author name (required)
 * - Price: Product price in USD (required, number)
 * - Stock: Available stock quantity (optional, defaults to 100)
 * 
 * On successful creation, the form is reset and the product list is refreshed.
 * 
 * @param {Object} productForm - Form state object with title, author, price, stock
 * @param {string} productStatus - Status message (success/error) from product creation
 * @param {Function} onProductFormChange - Handler for form field changes
 * @param {Function} onSubmit - Handler for form submission
 */

export default function ProductForm({
  productForm,
  productStatus,
  onProductFormChange,
  onSubmit
}) {
  return (
    <div className="rounded-3xl bg-slate-900/60 p-8 shadow-xl">
      <h2 className="text-xl font-semibold">Create a product</h2>
      <p className="mt-1 text-sm text-slate-300">
        Add new inventory items with pricing and stock levels.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="md:col-span-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Title</span>
          <input
            value={productForm.title}
            onChange={onProductFormChange('title')}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            placeholder="e.g. Clean Architecture"
          />
        </label>
        <label className="md:col-span-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Author</span>
          <input
            value={productForm.author}
            onChange={onProductFormChange('author')}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            placeholder="e.g. Robert C. Martin"
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wide text-slate-400">Price</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={productForm.price}
            onChange={onProductFormChange('price')}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            placeholder="19.99"
          />
        </label>
        <label>
          <span className="text-xs uppercase tracking-wide text-slate-400">Stock</span>
          <input
            type="number"
            min="0"
            value={productForm.stock}
            onChange={onProductFormChange('stock')}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Create product
          </button>
          {productStatus && (
            <span className="ml-3 text-sm text-slate-300">{productStatus}</span>
          )}
        </div>
      </form>
    </div>
  );
}

