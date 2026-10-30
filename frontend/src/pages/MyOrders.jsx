import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, cancelMyOrder } from "../services/orderService";

const formatPKR = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const statusStyle = (status) => {
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

const extractOrders = (response) => {
  if (response?.success === false) {
    throw new Error(response.message || "Unable to load orders.");
  }

  const candidates = [
    response?.data?.orders,
    response?.data?.data?.orders,
    response?.orders,
    response?.data,
  ];

  return candidates.find(Array.isArray) ?? null;
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setError("");

    try {
      const response = await getMyOrders();
      const result = extractOrders(response);

      if (!result) {
        throw new Error("The server returned an unexpected orders response.");
      }

      setOrders(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) return;

    setCancellingId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await cancelMyOrder(orderId);

      if (response?.success === false) {
        throw new Error(response.message || "Could not cancel this order.");
      }

      setNotice(response?.message || "Order cancellation requested.");
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to cancel this order.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="text-2xl font-black tracking-tight">
            Shop<span className="text-orange-600">Sphere</span>
          </Link>

          <Link
            to="/"
            className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
          >
            Continue shopping
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Your account
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">My Orders</h1>
            <p className="mt-2 text-sm text-gray-500">
              View your purchases and check their current status.
            </p>
          </div>

          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold transition hover:border-gray-900"
          >
            View cart
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" />
            <p className="mt-4 text-sm text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl">
              📦
            </div>
            <h2 className="mt-5 text-xl font-bold">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              When you place an order, it will appear here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Explore products
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => {
              const orderId = order.id;
              const status = String(order.status || "pending").toLowerCase();
              const paymentStatus = String(
                order.paymentStatus || "pending",
              ).toLowerCase();

              const canCancel = ["pending", "confirmed"].includes(status);

              return (
                <article
                  key={orderId}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order number
                      </p>
                      <h2 className="mt-1 break-all text-base font-black">
                        {order.orderNumber || `Order #${orderId}`}
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "en-PK",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Date unavailable"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order total
                      </p>
                      <p className="mt-1 text-xl font-black">
                        {formatPKR(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(status)}`}
                    >
                      Order: {status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(paymentStatus)}`}
                    >
                      Payment: {paymentStatus}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                    <Link
                      to={`/orders/${orderId}/confirmation`}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                    >
                      View order details
                    </Link>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancel(orderId)}
                        disabled={cancellingId === orderId}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId === orderId
                          ? "Cancelling..."
                          : "Cancel order"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyOrders;
