import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getComparison,
  removeFromComparison,
  clearComparison,
} from "../services/comparisonService";
import { getCurrentUser } from "../utils/auth";

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80";

const getProduct = (item) => item?.product || item;

const getProductName = (product) =>
  product?.name || product?.title || "ShopSphere Product";

const getProductPrice = (product) => {
  const price = Number(product?.price ?? product?.sellingPrice ?? 0);

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
};

const getProductImage = (product) =>
  product?.images?.[0]?.imageUrl ||
  product?.images?.[0]?.url ||
  product?.imageUrl ||
  product?.image ||
  product?.thumbnail ||
  fallbackImage;

const getCategory = (product) =>
  typeof product?.category === "string"
    ? product.category
    : product?.category?.name || product?.categoryName || "Not specified";

const getDescription = (product) =>
  product?.description || "No description available.";

const getStock = (product) => {
  const stock = product?.stockQuantity ?? product?.stock ?? product?.quantity;

  if (stock === undefined || stock === null || stock === "") {
    return "Not specified";
  }

  const amount = Number(stock);

  if (!Number.isFinite(amount)) return "Not specified";

  return amount > 0 ? `${amount} available` : "Out of stock";
};

export default function Comparison() {
  const [user] = useState(() => getCurrentUser());
  const [items, setItems] = useState([]);
  const [maxItems, setMaxItems] = useState(4);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getComparison();

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to load your comparison list.",
        );
      }

      const comparisonData = response?.data ?? response;

      setItems(
        Array.isArray(comparisonData?.items) ? comparisonData.items : [],
      );

      setMaxItems(Number(comparisonData?.maxItems) || 4);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your comparison list.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadComparison();
  }, [user, loadComparison]);

  const handleRemove = async (item) => {
    const product = getProduct(item);
    const productId = product?.id ?? item?.productId;

    if (!productId) {
      setError("Unable to identify this product.");
      return;
    }

    try {
      setRemovingId(productId);
      setError("");
      setNotice("");

      const response = await removeFromComparison(productId);

      if (response?.success === false) {
        throw new Error(response.message || "Could not remove product.");
      }

      setItems((currentItems) =>
        currentItems.filter((currentItem) => {
          const currentProduct = getProduct(currentItem);
          const currentId = currentProduct?.id ?? currentItem?.productId;

          return String(currentId) !== String(productId);
        }),
      );

      setNotice(response?.message || "Product removed from comparison.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not remove this product.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;

    try {
      setClearing(true);
      setError("");
      setNotice("");

      const response = await clearComparison();

      if (response?.success === false) {
        throw new Error(
          response.message || "Could not clear your comparison list.",
        );
      }

      setItems([]);
      setNotice(response?.message || "Comparison list cleared.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not clear your comparison list.",
      );
    } finally {
      setClearing(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">⚖️</div>
          <h1 className="mt-4 text-2xl font-black">Compare your favorites</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Please sign in to compare products and access your saved list.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-orange-600 px-7 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Sign in
          </Link>
          <div>
            <Link
              to="/"
              className="mt-5 inline-block text-sm font-semibold text-gray-500 hover:text-orange-600"
            >
              ← Back to shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="text-2xl font-black tracking-tight">
            Shop<span className="text-orange-600">Sphere</span>.
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/wishlist"
              className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold transition hover:border-orange-500 hover:text-orange-600 sm:px-4"
            >
              ♡ <span className="hidden sm:inline">Wishlist</span>
            </Link>

            <Link
              to="/cart"
              className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold transition hover:border-orange-500 hover:text-orange-600 sm:px-4"
            >
              🛒 <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Link
              to="/"
              className="text-sm font-semibold text-gray-500 transition hover:text-orange-600"
            >
              ← Continue shopping
            </Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
              Make the right choice
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Product comparison
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
              Compare prices, categories, availability, and details side by side
              before you decide.
            </p>
          </div>

          {!loading && items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing || removingId !== null}
              className="self-start rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              {clearing ? "Clearing..." : "Clear all"}
            </button>
          )}
        </div>

        {/* Comparison count */}
        {!loading && (
          <div className="mt-7 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 sm:px-6">
            <div>
              <p className="font-bold">Your comparison list</p>
              <p className="mt-1 text-sm text-gray-500">
                Add up to {maxItems} products to compare.
              </p>
            </div>

            <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
              {items.length} / {maxItems}
            </span>
          </div>
        )}

        {/* Messages */}
        {notice && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadComparison}
              className="mt-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl bg-white p-4"
              >
                <div className="aspect-4/3 rounded-2xl bg-gray-100" />
                <div className="mt-4 h-4 w-3/4 rounded bg-gray-100" />
                <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="mt-8 rounded-3xl border border-gray-100 bg-white px-5 py-16 text-center sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
              ⚖️
            </div>

            <h2 className="mt-5 text-2xl font-black">Nothing to compare yet</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Add products to your comparison list to review their details side
              by side.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex rounded-full bg-orange-600 px-7 py-3 font-bold text-white transition hover:bg-orange-700"
            >
              Explore products →
            </Link>
          </div>
        )}

        {/* Product comparison cards */}
        {!loading && items.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item, index) => {
                const product = getProduct(item);
                const productId = product?.id ?? item?.productId;
                const name = getProductName(product);

                return (
                  <article
                    key={item.id ?? productId ?? index}
                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                      <img
                        src={getProductImage(product)}
                        alt={name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage;
                        }}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={removingId === productId || clearing}
                        aria-label={`Remove ${name} from comparison`}
                        title="Remove from comparison"
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-red-600 shadow transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {removingId === productId ? "…" : "×"}
                      </button>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                        Product {index + 1}
                      </p>

                      <h2 className="mt-2 min-h-12 text-lg font-black leading-6">
                        {name}
                      </h2>

                      <p className="mt-3 text-xl font-black text-orange-600">
                        {getProductPrice(product)}
                      </p>

                      <Link
                        to={`/products/${productId}`}
                        className="mt-4 inline-flex text-sm font-bold text-gray-700 transition hover:text-orange-600"
                      >
                        View product →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Side-by-side details */}
            <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <h2 className="text-xl font-black">Compare product details</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review the available information for each product.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-620px border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="w-40 px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 sm:w-52 sm:px-7">
                        Feature
                      </th>

                      {items.map((item, index) => {
                        const product = getProduct(item);

                        return (
                          <th
                            key={item.id ?? product?.id ?? index}
                            className="min-w-48 px-5 py-4 text-sm font-bold sm:px-7"
                          >
                            Product {index + 1}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {[
                      {
                        label: "Product name",
                        value: (product) => getProductName(product),
                      },
                      {
                        label: "Price",
                        value: (product) => getProductPrice(product),
                      },
                      {
                        label: "Category",
                        value: (product) => getCategory(product),
                      },
                      {
                        label: "Availability",
                        value: (product) => getStock(product),
                      },
                      {
                        label: "Description",
                        value: (product) => getDescription(product),
                      },
                    ].map((feature) => (
                      <tr key={feature.label}>
                        <th className="bg-gray-50/70 px-5 py-4 text-sm font-semibold text-gray-600 sm:px-7">
                          {feature.label}
                        </th>

                        {items.map((item, index) => {
                          const product = getProduct(item);

                          return (
                            <td
                              key={item.id ?? product?.id ?? index}
                              className="px-5 py-4 text-sm leading-6 text-gray-700 sm:px-7"
                            >
                              {feature.value(product)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
          <Link
            to="/"
            className="font-semibold transition hover:text-orange-600"
          >
            Continue shopping →
          </Link>
        </div>
      </footer>
    </div>
  );
}
