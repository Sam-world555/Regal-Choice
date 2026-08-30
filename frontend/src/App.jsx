import { API_URL } from "./config";
import { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import "./components/Skeleton.css";
import { toast } from "react-toastify";
import Cart from "./Cart";
import Orders from "./Orders";
import OrderDetails from "./OrderDetails";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import LoginWithOTP from "./LoginWithOTP";
import Register from "./Register";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminOrderDetails from "./admin/AdminOrderDetails";
import AdminReviews from "./admin/AdminReviews";
import AdminCoupons from "./admin/AdminCoupons";
import AdminUsers from "./admin/AdminUsers";
import AdminProfile from "./admin/AdminProfile";
import Navbar from "./Navbar";
import ProductDetails from "./ProductDetails";
import Checkout from "./Checkout";
import ProductSkeleton from "./components/ProductSkeleton";
import ProductCarousel from "./components/ProductCarousel";
import Wishlist from "./Wishlist";
import Profile from "./Profile";
import "./Wishlist.css";
import "./Carousel.css";
import "./SearchSuggestions.css";
import {
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

function getStockInfo(stock) {
  if (!stock || stock <= 0) {
    return { label: "Out of Stock", className: "stock-badge-out" };
  }
  if (stock <= 5) {
    return { label: `Only ${stock} Left`, className: "stock-badge-low" };
  }
  return { label: "In Stock", className: "stock-badge-in" };
}

const POPULAR_SEARCHES = [
  "T-Shirt",
  "Jeans",
  "Hoodie",
  "Shirt",
  "Kurta",
];

function Home() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);

const [category, setCategory] = useState("");

const [sort, setSort] = useState("");

const [currentPage, setCurrentPage] = useState(1);

const productsPerPage = 8;
  const [search, setSearch] = useState("");
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [togglingWishlistId, setTogglingWishlistId] = useState(null);
  const token = sessionStorage.getItem("token");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchWrapRef = useRef(null);

  useEffect(() => {
  fetchProducts();
}, [search]);

  useEffect(() => {
    if (token) {
      fetchWishlist();
    }
  }, [token]);

  // Fetch the unfiltered product list once, purely to power search suggestions
  useEffect(() => {
    axios
      .get(API_URL + "/api/products")
      .then(({ data }) => setAllProducts(data))
      .catch((error) => console.log(error));
  }, []);

  // Close the suggestions dropdown when clicking outside the search box
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get(
        API_URL + "/api/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWishlistIds(data.map((item) => item.product._id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleWishlist = async (productId) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.warning("Please login first.");
      return;
    }

    try {
      setTogglingWishlistId(productId);

      const { data } = await axios.post(
        API_URL + "/api/wishlist/toggle",
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.wishlisted) {
        setWishlistIds((prev) => [...prev, productId]);
        toast.success("Added to Wishlist");
      } else {
        setWishlistIds((prev) =>
          prev.filter((id) => id !== productId)
        );
        toast.success("Removed from Wishlist");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update wishlist.");
    } finally {
      setTogglingWishlistId(null);
    }
  };

const fetchProducts = async () => {
  try {

    setLoading(true);

    const { data } = await axios.get(
      `${API_URL}/api/products?keyword=${search}`
    );

    setProducts(data);

    setLoading(false);

  } catch (error) {

    console.log(error);

    setLoading(false);

  }
};

  const handleAddToCart = async (productId) => {
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        toast.warning("Please login first.");
        return;
      }

      setAddingToCartId(productId);

      await axios.post(
        API_URL + "/api/cart",
        {
          product: productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Product added to cart!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to add product.");
    } finally {
      setAddingToCartId(null);
    }
  };

  const productSuggestions = useMemo(() => {
    if (!search.trim()) return [];

    const term = search.trim().toLowerCase();
    return allProducts
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [search, allProducts]);

  const handleSelectSuggestion = (product) => {
    setShowSuggestions(false);
    navigate(`/product/${product._id}`);
  };

  const handlePopularSearchClick = (term) => {
    setSearch(term);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

 // Curated homepage sections — derived from the full product list,
// only shown when the person hasn't typed a search yet.
const newArrivals = useMemo(
  () =>
    [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8),
  [products]
);

const bestSellers = useMemo(
  () => products.filter((p) => p.bestseller).slice(0, 8),
  [products]
);

const featuredProducts = useMemo(
  () => products.filter((p) => p.featured).slice(0, 8),
  [products]
);

const filteredProducts = useMemo(() => {
  let result = [...products];

  // Category Filter
  if (category) {
    result = result.filter((item) => item.category === category);
  }

  // Sort by Price Low → High
  if (sort === "low") {
    result.sort((a, b) => a.price - b.price);
  }

  // Sort by Price High → Low
  if (sort === "high") {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
}, [products, category, sort]);

const indexOfLastProduct =
  currentPage * productsPerPage;

const indexOfFirstProduct =
  indexOfLastProduct - productsPerPage;

const currentProducts =
  filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

const totalPages = Math.ceil(
  filteredProducts.length / productsPerPage
);
  return (
    <div className="container">
      <div className="brand-header">
        <p className="brand-eyebrow">Est. Tailored Goods</p>
        <h1>Regal Choice</h1>
        <div className="brand-rule" />
        <h2>Premium Clothing Brand</h2>

        <div className="search-wrap" ref={searchWrapRef}>
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search Products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="search-bar"
          />

          {showSuggestions && (
            <div className="search-suggestions-dropdown">
              {search.trim() ? (
                productSuggestions.length > 0 ? (
                  productSuggestions.map((product) => (
                    <button
                      key={product._id}
                      className="search-suggestion-item"
                      onClick={() => handleSelectSuggestion(product)}
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          className="search-suggestion-image"
                        />
                      )}
                      <span className="search-suggestion-name">
                        {product.name}
                      </span>
                      <span className="search-suggestion-price">
                        ₹{product.price}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="search-suggestion-empty">
                    No matching products
                  </p>
                )
              ) : (
                <div className="search-popular">
                  <p className="search-popular-label">Popular Searches</p>
                  <div className="search-popular-tags">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        className="search-popular-tag"
                        onClick={() => handlePopularSearchClick(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="filter-bar">
          <select
            className="filter-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="T-Shirt">T-Shirt</option>
            <option value="Shirt">Shirt</option>
            <option value="Jeans">Jeans</option>
            <option value="Trouser">Trouser</option>
            <option value="Hoodie">Hoodie</option>
            <option value="Jacket">Jacket</option>
            <option value="Sweater">Sweater</option>
            <option value="Shorts">Shorts</option>
            <option value="Kurta">Kurta</option>
            <option value="Ethnic Wear">Ethnic Wear</option>
            <option value="Activewear">Activewear</option>
            <option value="Innerwear">Innerwear</option>
          </select>

          <select
            className="filter-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Sort</option>
            <option value="low">
              Price Low → High
            </option>
            <option value="high">
              Price High → Low
            </option>
          </select>
        </div>
      </div>

      {!loading && filteredProducts.length > 0 && (
        <p className="results-count">
          Showing {currentProducts.length} of {filteredProducts.length} products
        </p>
      )}

      <Navbar />

      {!search && (
        <>
          <ProductCarousel
            title="New Arrivals"
            products={newArrivals}
            loading={loading}
          />

          <ProductCarousel
            title="Best Sellers"
            products={bestSellers}
            loading={loading}
          />

          <ProductCarousel
            title="Featured"
            products={featuredProducts}
            loading={loading}
          />
        </>
      )}

      <div className="products">
       {loading ? (
  Array.from({ length: productsPerPage }).map((_, index) => (
    <ProductSkeleton key={index} />
  ))
) : currentProducts.length === 0 ? (
  <div className="state-message">
    <h2>No products found</h2>
    <p className="state-subtext">Try a different search or category.</p>
  </div>
) : (
  currentProducts.map((product) => {
    const stockInfo = getStockInfo(product.stock);
    const isOutOfStock = !product.stock || product.stock <= 0;

    return (
    <div
      className="card"
      key={product._id}
    >
      <div className="card-image-wrap">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        )}

        {product.discount > 0 && (
          <span className="sale-badge">-{product.discount}%</span>
        )}

        <button
          className={
            wishlistIds.includes(product._id)
              ? "wishlist-heart-btn active"
              : "wishlist-heart-btn"
          }
          disabled={togglingWishlistId === product._id}
          onClick={() => handleToggleWishlist(product._id)}
          aria-label="Toggle Wishlist"
        >
          {wishlistIds.includes(product._id) ? "♥" : "♡"}
        </button>
      </div>

      <div className="card-body">
        <Link
          to={`/product/${product._id}`}
          className="card-title-link"
        >
          <h3>{product.name}</h3>
        </Link>

        <p className="card-category">{product.category}</p>

        <span className={`stock-badge-pill ${stockInfo.className}`}>
          {stockInfo.label}
        </span>

        <p className="card-description">{product.description}</p>

        <div className="card-footer">
          <div className="card-price-row">
            <p className="card-price">₹{product.price}</p>
            {product.originalPrice > product.price && (
              <p className="card-price-original">₹{product.originalPrice}</p>
            )}
          </div>

          <button
            className="add-to-cart-btn"
            disabled={addingToCartId === product._id || isOutOfStock}
            onClick={() =>
              handleAddToCart(product._id)
            }
          >
            {isOutOfStock
              ? "Out of Stock"
              : addingToCartId === product._id
              ? "Adding..."
              : "Add To Cart"}
          </button>
        </div>
      </div>
    </div>
    );
  })
)}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from(
            { length: totalPages },
            (_, index) => (
              <button
                key={index}
                onClick={() =>
                  setCurrentPage(index + 1)
                }
                className={
                  currentPage === index + 1
                    ? "page-btn page-btn-active"
                    : "page-btn"
                }
              >
                {index + 1}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/cart"
          element={<Cart />}
        />
        <Route
          path="/wishlist"
          element={<Wishlist />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/checkout"
          element={<Checkout />}
        />
        <Route
          path="/orders"
          element={<Orders />}
        />
        <Route
          path="/orders/:id"
          element={<OrderDetails />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/login-otp"
          element={<LoginWithOTP />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />
          <Route
            path="products"
            element={<AdminProducts />}
          />
          <Route
            path="orders"
            element={<AdminOrders />}
          />
          <Route
            path="orders/:id"
            element={<AdminOrderDetails />}
          />
          <Route
            path="reviews"
            element={<AdminReviews />}
          />
          <Route
            path="coupons"
            element={<AdminCoupons />}
          />
          <Route
            path="users"
            element={<AdminUsers />}
          />
          <Route
            path="profile"
            element={<AdminProfile />}
          />
        </Route>
        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />
      </Routes>
    </>
  );
}

export default App;