import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Lock, Mail, AlertCircle, Building2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Subdomain awareness
  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  // E.g., tenantname.clienthub.com -> parts = ['tenantname', 'clienthub', 'com']
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const subdomain = hostParts.length > (isLocalhost ? 1 : 2) && hostParts[0] !== 'www' ? hostParts[0] : null;

  // If already authenticated, redirect away from login page
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
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* App Branding Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-2xl shadow-md mb-3">
            C
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] font-sans">
            Client<span className="text-primary">Hub</span>
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Agency client portal and projects pipeline
          </p>
        </div>

        <Card className="border border-gray-100 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-5">
            <CardTitle className="text-xl font-bold text-center text-[#111111]">Sign in</CardTitle>
            <CardDescription className="text-xs text-center text-[#6B7280]">
              Enter your credentials to access your portal
            </CardDescription>

            {/* Subdomain-Aware Indicator */}
            {subdomain && (
              <div className="mt-3 flex items-center justify-center gap-1.5 bg-primary-light/50 border border-[#EEEDFE] rounded-lg px-3 py-1.5 text-xs text-primary font-semibold">
                <Building2 className="h-3.5 w-3.5" />
                <span>Logging into <span className="underline uppercase">{subdomain}</span> workspace</span>
              </div>
            )}
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] p-3 text-xs text-[#EF4444] font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#6B7280]">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@agency.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-lg text-sm focus-visible:ring-primary"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#6B7280]">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-lg text-sm focus-visible:ring-primary"
                    disabled={submitting}
                  />
                </div>
              </div>

            </CardContent>

            <CardFooter className="pt-2 pb-6">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Credentials Helper */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs space-y-1.5 text-[#6B7280] shadow-sm">
          <div className="font-semibold text-[#111111] flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Developer Demo Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium text-[#111111]">Agency Admin:</p>
              <p>admin@agency.com / admin123</p>
            </div>
            <div>
              <p className="font-medium text-[#111111]">Client User:</p>
              <p>client@acme.com / client123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
