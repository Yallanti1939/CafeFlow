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
      intervalId = setInterval(loadTrackData, 5000);
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
      // Cancel endpoint
      // We will define customer cancel on the controller, or map to post /orders/cancel
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
      window.open(paymentService.getDownloadInvoiceUrl(inv.invoiceNumber), '_blank');
    } catch (e: any) {
      alert(e.response?.data || "Invoice is not available yet. Ensure payment is verified first.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse">Connecting to kitchen monitors...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-2xl font-bold text-cafeflow-dark mb-2">Order track failed</h2>
        <p className="text-cafeflow-textMuted text-sm mb-4">Make sure the URL details are correct.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-cafeflow-accent text-white rounded">Back to Menu</button>
      </div>
    );
  }

  const steps = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  const activeIndex = steps.indexOf(order.status);

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
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Live Order Status</span>
          <div className="flex items-center gap-2 bg-cafeflow-card px-3 py-1.5 rounded-full border border-cafeflow-light/50">
            {pollingActive && <RefreshCw className="w-4 h-4 text-cafeflow-cta animate-spin" />}
            <span className="text-xs text-cafeflow-dark font-bold uppercase tracking-wider">Live Updates</span>
          </div>
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8 space-y-6">
        {/* Main Details Card */}
        <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start border-b border-cafeflow-light/20 pb-4">
            <div>
              <span className="text-[10px] font-bold text-cafeflow-accent uppercase tracking-widest">Order Reference</span>
              <h2 className="text-lg font-bold text-cafeflow-dark">{order.orderIdFormatted}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-cafeflow-textMuted uppercase tracking-widest">Payment Status</span>
              <p className={`text-xs font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{order.paymentStatus}</p>
            </div>
          </div>

          {/* Stepper Status Timeline */}
          {order.status === 'CANCELLED' ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
              <Ban className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-sm font-bold">Order Cancelled</span>
                <p className="text-xs text-red-600 leading-normal">This order was cancelled. Refunds (if applicable) are processed within 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-6">
              {steps.map((step, idx) => {
                const isPassed = idx <= activeIndex;
                const isCurrent = idx === activeIndex;
                const label = step === 'PLACED' ? 'Order Placed' :
                              step === 'CONFIRMED' ? 'Confirmed' :
                              step === 'PREPARING' ? 'Preparing' :
                              step === 'READY' ? 'Ready for Pickup' : 'Completed';
                const desc = step === 'PLACED' ? 'Waiting for validation' :
                             step === 'CONFIRMED' ? 'Order queued' :
                             step === 'PREPARING' ? 'Barista compiling items' :
                             step === 'READY' ? 'Pick up at coffee bar!' : 'Handed over';

                return (
                  <div key={step} className="flex gap-4 items-start relative">
                    {/* Line Connector */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-3.5 top-7 w-[2px] h-10 ${idx < activeIndex ? 'bg-cafeflow-cta' : 'bg-cafeflow-light/40'}`} />
                    )}
                    
                    {/* Dot */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCurrent 
                        ? 'border-cafeflow-cta bg-cafeflow-cta text-white scale-110 shadow-md shadow-cafeflow-cta/30' 
                        : isPassed 
                          ? 'border-cafeflow-cta bg-cafeflow-cta/15 text-cafeflow-cta' 
                          : 'border-cafeflow-light/50 bg-cafeflow-card text-cafeflow-light'
                    }`}>
                      {isPassed && !isCurrent ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>

                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold ${isCurrent ? 'text-cafeflow-dark font-serif text-base' : isPassed ? 'text-cafeflow-text' : 'text-cafeflow-textMuted/60'}`}>{label}</h4>
                      <p className="text-xs text-cafeflow-textMuted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Options */}
        <div className="space-y-3">
          {order.paymentStatus === 'PAID' && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="w-full bg-cafeflow-card border border-cafeflow-light/50 hover:bg-cafeflow-bgSecondary text-cafeflow-text font-semibold py-3.5 rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" /> {downloading ? 'Downloading...' : 'Download PDF Receipt'}
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <button
              onClick={() => navigate(`/feedback/${order.orderIdFormatted}`)}
              className="w-full bg-cafeflow-accent hover:bg-cafeflow-dark text-white font-semibold py-3.5 rounded-lg shadow transition-all text-sm flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" /> Share Your Feedback
            </button>
          )}

          {order.status === 'PLACED' && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-3.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" /> {cancelling ? 'Processing...' : 'Cancel Order'}
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
