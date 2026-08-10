import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Mail, Lock, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafeflow-dark flex flex-col justify-between py-12 px-6">
      <div /> {/* Spacer */}

      <main className="max-w-lg w-full mx-auto">
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-cafeflow-accent/15 rounded-2xl flex items-center justify-center text-cafeflow-accent mb-3 shadow-inner">
              <Coffee className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Admin Portal</h1>
            <p className="text-cafeflow-textMuted text-sm font-semibold">Sign in to manage ordering, billing & payments.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-semibold p-4 rounded-2xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-extrabold text-cafeflow-textMuted uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cafeflow-textMuted w-5 h-5" />
                <input 
                  id="email"
                  type="email"
                  placeholder="admin@cafeflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded-2xl pl-12 pr-4 py-4 text-base font-semibold focus:outline-none focus:border-cafeflow-accent transition-all text-cafeflow-dark"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="pass" className="text-xs font-extrabold text-cafeflow-textMuted uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cafeflow-textMuted w-5 h-5" />
                <input 
                  id="pass"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded-2xl pl-12 pr-4 py-4 text-base font-semibold focus:outline-none focus:border-cafeflow-accent transition-all text-cafeflow-dark"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cafeflow-cta text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-cafeflow-accent hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="bg-cafeflow-bg p-4 rounded-2xl text-xs text-cafeflow-textMuted font-medium leading-relaxed flex items-start gap-3 border border-cafeflow-light/40">
            <ShieldCheck className="w-5 h-5 text-cafeflow-accent shrink-0 mt-0.5" />
            <p>Access limited to authorized baristas, managers, and super admins. Activity logs are audited in compliance with security guidelines.</p>
          </div>
        </div>
      </main>

      <div className="text-center text-xs text-cafeflow-light/60 font-semibold">
        &copy; {new Date().getFullYear()} CafeFlow. Enterprise Systems.
      </div>
    </div>
  );
}
