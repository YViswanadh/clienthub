import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div>
        <h1>ClientHub</h1>
        <h2>Sign In</h2>
        <p>Sign in to your agency workspace.</p>
      </div>

      {error && (
        <div style={{ color: 'red' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email: </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@agency.com"
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="password">Password: </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={submitting}
          />
        </div>

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div>
        <h3>Demo credentials</h3>
        <p>Agency User: demo@clienthub.com / demo123</p>
        <p>Client User: client@demo.com / client123</p>
      </div>

      <div>
        <p>Don't have an account? Contact your agency.</p>
      </div>
    </div>
  );
}
