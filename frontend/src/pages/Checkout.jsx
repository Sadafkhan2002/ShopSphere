import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";
import { getCurrentUser } from "../utils/auth";

const initialShippingDetails = {
  shippingFullName: "",
  shippingPhone: "",
  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  shippingCountry: "Pakistan",
  notes: "",
};

const IMAGES = {
  tshirt:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=85",
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
    product.product_name ||
    item?.name ||
    item?.title ||
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
    product.sellingPrice ??
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

  if (value !== null && value !== undefined && value !== "") {
    const amount = Number(value);

    if (Number.isFinite(amount)) return amount;
  }

  return getProductPrice(item) * (Number(item?.quantity) || 0);
};

const getImageUrl = (image) => {
  if (typeof image === "string") return image.trim();

  if (!image || typeof image !== "object") return "";

  return image.imageUrl || image.image_url || image.url || image.src || "";
};

const getProductImage = (item) => {
  const product = getProduct(item);

  const images = [
    ...(product.primaryImage ? [product.primaryImage] : []),
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.ProductImages) ? product.ProductImages : []),
    ...(Array.isArray(product.product_images) ? product.product_images : []),
  ];

  const primaryImage =
    images.find(
      (image) =>
        [true, 1, "1"].includes(image?.isPrimary) ||
        [true, 1, "1"].includes(image?.is_primary),
    ) || images[0];

  const databaseImage = getImageUrl(primaryImage);

  if (databaseImage) return databaseImage;

  const name = getProductName(item);

  if (/\b(t[\s-]?shirts?|tees?|cotton\s+shirts?)\b/i.test(name)) {
    return IMAGES.tshirt;
  }

  return (
    getImageUrl(
      product.imageUrl ||
        product.image_url ||
        product.image ||
        product.thumbnail,
    ) || IMAGES.placeholder
  );
};

const extractCartItems = (response) => {
  if (response?.success === false) {
    throw new Error(response.message || "Unable to load your cart.");
  }

  const candidates = [
    response?.data?.items,
    response?.data?.cart?.items,
    response?.data?.data?.items,
    response?.items,
  ];

  return candidates.find(Array.isArray) ?? null;
};

const extractOrder = (response) =>
  response?.data?.order ??
  response?.data?.data?.order ??
  response?.order ??
  response?.data ??
  null;

function Checkout() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [shipping, setShipping] = useState(initialShippingDetails);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initializeCheckout = async () => {
      if (!getCurrentUser()) {
        navigate("/login", {
          replace: true,
          state: { from: "/checkout" },
        });
        return;
      }

      try {
        const response = await getCart();
        const cartItems = extractCartItems(response);

        if (!cartItems) {
          throw new Error("Unable to read your cart.");
        }

        if (!active) return;

        setItems(cartItems);

        if (cartItems.length === 0) {
          navigate("/cart", { replace: true });
        }
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

    initializeCheckout();

    return () => {
      active = false;
    };
  }, [navigate]);

  const itemCount = useMemo(
    () =>
      items.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const lineTotal = getItemSubtotal(item);

        return total + (Number.isFinite(lineTotal) ? lineTotal : 0);
      }, 0),
    [items],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setShipping((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");

    const requiredFields = [
      ["shippingFullName", "Full name"],
      ["shippingPhone", "Phone number"],
      ["shippingAddressLine1", "Address line 1"],
      ["shippingCity", "City"],
      ["shippingCountry", "Country"],
    ];

    const missingField = requiredFields.find(([key]) => !shipping[key].trim());

    if (missingField) {
      setError(`${missingField[1]} is required.`);
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty. Add a product before checkout.");
      return;
    }

    const shippingDetails = Object.fromEntries(
      Object.entries(shipping).map(([key, value]) => [key, value.trim()]),
    );

    setSubmitting(true);

    try {
      const response = await createOrder(shippingDetails);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to create your order.");
      }

      const order = extractOrder(response);

      if (!order?.id) {
        throw new Error(
          response?.message || "The server did not return an order ID.",
        );
      }

      navigate(`/orders/${order.id}/confirmation`, {
        replace: true,
        state: { order },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Order creation failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-700 focus:ring-4 focus:ring-amber-100";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />

          <p className="mt-4 text-sm text-stone-500">
            Preparing your checkout...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="text-xl font-black tracking-[0.12em] sm:text-2xl"
          >
            SHOP<span className="text-amber-700">SPHERE</span>
          </Link>

          <Link
            to="/cart"
            className="text-sm font-semibold text-stone-600 transition hover:text-amber-800"
          >
            ← Back to cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-800">
            Almost yours
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Enter your delivery details to place your order.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                  📦
                </div>

                <div>
                  <h2 className="text-xl font-bold">Delivery information</h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Fields marked with * are required.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Full name *
                  <input
                    className={inputClass}
                    name="shippingFullName"
                    value={shipping.shippingFullName}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={120}
                    required
                    placeholder="Enter your full name"
                  />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Phone number *
                  <input
                    className={inputClass}
                    name="shippingPhone"
                    type="tel"
                    value={shipping.shippingPhone}
                    onChange={handleChange}
                    autoComplete="tel"
                    maxLength={30}
                    required
                    placeholder="+92 3XX XXXXXXX"
                  />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Address line 1 *
                  <input
                    className={inputClass}
                    name="shippingAddressLine1"
                    value={shipping.shippingAddressLine1}
                    onChange={handleChange}
                    autoComplete="address-line1"
                    maxLength={255}
                    required
                    placeholder="House number, street, area"
                  />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Address line 2
                  <input
                    className={inputClass}
                    name="shippingAddressLine2"
                    value={shipping.shippingAddressLine2}
                    onChange={handleChange}
                    autoComplete="address-line2"
                    maxLength={255}
                    placeholder="Apartment, floor, landmark (optional)"
                  />
                </label>

                <label className="text-sm font-semibold">
                  City *
                  <input
                    className={inputClass}
                    name="shippingCity"
                    value={shipping.shippingCity}
                    onChange={handleChange}
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                    placeholder="Your city"
                  />
                </label>

                <label className="text-sm font-semibold">
                  Province / State
                  <input
                    className={inputClass}
                    name="shippingState"
                    value={shipping.shippingState}
                    onChange={handleChange}
                    autoComplete="address-level1"
                    maxLength={100}
                    placeholder="e.g. Khyber Pakhtunkhwa"
                  />
                </label>

                <label className="text-sm font-semibold">
                  Postal code
                  <input
                    className={inputClass}
                    name="shippingPostalCode"
                    value={shipping.shippingPostalCode}
                    onChange={handleChange}
                    autoComplete="postal-code"
                    maxLength={20}
                    placeholder="Optional"
                  />
                </label>

                <label className="text-sm font-semibold">
                  Country *
                  <input
                    className={inputClass}
                    name="shippingCountry"
                    value={shipping.shippingCountry}
                    onChange={handleChange}
                    autoComplete="country-name"
                    maxLength={100}
                    required
                  />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Delivery notes
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    name="notes"
                    value={shipping.notes}
                    onChange={handleChange}
                    maxLength={1000}
                    placeholder="Any special delivery instructions? (optional)"
                  />
                </label>
              </div>
            </section>

            <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold">Order summary</h2>

              <p className="mt-1 text-sm text-stone-500">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>

              <div className="mt-6 max-h-80 space-y-4 overflow-y-auto">
                {items.map((item) => {
                  const quantity = Number(item.quantity) || 0;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 border-b border-stone-100 pb-4 last:border-0"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        <img
                          src={getProductImage(item)}
                          alt={getProductName(item)}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = IMAGES.placeholder;
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">
                          {getProductName(item)}
                        </p>

                        <p className="mt-1 text-xs text-stone-500">
                          Quantity: {quantity}
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          {formatPKR(getItemSubtotal(item))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 border-t border-stone-100 pt-5 text-sm">
                <div className="flex justify-between gap-4 text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-4 text-stone-600">
                  <span>Shipping</span>
                  <span className="text-right">Calculated by server</span>
                </div>

                <div className="flex justify-between gap-4 border-t border-stone-100 pt-4 text-base font-bold">
                  <span>Estimated total</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>

                <p className="text-xs leading-5 text-stone-500">
                  This is an estimate. The backend calculates the final order
                  amount when you place your order.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="mt-6 w-full rounded-full bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Placing order..." : "Place order"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-stone-500">
                After your order is created, continue to the confirmation page
                to review the available next steps.
              </p>

              <Link
                to="/cart"
                className="mt-4 block text-center text-sm font-semibold text-stone-600 transition hover:text-amber-800"
              >
                ← Return to cart
              </Link>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Checkout;
