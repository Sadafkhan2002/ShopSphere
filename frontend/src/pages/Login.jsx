import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, loginUser } from "../services/authService";
import { saveCurrentUser } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleUnavailable(true);
      return undefined;
    }

    let cancelled = false;
    let initialized = false;
    let pollId = null;
    let timeoutId = null;
    let script = null;

    const handleGoogleResponse = async (googleResponse) => {
      if (!googleResponse?.credential) {
        setError("Google sign-in did not return a credential.");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const response = await googleLogin(googleResponse.credential);
        const user = response?.data?.user;

        if (!response?.success || !user) {
          throw new Error(response?.message || "Google sign-in failed.");
        }

        saveCurrentUser(user);
        navigate("/");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-in failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    const initializeGoogle = () => {
      if (
        cancelled ||
        initialized ||
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return false;
      }

      initialized = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      googleButtonRef.current.replaceChildren();

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.max(
          200,
          Math.min(350, googleButtonRef.current.clientWidth || 320),
        ),
      });

      setGoogleUnavailable(false);
      return true;
    };

    const handleScriptError = () => {
      if (!cancelled) {
        setGoogleUnavailable(true);
      }
    };

    if (initializeGoogle()) {
      return () => {
        cancelled = true;
      };
    }

    script = document.querySelector('script[data-google-identity="true"]');

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      document.head.appendChild(script);
    }

    script.addEventListener("error", handleScriptError);

    pollId = window.setInterval(() => {
      if (initializeGoogle()) {
        if (pollId) {
          window.clearInterval(pollId);
          pollId = null;
        }

        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }

        script?.removeEventListener("error", handleScriptError);
      }
    }, 200);

    timeoutId = window.setTimeout(() => {
      if (!cancelled && !initialized) {
        setGoogleUnavailable(true);
      }

      if (pollId) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }, 10000);

    return () => {
      cancelled = true;

      if (pollId) {
        window.clearInterval(pollId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      script?.removeEventListener("error", handleScriptError);
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password: formData.password,
      });

      const user = response?.data?.user;

      if (!response?.success || !user) {
        throw new Error(
          response?.message || "Login failed. Please check your credentials.",
        );
      }

      saveCurrentUser(user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[85vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden min-h-650px overflow-hidden bg-stone-900 lg:block">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85"
            alt="Modern fashion boutique"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/20" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <Link
              to="/"
              className="w-fit text-3xl font-black tracking-tight text-white"
            >
              Shop<span className="text-amber-300">Sphere</span>
            </Link>

            <div className="max-w-md pb-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                Discover your style
              </p>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Fashion that feels like you.
              </h1>

              <p className="mt-5 max-w-sm text-base leading-7 text-stone-200">
                Discover your next favorite look and enjoy a smoother shopping
                experience with ShopSphere.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <span className="h-1.5 w-10 rounded-full bg-amber-300" />
                <span className="h-1.5 w-3 rounded-full bg-white/60" />
                <span className="h-1.5 w-3 rounded-full bg-white/60" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-10 inline-block text-2xl font-black tracking-tight text-stone-900 lg:hidden"
            >
              Shop<span className="text-amber-600">Sphere</span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-500">
                Enter your details to continue shopping.
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

            <div className="mb-6">
              <div
                ref={googleButtonRef}
                className="flex min-h-11 w-full justify-center"
              />

              {googleUnavailable && (
                <p className="mt-2 text-center text-xs text-stone-500">
                  Google sign-in is unavailable. You can sign in with your email
                  and password instead.
                </p>
              )}
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Or continue with email
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-amber-700 transition hover:text-amber-800 hover:underline"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-stone-400">
              By signing in, you agree to ShopSphere's applicable terms and
              privacy policy.
            </p>

            <div className="mt-8 text-center">
              <Link
                to="/"
                className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
              >
                ← Back to shopping
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
