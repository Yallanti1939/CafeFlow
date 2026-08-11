import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Clock, FileText, ArrowRight, Star } from 'lucide-react';
import { orderService, Order } from '../services/orderService';
import { authService } from '../services/authService';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Public tracking states
  const [publicOrderId, setPublicOrderId] = useState('');
  const [publicMobile, setPublicMobile] = useState('');
  const [publicError, setPublicError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        const data = await orderService.getCustomerOrders();
        setOrders(data);
      } catch (e) {
        console.error('Failed to load order history', e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handlePublicTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublicError(null);

    if (!publicOrderId.trim() || !publicMobile.trim()) {
      setPublicError('Both order ID and mobile number are required.');
      return;
    }

    try {
      // Validate tracking credentials
      const validatedOrder = await orderService.trackOrderPublicly(publicOrderId.trim(), publicMobile.trim());
      navigate(`/track-order/${validatedOrder.orderIdFormatted}`);
    } catch (err: any) {
      setPublicError(err.response?.data || 'Order not found or mobile number mismatch.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'text-blue-700 bg-blue-50 border-blue-100';
      case 'CONFIRMED':
        return 'text-indigo-700 bg-indigo-50 border-indigo-100';
      case 'PREPARING':
        return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'READY':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'COMPLETED':
        return 'text-gray-700 bg-gray-50 border-gray-100';
      default:
        return 'text-red-700 bg-red-50 border-red-100';
    }
  };

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-20">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> Home
          </button>
          
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Order History</span>
          
          <div className="w-8 h-8" />
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-10 space-y-10">
        {/* Guest Tracking Form */}
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 md:p-10 shadow-md space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Guest Quick Track</h3>
            <p className="text-cafeflow-textMuted text-sm md:text-base font-medium">Verify your order status instantly without logging in.</p>
          </div>

          {publicError && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-2xl border border-red-200 font-semibold">
              {publicError}
            </div>
          )}

          <form onSubmit={handlePublicTrack} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text"
                placeholder="Order Code (e.g. 9381-ORD-0001001)"
                value={publicOrderId}
                onChange={(e) => setPublicOrderId(e.target.value)}
                className="bg-cafeflow-bg border-2 border-cafeflow-light/60 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-cafeflow-accent transition-all font-medium"
                required
              />
              <input 
                type="tel"
                placeholder="Mobile Number (e.g. 9876543210)"
                value={publicMobile}
                onChange={(e) => setPublicMobile(e.target.value)}
                className="bg-cafeflow-bg border-2 border-cafeflow-light/60 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-cafeflow-accent transition-all font-medium"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-cafeflow-accent text-white py-4 rounded-2xl font-bold text-base md:text-lg hover:bg-cafeflow-dark transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Track Order Status <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Logged in History */}
        {authService.isAuthenticated() && (
          <div className="space-y-6">
            <h3 className="text-base md:text-lg font-bold uppercase tracking-wider text-cafeflow-textMuted">Your Order History</h3>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-28 bg-cafeflow-card border border-cafeflow-light/20 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-cafeflow-card rounded-3xl border border-cafeflow-light/20 p-8 shadow-sm">
                <Clock className="w-12 h-12 text-cafeflow-light mx-auto mb-3" />
                <h4 className="font-serif font-bold text-cafeflow-dark text-xl mb-1">No orders found</h4>
                <p className="text-cafeflow-textMuted text-sm font-medium">You haven't checked out any delicious items yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((ord) => (
                  <div 
                    key={ord.id}
                    onClick={() => navigate(`/track-order/${ord.orderIdFormatted}`)}
                    className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-cafeflow-accent/50 cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl md:text-2xl font-extrabold text-cafeflow-dark">{ord.orderIdFormatted}</span>
                        <span className={`text-xs md:text-sm font-bold border px-3.5 py-1 rounded-full shadow-sm ${getStatusStyle(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-cafeflow-textMuted font-semibold">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-2xl md:text-3xl font-extrabold text-cafeflow-dark">₹{ord.finalAmount}</span>
                      <p className="text-xs md:text-sm text-cafeflow-textMuted uppercase font-bold">{ord.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
