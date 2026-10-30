import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import Comparison from "./pages/Comparison";

import { verifyCurrentUser } from "./utils/auth";

function App() {
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        await verifyCurrentUser();
      } catch (error) {
        console.error("Session verification failed:", error);
      } finally {
        if (mounted) {
          setSessionChecked(true);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading ShopSphere...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:productId" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/orders/:orderId/confirmation"
          element={<OrderConfirmation />}
        />
        <Route path="/orders" element={<MyOrders />} />

        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/comparison" element={<Comparison />} />

        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
              <h1 className="text-5xl font-black text-gray-900">404</h1>
              <p className="mt-3 text-gray-600">
                Sorry, this page could not be found.
              </p>
              <a
                href="/"
                className="mt-6 rounded-full bg-gray-950 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
              >
                Back to Home
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
