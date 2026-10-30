import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";

const getWishlistItems = (response) => {
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
};

const getProduct = (item) => item?.product ?? item?.Product ?? {};

const getProductImage = (product) => {
  const images = product?.images ?? product?.ProductImages ?? [];
  const firstImage = images[0];

  return (
    firstImage?.imageUrl ||
    firstImage?.url ||
    product?.imageUrl ||
    product?.image ||
    ""
  );
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

function Wishlist() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getWishlist();

      if (response?.success === false) {
        throw new Error(response.message || "Unable to load your wishlist.");
      }

      setItems(getWishlistItems(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your wishlist.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    if (!productId || removingId !== null) return;

    setRemovingId(productId);
    setError("");

    try {
      await removeFromWishlist(productId);

      setItems((currentItems) =>
        currentItems.filter((item) => {
          const product = getProduct(item);

          return Number(item.productId ?? product.id) !== Number(productId);
        }),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove this product from your wishlist.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-medium text-gray-600">
          Loading your wishlist...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="text-2xl font-black tracking-tight">
            Shop<span className="text-orange-600">Sphere</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/" className="transition hover:text-orange-600">
              Shop
            </Link>
            <Link to="/cart" className="transition hover:text-orange-600">
              Cart
            </Link>
            <Link to="/orders" className="transition hover:text-orange-600">
              My Orders
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
            Your saved collection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-gray-600">
            Keep your favorite products close and find them whenever you're
            ready.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button onClick={loadWishlist} className="ml-3 font-bold underline">
              Try again
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
              ♡
            </div>
            <h2 className="mt-5 text-xl font-bold">Your wishlist is waiting</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              You haven't saved any products yet. Explore the collection and add
              your favorites here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full bg-gray-950 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Explore products
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {items.length} saved {items.length === 1 ? "item" : "items"}
              </p>
              <Link
                to="/"
                className="text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                Continue shopping →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => {
                const product = getProduct(item);
                const productId = Number(item.productId ?? product.id);
                const image = getProductImage(product);
                const title = product.name || product.title || "Product";
                const price = product.price ?? product.salePrice ?? 0;

                return (
                  <article
                    key={item.id ?? productId}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <Link
                      to={`/products/${productId}`}
                      className="block overflow-hidden bg-gray-100"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          loading="lazy"
                          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                          Product image unavailable
                        </div>
                      )}
                    </Link>

                    <div className="p-5">
                      <Link
                        to={`/products/${productId}`}
                        className="line-clamp-2 text-lg font-bold hover:text-orange-600"
                      >
                        {title}
                      </Link>

                      <p className="mt-2 text-lg font-black text-orange-600">
                        {formatPrice(price)}
                      </p>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => navigate(`/products/${productId}`)}
                          className="flex-1 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                          View product
                        </button>

                        <button
                          onClick={() => handleRemove(productId)}
                          disabled={
                            removingId !== null && removingId === productId
                          }
                          aria-label={`Remove ${title} from wishlist`}
                          title="Remove from wishlist"
                          className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {removingId === productId ? "..." : "♡"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Wishlist;
