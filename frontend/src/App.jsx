import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import AllProducts from './components/allProducts';
import Login from './components/login';
import Register from './components/register';
import UserPage from './components/userPage';
import Home from './components/home';
import './styles/main.css';
import './styles/loginAndRegister.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Cart() {
  return <div style={{ padding: "2rem" }}><h2>Your Cart</h2></div>;
}

function Navbar({ user, handleLogout }) {
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
                  <i className="bi bi-person-circle"></i>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/cart">
                  <i className="bi bi-cart"></i>
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
                <Link className="nav-link" to="/register">
                  <i className="bi bi-cart"></i> Cart
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
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
