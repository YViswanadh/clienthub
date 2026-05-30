import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/ui/button';
import Input from '../components/ui/input';

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
    <div className="bg-surface text-on-surface min-h-screen flex flex-col md:flex-row w-full font-body-md">
      {/* Left Panel: Brand & Value Proposition */}
      <section className="flex-1 flex flex-col justify-between p-margin-mobile md:p-margin-desktop border-b md:border-b-0 md:border-r border-outline-variant bg-surface relative overflow-hidden">
        {/* Background Grid Pattern for architectural feel */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, #c5c6ca 1px, transparent 1px), linear-gradient(to bottom, #c5c6ca 1px, transparent 1px)', 
            backgroundSize: '32px 32px' 
          }}
        />
        
        {/* Header: Wordmark */}
        <header className="relative z-10">
          <h1 className="font-headline-md text-headline-md text-primary font-semibold tracking-tight">ClientHub</h1>
        </header>

        {/* Main Content */}
        <div className="relative z-10 my-16 md:my-auto">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-12 max-w-2xl leading-tight">
            Uncompromising transparency for creative partnerships.
          </h2>
          <ul className="space-y-6 max-w-xl">
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary mt-1">check</span>
              <div>
                <p className="font-body-md text-body-md text-on-surface">Real-time tracking</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Monitor project milestones and daily progress without the back-and-forth.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary mt-1">lock</span>
              <div>
                <p className="font-body-md text-body-md text-on-surface">Secure deliverables</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Access finalized assets through an encrypted, version-controlled vault.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary mt-1">receipt_long</span>
              <div>
                <p className="font-body-md text-body-md text-on-surface">Direct billing</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Review transparent invoices tied directly to approved work scopes.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="relative z-10 hidden md:block">
          <p className="font-label-sm text-label-sm text-on-surface-variant">© 2026 ClientHub Portal. Agency Internal Use Only.</p>
        </footer>
      </section>

      {/* Right Panel: Login Interface */}
      <section className="flex-1 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface-container-low">
        {/* Login Card (Planar Layering: No shadow, 1px border) */}
        <div className="w-full max-w-md bg-surface border border-outline-variant p-8 md:p-12 rounded-DEFAULT">
          <div className="mb-10">
            <h3 className="font-headline-md text-headline-md text-primary mb-2">Sign In</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Enter your portal credentials to continue.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-container text-on-error-container border border-error-container font-body-md text-body-md flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
                <div>
                  <p className="font-semibold mb-1">Error signing in</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <Input
              label="Email Address"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.com"
              iconLeft="mail"
              disabled={submitting}
            />

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors" href="#">Forgot password?</a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                iconLeft="key"
                disabled={submitting}
              />
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              iconRight="arrow_forward"
              className="w-full mt-4 py-4"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Hint Box (Contextual styling, subtle planar shift) */}
          <div className="mt-8 p-4 border border-outline-variant bg-surface-container flex items-start gap-3 rounded-DEFAULT">
            <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface mb-1 font-semibold">Demo Credentials</p>
              <p className="font-body-md text-body-md text-on-surface-variant font-mono text-sm">demo@clienthub.com / demo123 (Agency)</p>
              <p className="font-body-md text-body-md text-on-surface-variant font-mono text-sm">client@demo.com / client123 (Client)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
