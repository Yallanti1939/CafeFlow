import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { orderService, Order } from '../services/orderService';
import { Clock, RefreshCw, Filter, MessageSquare, AlertCircle, Ban, ArrowRight, Play, Check } from 'lucide-react';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE'); // ACTIVE, PLACED, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
  const [updatingMap, setUpdatingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(loadOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  async function loadOrders() {
    try {
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    setUpdatingMap(prev => ({ ...prev, [orderId]: true }));
    try {
      // Immediate 1-click status update without browser popups/prompts
      const notes = `Updated status to ${nextStatus}`;
      await orderService.updateOrderStatus(orderId, nextStatus, notes);
      
      // Update local state smoothly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));
    } catch (e) {
      console.error("Failed to update order status", e);
    } finally {
      setUpdatingMap(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setUpdatingMap(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderService.cancelOrder(orderId, "Cancelled by Admin");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (e) {
      console.error("Failed to cancel order", e);
    } finally {
      setUpdatingMap(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    setUpdatingMap(prev => ({ ...prev, [orderId]: true }));
    // Optimistic UI update for instant feedback
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextStatus = o.status === 'PLACED' ? 'CONFIRMED' : o.status;
        return { ...o, paymentStatus: 'PAID', status: nextStatus as any };
      }
      return o;
    }));

    try {
      await orderService.confirmOrderPayment(orderId);
    } catch (e) {
      console.error("Failed to confirm counter payment on server", e);
    } finally {
      setUpdatingMap(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ACTIVE') {
      return o.status !== 'COMPLETED' && o.status !== 'CANCELLED';
    }
    if (statusFilter !== 'ALL') {
      return o.status === statusFilter;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'CONFIRMED':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'PREPARING':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'READY':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'COMPLETED':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getActionButton = (order: Order) => {
    const isUpdating = updatingMap[order.id];
    switch (order.status) {
      case 'PLACED':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
            disabled={isUpdating}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-all"
          >
            Confirm Order
          </button>
        );
      case 'CONFIRMED':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
            disabled={isUpdating}
            className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-700 shadow-md transition-all"
          >
            Start Preparing
          </button>
        );
      case 'PREPARING':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'READY')}
            disabled={isUpdating}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md transition-all"
          >
            Mark Ready
          </button>
        );
      case 'READY':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
            disabled={isUpdating}
            className="flex items-center gap-1.5 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-900 shadow-md transition-all"
          >
            Complete Pick Up
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-cafeflow-bg min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Live Order Queue</h1>
            <p className="text-cafeflow-textMuted text-sm font-medium mt-1">Real-time status updates and order progress monitors.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-cafeflow-textMuted font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-cafeflow-cta" /> Live updates active
            </span>
            <button 
              onClick={loadOrders}
              className="text-sm font-bold px-4 py-2 bg-cafeflow-card border border-cafeflow-light/50 rounded-xl hover:bg-cafeflow-bgSecondary transition-all shadow-sm"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-5 shadow-sm">
          <Filter className="w-5 h-5 text-cafeflow-textMuted ml-1 shrink-0" />
          <span className="text-sm text-cafeflow-textMuted font-bold mr-2">Filter Queue:</span>
          
          {['ACTIVE', 'ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-sm px-4 py-2 rounded-full border font-bold transition-all ${
                statusFilter === f 
                  ? 'bg-cafeflow-accent text-white border-transparent shadow-sm scale-105' 
                  : 'bg-cafeflow-bg border-cafeflow-light/45 text-cafeflow-textMuted hover:bg-cafeflow-bgSecondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-cafeflow-textMuted font-medium animate-pulse">Connecting to live order queue...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-3xl border border-cafeflow-light/35 shadow-sm">
            <p className="text-cafeflow-textMuted text-base font-semibold">No orders in this status currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((ord) => (
              <div 
                key={ord.id}
                className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-cafeflow-light/20 pb-4">
                  <div className="space-y-1">
                    <span className="text-lg font-bold text-cafeflow-dark block">{ord.orderIdFormatted}</span>
                    <span className="text-xs text-cafeflow-textMuted font-semibold">Placed: {new Date(ord.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <span className={`text-xs font-extrabold border px-3 py-1 rounded-full ${getStatusColor(ord.status)}`}>
                    {ord.status}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2.5 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-cafeflow-textMuted">Ordered Items</span>
                  <div className="space-y-2">
                    {ord.items.map((item) => (
                      <div key={item.id} className="text-sm md:text-base">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-cafeflow-dark">{item.productName} × {item.quantity}</span>
                          <span className="font-bold text-cafeflow-dark">₹{item.totalPrice}</span>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-xs text-cafeflow-accent leading-normal pl-2 mt-0.5 font-medium">
                            {item.customizations.map(c => `${c.customizationOptionName} (+₹${c.additionalPrice})`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Block (Payment & Amounts) */}
                <div className="bg-cafeflow-bg p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs md:text-sm border border-cafeflow-light/40">
                  <div>
                    <span className="text-cafeflow-textMuted block font-medium">Payment Status</span>
                    <span className={`font-bold text-sm block ${ord.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {ord.paymentStatus} ({ord.paymentMethod})
                    </span>
                    {ord.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => handleConfirmPayment(ord.id)}
                        disabled={updatingMap[ord.id]}
                        className="mt-2 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Counter Paid
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-cafeflow-textMuted block font-medium">Total Amount</span>
                    <span className="font-bold text-lg text-cafeflow-dark">₹{ord.finalAmount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t border-cafeflow-light/20 pt-4">
                  <div>
                    {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        disabled={updatingMap[ord.id]}
                        className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all"
                      >
                        <Ban className="w-4 h-4" /> Cancel Order
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {getActionButton(ord)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
