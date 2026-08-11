import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { dashboardService, DashboardKPIs, SalesAnalytics, FeedbackSummary } from '../services/dashboardService';
import { orderService, PaymentAttempt } from '../services/orderService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, ClipboardList, Clock, Star, Banknote, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingMap, setConfirmingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }

    async function loadDashboard() {
      setLoading(true);
      try {
        const [kpiRes, analyticsRes, feedRes, allPays] = await Promise.allSettled([
          dashboardService.getKPIs(),
          dashboardService.getAnalytics(),
          dashboardService.getFeedbackAnalytics(),
          orderService.getAllPayments()
        ]);

        if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
        if (feedRes.status === 'fulfilled') setFeedback(feedRes.value);

        if (allPays.status === 'fulfilled') {
          const pendingCounter = allPays.value.filter(
            p => p.paymentMethod === 'COUNTER_PAY' && p.paymentStatus === 'PENDING'
          );
          setPendingPayments(pendingCounter);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleConfirmCounterPayment = async (paymentId: number) => {
    setConfirmingMap(prev => ({ ...prev, [paymentId]: true }));
    try {
      const idemp = `confirm-pay-${paymentId}-${Date.now()}`;
      await orderService.confirmCounterPayment(paymentId, idemp);
      
      // Update UI state
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      
      // Reload stats
      const [kpiRes, analyticsRes] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getAnalytics()
      ]);
      setKpis(kpiRes);
      setAnalytics(analyticsRes);
    } catch (e) {
      console.error("Failed to approve counter payment", e);
    } finally {
      setConfirmingMap(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse">Assembling analytics deck...</span>
      </div>
    );
  }

  // Recharts colors
  const COLORS = ['#6B4226', '#B77945', '#D8C3A5', '#3B261C'];

  const pieData = analytics ? Object.entries(analytics.paymentMethodDistribution).map(([name, value]) => ({
    name,
    value
  })) : [];

  return (
    <div className="flex bg-cafeflow-bg min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-10 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Dashboard</h1>
            <p className="text-cafeflow-textMuted text-sm font-medium mt-1">Real-time metrics, transaction analysis & performance indicators.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm font-bold px-5 py-3 bg-cafeflow-accent text-white rounded-2xl shadow-md hover:bg-cafeflow-dark transition-all"
          >
            Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                <IndianRupee className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Today's Revenue</span>
                <p className="text-3xl font-bold font-sans text-cafeflow-dark">₹{kpis.todayRevenue}</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Today's Orders</span>
                <p className="text-3xl font-bold font-sans text-cafeflow-dark">{kpis.todayOrdersCount}</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Pending Orders</span>
                <p className="text-3xl font-bold font-sans text-cafeflow-dark">{kpis.pendingOrdersCount}</p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-cafeflow-bgSecondary text-cafeflow-accent rounded-2xl shrink-0">
                <Star className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-cafeflow-textMuted uppercase tracking-wider">Satisfaction</span>
                <p className="text-3xl font-bold font-sans text-cafeflow-dark">
                  {kpis.averageCustomerRating} <span className="text-sm text-cafeflow-textMuted font-semibold font-sans">/ 5</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts & Graphs Row */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales bar chart */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">Daily Revenue Breakdown</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailySalesBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE7DC" />
                    <XAxis dataKey="date" stroke="#6F5B52" fontSize={13} fontWeight={600} />
                    <YAxis stroke="#6F5B52" fontSize={13} fontWeight={600} />
                    <Tooltip cursor={{ fill: 'rgba(183, 121, 69, 0.08)' }} />
                    <Bar dataKey="revenue" fill="#B77945" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment methods donut chart */}
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 shadow-sm space-y-6 flex flex-col justify-between">
              <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">Payment Modes</h3>
              {pieData.length === 0 ? (
                <div className="text-center py-10 text-cafeflow-textMuted text-sm font-medium">No transactions compiled.</div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm font-bold text-cafeflow-dark">
                {pieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Pending Counter Approvals Panel */}
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-cafeflow-light/20 pb-4">
              <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">Pending Counter Cash Approvals</h3>
              <span className="text-xs font-extrabold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                {pendingPayments.length} Pending
              </span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-cafeflow-textMuted text-sm font-medium">
                No counter payments are currently awaiting cash validation.
              </div>
            ) : (
              <div className="divide-y divide-cafeflow-light/20">
                {pendingPayments.map((p) => (
                  <div key={p.id} className="py-4 flex justify-between items-center text-sm md:text-base">
                    <div className="space-y-1">
                      <span className="font-bold text-lg text-cafeflow-dark">{p.orderIdFormatted}</span>
                      <p className="text-cafeflow-textMuted text-xs font-semibold">Customer Mobile: {p.customerMobile}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-xl text-cafeflow-dark">₹{p.amount}</span>
                      <button
                        onClick={() => handleConfirmCounterPayment(p.id)}
                        disabled={confirmingMap[p.id]}
                        className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all text-sm shadow-md"
                      >
                        {confirmingMap[p.id] ? 'Confirming...' : 'Approve Cash'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          {analytics && (
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="font-serif text-2xl font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-4">Top Selling Products</h3>
              
              {analytics.topProducts.length === 0 ? (
                <div className="text-center py-12 text-cafeflow-textMuted text-sm font-medium">
                  No products have been sold today yet.
                </div>
              ) : (
                <div className="divide-y divide-cafeflow-light/20">
                  {analytics.topProducts.map((p, idx) => (
                    <div key={p.productName} className="py-4 flex justify-between items-center text-sm md:text-base">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-xl text-cafeflow-accent w-6">{idx + 1}</span>
                        <span className="font-bold text-cafeflow-dark">{p.productName}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="font-bold text-cafeflow-dark text-base">{p.quantitySold} Sold</span>
                        <p className="text-cafeflow-textMuted text-xs font-semibold">Revenue: ₹{p.totalRevenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
