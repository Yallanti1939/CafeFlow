import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, AlertTriangle, FileDown, Star, Ban, CheckCircle } from 'lucide-react';
import { orderService, Order, OrderStatusHistory } from '../services/orderService';
import { paymentService } from '../services/paymentService';

export default function TrackOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Poll details every 5 seconds for status updates
  useEffect(() => {
    if (!id) return;

    async function loadTrackData() {
      if (!id) return;
      try {
        const orderData = await orderService.getCustomerOrderDetails(id);
        setOrder(orderData);
        
        const historyData = await orderService.getOrderStatusHistory(id);
        setHistory(historyData);

        // Stop polling if final state (COMPLETED or CANCELLED) is reached
        if (orderData.status === 'COMPLETED' || orderData.status === 'CANCELLED') {
          setPollingActive(false);
        }
      } catch (e) {
        console.error('Failed to load tracking data', e);
      } finally {
        setLoading(false);
      }
    }

    loadTrackData();

    let intervalId: any;
    if (pollingActive) {
      intervalId = setInterval(loadTrackData, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, pollingActive]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const token = localStorage.getItem('customer_token');
      
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: "Cancelled by customer." })
      });

      if (res.ok) {
        alert("Order cancelled successfully.");
        window.location.reload();
      } else {
        const txt = await res.text();
        alert(txt || "Failed to cancel order.");
      }
    } catch (e) {
      alert("Failed to request cancel.");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const inv = await paymentService.getCustomerInvoice(order.id);
      const blob = await paymentService.downloadInvoicePdf(inv.invoiceNumber);
      
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert(e.response?.data || "Invoice is not available yet. Ensure payment is verified first.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse text-lg">Connecting to live kitchen display...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-3xl font-bold text-cafeflow-dark mb-2">Order tracking not found</h2>
        <p className="text-cafeflow-textMuted text-base mb-6">Please check your order code and try again.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-cafeflow-accent text-white font-bold rounded-xl shadow-md">Back to Menu</button>
      </div>
    );
  }

  const steps = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  const activeIndex = Math.max(0, steps.indexOf(order.status));
  const progressPercent = order.status === 'CANCELLED' ? 0 : Math.round(((activeIndex + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-20">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-24 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-7 h-7" /> Home
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl md:text-4xl font-bold text-cafeflow-dark">Live Order Status</span>
            <span className="hidden sm:inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Live
            </span>
          </div>

          <div className="flex items-center gap-2 bg-cafeflow-card px-4 py-2 rounded-full border border-cafeflow-light/50 shadow-sm">
            {pollingActive && <RefreshCw className="w-4 h-4 text-cafeflow-cta animate-spin" />}
            <span className="text-xs text-cafeflow-dark font-bold uppercase tracking-wider">3s Sync</span>
          </div>
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8 space-y-8">
        {/* Main Details Card (Enlarged & Enhanced) */}
        <div className="bg-cafeflow-card border-2 border-cafeflow-light/40 rounded-3xl p-8 md:p-10 shadow-lg space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cafeflow-light/30 pb-6">
            <div>
              <span className="text-xs font-bold text-cafeflow-accent uppercase tracking-widest">Live Order Tracker</span>
              <h2 className="text-2xl md:text-3xl font-bold font-sans text-cafeflow-dark mt-1 tracking-wider">{order.orderIdFormatted}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-widest block">Payment Status</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase mt-1 ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          {order.status !== 'CANCELLED' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-cafeflow-textMuted">
                <span>Progress Tracker</span>
                <span className="text-cafeflow-cta font-extrabold">{progressPercent}% Completed</span>
              </div>
              <div className="w-full h-3 bg-cafeflow-bgSecondary rounded-full overflow-hidden border border-cafeflow-light/40">
                <div 
                  className="h-full bg-gradient-to-r from-cafeflow-accent to-cafeflow-cta transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Stepper Status Timeline (Enlarged) */}
          {order.status === 'CANCELLED' ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 flex items-center gap-4">
              <Ban className="w-8 h-8 shrink-0" />
              <div>
                <span className="text-lg font-bold">Order Cancelled</span>
                <p className="text-sm text-red-600 leading-normal">This order was cancelled. Any processed payments will be refunded automatically within 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-8">
              {steps.map((step, idx) => {
                const isPassed = idx <= activeIndex;
                const isCurrent = idx === activeIndex;
                const label = step === 'PLACED' ? 'Order Placed' :
                              step === 'CONFIRMED' ? 'Confirmed by Kitchen' :
                              step === 'PREPARING' ? 'Preparing Items' :
                              step === 'READY' ? 'Ready for Pickup' : 'Order Completed';
                const desc = step === 'PLACED' ? 'Received & pending validation' :
                             step === 'CONFIRMED' ? 'Accepted & added to active queue' :
                             step === 'PREPARING' ? 'Baristas actively crafting your order' :
                             step === 'READY' ? 'Ready at the pickup counter!' : 'Picked up & handed over';

                return (
                  <div key={step} className="flex gap-6 items-start relative">
                    {/* Line Connector */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-5 top-12 w-[3px] h-12 ${idx < activeIndex ? 'bg-cafeflow-cta' : 'bg-cafeflow-light/30'}`} />
                    )}
                    
                    {/* Stepper Node (Enlarged w-10 h-10 to w-12 h-12) */}
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCurrent 
                        ? 'border-cafeflow-cta bg-cafeflow-cta text-white scale-110 shadow-lg shadow-cafeflow-cta/30 ring-4 ring-cafeflow-cta/20' 
                        : isPassed 
                          ? 'border-cafeflow-cta bg-cafeflow-cta/15 text-cafeflow-cta' 
                          : 'border-cafeflow-light/50 bg-cafeflow-bg text-cafeflow-textMuted/50'
                    }`}>
                      {isPassed && !isCurrent ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-base font-extrabold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`font-bold transition-all ${isCurrent ? 'text-cafeflow-dark font-serif text-xl md:text-2xl text-cafeflow-cta' : isPassed ? 'text-cafeflow-dark text-lg font-semibold' : 'text-cafeflow-textMuted/60 text-base'}`}>{label}</h4>
                        {isCurrent && (
                          <span className="bg-cafeflow-cta/10 text-cafeflow-cta border border-cafeflow-cta/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full animate-pulse">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-cafeflow-textMuted leading-relaxed font-medium">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Options */}
        <div className="space-y-4">
          {order.paymentStatus === 'PAID' && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="w-full bg-cafeflow-cta hover:bg-cafeflow-accent text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base md:text-lg flex items-center justify-center gap-3"
            >
              <FileDown className="w-5 h-5" /> {downloading ? 'Preparing Receipt PDF...' : 'Download Official PDF Receipt'}
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <button
              onClick={() => navigate(`/feedback/${order.orderIdFormatted}`)}
              className="w-full bg-cafeflow-accent hover:bg-cafeflow-dark text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base md:text-lg flex items-center justify-center gap-3"
            >
              <Star className="w-5 h-5" /> Share Your Feedback
            </button>
          )}

          {order.status === 'PLACED' && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 font-bold py-4 px-6 rounded-2xl transition-all text-base flex items-center justify-center gap-3"
            >
              <Ban className="w-5 h-5" /> {cancelling ? 'Processing Cancellation...' : 'Cancel Order'}
            </button>
          )}
        </div>

        {/* Ordered items snapshot */}
        <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-cafeflow-dark">Items Summary</h3>
          <div className="divide-y divide-cafeflow-light/20">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-cafeflow-text">{item.productName} × {item.quantity}</span>
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-[10px] text-cafeflow-textMuted leading-tight mt-0.5">
                      {item.customizations.map(c => c.customizationOptionName).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-cafeflow-text">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-cafeflow-light/20 font-bold text-sm text-cafeflow-dark">
            <span>Total Paid Amount:</span>
            <span>₹{order.finalAmount}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
