import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getProducts } from "../services/productService";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { addToComparison } from "../services/comparisonService";
import { getCurrentUser, logoutUser } from "../utils/auth";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85",

  clothing:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",

  newArrivals:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",

  accessories:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",

  // Three distinct T-shirt / clothing image options
  shirt:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85",

  shirtTwo:
    "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=800&q=85",

  shirtThree:
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=85",

  hoodie:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85",

  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85",

  default:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85",
};

const COLLECTIONS = [
  {
    title: "Clothing",
    subtitle: "Everyday essentials and timeless styles.",
    image: IMAGES.clothing,
    keyword: "clothing",
  },
  {
    title: "New Arrivals",
    subtitle: "Discover something fresh for your wardrobe.",
    image: IMAGES.newArrivals,
    keyword: "new",
  },
  {
    title: "Accessories",
    subtitle: "Complete your look with the finishing touch.",
    image: IMAGES.accessories,
    keyword: "accessories",
  },
];

const formatPrice = (value) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const getProductImage = (product, index = 0) => {
  const image =
    product?.images?.[0]?.imageUrl ||
    product?.images?.[0]?.url ||
    product?.Images?.[0]?.imageUrl ||
    product?.ProductImages?.[0]?.imageUrl ||
    product?.imageUrl ||
    product?.image ||
    product?.thumbnail;

  // Keep images already supplied by the database.
  if (image) return image;

  const text = [
    product?.name,
    product?.description,
    product?.category?.name,
    product?.Category?.name,
    product?.categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/hoodie|sweatshirt|sweater/.test(text)) {
    return IMAGES.hoodie;
  }

  if (/watch|accessor/.test(text)) {
    return IMAGES.accessories;
  }

  if (/bag|handbag|backpack|purse/.test(text)) {
    return IMAGES.bag;
  }

  if (/shirt|tshirt|t-shirt|tee/.test(text)) {
    const shirtImages = [IMAGES.shirt, IMAGES.shirtTwo, IMAGES.shirtThree];

    // Rotate shirt fallback photos so adjacent shirts can look different.
    return shirtImages[index % shirtImages.length];
  }

  const fallbackImages = [
    IMAGES.shirt,
    IMAGES.shirtTwo,
    IMAGES.hoodie,
    IMAGES.bag,
    IMAGES.shirtThree,
    IMAGES.accessories,
  ];

  return fallbackImages[index % fallbackImages.length] || IMAGES.default;
};

function Home() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [menuOpen, setMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCollection, setSelectedCollection] = useState("");

  const [addingProductId, setAddingProductId] = useState(null);
  const [processingAction, setProcessingAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError("");

      const response = await getProducts();

      const result =
        response?.data?.products ??
        response?.data?.rows ??
        response?.products ??
        response?.data ??
        [];

      setProducts(Array.isArray(result) ? result : []);
    } catch (err) {
      setProductsError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load products. Please try again.",
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const names = products
      .map(
        (product) =>
          product?.category?.name ||
          product?.Category?.name ||
          product?.categoryName,
      )
      .filter(Boolean);

    return ["All", ...new Set(names)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const category =
        product?.category?.name ||
        product?.Category?.name ||
        product?.categoryName ||
        "";

      const searchableText = [
        product?.name,
        product?.description,
        category,
        product?.sku,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesCategory =
        selectedCategory === "All" ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      let matchesCollection = true;

      if (selectedCollection === "clothing") {
        matchesCollection =
          /clothing|apparel|shirt|tshirt|t-shirt|tee|hoodie|sweatshirt|sweater|trouser|jeans|dress|jacket|fashion/.test(
            searchableText,
          );
      } else if (selectedCollection === "accessories") {
        matchesCollection =
          /\b(accessory|accessories|watch|bag|handbag|backpack|purse)\b/.test(
            searchableText,
          );
      } else if (selectedCollection === "new") {
        matchesCollection =
          product?.isNew === true ||
          product?.isNewArrival === true ||
          product?.is_new === true;
      }

      return matchesCategory && matchesSearch && matchesCollection;
    });
  }, [products, searchTerm, selectedCategory, selectedCollection]);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const selectCollection = (keyword) => {
    setSelectedCategory("All");
    setSearchTerm("");
    setSelectedCollection(keyword);
    setMenuOpen(false);

    window.setTimeout(scrollToProducts, 50);
  };

  const showAllProducts = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedCollection("");
    setMenuOpen(false);
    window.setTimeout(scrollToProducts, 50);
  };

  const requireLogin = () => {
    if (!currentUser) {
      navigate("/login");
      return false;
    }

    return true;
  };

  const handleAddToCart = async (product) => {
    setNotice("");
    setError("");

    if (!requireLogin()) return;

    const stock = Number(product.stockQuantity ?? product.stock_quantity ?? 0);

    if (stock <= 0) {
      setError("This product is currently out of stock.");
      return;
    }

    setAddingProductId(product.id);

    try {
      const response = await addToCart(product.id, 1);

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to add this product to your cart.",
        );
      }

      setNotice(
        response?.message ||
          `${product.name} was added to your cart successfully.`,
      );
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Please sign in again to add products to your cart.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to add this product to your cart.",
        );
      }
    } finally {
      setAddingProductId(null);
    }
  };

  const handleWishlist = async (product) => {
    setNotice("");
    setError("");

    if (!requireLogin()) return;

    setProcessingAction(`wishlist-${product.id}`);

    try {
      const response = await addToWishlist(product.id);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to update your wishlist.");
      }

      setNotice(
        response?.message || `${product.name} was added to your wishlist.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update your wishlist.",
      );
    } finally {
      setProcessingAction("");
    }
  };

  const handleCompare = async (product) => {
    setNotice("");
    setError("");

    if (!requireLogin()) return;

    setProcessingAction(`compare-${product.id}`);

    try {
      const response = await addToComparison(product.id);

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to add this product for comparison.",
        );
      }

      setNotice(
        response?.message || `${product.name} was added to product comparison.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to add this product to comparison.",
      );
    } finally {
      setProcessingAction("");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setCurrentUser(null);
      setMenuOpen(false);
      navigate("/login");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#28221F]">
      {/* Announcement bar */}
      <div className="bg-[#28221F] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs">
        Discover your style · New-season favorites at ShopSphere
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e9e1d8] bg-[#FAF8F5]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-76px max-w-7xl items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <Link
            to="/"
            onClick={closeMenu}
            className="shrink-0 text-lg font-extrabold tracking-[0.12em] sm:text-2xl"
          >
            SHOP<span className="text-[#E85D26]">SPHERE</span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 text-xs font-semibold lg:flex"
          >
            <a href="#home" className="transition hover:text-[#E85D26]">
              Home
            </a>
            <a href="#collections" className="transition hover:text-[#E85D26]">
              Collections
            </a>
            <a
              href="#products"
              onClick={showAllProducts}
              className="transition hover:text-[#E85D26]"
            >
              Shop All
            </a>
            <Link to="/wishlist" className="transition hover:text-[#E85D26]">
              Wishlist
            </Link>
            <Link to="/comparison" className="transition hover:text-[#E85D26]">
              Compare
            </Link>
            {currentUser && (
              <Link to="/orders" className="transition hover:text-[#E85D26]">
                My Orders
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <span className="hidden max-w-28 truncate text-xs text-[#756e63] xl:inline">
                  Hi, {currentUser.firstName || currentUser.name || "there"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-full px-3 py-2 text-xs font-semibold hover:text-[#E85D26] sm:inline-flex"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-2 text-xs font-semibold hover:text-[#E85D26] sm:inline-flex"
              >
                Login
              </Link>
            )}

            <Link
              to="/cart"
              className="rounded-full bg-[#E85D26] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#c94818] sm:px-5"
            >
              My Bag
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2d8ce] text-xl lg:hidden"
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1 border-t border-[#e9e1d8] bg-[#FAF8F5] px-5 py-4 text-sm lg:hidden"
          >
            <a href="#home" onClick={closeMenu} className="py-3">
              Home
            </a>
            <a href="#collections" onClick={closeMenu} className="py-3">
              Collections
            </a>
            <a href="#products" onClick={showAllProducts} className="py-3">
              Shop All
            </a>
            <Link to="/wishlist" onClick={closeMenu} className="py-3">
              Wishlist
            </Link>
            <Link to="/comparison" onClick={closeMenu} className="py-3">
              Compare Products
            </Link>
            {currentUser ? (
              <>
                <Link to="/orders" onClick={closeMenu} className="py-3">
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMenu} className="py-3">
                Login
              </Link>
            )}
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section
          id="home"
          className="relative isolate flex min-h-570px items-center overflow-hidden bg-[#453b34] sm:min-h-650px lg:min-h-690px"
        >
          <img
            src={IMAGES.hero}
            alt="ShopSphere clothing collection"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/45 to-black/10" />

          <div className="mx-auto w-full max-w-7xl px-5 py-20 text-white sm:px-9 lg:px-12">
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffc29e]">
              The ShopSphere clothing edit
            </p>

            <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-8xl">
              Everyday
              <br />
              <em className="font-normal text-[#ffc29e]">style, redefined.</em>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-white/85 sm:text-base">
              Discover comfortable clothing, fresh wardrobe essentials, and
              carefully selected accessories for your everyday style.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => selectCollection("clothing")}
                className="min-h-12 rounded-full bg-[#E85D26] px-7 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c94818]"
              >
                Explore Clothing →
              </button>

              <button
                type="button"
                onClick={showAllProducts}
                className="min-h-12 rounded-full border border-white/80 bg-white/10 px-7 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white hover:text-[#28221F]"
              >
                Shop All Products →
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 sm:block">
            Everyday style, your way
          </div>
        </section>

        {/* Store benefits */}
        <section className="border-b border-[#e9e1d8] bg-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
            {[
              {
                icon: "✦",
                title: "Thoughtful Style",
                text: "Pieces for everyday living",
              },
              {
                icon: "↗",
                title: "Fresh Finds",
                text: "Discover new favorites",
              },
              {
                icon: "♡",
                title: "Your Wishlist",
                text: "Save the looks you love",
              },
              {
                icon: "✓",
                title: "Easy Shopping",
                text: "Simple online ordering",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0e8] text-xl text-[#E85D26]">
                  {item.icon}
                </span>
                <div>
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-[#756e63]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Clothing-focused collections */}
        <section
          id="collections"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
        >
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E85D26]">
                Find your next favorite
              </p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">
                Explore our collections
              </h2>
            </div>

            <button
              type="button"
              onClick={showAllProducts}
              className="w-fit text-sm font-bold text-[#E85D26] hover:text-[#c94818]"
            >
              Explore everything →
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((collection) => (
              <button
                type="button"
                key={collection.title}
                onClick={() => selectCollection(collection.keyword)}
                className="group relative isolate h-340px overflow-hidden rounded-2xl bg-[#ded8cf] text-left sm:h-400px"
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  loading="lazy"
                  className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    Discover ShopSphere
                  </p>
                  <h3 className="mt-2 font-serif text-3xl sm:text-4xl">
                    {collection.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/85">
                    {collection.subtitle}
                  </p>
                  <span className="mt-5 inline-flex rounded-full bg-[#E85D26] px-5 py-3 text-xs font-bold text-white transition group-hover:bg-white group-hover:text-[#28221F]">
                    Explore collection →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Editorial banner */}
        <section className="px-5 pb-16 sm:px-8 lg:px-10">
          <div className="relative mx-auto flex min-h-300px max-w-7xl items-center overflow-hidden rounded-3xl bg-[#292b24] sm:min-h-360px">
            <img
              src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1800&q=85"
              alt="Clothing from the ShopSphere collection"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />

            <div className="absolute inset-0 bg-linear-to-r from-black/75 to-black/10" />

            <div className="relative max-w-2xl px-6 py-12 text-white sm:px-12 sm:py-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ffc29e]">
                Your wardrobe, refreshed
              </p>

              <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                Simple pieces.
                <br />
                <em>Standout style.</em>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/85">
                Explore versatile clothing and carefully selected pieces to
                bring a little inspiration to every day.
              </p>

              <button
                type="button"
                onClick={showAllProducts}
                className="mt-7 rounded-full bg-[#E85D26] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c94818]"
              >
                Discover the collection →
              </button>
            </div>
          </div>
        </section>

        {/* Products */}
        <section
          id="products"
          className="scroll-mt-24 bg-[#F2EDE6] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E85D26]">
                  Handpicked for you
                </p>
                <h2 className="mt-3 font-serif text-4xl sm:text-5xl">
                  Trending now<span className="text-[#E85D26]">.</span>
                </h2>
                <p className="mt-3 text-sm text-[#756e63]">
                  Find your next favorite from our latest collection.
                </p>
              </div>

              <span className="text-xs font-semibold text-[#756e63]">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            </div>

            {/* Search and category filters */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-full border border-[#e0d6ca] bg-white px-5">
                <span aria-hidden="true" className="text-lg text-[#E85D26]">
                  ⌕
                </span>

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search clothing and products..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#999087]"
                  aria-label="Search products"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-xs font-bold text-[#E85D26]"
                  >
                    Clear
                  </button>
                )}
              </label>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedCollection("");
                    }}
                    className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                      selectedCategory === category
                        ? "bg-[#E85D26] text-white"
                        : "border border-[#e0d6ca] bg-white text-[#514940] hover:border-[#E85D26] hover:text-[#E85D26]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {selectedCollection && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e0d6ca] bg-white px-4 py-3">
                <p className="text-sm text-[#514940]">
                  Showing collection:{" "}
                  <strong>
                    {COLLECTIONS.find(
                      (collection) => collection.keyword === selectedCollection,
                    )?.title || selectedCollection}
                  </strong>
                </p>

                <button
                  type="button"
                  onClick={showAllProducts}
                  className="text-xs font-bold text-[#E85D26] hover:text-[#c94818]"
                >
                  Clear collection
                </button>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
              >
                <span>{notice}</span>
                <Link to="/cart" className="font-bold text-[#E85D26] underline">
                  View bag
                </Link>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
                {!currentUser && (
                  <Link to="/login" className="ml-2 font-bold underline">
                    Sign in
                  </Link>
                )}
              </div>
            )}

            {productsLoading && (
              <p role="status" className="py-16 text-center text-[#756e63]">
                Loading the latest styles...
              </p>
            )}

            {productsError && (
              <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                <p className="text-sm text-red-700">{productsError}</p>

                <button
                  type="button"
                  onClick={loadProducts}
                  className="mt-5 rounded-full bg-[#E85D26] px-6 py-3 text-xs font-bold text-white hover:bg-[#c94818]"
                >
                  Try again
                </button>
              </div>
            )}

            {!productsLoading &&
              !productsError &&
              filteredProducts.length === 0 && (
                <div className="rounded-2xl bg-white px-5 py-16 text-center">
                  <p className="font-serif text-2xl">No products found</p>

                  <p className="mt-2 text-sm text-[#756e63]">
                    {selectedCollection
                      ? "There are no products matching this collection yet. Explore all products or add matching products to your catalog."
                      : "Try another search or select a different category."}
                  </p>

                  <button
                    type="button"
                    onClick={showAllProducts}
                    className="mt-5 rounded-full bg-[#E85D26] px-6 py-3 text-xs font-bold text-white hover:bg-[#c94818]"
                  >
                    Show all products
                  </button>
                </div>
              )}

            {!productsLoading &&
              !productsError &&
              filteredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6">
                  {filteredProducts.map((product, index) => {
                    const stock = Number(
                      product.stockQuantity ?? product.stock_quantity ?? 0,
                    );

                    const price = Number(product.price ?? 0);
                    const comparePrice = Number(
                      product.compareAtPrice ?? product.compare_at_price ?? 0,
                    );

                    const isAdding = addingProductId === product.id;
                    const isSale =
                      Number.isFinite(comparePrice) && comparePrice > price;

                    return (
                      <article key={product.id} className="group min-w-0">
                        <div className="relative overflow-hidden rounded-xl bg-white">
                          <Link
                            to={`/products/${product.id}`}
                            className="relative block aspect-3/4 overflow-hidden"
                          >
                            <img
                              src={getProductImage(product, index)}
                              alt={product.name || "ShopSphere product"}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = IMAGES.default;
                              }}
                            />

                            {isSale && (
                              <span className="absolute left-2 top-2 rounded-full bg-[#E85D26] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white sm:left-3 sm:top-3">
                                Sale
                              </span>
                            )}

                            {stock <= 0 && (
                              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#28221F]">
                                Sold out
                              </span>
                            )}
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleWishlist(product)}
                            disabled={
                              processingAction === `wishlist-${product.id}`
                            }
                            aria-label={`Add ${product.name} to wishlist`}
                            title="Add to wishlist"
                            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg text-[#E85D26] shadow-sm transition hover:bg-[#E85D26] hover:text-white disabled:opacity-50 sm:right-3 sm:top-3"
                          >
                            {processingAction === `wishlist-${product.id}`
                              ? "…"
                              : "♡"}
                          </button>
                        </div>

                        <div className="pt-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8d7965] sm:text-[10px]">
                            {product?.category?.name ||
                              product?.Category?.name ||
                              product?.categoryName ||
                              "Clothing"}
                          </p>

                          <Link
                            to={`/products/${product.id}`}
                            className="mt-2 block min-h-10 font-serif text-base leading-snug transition hover:text-[#E85D26] sm:text-lg"
                          >
                            {product.name}
                          </Link>

                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-bold">
                              {formatPrice(price)}
                            </span>

                            {isSale && (
                              <span className="text-xs text-[#90877d] line-through">
                                {formatPrice(comparePrice)}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-[10px] text-[#756e63]">
                            {stock > 0
                              ? `${stock} available`
                              : "Currently unavailable"}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={isAdding || stock <= 0}
                            className="mt-3 min-h-10 w-full rounded-full bg-[#E85D26] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#c94818] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:text-xs"
                          >
                            {isAdding
                              ? "Adding..."
                              : stock <= 0
                                ? "Out of stock"
                                : "Add to bag +"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCompare(product)}
                            disabled={
                              processingAction === `compare-${product.id}`
                            }
                            className="mt-2 w-full py-2 text-[10px] font-semibold text-[#756e63] transition hover:text-[#E85D26] disabled:opacity-50"
                          >
                            {processingAction === `compare-${product.id}`
                              ? "Adding..."
                              : "⇄ Compare product"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </div>
        </section>

        {/* About */}
        <section id="about" className="px-5 py-20 text-center sm:py-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E85D26]">
            The ShopSphere philosophy
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Find the pieces that feel like <em>you.</em>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#756e63] sm:text-base">
            ShopSphere brings clothing and everyday essentials together in one
            welcoming shopping experience. Explore your favorites, save pieces
            for later, and discover your own style.
          </p>

          <button
            type="button"
            onClick={showAllProducts}
            className="mt-8 rounded-full bg-[#E85D26] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c94818]"
          >
            Explore ShopSphere →
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#28221F] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-9 border-b border-white/15 pb-9 md:flex-row">
          <div>
            <Link to="/" className="text-2xl font-extrabold tracking-[0.12em]">
              SHOP<span className="text-[#E85D26]">SPHERE</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">
              Your style. Your sphere. Discover something you'll love.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffc29e]">
              Quick links
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
              <a href="#home" className="hover:text-white">
                Home
              </a>
              <a href="#collections" className="hover:text-white">
                Collections
              </a>
              <a
                href="#products"
                onClick={showAllProducts}
                className="hover:text-white"
              >
                Shop
              </a>
              <Link to="/wishlist" className="hover:text-white">
                Wishlist
              </Link>
              <Link to="/comparison" className="hover:text-white">
                Compare
              </Link>
              <Link to="/cart" className="hover:text-white">
                My Bag
              </Link>
              {currentUser && (
                <Link to="/orders" className="hover:text-white">
                  My Orders
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 pt-6 text-xs text-white/50 sm:flex-row">
          <span>
            © {new Date().getFullYear()} ShopSphere. All rights reserved.
          </span>
          <span>Designed for your everyday style.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
