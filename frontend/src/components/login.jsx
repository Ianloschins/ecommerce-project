import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await loginUser({ email, password });
      if (res.error) {
        setError(res.error);
      } else {
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
        navigate('/');
        window.location.reload(); // force state update in App.jsx
      }
    } catch {
      setError('Login failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
        <p>No account? <a href="/register">Register here</a></p>
      </form>
    </div>
  );
}
