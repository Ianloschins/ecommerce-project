import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AllProducts from './components/allProducts';
import Login from './components/login';
import Register from './components/register';
import UserPage from './components/userPage';
import Home from './components/home';
import Cart from './components/cart';
import { CART_UPDATED_EVENT, getCartItemCount } from './utils/cart';
import { fetchCurrentUser } from './api/api';
import './styles/main.css';
import './styles/loginAndRegister.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

function getDisplayName(user) {
  return user?.username || user?.email || "Account";
}

function Navbar({ user, cartCount, handleLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/">Ecommerce Shop</Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/">
              <i className="bi bi-house"></i> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/AllProducts">
              <i className="bi bi-collection"></i> Collection
            </Link>
          </li>
          {user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/user">
                  <i className="bi bi-person-circle"></i> {getDisplayName(user)}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/cart">
                  <i className="bi bi-cart"></i> Cart
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-sm btn-danger ms-3" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-left"></i> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  <i className="bi bi-box-arrow-in-right"></i> Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/cart">
                  <i className="bi bi-cart"></i> Cart
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string,
  }),
  cartCount: PropTypes.number.isRequired,
  handleLogout: PropTypes.func.isRequired,
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [cartCount, setCartCount] = useState(getCartItemCount);

  useEffect(() => {
    const updateCartCount = () => setCartCount(getCartItemCount());

    window.addEventListener(CART_UPDATED_EVENT, updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <>
      <Navbar user={user} cartCount={cartCount} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/AllProducts" element={<AllProducts />} />
        <Route path="/products/mens" element={<AllProducts category="men's clothing" />} />
        <Route path="/products/womens" element={<AllProducts category="women's clothing" />} />
        <Route path="/products/shoes" element={<AllProducts category="shoes" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
