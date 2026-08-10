import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Clock, Coffee, ArrowRight, FileText, ChevronLeft } from 'lucide-react';
import { orderService, Order } from '../services/orderService';

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const data = await orderService.getCustomerOrderDetails(id);
        setOrder(data);
      } catch (e) {
        console.error('Failed to load confirmed order details', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse">Confirming order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-2xl font-bold text-cafeflow-dark mb-2">Order details not found</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-cafeflow-accent text-white rounded">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text flex flex-col justify-between pb-12">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> Home
          </button>

          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Order Confirmation</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-10 shadow-lg text-center space-y-8">
          <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-inner">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-bold text-cafeflow-dark">Order Confirmed!</h1>
            <p className="text-cafeflow-textMuted text-sm font-semibold">Your order has been transmitted directly to the kitchen.</p>
          </div>

          <div className="bg-cafeflow-bg p-4 rounded-2xl space-y-2 border border-cafeflow-light/50">
            <p className="text-cafeflow-textMuted text-xs font-bold uppercase tracking-wider">
              Order Code: <span className="text-lg bg-cafeflow-bgSecondary px-3 py-1 rounded-xl font-bold text-cafeflow-dark border border-cafeflow-light/50">{order.orderIdFormatted}</span>
            </p>
            <p className="text-xs text-cafeflow-accent font-bold">Estimated Preparation Time: ~15 mins</p>
          </div>

          {order.paymentMethod === 'COUNTER_PAY' && order.paymentStatus === 'PENDING' ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 font-medium space-y-1">
              <p className="font-bold text-sm text-amber-950">Counter Cash Payment Required</p>
              <p>Please proceed to the counter, show order code <span className="font-bold text-cafeflow-dark">{order.orderIdFormatted}</span>, and pay <span className="font-bold text-cafeflow-dark">₹{order.finalAmount}</span>. Kitchen preparation begins immediately after cashier confirmation.</p>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-900 text-sm md:text-base p-6 rounded-2xl border border-emerald-200 text-left space-y-3 leading-relaxed shadow-sm">
              <span className="font-bold text-lg flex items-center gap-2 text-emerald-900">☕ Order Confirmed:</span>
              <p>Payment of <span className="font-bold text-cafeflow-dark">₹{order.finalAmount}</span> verified! Your order details have been dispatched to the barista kitchen and preparation has started.</p>
            </div>
          )}

          <div className="space-y-3.5 pt-4">
            <button
              onClick={() => navigate(`/track-order/${order.orderIdFormatted}`)}
              className="w-full bg-cafeflow-cta text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-cafeflow-accent hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              Track Live Order <Clock className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-cafeflow-bgSecondary text-cafeflow-dark border-2 border-cafeflow-light/60 font-bold py-4 px-6 rounded-2xl hover:bg-cafeflow-light/40 transition-all text-lg"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </main>

      <div />
    </div>
  );
}
