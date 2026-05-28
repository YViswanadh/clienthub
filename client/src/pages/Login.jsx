import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Subdomain awareness
  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const subdomain = hostParts.length > (isLocalhost ? 1 : 2) && hostParts[0] !== 'www' ? hostParts[0] : null;

  // If already authenticated, redirect to root dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      triggerShake();
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
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => {
      setShouldShake(false);
    }, 450);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans">
      {/* Keyframe Inject for credentials wrong shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* LEFT PANEL — Dark Branding (45% Width on Desktop) */}
      <div
        className="w-full md:w-[45%] h-[80px] md:h-full shrink-0 relative flex flex-row md:flex-col items-center justify-between md:justify-center p-6 md:p-12 overflow-hidden"
        style={{ backgroundColor: 'var(--void)' }}
      >
        {/* Background Visual Circles (Desktop only) */}
        <div
          className="absolute rounded-full pointer-events-none hidden md:block"
          style={{
            width: '300px',
            height: '300px',
            backgroundColor: 'var(--brand-color, var(--electric))',
            opacity: 0.03,
            top: '-100px',
            left: '-100px',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none hidden md:block"
          style={{
            width: '400px',
            height: '400px',
            backgroundColor: 'var(--brand-color, var(--electric))',
            opacity: 0.02,
            bottom: '-150px',
            right: '-100px',
          }}
        />

        {/* Mobile Left/Top Content */}
        <div className="md:hidden flex items-center justify-between w-full h-full relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/5 text-white font-bold text-lg"
              style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              C
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white m-0">ClientHub</h2>
              <p className="text-[10px] text-[#A3A3C8]/70 m-0">The command center for your agency.</p>
            </div>
          </div>
          <span className="text-[10px] text-[#4E4E6B]">v1.0.0</span>
        </div>

        {/* Desktop Left Content */}
        <div className="hidden md:flex flex-col justify-between h-full relative z-10 w-full">
          <div className="my-auto space-y-12">
            <div>
              {/* Logo square */}
              <div
                className="flex h-12 w-12 items-center justify-center text-white font-bold text-2xl shadow-sm"
                style={{ backgroundColor: 'var(--brand-color, var(--electric))', borderRadius: '12px' }}
              >
                C
              </div>
              <h1 className="text-2xl font-semibold text-white mt-4 mb-0">
                Client<span style={{ color: 'var(--brand-color, var(--electric))' }}>Hub</span>
              </h1>
              <p className="text-[15px] mt-2 mb-0 max-w-[260px]" style={{ color: 'var(--void-text)', lineHeight: '1.6' }}>
                The command center for your agency.
              </p>
            </div>

            {/* Highlights list */}
            <div className="space-y-4">
              {[
                'Multi-tenant workspace isolation',
                'Real-time file approvals',
                'Stripe-powered invoicing',
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-color, var(--electric))' }} />
                  <span className="text-[13px]" style={{ color: '#8888A8' }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-[#4E4E6B] mt-auto">v1.0.0</span>
        </div>
      </div>

      {/* RIGHT PANEL — Light Form (55% Width on Desktop) */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 h-[calc(100vh-80px)] md:h-full overflow-y-auto">
        <div
          className={`w-full max-w-[340px] space-y-6 ${shouldShake ? 'animate-shake' : ''}`}
        >
          {/* Header titles */}
          <div>
            <h1 className="text-[22px] font-semibold text-[#0E0E1A] m-0">Welcome back</h1>
            <p className="text-xs mt-1 m-0 text-slate-500">Sign in to your agency workspace.</p>

            {/* Subdomain-Aware Indicator */}
            {subdomain && (
              <div
                className="mt-3 flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--electric-muted)',
                  color: 'var(--brand-color, var(--electric))',
                }}
              >
                <span>
                  Logging into <span className="underline uppercase">{subdomain}</span> workspace
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Error Alert */}
            {error && (
              <div
                className="flex items-start gap-2.5 p-3 text-xs"
                style={{
                  backgroundColor: 'var(--ember-light)',
                  borderLeft: '3px solid var(--ember)',
                  borderRadius: 'var(--radius-md)',
                  color: '#9B1C1C',
                }}
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="font-semibold leading-normal">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-[12px] font-medium text-slate-500 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                disabled={submitting}
                className="w-full px-3 rounded-lg outline-none transition-all text-xs"
                style={{
                  height: '40px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--brand-color, var(--electric))';
                  e.target.style.boxShadow = '0 0 0 3px var(--electric-muted)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-[12px] font-medium text-slate-500 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full pl-3 pr-10 rounded-lg outline-none transition-all text-xs"
                  style={{
                    height: '40px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--brand-color, var(--electric))';
                    e.target.style.boxShadow = '0 0 0 3px var(--electric-muted)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {/* Eye Show/Hide password switch */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-xs font-semibold tracking-wide transition-all active:scale-[0.98] border-none"
              style={{
                height: '42px',
                backgroundColor: 'var(--brand-color, var(--electric))',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Don't have an account? Contact your agency.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
