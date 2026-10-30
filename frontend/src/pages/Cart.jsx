import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCart,
  updateCartItem,
  removeCartItem,
} from "../services/cartService";

import { getCurrentUser } from "../utils/auth";

const IMAGES = {
  tshirt:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=85",
  watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=85",
  shoes:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=85",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=85",
  placeholder: "https://placehold.co/500x600/f5f5f4/78716c?text=ShopSphere",
};

const formatPKR = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getProduct = (item) => item?.product || item?.Product || {};

const getProductName = (item) => {
  const product = getProduct(item);

  return (
    product.name ||
    product.title ||
    product.productName ||
    `Product #${item?.productId ?? item?.product_id ?? ""}`
  );
};

const getProductPrice = (item) => {
  const product = getProduct(item);

  const value =
    item?.unitPrice ??
    item?.unit_price ??
    item?.price ??
    product.price ??
    product.salePrice ??
    product.sale_price ??
    0;

  const price = Number(value);

  return Number.isFinite(price) ? price : 0;
};

const getItemSubtotal = (item) => {
  const value =
    item?.subtotal ??
    item?.lineTotal ??
    item?.line_total ??
    item?.totalPrice ??
    item?.total_price;

  if (value != null && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return getProductPrice(item) * (Number(item?.quantity) || 0);
};

const getImageUrl = (image) => {
  if (typeof image === "string") return image.trim();

  if (!image || typeof image !== "object") return "";

  return image.imageUrl || image.image_url || image.url || image.src || "";
};

const getFallbackImage = (item) => {
  const name = getProductName(item).toLowerCase();

  if (/\b(t[\s-]?shirts?|tees?|cotton\s+shirts?)\b/.test(name)) {
    return IMAGES.tshirt;
  }

  if (/\b(watches|watch)\b/.test(name)) return IMAGES.watch;

  if (/\b(shoes?|sneakers?|footwear)\b/.test(name)) {
    return IMAGES.shoes;
  }

  if (/\b(bags?|handbags?|purses?)\b/.test(name)) {
    return IMAGES.bag;
  }

  return IMAGES.placeholder;
};

const getProductImage = (item) => {
  const product = getProduct(item);

  const images = [
    ...(product.primaryImage ? [product.primaryImage] : []),
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.ProductImages) ? product.ProductImages : []),
  ];

  const primary =
    images.find(
      (image) =>
        [true, 1, "1"].includes(image?.isPrimary) ||
        [true, 1, "1"].includes(image?.is_primary),
    ) || images[0];

  const databaseImage = getImageUrl(primary);

  if (databaseImage) return databaseImage;

  // Keep T-shirt demo images consistent with the homepage.
  if (
    /\b(t[\s-]?shirts?|tees?|cotton\s+shirts?)\b/i.test(getProductName(item))
  ) {
    return IMAGES.tshirt;
  }

  return (
    getImageUrl(
      product.imageUrl ||
        product.image_url ||
        product.image ||
        product.thumbnail,
    ) || getFallbackImage(item)
  );
};

const getStock = (item) => {
  const product = getProduct(item);

  const raw = product.stockQuantity ?? product.stock_quantity;

  if (raw == null || raw === "") return null;

  const stock = Number(raw);

  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null;
};

const extractItems = (response) => {
  const data = response?.data?.cart ?? response?.data ?? response;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cart?.items)) return data.cart.items;
  if (Array.isArray(data?.CartItems)) return data.CartItems;

  return null;
};

function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCart = useCallback(async () => {
    const response = await getCart();

    if (response?.success === false) {
      throw new Error(response.message || "Unable to load your cart.");
    }

    const cartItems = extractItems(response);

    if (!cartItems) {
      throw new Error("Unexpected cart response from the server.");
    }

    setItems(cartItems);
  }, []);

  useEffect(() => {
    if (!getCurrentUser()) {
      navigate("/login", {
        replace: true,
        state: { from: "/cart" },
      });

      return;
    }

    let active = true;

    const initializeCart = async () => {
      try {
        await loadCart();
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your cart.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeCart();

    return () => {
      active = false;
    };
  }, [navigate, loadCart]);

  const busy = updatingItemId !== null || removingItemId !== null;

  const handleQuantityChange = async (item, quantity) => {
    if (busy) return;

    const nextQuantity = Number(quantity);
    const stock = getStock(item);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (stock !== null && nextQuantity > stock) {
      setError(`Only ${stock} units are available.`);
      return;
    }

    setError("");
    setNotice("");
    setUpdatingItemId(item.id);

    try {
      const response = await updateCartItem(item.id, nextQuantity);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to update quantity.");
      }

      await loadCart();
      setNotice("Cart quantity updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update quantity.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    if (busy) return;

    setError("");
    setNotice("");
    setRemovingItemId(item.id);

    try {
      const response = await removeCartItem(item.id);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to remove this item.");
      }

      await loadCart();
      setNotice("Item removed from your cart.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to remove this item.",
      );
    } finally {
      setRemovingItemId(null);
    }
  };

  const totalItems = items.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  const subtotal = items.reduce(
    (total, item) => total + getItemSubtotal(item),
    0,
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />

          <p className="mt-4 text-sm text-stone-500">Loading your cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="text-xl font-black tracking-[0.12em]">
            SHOP<span className="text-amber-700">SPHERE</span>
          </Link>

          <Link
            to="/"
            className="text-sm font-semibold text-stone-600 transition hover:text-amber-800"
          >
            Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-800">
            Your selections
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {items.length === 0 ? (
          <section className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl" aria-hidden="true">
              🛍️
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Your cart is looking empty
            </h2>

            <p className="mt-3 text-sm text-stone-500">
              Discover something you love and add it to your cart.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Explore products
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_0.8fr]">
            {/* Cart items */}
            <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="hidden grid-cols-[minmax(0,1fr)_110px_120px] gap-4 border-b border-stone-100 bg-stone-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500 sm:grid">
                <span>Product</span>
                <span>Quantity</span>
                <span className="text-right">Subtotal</span>
              </div>

              <div className="divide-y divide-stone-100">
                {items.map((item) => {
                  const name = getProductName(item);
                  const image = getProductImage(item);
                  const quantity = Number(item.quantity) || 1;
                  const stock = getStock(item);
                  const lineTotal = getItemSubtotal(item);

                  const maxQuantity =
                    stock === null
                      ? Math.max(10, quantity)
                      : Math.max(quantity, stock);

                  return (
                    <article
                      key={item.id}
                      className="flex flex-col gap-5 p-5 sm:grid sm:grid-cols-[minmax(0,1fr)_110px_120px] sm:items-center sm:gap-4 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <Link
                          to={`/products/${item.productId ?? item.product_id ?? getProduct(item).id}`}
                          className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100"
                        >
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = getFallbackImage(item);
                            }}
                          />
                        </Link>

                        <div className="min-w-0">
                          <Link
                            to={`/products/${item.productId ?? item.product_id ?? getProduct(item).id}`}
                            className="line-clamp-2 font-semibold hover:text-amber-800"
                          >
                            {name}
                          </Link>

                          <p className="mt-2 text-sm text-stone-500">
                            {formatPKR(getProductPrice(item))} each
                          </p>

                          {stock !== null && stock <= 5 && (
                            <p className="mt-1 text-xs text-amber-800">
                              {stock === 0
                                ? "Currently out of stock"
                                : `Only ${stock} available`}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            disabled={busy}
                            className="mt-3 text-xs font-semibold text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingItemId === item.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between sm:block">
                        <label
                          htmlFor={`quantity-${item.id}`}
                          className="text-sm text-stone-500 sm:hidden"
                        >
                          Quantity
                        </label>

                        <select
                          id={`quantity-${item.id}`}
                          value={quantity}
                          disabled={busy}
                          onChange={(event) =>
                            handleQuantityChange(item, event.target.value)
                          }
                          className="w-24 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700 disabled:opacity-50"
                        >
                          {Array.from(
                            { length: maxQuantity },
                            (_, index) => index + 1,
                          )
                            .filter(
                              (number) =>
                                stock === null ||
                                number <= stock ||
                                number === quantity,
                            )
                            .map((number) => (
                              <option key={number} value={number}>
                                {number}
                              </option>
                            ))}
                        </select>

                        {updatingItemId === item.id && (
                          <p className="mt-2 text-xs text-stone-500">
                            Updating...
                          </p>
                        )}
                      </div>

                      {/* Line total */}
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className="text-sm text-stone-500 sm:hidden">
                          Subtotal
                        </span>

                        <p className="font-bold">{formatPKR(lineTotal)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Order summary */}
            <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="mt-6 space-y-4 border-b border-stone-100 pb-5">
                <div className="flex justify-between gap-4 text-sm text-stone-600">
                  <span>Items ({totalItems})</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-4 text-sm text-stone-600">
                  <span>Shipping</span>
                  <span className="text-right">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between gap-4 py-5 text-lg font-bold">
                <span>Estimated Total</span>
                <span>{formatPKR(subtotal)}</span>
              </div>

              <p className="mb-5 text-xs leading-5 text-stone-500">
                Your final order amount will be calculated by the server during
                checkout.
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={() => navigate("/checkout")}
                className="w-full rounded-full bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Proceed to Checkout"}
              </button>

              <Link
                to="/"
                className="mt-4 block text-center text-sm font-semibold text-stone-600 transition hover:text-amber-800"
              >
                Continue shopping
              </Link>

              <p className="mt-6 text-center text-xs text-stone-500">
                Secure account-based shopping
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;
