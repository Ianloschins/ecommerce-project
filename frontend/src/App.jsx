import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AllProducts from './components/allProducts';
import About from './components/about';
import Login from './components/login';
import Register from './components/register';
import UserPage from './components/userPage';
import './styles/main.css';
import './styles/loginAndRegister.css';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // or useNavigate here if needed
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {user ? (
          <>
            <Link to="/user">User Page</Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<AllProducts />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserPage />} />
      </Routes>
    </>
  );
}

export default AppWrapper;
