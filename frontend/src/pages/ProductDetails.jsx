import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../services/productService";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";

// Temporary fallback images until final product images are added.
const PRODUCT_IMAGES = {
  tshirtFront:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
  tshirtAlternate:
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85",
  watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
  shoes:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85",
  dress:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
  clothing:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
  placeholder:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85",
};

const isTshirtProduct = (product) => {
  const name = String(product?.name || "").toLowerCase();
  const category = String(
    product?.category?.name ||
      product?.Category?.name ||
      product?.categoryName ||
      "",
  ).toLowerCase();

  return (
    name.includes("t-shirt") ||
    name.includes("tshirt") ||
    name.includes("tee") ||
    category.includes("shirt") ||
    category.includes("clothing") ||
    category.includes("apparel")
  );
};

const getFallbackImage = (product) => {
  const name = String(product?.name || "").toLowerCase();
  const category = String(
    product?.category?.name ||
      product?.Category?.name ||
      product?.categoryName ||
      "",
  ).toLowerCase();

  if (isTshirtProduct(product)) {
    return PRODUCT_IMAGES.tshirtFront;
  }

  if (name.includes("watch") || category.includes("watch")) {
    return PRODUCT_IMAGES.watch;
  }

  if (
    name.includes("shoe") ||
    name.includes("sneaker") ||
    category.includes("shoe")
  ) {
    return PRODUCT_IMAGES.shoes;
  }

  if (name.includes("bag") || category.includes("bag")) {
    return PRODUCT_IMAGES.bag;
  }

  if (
    name.includes("dress") ||
    name.includes("gown") ||
    category.includes("dress")
  ) {
    return PRODUCT_IMAGES.dress;
  }

  if (category.includes("clothing") || category.includes("apparel")) {
    return PRODUCT_IMAGES.clothing;
  }

  return PRODUCT_IMAGES.placeholder;
};

const getImageUrl = (image) => {
  if (typeof image === "string") {
    return image;
  }

  return (
    image?.imageUrl || image?.url || image?.image_url || image?.secureUrl || ""
  );
};

const isPrimaryImage = (image) =>
  image?.isPrimary === true ||
  image?.isPrimary === 1 ||
  image?.is_primary === true;

const getProductImages = (product) => {
  const images =
    product?.images || product?.ProductImages || product?.productImages || [];

  if (!Array.isArray(images)) {
    return [];
  }

  return [...images].sort(
    (a, b) => Number(isPrimaryImage(b)) - Number(isPrimaryImage(a)),
  );
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

function ProductDetails() {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [wishlistError, setWishlistError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedImage("");
      setQuantity(1);
      setCartMessage("");
      setCartError("");
      setWishlistMessage("");
      setWishlistError("");

      try {
        const response = await getProductById(productId);

        const fetchedProduct =
          response?.data?.product ||
          response?.data?.data?.product ||
          response?.data?.data ||
          response?.product ||
          response?.data ||
          response;

        if (
          !fetchedProduct ||
          typeof fetchedProduct !== "object" ||
          Array.isArray(fetchedProduct) ||
          !fetchedProduct.id
        ) {
          throw new Error("Product details could not be loaded.");
        }

        if (isMounted) {
          setProduct(fetchedProduct);

          const images = getProductImages(fetchedProduct);
          const firstImage = images.find((image) => getImageUrl(image));

          setSelectedImage(
            getImageUrl(firstImage) || getFallbackImage(fetchedProduct),
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load product details.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleAddToCart = async () => {
    if (addingToCart || !product) return;

    setAddingToCart(true);
    setCartMessage("");
    setCartError("");

    try {
      const response = await addToCart(product.id, quantity);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to add product to cart.");
      }

      setCartMessage(
        response?.message || "Product added to your cart successfully.",
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setCartError("Please sign in before adding products to your cart.");
      } else {
        setCartError(
          err.response?.data?.message ||
            err.message ||
            "Unable to add product to cart.",
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (addingToWishlist || !product) return;

    setAddingToWishlist(true);
    setWishlistMessage("");
    setWishlistError("");

    try {
      const response = await addToWishlist(product.id);

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to add this product to your wishlist.",
        );
      }

      setWishlistMessage(
        response?.message || "Product added to your wishlist successfully.",
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistError("Please sign in to save products to your wishlist.");
      } else {
        setWishlistError(
          err.response?.data?.message ||
            err.message ||
            "Unable to add this product to your wishlist.",
        );
      }
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-amber-800" />
          <p className="mt-4 text-sm text-stone-600">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">
            Product unavailable
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error || "This product could not be found."}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = getProductImages(product)
    .map((image) => ({
      ...image,
      displayUrl: getImageUrl(image),
    }))
    .filter((image) => image.displayUrl);

  const fallbackImage = getFallbackImage(product);
  const displayImage = selectedImage || fallbackImage;

  const productName = product.name || product.title || "ShopSphere Product";
  const price = Number(product.price) || 0;
  const stock = Number(
    product.stockQuantity ?? product.stock ?? product.quantity ?? 0,
  );

  const categoryName =
    product.category?.name ||
    product.Category?.name ||
    product.categoryName ||
    "General";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-2xl font-black tracking-tight text-stone-900"
          >
            Shop<span className="text-amber-800">Sphere</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
            <Link to="/" className="transition hover:text-amber-800">
              Shop
            </Link>

            <Link to="/wishlist" className="transition hover:text-amber-800">
              ♡ Wishlist
            </Link>

            <Link to="/cart" className="transition hover:text-amber-800">
              Cart
            </Link>

            <Link to="/login" className="transition hover:text-amber-800">
              Account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <Link to="/" className="hover:text-amber-800">
            Home
          </Link>
          <span>/</span>
          <span>{categoryName}</span>
          <span>/</span>
          <span className="font-medium text-stone-900">{productName}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Product gallery */}
          <section>
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
              <img
                src={displayImage}
                alt={productName}
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackImage) {
                    event.currentTarget.src = fallbackImage;
                  }
                }}
                className="h-360px w-full object-cover sm:h-500px lg:h-600px"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={image.id ?? image.displayUrl ?? index}
                    type="button"
                    onClick={() => setSelectedImage(image.displayUrl)}
                    aria-label={`View product image ${index + 1}`}
                    className={`overflow-hidden rounded-xl border-2 bg-white transition ${
                      selectedImage === image.displayUrl
                        ? "border-amber-800"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img
                      src={image.displayUrl}
                      alt={`${productName} view ${index + 1}`}
                      className="h-20 w-full object-cover sm:h-24"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Product information */}
          <section className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
              {categoryName}
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {productName}
            </h1>

            <p className="mt-5 text-3xl font-bold text-stone-900">
              {formatPrice(price)}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stock > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {stock > 0 ? "In Stock" : "Out of Stock"}
              </span>

              <span className="text-sm text-stone-500">
                SKU: {product.sku || `SS-${product.id}`}
              </span>
            </div>

            <div className="my-8 h-px bg-stone-200" />

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                Product Description
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600 sm:text-base">
                {product.description ||
                  "Discover everyday style and quality with this ShopSphere product. Designed to complement your wardrobe and lifestyle."}
              </p>
            </div>

            {stock > 0 && (
              <div className="mt-8">
                <label
                  htmlFor="product-quantity"
                  className="mb-3 block text-sm font-semibold text-stone-800"
                >
                  Quantity
                </label>

                <div className="inline-flex items-center overflow-hidden rounded-xl border border-stone-300 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="px-4 py-3 text-lg transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>

                  <input
                    id="product-quantity"
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      if (Number.isInteger(value) && value >= 1) {
                        setQuantity(Math.min(value, stock));
                      }
                    }}
                    className="w-14 border-x border-stone-200 py-3 text-center text-sm font-semibold outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.min(stock, current + 1))
                    }
                    disabled={quantity >= stock}
                    aria-label="Increase quantity"
                    className="px-4 py-3 text-lg transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart || stock <= 0}
                className="w-full rounded-xl bg-stone-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stock <= 0
                  ? "Out of Stock"
                  : addingToCart
                    ? "Adding to Cart..."
                    : "Add to Cart"}
              </button>

              {cartError && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p>{cartError}</p>

                  {cartError.toLowerCase().includes("sign in") && (
                    <Link
                      to="/login"
                      className="mt-2 inline-block font-semibold underline"
                    >
                      Sign in to continue
                    </Link>
                  )}
                </div>
              )}

              {cartMessage && (
                <div
                  role="status"
                  className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                  <p>{cartMessage}</p>
                  <Link
                    to="/cart"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    View Cart →
                  </Link>
                </div>
              )}

              {/* Add to Wishlist */}
              <button
                type="button"
                onClick={handleAddToWishlist}
                disabled={addingToWishlist}
                className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-6 py-4 text-sm font-semibold text-stone-900 transition hover:border-amber-800 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToWishlist ? "Saving..." : "♡ Add to Wishlist"}
              </button>

              {wishlistError && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p>{wishlistError}</p>

                  {wishlistError.toLowerCase().includes("sign in") && (
                    <Link
                      to="/login"
                      className="mt-2 inline-block font-semibold underline"
                    >
                      Sign in to continue
                    </Link>
                  )}
                </div>
              )}

              {wishlistMessage && (
                <div
                  role="status"
                  className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                  <p>{wishlistMessage}</p>

                  <Link
                    to="/wishlist"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    View Wishlist →
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-stone-200 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Secure Shopping
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Shop with confidence.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Quality First
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Selected for everyday use.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Customer Support
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  We are here to help.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>

          <div className="flex gap-5">
            <Link to="/" className="hover:text-amber-800">
              Shop
            </Link>
            <Link to="/wishlist" className="hover:text-amber-800">
              Wishlist
            </Link>
            <Link to="/cart" className="hover:text-amber-800">
              Cart
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ProductDetails;
