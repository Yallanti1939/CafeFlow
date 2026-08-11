import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Plus, Minus, Star, Coffee, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { productService, Product, Category } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import { authService } from '../services/authService';

export default function FullMenu() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCategory = searchParams.get('category');

  const addItem = useCartStore((state) => state.addItem);
  const cart = useCartStore((state) => state.cart);
  const guestItems = useCartStore((state) => state.guestItems);
  const cartItemCount = useCartStore((state) => state.getCartItemCount());

  const cartItems = authService.isAuthenticated() && cart ? cart.items : guestItems;
  const isProductInCart = (productId: number) => cartItems.some(item => item.productId === productId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory || 'All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categoryList = [
    'All Items',
    'Coffee',
    'Tea',
    'Desserts',
    'Ice Creams',
    'Burgers',
    'Snacks',
    'Sandwiches'
  ];

  useEffect(() => {
    if (paramCategory) {
      // Find matching category in list (case insensitive)
      const matched = categoryList.find(c => c.toLowerCase().trim() === paramCategory.toLowerCase().trim());
      if (matched) {
        setSelectedCategory(matched);
      } else {
        setSelectedCategory(paramCategory);
      }
    }
  }, [paramCategory]);

  useEffect(() => {
    async function loadData() {
      try {
        const catData = await productService.getCategories();
        const prodData = await productService.getProducts();
        setCategories(catData);
        setProducts(prodData);

        const initialQty: Record<number, number> = {};
        prodData.forEach(p => { initialQty[p.id] = 1; });
        setQuantities(initialQty);
      } catch (err) {
        console.error('Failed to load full menu data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedCategory, searchQuery]);

  const handleQtyChange = (productId: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const qty = quantities[product.id] || 1;
    
    addItem({
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl,
      basePrice: product.price,
      customizationPrice: 0,
      quantity: qty,
      selectedCustomizations: []
    });

    setToastMessage(`Added ${qty}x ${product.name} to cart!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All Items') {
      const pCat = (p.categoryName || '').toLowerCase().trim();
      const sCat = selectedCategory.toLowerCase().trim();
      if (!pCat.includes(sCat) && !sCat.includes(pCat)) {
        return false;
      }
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = p.name.toLowerCase().includes(query);
      const descMatch = p.description.toLowerCase().includes(query);
      const catMatch = (p.categoryName || '').toLowerCase().includes(query);
      if (!nameMatch && !descMatch && !catMatch) return false;
    }
    return true;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="h-screen w-full flex bg-cafeflow-bg text-cafeflow-text selection:bg-cafeflow-light overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-cafeflow-dark text-white px-6 py-3.5 rounded-2xl shadow-2xl z-50 text-sm font-semibold tracking-wide flex items-center gap-3 animate-bounce border border-cafeflow-cta/30">
          <Check className="w-5 h-5 text-emerald-400" /> {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR - FIXED & NON-SCROLLING */}
      <aside className="w-80 lg:w-96 h-screen sticky top-0 bg-cafeflow-dark text-cafeflow-bgSecondary p-6 lg:p-8 flex flex-col justify-between shrink-0 shadow-2xl z-20 overflow-hidden border-r border-cafeflow-accent/20">
        <div className="space-y-6">
          {/* Website Logo Header */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-cafeflow-cta text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-amber-400/30">
              <Coffee className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                CafeFlow
              </h2>
              <span className="text-[11px] font-bold text-cafeflow-light/60 uppercase tracking-widest block">Craft Coffee & Bites</span>
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-cafeflow-light/60 uppercase tracking-widest block px-2 mb-3">Categories</span>
            <nav className="space-y-2">
              {categoryList.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat === 'All Items') {
                        setSearchParams({});
                      } else {
                        setSearchParams({ category: cat });
                      }
                    }}
                    className={`w-full py-3.5 px-6 rounded-2xl text-left font-serif text-[20px] font-bold tracking-wide transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-cafeflow-cta text-white shadow-md scale-[1.02]'
                        : 'text-cafeflow-light/85 hover:bg-cafeflow-accent/30 hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    {isActive && <Sparkles className="w-5 h-5 text-amber-300" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="pt-6 border-t border-cafeflow-accent/20">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-cafeflow-accent/30 hover:bg-cafeflow-accent/50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home Page
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA - SCROLLABLE ONLY FOR PRODUCTS */}
      <main className="flex-1 h-screen overflow-y-auto bg-cafeflow-bg flex flex-col min-w-0">
        {/* TOP STICKY HEADER SECTION (Spans full remaining width next to sidebar with 15px bottom rounded corners) */}
        <div className="sticky top-0 z-30 w-full bg-cafeflow-bg/95 backdrop-blur-md px-6 md:px-12 pt-6 pb-6 space-y-6 border-b border-cafeflow-light/30 shadow-sm rounded-b-[15px]">
          {/* Header Title & Cart */}
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-cafeflow-dark tracking-tight">
                Crafted for Your Cravings
              </h1>
              <p className="font-serif italic text-sm md:text-base text-cafeflow-textMuted">
                Freshly prepared, thoughtfully customized, and made exactly the way you like it.
              </p>
            </div>

            {/* Cart Logo / Button */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-3.5 rounded-2xl bg-cafeflow-card border border-cafeflow-light/50 hover:bg-cafeflow-bgSecondary hover:scale-105 flex items-center justify-center transition-all shadow-md shrink-0"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-7 h-7 text-cafeflow-dark" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cafeflow-cta text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* SEARCH BAR - Sticky inside header */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cafeflow-textMuted w-5 h-5" />
            <input
              type="text"
              placeholder="Search coffee, tea, burgers, desserts, snacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cafeflow-card border border-cafeflow-light/60 focus:border-cafeflow-accent rounded-2xl px-12 py-3.5 text-sm text-cafeflow-dark placeholder-cafeflow-textMuted focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* PRODUCT LIST AREA (Scrolls smoothly below sticky header) */}
        <div className="px-6 md:px-12 pt-6 pb-12 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-cafeflow-card border border-cafeflow-light/35 rounded-2xl p-6 h-36 animate-pulse space-y-3" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-cafeflow-card rounded-2xl p-8 border border-cafeflow-light/30">
              <ShoppingBag className="w-14 h-14 text-cafeflow-light mx-auto mb-3" />
              <h3 className="text-xl font-serif font-bold text-cafeflow-dark mb-1">No products found</h3>
              <p className="text-cafeflow-textMuted text-sm">Try selecting another category or clear your search term.</p>
            </div>
          ) : (
            <div className="space-y-4">
            {displayedProducts.map((prod) => (
              <div
                key={prod.id}
                className="group bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm hover:shadow-lg hover:border-cafeflow-accent/40 transition-all"
              >
                {/* Left: Product Image (Enlarged to 160px x 160px) */}
                <div 
                  onClick={() => navigate(`/product/${prod.id}`)}
                  className="w-36 h-36 md:w-44 md:h-44 bg-cafeflow-bgSecondary rounded-2xl overflow-hidden shrink-0 cursor-pointer flex items-center justify-center border border-cafeflow-light/40 relative shadow-sm"
                >
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Coffee className="w-16 h-16 text-cafeflow-light" />
                  )}
                </div>

                {/* Middle: Details (Enlarged Text & Clear Layout) */}
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-bold text-cafeflow-accent uppercase tracking-widest">{prod.categoryName}</span>
                  </div>
                  
                  <h3 
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="font-serif text-3xl md:text-4xl font-bold text-cafeflow-dark cursor-pointer hover:text-cafeflow-accent transition-colors"
                  >
                    {prod.name}
                  </h3>
                  
                  <p className="text-sm md:text-base text-cafeflow-textMuted leading-relaxed max-w-2xl line-clamp-2">
                    {prod.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                    {/* Quantity Selector: (- 1 +) */}
                    <div className="inline-flex items-center bg-cafeflow-bgSecondary border border-cafeflow-light/50 rounded-full px-3 py-1 gap-2.5 shadow-inner">
                      <button
                        onClick={() => handleQtyChange(prod.id, -1)}
                        className="w-7 h-7 rounded-full bg-white text-cafeflow-dark hover:bg-cafeflow-light/50 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <span className="font-sans text-lg md:text-xl font-extrabold text-cafeflow-dark min-w-[24px] text-center tracking-tight leading-none px-0.5">
                        {quantities[prod.id] || 1}
                      </span>
                      <button
                        onClick={() => handleQtyChange(prod.id, 1)}
                        className="w-7 h-7 rounded-full bg-white text-cafeflow-dark hover:bg-cafeflow-light/50 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 text-base font-bold text-cafeflow-text">
                      <Star className="w-5 h-5 text-amber-500 fill-current" />
                      <span>4.8</span>
                    </div>

                    {/* Price */}
                    <span className="font-bold text-2xl md:text-3xl text-cafeflow-dark ml-2">
                      ₹{prod.price}
                    </span>
                  </div>
                </div>

                {/* Right: Action Buttons (Significantly Larger & Bolder Buttons) */}
                <div className="flex flex-col gap-3.5 shrink-0 w-full md:w-auto justify-center">
                  <button
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="w-full md:w-44 lg:w-48 bg-cafeflow-bgSecondary text-cafeflow-dark border-2 border-cafeflow-light/80 py-3.5 px-6 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-cafeflow-light/40 hover:scale-105 transition-all text-center shadow-sm"
                  >
                    + Customize
                  </button>
                  {isProductInCart(prod.id) ? (
                    <button
                      onClick={() => navigate('/cart')}
                      className="w-full md:w-44 lg:w-48 bg-emerald-700 text-white py-3.5 px-6 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-emerald-800 hover:scale-105 transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" /> Go to Cart →
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleAddToCart(prod, e)}
                      className="w-full md:w-44 lg:w-48 bg-cafeflow-cta text-white py-3.5 px-6 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-cafeflow-accent hover:scale-105 transition-all shadow-md text-center"
                    >
                      + Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* LOAD MORE BUTTON */}
            {filteredProducts.length > visibleCount && (
              <div className="text-center pt-8 pb-12">
                <button
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="px-8 py-3.5 bg-cafeflow-dark text-white font-serif text-sm font-bold rounded-2xl hover:bg-cafeflow-cta transition-all shadow-md hover:shadow-lg hover:scale-105"
                >
                  Load More Products ({filteredProducts.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
