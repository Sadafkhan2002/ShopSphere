import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getMyOrderById, simulatePayment } from "../services/orderService";

const formatPKR = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getStatusStyle = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
    case "delivered":
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "cancelled":
    case "refunded":
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const response = await getMyOrderById(orderId);
        const fetchedOrder = response?.data?.order;

        if (!response?.success || !fetchedOrder) {
          throw new Error(response?.message || "Order could not be found.");
        }

        if (active) setOrder(fetchedOrder);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your order.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  const handleDemoPayment = async () => {
    setError("");
    setNotice("");
    setPaying(true);

    try {
      const response = await simulatePayment(orderId);

      if (!response?.success) {
        throw new Error(response?.message || "Demo payment was unsuccessful.");
      }

      setNotice(
        response.message ||
          "Demo payment completed. No real money was charged.",
      );

      // Refresh the order so the displayed status comes from the backend.
      const updatedResponse = await getMyOrderById(orderId);

      if (updatedResponse?.success && updatedResponse?.data?.order) {
        setOrder(updatedResponse.data.order);
      } else if (response.data) {
        setOrder((current) => ({
          ...current,
          ...response.data,
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to process the demo payment.",
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" />
          <p className="mt-4 text-sm text-gray-600">Loading your order...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black">Order unavailable</h1>
          <p className="mt-3 text-sm text-gray-600">
            {error || "We couldn't retrieve this order."}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const paymentStatus = String(order.paymentStatus || "pending").toLowerCase();
  const orderStatus = String(order.status || "pending").toLowerCase();
  const isPaid = paymentStatus === "paid";
  const isCancelled = orderStatus === "cancelled";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="text-2xl font-black tracking-tight">
            Shop<span className="text-orange-600">Sphere</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-gray-600 hover:text-orange-600"
          >
            Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-gray-950 px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
              {isCancelled ? "!" : isPaid ? "✓" : "✓"}
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-orange-300">
              {isCancelled ? "Order cancelled" : "Order placed"}
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {isCancelled
                ? "This order was cancelled"
                : isPaid
                  ? "Payment successful"
                  : "Thank you for your order!"}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-300">
              {isCancelled
                ? "This order is cancelled. You can return to the shop to browse products."
                : isPaid
                  ? "Your demo payment has been recorded by ShopSphere."
                  : "Your order has been created. Complete payment using the available demo option below, or leave it pending for now."}
            </p>
          </div>

          <div className="p-6 sm:p-10">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order number
                </p>
                <p className="mt-2 break-all text-sm font-bold">
                  {order.orderNumber || `Order #${order.id}`}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order total
                </p>
                <p className="mt-2 text-lg font-black">
                  {formatPKR(order.totalAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(order.status)}`}
                >
                  {order.status || "pending"}
                </span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(paymentStatus)}`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold">Items in your order</h2>

              {items.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  Item details aren't available in this response.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const name =
                      item.productName ||
                      item.name ||
                      item.product?.name ||
                      item.product?.title ||
                      `Product ${item.productId || index + 1}`;

                    const quantity = Number(item.quantity) || 0;
                    const lineTotal =
                      item.lineTotal ??
                      item.totalPrice ??
                      (Number(item.unitPrice) || 0) * quantity;

                    return (
                      <div
                        key={item.id || `${item.productId}-${index}`}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Quantity: {quantity}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold">
                          {formatPKR(lineTotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <h2 className="font-bold">Payment options</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                The simulated payment is for development and portfolio
                demonstrations only. It does not charge real money.
              </p>

              {!isPaid && !isCancelled && (
                <button
                  type="button"
                  onClick={handleDemoPayment}
                  disabled={paying}
                  className="mt-4 w-full rounded-full bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying
                    ? "Processing demo payment..."
                    : "Pay with demo payment"}
                </button>
              )}

              {isPaid && (
                <p className="mt-3 text-sm font-semibold text-green-700">
                  Payment is marked as paid by the backend.
                </p>
              )}

              {isCancelled && (
                <p className="mt-3 text-sm font-semibold text-red-700">
                  Payment is unavailable for a cancelled order.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/"
                className="flex-1 rounded-full bg-gray-950 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="flex-1 rounded-full border border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:border-gray-950 hover:text-gray-950"
              >
                View cart
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OrderConfirmation;
