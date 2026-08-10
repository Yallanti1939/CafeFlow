import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Key, ArrowRight, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { useCartStore } from '../store/useCartStore';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobile = searchParams.get('mobile') || '';
  const mergeGuestCart = useCartStore((state) => state.mergeGuestCart);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockOtp, setMockOtp] = useState<string | null>(null);

  useEffect(() => {
    // Read the mock OTP if generated in the dev profile
    const devOtp = sessionStorage.getItem('dev_mock_otp');
    if (devOtp) {
      setMockOtp(devOtp);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !otp.match(/^\d+$/)) {
      setError('Please enter a 6-digit numerical OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.verifyOtp(mobile, otp);
      
      // Merge guest cart items into DB
      await mergeGuestCart();
      
      sessionStorage.removeItem('dev_mock_otp');
      navigate('/payment');
    } catch (err: any) {
      setError(err.response?.data || 'Incorrect or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const res = await authService.sendOtp(mobile);
      if (res.otp) {
        setMockOtp(res.otp);
        sessionStorage.setItem('dev_mock_otp', res.otp);
      }
      alert('Verification code sent successfully!');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text flex flex-col justify-between pb-12">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/checkout`)}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> Back
          </button>
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Verify OTP</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      {/* Verification Panel */}
      <main className="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-10 shadow-lg space-y-8">
          <div className="text-center space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Enter OTP</h1>
            <p className="text-cafeflow-textMuted text-base md:text-lg">We've sent a 6-digit confirmation code to <span className="font-bold text-cafeflow-dark">{mobile}</span>.</p>
          </div>

          {mockOtp && (
            <div className="bg-amber-50 text-amber-900 text-sm p-4 rounded-2xl border border-amber-200 leading-relaxed space-y-1.5 shadow-sm">
              <span className="font-bold text-base">🧪 Developer Console Mode:</span>
              <p>Simulated SMS dispatch. Use OTP: <span className="font-mono font-bold text-base bg-amber-100 px-3 py-1 rounded-xl text-amber-950 border border-amber-300">{mockOtp}</span></p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-2xl border border-red-200 leading-relaxed shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider block text-center">Enter 6-Digit Verification Passcode</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1 2 3 4 5 6"
                className="w-full bg-cafeflow-bg border-2 border-cafeflow-light/60 focus:border-cafeflow-accent rounded-2xl px-8 py-4 text-xl text-center font-bold tracking-[0.5em] focus:outline-none transition-all shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cafeflow-cta text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:bg-cafeflow-accent transition-all flex items-center justify-center gap-3"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center justify-center text-sm text-cafeflow-textMuted font-medium pt-3 border-t border-cafeflow-light/20">
            Didn't receive code?&nbsp;
            <button 
              onClick={handleResend}
              className="text-cafeflow-accent font-bold hover:underline flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Resend Code
            </button>
          </div>
        </div>
      </main>

      <div />
    </div>
  );
}
