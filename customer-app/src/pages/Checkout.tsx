import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export default function Checkout() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Format check (10-15 digits, optional + prefix)
    const normalized = mobileNumber.trim();
    if (!normalized.match(/^\+?\d{10,15}$/)) {
      setError('Please enter a valid mobile number (e.g. +919876543210 or 9876543210).');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(normalized);
      
      // If dev mode is active, store the mock OTP in session storage to pre-fill or guide the user
      if (res.otp) {
        sessionStorage.setItem('dev_mock_otp', res.otp);
      }
      
      navigate(`/verify-otp?mobile=${encodeURIComponent(normalized)}`);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text flex flex-col justify-between pb-12">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> View Cart
          </button>
          
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Guest Checkout</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-10 shadow-lg space-y-8">
          <div className="text-center space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Almost There!</h1>
            <p className="text-cafeflow-textMuted text-base md:text-lg">Enter your mobile number to checkout and place your order.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-2xl border border-red-200 leading-relaxed shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="mobile" className="text-sm font-bold text-cafeflow-textMuted uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-cafeflow-textMuted w-6 h-6" />
                <input 
                  id="mobile"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-cafeflow-bg border-2 border-cafeflow-light/60 focus:border-cafeflow-accent rounded-2xl px-12 py-4 text-base text-cafeflow-dark placeholder-cafeflow-textMuted focus:outline-none transition-all shadow-inner font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cafeflow-cta text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:bg-cafeflow-accent transition-all flex items-center justify-center gap-3"
            >
              {loading ? 'Sending Code...' : 'Send Verification OTP'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
      
      <div /> {/* Spacer */}
    </div>
  );
}
