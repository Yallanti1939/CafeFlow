import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, CreditCard, Banknote, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

export default function Payment() {
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const mergeGuestCart = useCartStore((state) => state.mergeGuestCart);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const subtotal = useCartStore((state) => state.getCartSubtotal());
  const tax = useCartStore((state) => state.getCartTax());
  const total = useCartStore((state) => state.getCartFinalAmount());

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COUNTER_PAY'>('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Idempotency check key
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Mock Gateway modal state
  const [showMockGateway, setShowMockGateway] = useState(false);
  const [providerOrderId, setProviderOrderId] = useState('');
  const [initiatedAmount, setInitiatedAmount] = useState(0);
  const [createdOrderFormattedId, setCreatedOrderFormattedId] = useState('');

  useEffect(() => {
    // Generate UUID for idempotency key on mount
    setIdempotencyKey('idemp-' + Math.random().toString(36).substring(2) + '-' + Date.now());

    // Sync cart state on payment mount to ensure DB cart and guest cart merge
    async function syncPaymentCart() {
      if (authService.isAuthenticated()) {
        const local = localStorage.getItem('guest_cart');
        const hasLocal = local && JSON.parse(local).length > 0;
        if (hasLocal || useCartStore.getState().guestItems.length > 0) {
          await mergeGuestCart();
        } else {
          await fetchCart();
        }
      }
    }
    syncPaymentCart();
  }, [fetchCart, mergeGuestCart]);

  const handlePlaceOrderAndPay = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Place the order
      const order = await orderService.placeOrder(paymentMethod, 0, idempotencyKey);
      
      if (paymentMethod === 'COUNTER_PAY') {
        // Clear cart and redirect immediately to confirmation
        clearCart();
        navigate(`/order-confirmation/${order.orderIdFormatted}`);
      } else {
        // 2. Online checkout: initiate payment session
        setCreatedOrderFormattedId(order.orderIdFormatted);
        
        const session = await paymentService.initiatePayment({
          orderIdFormatted: order.orderIdFormatted,
          paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'CARD',
          amount: total
        }, idempotencyKey + '-pay');
        
        setProviderOrderId(session.providerPaymentId);
        setInitiatedAmount(session.amount);
        setShowMockGateway(true);
      }
    } catch (err: any) {
      setError(err.response?.data || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    setLoading(true);
    try {
      const mockPayId = 'pay_ref_' + Math.random().toString(36).substring(7).toUpperCase();
      await paymentService.verifyPayment({
        orderIdFormatted: createdOrderFormattedId,
        providerOrderId: providerOrderId,
        providerPaymentId: mockPayId,
        signature: 'valid_signature'
      }, idempotencyKey + '-verify');

      setShowMockGateway(false);
      clearCart();
      navigate(`/order-confirmation/${createdOrderFormattedId}`);
    } catch (err: any) {
      alert(err.response?.data || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentFailure = () => {
    setShowMockGateway(false);
    alert('Payment was cancelled or failed.');
  };

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-20 relative">
      {/* Mock Payment Gateway overlay */}
      {showMockGateway && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-cafeflow-accent/10 rounded-full flex items-center justify-center text-cafeflow-accent mb-2">
              {paymentMethod === 'UPI' ? <QrCode className="w-8 h-8" /> : <CreditCard className="w-8 h-8" />}
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-bold text-cafeflow-accent uppercase tracking-widest">Mock Gateway Portal</span>
              <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">Complete Transaction</h3>
              <p className="text-cafeflow-textMuted text-xs font-medium">Order Ref: {createdOrderFormattedId}</p>
            </div>

            <div className="bg-cafeflow-bg p-4 rounded-xl space-y-1">
              <span className="text-xs text-cafeflow-textMuted font-semibold">Amount to Pay</span>
              <p className="text-2xl font-bold text-cafeflow-dark">₹{initiatedAmount}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSimulatePaymentSuccess}
                className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Simulate Success
              </button>
              <button
                onClick={handleSimulatePaymentFailure}
                className="w-full bg-cafeflow-bgSecondary text-cafeflow-textMuted font-semibold py-3 rounded-lg hover:bg-cafeflow-light/20 transition-all text-sm"
              >
                Cancel / Simulate Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> View Cart
          </button>

          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Payment Options</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark mb-8">Payment Options</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-2xl border border-red-200 leading-relaxed mb-6 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Methods select */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-base font-bold uppercase tracking-wider text-cafeflow-textMuted">Choose Payment Mode</h2>
            
            <div className="space-y-4">
              {/* UPI */}
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between bg-cafeflow-card ${
                  paymentMethod === 'UPI' ? 'border-cafeflow-cta shadow-md scale-[1.01]' : 'border-cafeflow-light/40 hover:border-cafeflow-accent/40'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl md:text-2xl text-cafeflow-dark">UPI (Instant Transfer)</h3>
                    <p className="text-sm text-cafeflow-textMuted">Pay via Google Pay, PhonePe, Paytm, or BHIM QR.</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'UPI' ? 'border-cafeflow-cta bg-cafeflow-cta' : 'border-cafeflow-light'}`}>
                  {paymentMethod === 'UPI' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* CARD */}
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between bg-cafeflow-card ${
                  paymentMethod === 'CARD' ? 'border-cafeflow-cta shadow-md scale-[1.01]' : 'border-cafeflow-light/40 hover:border-cafeflow-accent/40'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl md:text-2xl text-cafeflow-dark">Debit / Credit Card</h3>
                    <p className="text-sm text-cafeflow-textMuted">Accepts Visa, Mastercard, or RuPay cards.</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'CARD' ? 'border-cafeflow-cta bg-cafeflow-cta' : 'border-cafeflow-light'}`}>
                  {paymentMethod === 'CARD' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* COUNTER_PAY */}
              <button
                onClick={() => setPaymentMethod('COUNTER_PAY')}
                className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between bg-cafeflow-card ${
                  paymentMethod === 'COUNTER_PAY' ? 'border-cafeflow-cta shadow-md scale-[1.01]' : 'border-cafeflow-light/40 hover:border-cafeflow-accent/40'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl md:text-2xl text-cafeflow-dark">Pay at Counter (Cash/Card)</h3>
                    <p className="text-sm text-cafeflow-textMuted">Show order ID and pay the cashier directly.</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'COUNTER_PAY' ? 'border-cafeflow-cta bg-cafeflow-cta' : 'border-cafeflow-light'}`}>
                  {paymentMethod === 'COUNTER_PAY' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-cafeflow-textMuted leading-relaxed pt-3 font-medium">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>256-bit encrypted checkout. Fast & verified payment processing.</span>
            </div>
          </div>

          {/* Checkout Totals Summary */}
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 space-y-6 shadow-md">
            <h3 className="font-serif text-2xl font-bold text-cafeflow-dark pb-4 border-b border-cafeflow-light/20">Order Summary</h3>
            
            <div className="space-y-4 text-base">
              <div className="flex justify-between text-cafeflow-textMuted">
                <span>Subtotal:</span>
                <span className="font-bold text-cafeflow-dark">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-cafeflow-textMuted">
                <span>Tax (5% GST):</span>
                <span className="font-bold text-cafeflow-dark">₹{tax}</span>
              </div>
              
              <div className="flex justify-between text-2xl font-bold text-cafeflow-dark pt-5 border-t border-cafeflow-light/20">
                <span>Total:</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrderAndPay}
              disabled={loading}
              className="w-full bg-cafeflow-cta text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:bg-cafeflow-accent hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Processing Order...
                </>
              ) : (
                `Place Order & Pay ₹${total}`
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
