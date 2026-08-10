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

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8 space-y-8">
        {/* Guest Tracking Form */}
        <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-cafeflow-dark">Guest Quick Track</h3>
            <p className="text-cafeflow-textMuted text-xs">Verify your order status without logging in.</p>
          </div>

          {publicError && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded border border-red-200">
              {publicError}
            </div>
          )}

          <form onSubmit={handlePublicTrack} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text"
                placeholder="Order Code (e.g. 9876-ORD-0001001)"
                value={publicOrderId}
                onChange={(e) => setPublicOrderId(e.target.value)}
                className="bg-cafeflow-bg border border-cafeflow-light/60 rounded px-3 py-2 text-xs focus:outline-none focus:border-cafeflow-accent transition-all"
                required
              />
              <input 
                type="tel"
                placeholder="Mobile Number (e.g. +919876543210)"
                value={publicMobile}
                onChange={(e) => setPublicMobile(e.target.value)}
                className="bg-cafeflow-bg border border-cafeflow-light/60 rounded px-3 py-2 text-xs focus:outline-none focus:border-cafeflow-accent transition-all"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-cafeflow-accent text-white py-2.5 rounded font-semibold text-xs hover:bg-cafeflow-dark transition-all flex items-center justify-center gap-1"
            >
              Track Order Status <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Logged in History */}
        {authService.isAuthenticated() && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cafeflow-textMuted">Your Order History</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(n => (
                  <div key={n} className="h-24 bg-cafeflow-card border border-cafeflow-light/20 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 bg-cafeflow-card rounded-xl border border-cafeflow-light/20 p-6">
                <Clock className="w-10 h-10 text-cafeflow-light mx-auto mb-2" />
                <h4 className="font-serif font-bold text-cafeflow-dark text-base mb-0.5">No orders found</h4>
                <p className="text-cafeflow-textMuted text-xs">You haven't checked out any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div 
                    key={ord.id}
                    onClick={() => navigate(`/track-order/${ord.orderIdFormatted}`)}
                    className="bg-cafeflow-card border border-cafeflow-light/35 rounded-xl p-4 shadow-sm hover:shadow hover:border-cafeflow-accent/40 cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cafeflow-dark">{ord.orderIdFormatted}</span>
                        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${getStatusStyle(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-cafeflow-textMuted font-medium">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} items
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-sm font-bold text-cafeflow-dark">₹{ord.finalAmount}</span>
                      <p className="text-[10px] text-cafeflow-textMuted uppercase font-semibold">{ord.paymentMethod}</p>
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
