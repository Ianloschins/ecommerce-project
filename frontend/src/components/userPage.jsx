import { useCallback, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  fetchAllProducts,
  fetchUserLikes,
  fetchProductAnalytics,
  fetchCurrentUser,
  updateCurrentUserProfile,
  updateCurrentUserAccount,
  addProduct,
  deleteProduct,
  unlikeProduct,
  uploadCsvProducts,
} from "../api/api";
import { addCartItem, getCartItemCount } from "../utils/cart";
import { FaUpload, FaTrash } from "react-icons/fa";

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

// Builds donut chart slices from category totals.
function buildCategoryChart(categoryStats) {
  const total = categoryStats.reduce((sum, item) => sum + item.productCount, 0);
  let start = 0;

  if (total === 0) {
    return { gradient: "#e5e7eb", legend: [] };
  }

  const legend = categoryStats.map((item, index) => {
    const percentage = (item.productCount / total) * 100;
    const end = start + percentage;
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const segment = `${color} ${start}% ${end}%`;

    start = end;

    return {
      ...item,
      color,
      percentage: Number(percentage.toFixed(1)),
      segment,
    };
  });

  return {
    gradient: `conic-gradient(${legend.map((item) => item.segment).join(", ")})`,
    legend,
  };
}

// Builds CSS crop styles for profile images.
function getProfileImageStyle({ zoom = 1, focusX = 50, focusY = 50 }) {
  return {
    transform: `scale(${zoom})`,
    transformOrigin: `${focusX}% ${focusY}%`,
  };
}

export default function UserPage() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const isProductManager =
    user?.product_manager || user?.role === "product_manager";
  const displayName = user?.username || user?.email || "User";
  const [products, setProducts] = useState([]);
  const [likedProductIds, setLikedProductIds] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    image: "",
  });
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [accountCartCount, setAccountCartCount] = useState(getCartItemCount);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileImageInput, setProfileImageInput] = useState("");
  const [profileZoomInput, setProfileZoomInput] = useState(1);
  const [profileFocusXInput, setProfileFocusXInput] = useState(50);
  const [profileFocusYInput, setProfileFocusYInput] = useState(50);
  const [profileError, setProfileError] = useState("");
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const categoryChart = analytics ? buildCategoryChart(analytics.categoryStats) : null;
  const savedProfileImageStyle = getProfileImageStyle({
    zoom: user?.profileZoom || 1,
    focusX: user?.profileFocusX || 50,
    focusY: user?.profileFocusY || 50,
  });
  const previewProfileImageStyle = getProfileImageStyle({
    zoom: profileZoomInput,
    focusX: profileFocusXInput,
    focusY: profileFocusYInput,
  });

  // Refreshes account data from SQL.
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    fetchCurrentUser()
      .then((freshUser) => {
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      });
  }, []);

  // Formats money values.
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);

  // Updates product and category state.
  const setProductState = (data) => {
    setProducts(data);
    setCategories([...new Set(data.map(p => p.category))]);
  };

  // Reloads product manager analytics.
  const refreshAnalytics = useCallback(async () => {
    if (!isProductManager) return;

    try {
      setAnalytics(await fetchProductAnalytics());
      setAnalyticsError("");
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setAnalyticsError(err.message);
    }
  }, [isProductManager]);

  // Reloads products and analytics from the backend.
  const refreshManagerData = async () => {
    const data = await fetchAllProducts();
    setProductState(data);
    await refreshAnalytics();
  };

  // Fetch products and categories
  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return;

      try {
        const data = await fetchAllProducts();
        setProductState(data);

        if (isProductManager) {
          await refreshAnalytics();
        } else {
          const likes = await fetchUserLikes(user.id);
          setLikedProductIds(likes.map((like) => like.productId));
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    loadProducts();
  }, [user, isProductManager, refreshAnalytics]);

  // Handle form field change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new product
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newProduct = await addProduct(form);
      setProductState([...products, newProduct]);
      await refreshAnalytics();

      setForm({
        title: "",
        price: "",
        category: "",
        description: "",
        image: "",
      });
    } catch (err) {
      console.error("Add failed:", err);
    }
  };

  // Delete a product
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      await refreshAnalytics();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUnlike = async (productId) => {
    try {
      await unlikeProduct(user.id, productId);
      setLikedProductIds(likedProductIds.filter((id) => id !== productId));
      setAccountMessage("Saved item removed.");
    } catch (err) {
      console.error("Unlike failed:", err);
    }
  };

  // Adds a saved item to the cart.
  const handleAddSavedToCart = (product) => {
    addCartItem(product);
    setAccountCartCount(getCartItemCount());
    setAccountMessage(`${product.title} added to cart.`);
  };

  // Opens the account details editor.
  const openAccountModal = () => {
    setAccountForm({
      username: user?.username || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setAccountError("");
    setAccountModalOpen(true);
  };

  // Updates account form fields.
  const handleAccountFormChange = (event) => {
    setAccountForm({ ...accountForm, [event.target.name]: event.target.value });
  };

  // Saves account detail changes.
  const handleAccountSave = async (event) => {
    event.preventDefault();

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError("New passwords do not match");
      return;
    }

    try {
      const result = await updateCurrentUserAccount({
        username: accountForm.username,
        email: accountForm.email,
        currentPassword: accountForm.currentPassword,
        newPassword: accountForm.newPassword,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);
      setAccountModalOpen(false);
      setAccountMessage("Account updated.");
    } catch (err) {
      setAccountError(err.message);
    }
  };

  // Opens the profile image editor.
  const openProfileModal = () => {
    setProfileImageInput(user?.profileImage || "");
    setProfileZoomInput(user?.profileZoom || 1);
    setProfileFocusXInput(user?.profileFocusX || 50);
    setProfileFocusYInput(user?.profileFocusY || 50);
    setProfileError("");
    setProfileModalOpen(true);
  };

  // Saves the profile image URL.
  const handleProfileSave = async (e) => {
    e.preventDefault();

    try {
      const freshUser = await updateCurrentUserProfile({
        profileImage: profileImageInput.trim(),
        profileZoom: profileZoomInput,
        profileFocusX: profileFocusXInput,
        profileFocusY: profileFocusYInput,
      });

      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
      setProfileModalOpen(false);
      setAccountMessage("Profile picture updated.");
    } catch (err) {
      setProfileError(err.message);
    }
  };

  // Removes the profile image URL.
  const handleProfileRemove = async () => {
    try {
      const freshUser = await updateCurrentUserProfile({ profileImage: "" });

      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
      setProfileImageInput("");
      setProfileZoomInput(1);
      setProfileFocusXInput(50);
      setProfileFocusYInput(50);
      setProfileModalOpen(false);
      setAccountMessage("Profile picture removed.");
    } catch (err) {
      setProfileError(err.message);
    }
  };

  // Renders the profile avatar button.
  const renderProfileAvatar = (className) => (
    <button
      type="button"
      className={className}
      onClick={openProfileModal}
      aria-label="Update profile picture"
    >
      <span className="profile-avatar-frame">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={`${displayName} profile`}
            style={savedProfileImageStyle}
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </span>
      <span className="avatar-edit-icon">
        <i className="bi bi-camera"></i>
      </span>
    </button>
  );

  // Renders the profile image modal.
  const renderProfileModal = () =>
    profileModalOpen && (
      <div className="profile-modal-backdrop" role="dialog" aria-modal="true">
        <form className="profile-modal" onSubmit={handleProfileSave}>
          <div className="profile-modal-header">
            <h2>Update Profile Picture</h2>
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              aria-label="Close profile picture popup"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="profile-preview">
            {profileImageInput.trim() ? (
              <img
                src={profileImageInput.trim()}
                alt="Profile preview"
                style={previewProfileImageStyle}
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <label>
            Image URL
            <input
              type="url"
              placeholder="https://example.com/profile.jpg"
              value={profileImageInput}
              onChange={(event) => setProfileImageInput(event.target.value)}
            />
          </label>

          <div className="profile-crop-controls">
            <label>
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={profileZoomInput}
                onChange={(event) => setProfileZoomInput(Number(event.target.value))}
              />
            </label>
            <label>
              Move Left/Right
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={profileFocusXInput}
                onChange={(event) => setProfileFocusXInput(Number(event.target.value))}
              />
            </label>
            <label>
              Move Up/Down
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={profileFocusYInput}
                onChange={(event) => setProfileFocusYInput(Number(event.target.value))}
              />
            </label>
          </div>

          {profileError && <p className="error">{profileError}</p>}

          <div className="profile-modal-actions">
            <button type="submit" className="btn btn-dark">
              Save
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={handleProfileRemove}>
              Remove
            </button>
          </div>
        </form>
      </div>
    );

  // Renders the account details modal.
  const renderAccountModal = () =>
    accountModalOpen && (
      <div className="profile-modal-backdrop" role="dialog" aria-modal="true">
        <form className="profile-modal" onSubmit={handleAccountSave}>
          <div className="profile-modal-header">
            <h2>Edit Account</h2>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              aria-label="Close account popup"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={accountForm.username}
              onChange={handleAccountFormChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={accountForm.email}
              onChange={handleAccountFormChange}
              required
            />
          </label>

          <div className="account-password-group">
            <h3>Password</h3>
            <label>
              Current Password
              <input
                type="password"
                name="currentPassword"
                value={accountForm.currentPassword}
                onChange={handleAccountFormChange}
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                value={accountForm.newPassword}
                onChange={handleAccountFormChange}
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                value={accountForm.confirmPassword}
                onChange={handleAccountFormChange}
              />
            </label>
          </div>

          {accountError && <p className="error">{accountError}</p>}

          <div className="profile-modal-actions">
            <button type="submit" className="btn btn-dark">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );

  // Bulk upload from JSON or CSV
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadMessage("");
    setUploadError("");

    const lowerFileName = file.name.toLowerCase();

    if (lowerFileName.endsWith(".csv") || lowerFileName.endsWith(".tsv")) {
      uploadCsvProducts(file)
        .then(async (result) => {
          const data = await fetchAllProducts();
          setProductState(data);
          await refreshAnalytics();
          setUploadMessage(
            `CSV upload complete: ${result.rowsRead} data rows read, ${result.inserted} inserted, ${result.skippedOrInvalid} skipped.`
          );

          if (result.errors?.length) {
            setUploadError(
              result.errors
                .slice(0, 5)
                .map((item) => `Row ${item.rowNumber}: ${item.error}`)
                .join(" ")
            );
          }
        })
        .catch((err) => {
          console.error("CSV upload error:", err);
          setUploadError(err.message);
        })
        .finally(() => {
          e.target.value = "";
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        for (const product of parsed) {
          const added = await addProduct(product);
          setProducts(prev => [...prev, added]);
        }
        await refreshAnalytics();
        setUploadMessage(`JSON upload complete: ${parsed.length} products processed.`);
      } catch (err) {
        console.error("Bulk upload error:", err);
        setUploadError(err.message || "Bulk upload failed");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isProductManager) {
    const likedProducts = products.filter((product) => likedProductIds.includes(product.id));

    return (
      <main className="account-page">
        <section className="account-hero">
          {renderProfileAvatar("account-avatar")}
          <div>
            <p className="account-eyebrow">Customer Account</p>
            <h1>{displayName}</h1>
            <p>{user.email}</p>
          </div>
          <span className="account-badge">
            <i className="bi bi-person-check"></i> Customer
          </span>
          <button type="button" className="account-edit-btn" onClick={openAccountModal}>
            <i className="bi bi-pencil-square"></i> Edit Account
          </button>
        </section>

        <section className="account-actions">
          <Link className="account-action" to="/cart">
            <i className="bi bi-cart"></i>
            <span>Cart</span>
            <strong>{accountCartCount}</strong>
          </Link>
          <Link className="account-action" to="/AllProducts">
            <i className="bi bi-bag"></i>
            <span>Shop</span>
            <strong>{products.length}</strong>
          </Link>
          <div className="account-action">
            <i className="bi bi-heart"></i>
            <span>Saved</span>
            <strong>{likedProducts.length}</strong>
          </div>
        </section>

        {accountMessage && <p className="success account-message">{accountMessage}</p>}

        <section className="account-section">
          <div className="account-section-heading">
            <div>
              <h2>Saved Items</h2>
              <p>{likedProducts.length} saved for later</p>
            </div>
            <Link className="account-link-button" to="/AllProducts">
              Browse Products
            </Link>
          </div>

        {likedProducts.length === 0 ? (
          <div className="account-empty">
            <i className="bi bi-heart"></i>
            <h3>No saved items yet</h3>
            <Link className="btn btn-dark" to="/AllProducts">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="saved-items-grid">
            {likedProducts.map((product) => (
              <article className="saved-item-card" key={product.id}>
                <img src={product.image} alt={product.title} />
                <div className="saved-item-body">
                  <span>{product.category}</span>
                  <h3>{product.title}</h3>
                  <strong>{formatCurrency(product.price)}</strong>
                  <div className="saved-item-actions">
                    <button
                      type="button"
                      className="btn btn-dark btn-sm"
                      onClick={() => handleAddSavedToCart(product)}
                    >
                      <i className="bi bi-cart-plus"></i> Add
                    </button>
                    <button
                      type="button"
                      className="saved-remove-btn"
                      onClick={() => handleUnlike(product.id)}
                      aria-label={`Remove ${product.title} from saved items`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </section>
        {renderProfileModal()}
        {renderAccountModal()}
      </main>
    );
  }

  return (
    <div className="manager-container">
      <div className="manager-profile-card">
        {renderProfileAvatar("manager-avatar")}
        <div>
          <h2>Product Manager</h2>
          <p>
            Signed in as <strong>{displayName}</strong> ({user.email})
          </p>
        </div>
        <button type="button" className="account-edit-btn manager-edit-btn" onClick={openAccountModal}>
          <i className="bi bi-pencil-square"></i> Edit Account
        </button>
      </div>

      {/* Shows analytics for product managers. */}
      <section className="analytics-dashboard">
        <div className="analytics-header">
          <div>
            <h3>Analytics Dashboard</h3>
            <p>Products, likes, categories, and seller ownership.</p>
          </div>
          <button type="button" className="refresh-dashboard-btn" onClick={refreshManagerData}>
            Refresh
          </button>
          {analyticsError && <p className="error">{analyticsError}</p>}
        </div>

        {analytics && (
          <>
            <div className="analytics-kpis">
              <div>
                <span>Total Products</span>
                <strong>{analytics.totalProducts}</strong>
              </div>
              <div>
                <span>Categories</span>
                <strong>{analytics.totalCategories}</strong>
              </div>
              <div>
                <span>Average Price</span>
                <strong>{formatCurrency(analytics.averagePrice)}</strong>
              </div>
              <div>
                <span>Total Likes</span>
                <strong>{analytics.totalLikes}</strong>
              </div>
            </div>

            {/* Shows category share as a circular chart. */}
            <section className="analytics-donut-panel">
              <div>
                <h4>Category Share</h4>
                <p>Visual split of products across categories.</p>
              </div>
              <div className="analytics-donut-wrap">
                <div
                  className="analytics-donut"
                  style={{ background: categoryChart.gradient }}
                  aria-label="Product category share chart"
                >
                  <span>{analytics.totalProducts}</span>
                  <small>products</small>
                </div>
                <div className="analytics-legend">
                  {categoryChart.legend.map((item) => (
                    <div key={item.category}>
                      <span style={{ backgroundColor: item.color }}></span>
                      <strong>{item.category}</strong>
                      <small>{item.percentage}%</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="analytics-grid">
              <section>
                <h4>Products by Category</h4>
                {analytics.categoryStats.map((item) => (
                  <div className="analytics-row" key={item.category}>
                    <span>{item.category}</span>
                    <strong>{item.productCount}</strong>
                    <small>{formatCurrency(item.averagePrice)} avg</small>
                  </div>
                ))}
              </section>

              <section>
                <h4>Products by Seller</h4>
                {analytics.sellerStats.map((item) => (
                  <div className="analytics-row" key={item.sellerUsername}>
                    <span>{item.sellerUsername}</span>
                    <strong>{item.productCount}</strong>
                    <small>{item.totalLikes} likes</small>
                  </div>
                ))}
              </section>

              <section>
                <h4>Most Liked Products</h4>
                {analytics.mostLikedProducts.map((item) => (
                  <div className="analytics-row" key={item.id}>
                    <span>{item.title}</span>
                    <strong>{item.likes}</strong>
                    <small>{item.sellerUsername}</small>
                  </div>
                ))}
              </section>

              <section>
                <h4>Recently Added</h4>
                {analytics.recentProducts.map((item) => (
                  <div className="analytics-row" key={item.id}>
                    <span>{item.title}</span>
                    <strong>{formatCurrency(item.price)}</strong>
                    <small>{item.sellerUsername}</small>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
      </section>

      {/* Bulk Upload */}
      <div className="bulk-upload-top">
        <label className="bulk-upload-btn">
          <FaUpload />
          Bulk Upload
          <input type="file" accept=".json,.csv,.tsv" onChange={handleBulkUpload} />
        </label>
      </div>
      {uploadMessage && <p className="success">{uploadMessage}</p>}
      {uploadError && <p className="error">{uploadError}</p>}

      {/* Add Product Form */}
      <form onSubmit={handleAdd}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          list="category-options"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <datalist id="category-options">
          {categories.map((cat, i) => (
            <option key={i} value={cat} />
          ))}
        </datalist>
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="image"
          placeholder="Image URL"
          value={form.image}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Product</button>
      </form>

      {/* Product List */}
      <ul style={{ marginTop: "2rem", padding: 0 }}>
        {products.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              padding: "10px",
              borderBottom: "1px solid #ccc",
            }}
          >
            <div>
              <strong>{p.title}</strong> - ${p.price} - {p.category}
              {p.seller?.username && <div>Seller: {p.seller.username}</div>}
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "red",
              }}
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
      {renderProfileModal()}
      {renderAccountModal()}
    </div>
  );
}
