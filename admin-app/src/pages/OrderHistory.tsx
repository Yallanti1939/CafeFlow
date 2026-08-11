import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { orderService, Order } from '../services/orderService';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  FileDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Phone, 
  ShoppingBag, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  
  // Expanded Order Card ID
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  async function loadOrderHistory() {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to fetch order history', e);
    } finally {
      setLoading(false);
    }
  }

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    // 1. Text Search (Order ID, Mobile, or Product Name)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchId = order.orderIdFormatted?.toLowerCase().includes(query);
      const matchMobile = order.customerMobile?.toLowerCase().includes(query);
      const matchProduct = order.items?.some(i => i.productName?.toLowerCase().includes(query));
      if (!matchId && !matchMobile && !matchProduct) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }

    // 3. Payment Filter
    if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) {
      return false;
    }

    // 4. Date Filter
    if (dateFilter !== 'ALL' && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'WEEK') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'MONTH') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < thirtyDaysAgo) return false;
      }
    }

    return true;
  });

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // PDF Download Handler
  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingId(order.orderIdFormatted);
    try {
      // First get invoice number or construct invoice download URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const token = localStorage.getItem('admin_token');

      // Fetch customer invoice metadata or download directly by order
      const invRes = await fetch(`${API_BASE_URL}/api/customer/invoices/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let invoiceNumber = `INV-${order.id}`;
      if (invRes.ok) {
        const invData = await invRes.json();
        invoiceNumber = invData.invoiceNumber;
      }

      // Fetch binary PDF
      const pdfRes = await fetch(`${API_BASE_URL}/api/invoices/download/${invoiceNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!pdfRes.ok) {
        throw new Error("PDF generation pending or failed.");
      }

      const blob = await pdfRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert("Invoice PDF is not available yet. Ensure order is paid.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      case 'READY':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Ready</span>;
      case 'PREPARING':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 animate-spin" /> Preparing</span>;
      case 'CONFIRMED':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Confirmed</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Placed</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-cafeflow-bg text-cafeflow-text">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-cafeflow-card p-8 rounded-3xl border border-cafeflow-light/35 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cafeflow-cta/10 text-cafeflow-cta rounded-2xl">
                <History className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-cafeflow-dark">Order History Archive</h1>
                <p className="text-cafeflow-textMuted text-sm font-medium mt-0.5">Comprehensive audit logs of all past & completed customer transactions.</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadOrderHistory}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-cafeflow-card hover:bg-cafeflow-bgSecondary border border-cafeflow-light/60 rounded-2xl text-sm font-bold text-cafeflow-dark shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cafeflow-cta' : ''}`} /> Refresh Archive
          </button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Total Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-cafeflow-dark">{totalOrdersCount}</span>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ShoppingBag className="w-6 h-6" /></div>
            </div>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Completed Revenue</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-emerald-700">₹{totalRevenue}</span>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
            </div>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Avg Order Value</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-cafeflow-dark">₹{avgOrderValue}</span>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
            </div>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Cancelled Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">{cancelledCount}</span>
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><XCircle className="w-6 h-6" /></div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-cafeflow-textMuted" />
              <input
                type="text"
                placeholder="Search order ID, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-cafeflow-bg border border-cafeflow-light/50 rounded-2xl text-sm font-medium focus:outline-none focus:border-cafeflow-cta"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-cafeflow-bg border border-cafeflow-light/50 rounded-2xl text-sm font-bold text-cafeflow-dark focus:outline-none focus:border-cafeflow-cta"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="READY">READY</option>
                <option value="PREPARING">PREPARING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PLACED">PLACED</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-3 bg-cafeflow-bg border border-cafeflow-light/50 rounded-2xl text-sm font-bold text-cafeflow-dark focus:outline-none focus:border-cafeflow-cta"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 bg-cafeflow-bg border border-cafeflow-light/50 rounded-2xl text-sm font-bold text-cafeflow-dark focus:outline-none focus:border-cafeflow-cta"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="WEEK">Past 7 Days</option>
                <option value="MONTH">Past 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-20 text-cafeflow-textMuted font-medium animate-pulse text-lg">
            Loading order history archive...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-16 text-center space-y-3">
            <History className="w-12 h-12 text-cafeflow-textMuted/50 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">No historical orders match your query</h3>
            <p className="text-cafeflow-textMuted text-sm">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <div 
                  key={order.id}
                  className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-cafeflow-light/20 pb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-cafeflow-accent uppercase tracking-widest block">Order Code</span>
                        <span className="text-lg font-bold text-cafeflow-dark">{order.orderIdFormatted}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-cafeflow-light/40" />
                      <div>
                        <span className="text-[10px] font-bold text-cafeflow-textMuted uppercase tracking-widest block">Customer</span>
                        <span className="text-sm font-bold text-cafeflow-dark flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-cafeflow-accent" /> {order.customerMobile}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(order.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                      <span className="text-lg font-bold text-cafeflow-dark">₹{order.finalAmount}</span>
                    </div>
                  </div>

                  {/* Summary & Date Bar */}
                  <div className="flex justify-between items-center text-xs text-cafeflow-textMuted font-medium pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cafeflow-accent" />
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {order.paymentStatus === 'PAID' && (
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingId === order.orderIdFormatted}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cafeflow-cta text-white rounded-xl text-xs font-bold hover:bg-cafeflow-accent transition-all shadow-sm"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          {downloadingId === order.orderIdFormatted ? 'Downloading...' : 'PDF Receipt'}
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cafeflow-bgSecondary hover:bg-cafeflow-light/30 rounded-xl text-xs font-bold text-cafeflow-dark transition-all"
                      >
                        {isExpanded ? <>Less <ChevronUp className="w-3.5 h-3.5" /></> : <>Items ({order.items?.length || 0}) <ChevronDown className="w-3.5 h-3.5" /></>}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Itemized Breakdown */}
                  {isExpanded && (
                    <div className="bg-cafeflow-bg p-5 rounded-2xl border border-cafeflow-light/40 space-y-3 mt-3 animate-fadeIn">
                      <h4 className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Item Details & Customizations</h4>
                      <div className="divide-y divide-cafeflow-light/20">
                        {order.items?.map((item) => (
                          <div key={item.id} className="py-2.5 flex justify-between items-center text-sm">
                            <div>
                              <span className="font-bold text-cafeflow-dark">{item.productName} × {item.quantity}</span>
                              {item.customizations && item.customizations.length > 0 && (
                                <p className="text-xs text-cafeflow-textMuted mt-0.5">
                                  Customs: {item.customizations.map(c => c.customizationOptionName).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-cafeflow-dark">₹{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-cafeflow-light/30 flex justify-between text-xs text-cafeflow-textMuted font-medium">
                        <span>Subtotal: ₹{order.subtotal} | Tax: ₹{order.tax} | Discount: -₹{order.discount}</span>
                        <span className="font-bold text-cafeflow-dark text-sm">Total Paid: ₹{order.finalAmount}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
