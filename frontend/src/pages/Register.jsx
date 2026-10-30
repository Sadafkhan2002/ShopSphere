import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

const fashionImage =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=85";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Your passwords do not match. Please try again.");
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser(formData);

      setSuccess(
        response.message || "Your account has been created successfully.",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f6f2] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-1500px overflow-hidden rounded-2xl bg-white shadow-xl shadow-stone-900/5 sm:min-h-[calc(100vh-40px)] lg:grid-cols-2">
        {/* Editorial fashion panel */}
        <section
          className="relative hidden min-h-700px overflow-hidden bg-stone-900 bg-cover bg-center lg:flex"
          style={{ backgroundImage: `url("${fashionImage}")` }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/15 to-black/80" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white xl:p-14">
            <Link
              to="/"
              className="w-fit text-3xl font-semibold tracking-tight"
            >
              ShopSphere<span className="text-amber-300">.</span>
            </Link>

            <div className="max-w-lg pb-5">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
                Find your everyday look
              </p>

              <h2 className="font-serif text-5xl leading-[1.12] xl:text-6xl">
                Good style.
                <br />
                <span className="italic">Good feeling.</span>
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-7 text-white/80">
                Build your wardrobe around the pieces you love. Discover your
                next favorites with ShopSphere.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <span className="h-px w-10 bg-amber-300" />
                <span className="text-xs tracking-[0.2em] text-white/80">
                  MAKE IT YOURS.
                </span>
              </div>
            </div>

            <p className="text-xs text-white/65">
              Your style journey starts here.
            </p>
          </div>
        </section>

        {/* Registration form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="inline-block text-2xl font-semibold tracking-tight text-stone-900 lg:hidden"
            >
              ShopSphere<span className="text-amber-700">.</span>
            </Link>

            <div className="mb-7 mt-8 lg:mt-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800">
                Become a member
              </p>

              <h1 className="font-serif text-4xl leading-tight tracking-tight text-stone-900 sm:text-5xl">
                Make yourself
                <br />
                at home.
              </h1>

              <p className="mt-4 text-sm leading-6 text-stone-500">
                Create your account and make room for something wonderful.
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

            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="register-firstName"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    First name
                  </label>

                  <input
                    id="register-firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-3.5 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-lastName"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Last name
                  </label>

                  <input
                    id="register-lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-3.5 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/5"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Email address
                </label>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/5"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3.5 pr-20 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/5"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-4 text-xs font-semibold text-stone-500 transition hover:text-stone-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirmPassword"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Confirm password
                </label>

                <input
                  id="register-confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/5"
                />
              </div>

              <p className="text-xs leading-5 text-stone-500">
                By creating an account, you agree to ShopSphere's applicable
                terms and policies.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-stone-900 px-5 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create account"}
                {!loading && (
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-500">
              Already a member?{" "}
              <Link
                to="/login"
                className="font-semibold text-stone-900 underline decoration-amber-700 underline-offset-4 transition hover:text-amber-800"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Register;
