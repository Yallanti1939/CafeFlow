import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { authService } from '../services/authService';

export default function Cart() {
  const navigate = useNavigate();
  
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cart = useCartStore((state) => state.cart);
  const guestItems = useCartStore((state) => state.guestItems);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  
  const subtotal = useCartStore((state) => state.getCartSubtotal());
  const tax = useCartStore((state) => state.getCartTax());
  const total = useCartStore((state) => state.getCartFinalAmount());

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchCart();
    }
  }, [fetchCart]);

  const items = authService.isAuthenticated() && cart ? cart.items : guestItems;

  const handleCheckoutRedirect = () => {
    if (authService.isAuthenticated()) {
      navigate('/payment');
    } else {
      navigate('/checkout');
    }
  };

  const handleRemoveItem = async (item: any) => {
    await removeItem(item.productId, item.selectedCustomizations || [], item.id);
  };

  const handleUpdateQty = async (item: any, newQty: number) => {
    await updateQuantity(item.productId, item.selectedCustomizations || [], newQty, item.id);
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
            <ChevronLeft className="w-6 h-6" /> Continue Browsing
          </button>
          
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Your Order</span>
          
          <div className="w-8 h-8" /> {/* Spacer */}
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-3xl border border-cafeflow-light/30 p-10 shadow-sm">
            <ShoppingBag className="w-20 h-20 text-cafeflow-light mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-cafeflow-dark mb-2">Your cart is empty</h2>
            <p className="text-cafeflow-textMuted text-base mb-8">Looks like you haven't added anything to your order yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-cafeflow-cta text-white font-bold rounded-2xl text-base hover:bg-cafeflow-accent transition-all shadow-md"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items list */}
            <div className="lg:col-span-2 space-y-5">
              {items.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
                    {/* Image */}
                    <div className="w-24 h-24 bg-cafeflow-bgSecondary rounded-2xl flex items-center justify-center text-cafeflow-light overflow-hidden shrink-0 border border-cafeflow-light/40 shadow-sm">
                      {item.productImageUrl ? (
                        <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-10 h-10" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-serif text-2xl font-bold text-cafeflow-dark">{item.productName}</h3>
                      {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                        <div className="text-sm text-cafeflow-textMuted leading-relaxed font-medium">
                          {item.selectedCustomizations.map((c, cIdx) => (
                            <span key={cIdx}>
                              {c.optionName} {c.price > 0 ? `(+₹${c.price})` : ''}
                              {cIdx < item.selectedCustomizations.length - 1 ? ' • ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="inline-block text-xl font-bold text-cafeflow-dark">₹{item.basePrice + item.customizationPrice}</span>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-cafeflow-light/20">
                    <div className="inline-flex items-center bg-cafeflow-bgSecondary border border-cafeflow-light/50 rounded-full px-3 py-1 gap-2.5 shadow-inner">
                      <button 
                        onClick={() => handleUpdateQty(item, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white text-cafeflow-dark hover:bg-cafeflow-light/50 flex items-center justify-center shadow-sm transition-all active:scale-95 shrink-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <span className="font-sans text-lg md:text-xl font-extrabold text-cafeflow-dark min-w-[24px] text-center tracking-tight leading-none px-0.5">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdateQty(item, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-white text-cafeflow-dark hover:bg-cafeflow-light/50 flex items-center justify-center shadow-sm transition-all active:scale-95 shrink-0"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item)}
                      className="p-3 hover:bg-red-50 text-red-600 rounded-full transition-colors active:scale-95"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Summary */}
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
                <div className="flex justify-between text-cafeflow-textMuted">
                  <span>Discount:</span>
                  <span className="font-bold text-emerald-600">-₹0.00</span>
                </div>
                
                <div className="flex justify-between text-2xl font-bold text-cafeflow-dark pt-5 border-t border-cafeflow-light/20">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutRedirect}
                className="w-full bg-cafeflow-cta text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:bg-cafeflow-accent hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
