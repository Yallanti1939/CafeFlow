import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, ArrowRight, Star, Coffee, Sparkles, ShieldCheck, Clock, Award, Flame, Zap } from 'lucide-react';
import { productService, Product, Category } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import { authService } from '../services/authService';

export default function Landing() {
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) => state.getCartItemCount());
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceFilter, setPriceFilter] = useState<number>(300);
  const [selectedDiet, setSelectedDiet] = useState<'ALL' | 'VEG'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const catData = await productService.getCategories();
        const prodData = await productService.getProducts();
        setCategories(catData);
        setProducts(prodData);
      } catch (error) {
        console.error('Failed to load menu data', error);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      const prodData = await productService.getProducts();
      setProducts(prodData);
      return;
    }
    const filtered = await productService.searchProducts(searchQuery);
    setProducts(filtered);
  };

  const filteredProducts = products.filter((prod) => {
    if (selectedCategory !== null && prod.categoryId !== selectedCategory) return false;
    if (prod.price > priceFilter) return false;
    if (selectedDiet === 'VEG' && !prod.name.toLowerCase().includes('veg') && !prod.description.toLowerCase().includes('veg') && !prod.name.toLowerCase().includes('paneer') && !prod.name.toLowerCase().includes('french fries') && !prod.name.toLowerCase().includes('masala chai')) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">Available</span>;
      case 'OUT_OF_STOCK':
        return <span className="text-[11px] font-medium text-amber-700 bg-amber-50/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">Out of Stock</span>;
      default:
        return <span className="text-[11px] font-medium text-gray-700 bg-gray-50/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">Unavailable</span>;
    }
  };

  const chefSpecials = [
    {
      id: 2,
      name: 'Signature Cappuccino',
      category: 'Coffee Special',
      description: 'Velvety espresso with steamed milk foam and cocoa dusting.',
      originalPrice: 180,
      specialPrice: 150,
      badge: "Chef's Choice",
      imageUrl: '/images/products/cappuccino.png',
    },
    {
      id: 4,
      name: 'Iced Vanilla Cold Coffee',
      category: 'Cold Brews',
      description: 'Slow-steeped espresso with vanilla ice cream & dark chocolate drizzle.',
      originalPrice: 210,
      specialPrice: 180,
      badge: 'Bestseller',
      imageUrl: '/images/products/cold_coffee.png',
    },
    {
      id: 8,
      name: 'Truffle Paneer Sourdough',
      category: 'Gourmet Food',
      description: 'Grilled cottage cheese with mint pesto on artisan sourdough bread.',
      originalPrice: 170,
      specialPrice: 140,
      badge: '20% OFF',
      imageUrl: '/images/products/paneer_sandwich.png',
    },
    {
      id: 11,
      name: 'Blueberry Cheesecake',
      category: 'Dessert Special',
      description: 'Creamy New York style cheesecake topped with fresh blueberry glaze.',
      originalPrice: 210,
      specialPrice: 180,
      badge: 'Popular',
      imageUrl: '/images/products/cheesecake.png',
    },
  ];

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text selection:bg-cafeflow-light">
      {/* Header - 100% Full Width (Expanded Height & Font Size) */}
      <header className="sticky top-0 z-40 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-cafeflow-accent text-white p-2 rounded-xl shadow-sm">
              <Coffee className="w-7 h-7 stroke-[2.5]" />
            </div>
            <span className="font-serif text-3xl font-bold tracking-tight text-cafeflow-dark">CafeFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-12 text-lg font-bold">
            <a href="#specials" className="hover:text-cafeflow-accent transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" /> Specials
            </a>
            <button onClick={() => navigate('/menu')} className="hover:text-cafeflow-accent transition-colors">Menu</button>
            <a href="#whyus" className="hover:text-cafeflow-accent transition-colors">Why Us</a>
            <button onClick={() => navigate('/my-orders')} className="hover:text-cafeflow-accent transition-colors">Track Order</button>
          </nav>

          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/cart')} 
              className="relative p-3 hover:bg-cafeflow-bgSecondary rounded-full transition-all"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-6 h-6 text-cafeflow-dark" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-cafeflow-cta text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                  {cartItemCount}
                </span>
              )}
            </button>
            {authService.isAuthenticated() ? (
              <button 
                onClick={() => { authService.logout(); window.location.reload(); }} 
                className="text-sm font-bold px-5 py-2.5 bg-cafeflow-bgSecondary border border-cafeflow-light/50 rounded-xl hover:bg-cafeflow-light/35 transition-all"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => navigate('/checkout')} 
                className="text-sm font-bold px-6 py-3 bg-cafeflow-accent text-white rounded-xl hover:bg-cafeflow-dark transition-all shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - 100% Full Width */}
      <section className="relative overflow-hidden py-16 md:py-24 w-full px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-cafeflow-bgSecondary/80 border border-cafeflow-light/40 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-xs font-bold tracking-widest text-cafeflow-accent uppercase">EST. 2026 • MADE WITH CARE</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-cafeflow-dark">
            Good Coffee.<br />
            <span className="text-cafeflow-cta">Made Your Way.</span>
          </h1>
          <p className="text-cafeflow-textMuted text-base md:text-lg leading-relaxed">
            Freshly prepared, thoughtfully customized, and ready when you are. Experience slow coffee culture combined with fast digital ordering.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="#menu" 
              className="inline-flex items-center justify-center px-7 py-3.5 bg-cafeflow-cta text-white font-semibold rounded-xl hover:bg-cafeflow-accent transition-all shadow-md hover:shadow-lg text-sm"
            >
              Explore Menu <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <a 
              href="#specials" 
              className="inline-flex items-center justify-center px-7 py-3.5 bg-cafeflow-card border border-cafeflow-light text-cafeflow-dark font-semibold rounded-xl hover:bg-cafeflow-bgSecondary transition-all text-sm"
            >
              View Specials
            </a>
          </div>
        </div>
        
        <div className="flex-1 w-full flex justify-center md:justify-end">
          <div className="relative group flex items-center justify-center cursor-pointer select-none">
            {/* Soft Subtle Outer Neon Light Aura (Appears OUTSIDE container on hover) */}
            <div className="absolute -inset-8 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 rounded-full blur-2xl opacity-15 group-hover:opacity-45 group-hover:scale-115 transition-all duration-500 pointer-events-none" />
            <div className="absolute -inset-3 bg-amber-400/50 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none" />

            {/* Round Shape UI Logo Container with Soft Outer Neon Box-Shadow */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] lg:w-[520px] lg:h-[520px] rounded-full bg-gradient-to-br from-cafeflow-dark via-cafeflow-accent to-[#2A1713] p-6 shadow-[0_0_35px_rgba(183,121,69,0.35)] group-hover:shadow-[0_0_50px_rgba(245,158,11,0.5),0_0_90px_rgba(251,146,60,0.35)] border-[12px] border-cafeflow-card transition-shadow duration-500 flex items-center justify-center text-center overflow-hidden">
              
              {/* Decorative inner circular rings (Unchanged on hover) */}
              <div className="absolute inset-5 rounded-full border border-amber-400/30 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border-2 border-dashed border-amber-400/35 pointer-events-none animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-16 rounded-full border border-amber-300/20 pointer-events-none animate-pulse" />
              
              {/* Center UI Coffee Cup Logo Emblem (Zooms in and out on hover) */}
              <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-[320px] md:h-[320px] lg:w-[350px] lg:h-[350px] bg-gradient-to-tr from-cafeflow-cta via-amber-500 to-cafeflow-accent rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(183,121,69,0.5)] border-4 border-amber-200/50 z-10 shrink-0 group-hover:animate-[pulseZoom_2.2s_ease-in-out_infinite] transition-transform duration-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 text-cafeflow-card drop-shadow-[0_0_25px_rgba(255,255,255,0.7)] overflow-visible"
                >
                  {/* 3 S-Curve Steam Lines with Snake-like Slithering Wave Motion */}
                  <g>
                    <path
                      d="M 6 6 C 4 4.5, 8 3.5, 6 2 C 4 0.5, 8 -0.5, 6 -2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="animate-snake-1"
                    />
                    <path
                      d="M 10 6 C 8 4.5, 12 3.5, 10 2 C 8 0.5, 12 -0.5, 10 -2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="animate-snake-2"
                    />
                    <path
                      d="M 14 6 C 12 4.5, 16 3.5, 14 2 C 12 0.5, 16 -0.5, 14 -2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="animate-snake-3"
                    />
                  </g>

                  {/* Exact original Lucide Coffee Cup Body & Handle */}
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALS SECTION - 100% Full Width */}
      <section id="specials" className="py-20 w-full px-6 sm:px-10 lg:px-16 xl:px-20 bg-cafeflow-bgSecondary/40 border-y border-cafeflow-light/25">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cafeflow-cta uppercase tracking-widest">
              <Flame className="w-4 h-4 text-orange-600" /> Limited Edition Specials
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Today's Chef Specials</h2>
            <p className="text-cafeflow-textMuted text-sm max-w-xl">
              Hand-crafted seasonal beverages & gourmet pairings curated daily by our master baristas.
            </p>
          </div>
          <a href="#menu" className="inline-flex items-center text-sm font-semibold text-cafeflow-accent hover:underline">
            View All Items <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {chefSpecials.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/product/${item.id}`)}
              className="group bg-cafeflow-card border border-cafeflow-light/35 rounded-2xl overflow-hidden hover:shadow-xl hover:border-cafeflow-accent/40 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-52 bg-cafeflow-bgSecondary relative overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow">
                    {item.badge}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cafeflow-accent">{item.category}</span>
                  <h3 className="font-serif text-xl font-bold text-cafeflow-dark">{item.name}</h3>
                  <p className="text-cafeflow-textMuted text-xs leading-relaxed line-clamp-2">{item.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between">
                <div>
                  <span className="text-xs text-cafeflow-textMuted line-through mr-1.5">₹{item.originalPrice}</span>
                  <span className="text-lg font-bold text-cafeflow-dark">₹{item.specialPrice}</span>
                </div>
                <button className="text-xs font-semibold bg-cafeflow-cta text-white px-3.5 py-2 rounded-lg hover:bg-cafeflow-accent transition-all shadow-sm">
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Menu & Catalog - 100% Full Width */}
      <section id="menu" className="py-20 w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Explore Our Menu</h2>
          <p className="text-cafeflow-textMuted text-sm">Freshly prepared to order. Customize it exactly to your taste.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafeflow-textMuted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search coffee, tea, burgers, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cafeflow-card border border-cafeflow-light/60 rounded-xl px-10 py-3.5 text-sm focus:outline-none focus:border-cafeflow-accent transition-all shadow-sm"
            />
          </div>
          <button type="submit" className="px-7 py-3.5 bg-cafeflow-accent text-white font-semibold rounded-xl hover:bg-cafeflow-dark transition-all text-sm shadow-sm">
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12 border-b border-cafeflow-light/20 pb-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => navigate('/menu')}
              className={`text-sm font-semibold px-6 py-2.5 rounded-full transition-all border ${selectedCategory === null ? 'bg-cafeflow-accent text-white border-transparent shadow-sm' : 'bg-cafeflow-card text-cafeflow-textMuted border-cafeflow-light/45 hover:bg-cafeflow-bgSecondary'}`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => navigate(`/menu?category=${encodeURIComponent(cat.name)}`)}
                className={`text-sm font-semibold px-6 py-2.5 rounded-full transition-all border ${selectedCategory === cat.id ? 'bg-cafeflow-accent text-white border-transparent shadow-sm' : 'bg-cafeflow-card text-cafeflow-textMuted border-cafeflow-light/45 hover:bg-cafeflow-bgSecondary'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Price & Diet switches */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cafeflow-textMuted font-medium">Diet:</span>
              <button 
                onClick={() => setSelectedDiet(selectedDiet === 'VEG' ? 'ALL' : 'VEG')}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all ${selectedDiet === 'VEG' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' : 'bg-cafeflow-card border-cafeflow-light/40 text-cafeflow-textMuted'}`}
              >
                Veg Only
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-cafeflow-textMuted font-medium">Max Price: ₹{priceFilter}</span>
              <input 
                type="range" 
                min="50" 
                max="300" 
                step="10"
                value={priceFilter}
                onChange={(e) => setPriceFilter(Number(e.target.value))}
                className="accent-cafeflow-cta h-1 w-28 bg-cafeflow-light rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Product Grid - Limited to 10 items on Landing Page */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="bg-cafeflow-card border border-cafeflow-light/35 rounded-2xl p-4 animate-pulse space-y-4">
                <div className="h-48 bg-cafeflow-bgSecondary rounded-xl" />
                <div className="h-4 w-1/3 bg-cafeflow-bgSecondary rounded" />
                <div className="h-6 w-2/3 bg-cafeflow-bgSecondary rounded" />
                <div className="h-8 bg-cafeflow-bgSecondary rounded" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-2xl border border-cafeflow-light/20 p-8">
            <ShoppingBag className="w-12 h-12 text-cafeflow-light mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-cafeflow-dark mb-1">No items found</h3>
            <p className="text-cafeflow-textMuted text-sm">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.slice(0, 10).map((prod) => (
                <div 
                  key={prod.id} 
                  className="group bg-cafeflow-card border border-cafeflow-light/30 rounded-2xl overflow-hidden hover:shadow-xl hover:border-cafeflow-accent/40 transition-all flex flex-col justify-between"
                >
                  <div 
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="cursor-pointer"
                  >
                    {/* Image container */}
                    <div className="h-52 bg-cafeflow-bgSecondary relative overflow-hidden flex items-center justify-center text-cafeflow-light">
                      {prod.imageUrl ? (
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Coffee className="w-16 h-16 stroke-[1]" />
                      )}
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(prod.availabilityStatus)}
                      </div>
                    </div>

                    {/* Body details */}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold text-cafeflow-accent uppercase tracking-widest">{prod.categoryName}</span>
                      <h3 className="font-serif text-xl font-bold text-cafeflow-dark line-clamp-1">{prod.name}</h3>
                      <p className="text-cafeflow-textMuted text-xs line-clamp-2 leading-relaxed h-8">{prod.description}</p>
                      
                      <div className="flex items-center gap-1 text-amber-500 text-xs pt-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-semibold text-cafeflow-text">4.8</span>
                        <span className="text-cafeflow-textMuted">(24 reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Cart Call to action */}
                  <div className="p-4 border-t border-cafeflow-light/15 flex items-center justify-between">
                    <span className="font-bold text-xl text-cafeflow-dark">₹{prod.price}</span>
                    {prod.availabilityStatus === 'AVAILABLE' ? (
                      <button 
                        onClick={() => navigate(`/product/${prod.id}`)}
                        className="text-xs font-semibold bg-cafeflow-cta text-white px-4 py-2 rounded-lg hover:bg-cafeflow-accent transition-all shadow-sm"
                      >
                        + Customize
                      </button>
                    ) : (
                      <button 
                        disabled 
                        className="text-xs font-semibold bg-cafeflow-light/50 text-cafeflow-textMuted/60 px-4 py-2 rounded-lg cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* View Full Menu Call To Action */}
            <div className="text-center pt-4">
              <button
                onClick={() => navigate('/menu')}
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-cafeflow-dark text-white font-serif text-lg font-bold rounded-2xl hover:bg-cafeflow-cta transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View Full Menu (All Products) <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* WHY US SECTION - 100% Full Width (Positioned after Explore Menu) */}
      <section id="whyus" className="py-20 w-full px-6 sm:px-10 lg:px-16 xl:px-20 bg-cafeflow-bgSecondary/30 border-t border-cafeflow-light/25">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cafeflow-cta uppercase tracking-widest">
            <Award className="w-4 h-4 text-cafeflow-cta" /> The CafeFlow Difference
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Why CafeFlow?</h2>
          <p className="text-cafeflow-textMuted text-sm md:text-base">
            Combining the art of slow-roasted artisanal coffee with seamless modern digital ordering.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-cafeflow-card border border-cafeflow-light/35 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Coffee className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-cafeflow-dark">100% Organic Arabica</h3>
            <p className="text-cafeflow-textMuted text-xs leading-relaxed">
              Direct-trade single origin beans grown at high altitudes, medium roasted to perfection every morning.
            </p>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-cafeflow-dark">Artisanal Fresh Kitchen</h3>
            <p className="text-cafeflow-textMuted text-xs leading-relaxed">
              Handcrafted gourmet sourdough sandwiches, crispy snacks, and fresh bakes made from scratch daily.
            </p>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-cafeflow-dark">Zero-Wait Counter</h3>
            <p className="text-cafeflow-textMuted text-xs leading-relaxed">
              Order digital online, customize every detail, and pick up hot right when you arrive with live status tracking.
            </p>
          </div>

          <div className="bg-cafeflow-card border border-cafeflow-light/35 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-cafeflow-dark">Custom Barista Touch</h3>
            <p className="text-cafeflow-textMuted text-xs leading-relaxed">
              Tailor your milk choice, coffee strength, temperature, and sugar levels with absolute freedom.
            </p>
          </div>
        </div>

        {/* Brand Stats Banner */}
        <div className="bg-cafeflow-dark text-cafeflow-bgSecondary rounded-3xl p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center shadow-xl">
          <div className="space-y-1">
            <div className="font-serif text-4xl lg:text-5xl font-bold text-amber-400">10K+</div>
            <p className="text-xs text-cafeflow-light/70 uppercase tracking-wider font-medium">Happy Coffee Lovers</p>
          </div>
          <div className="space-y-1">
            <div className="font-serif text-4xl lg:text-5xl font-bold text-amber-400">100%</div>
            <p className="text-xs text-cafeflow-light/70 uppercase tracking-wider font-medium">Organic Certified</p>
          </div>
          <div className="space-y-1">
            <div className="font-serif text-4xl lg:text-5xl font-bold text-amber-400">4.9 ★</div>
            <p className="text-xs text-cafeflow-light/70 uppercase tracking-wider font-medium">Customer Rating</p>
          </div>
          <div className="space-y-1">
            <div className="font-serif text-4xl lg:text-5xl font-bold text-amber-400">&lt; 8 Mins</div>
            <p className="text-xs text-cafeflow-light/70 uppercase tracking-wider font-medium">Avg Pickup Time</p>
          </div>
        </div>
      </section>

      {/* Footer - 100% Full Width */}
      <footer className="bg-cafeflow-dark text-cafeflow-bgSecondary py-16 px-6 sm:px-10 lg:px-16 xl:px-20 border-t border-cafeflow-accent/10">
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-cafeflow-cta text-white p-1 rounded-md">
                <Coffee className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">CafeFlow</span>
            </div>
            <p className="text-cafeflow-light/75 text-sm leading-relaxed">
              Crafting premium cafe moments daily with pure Arabica coffees and gourmet meals.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Ordering</h4>
            <ul className="space-y-2.5 text-sm text-cafeflow-light/75">
              <li><a href="#specials" className="hover:text-white transition-colors">Chef's Specials</a></li>
              <li><a href="#menu" className="hover:text-white transition-colors">Browse Menu</a></li>
              <li><a href="#whyus" className="hover:text-white transition-colors">Why Us</a></li>
              <li><button onClick={() => navigate('/cart')} className="hover:text-white transition-colors">Shopping Cart</button></li>
              <li><button onClick={() => navigate('/my-orders')} className="hover:text-white transition-colors">Track Status</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Location</h4>
            <p className="text-sm text-cafeflow-light/75 leading-relaxed">
              101 Espresso Boulevard,<br />
              Cafe District, Bangalore<br />
              India
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Timings</h4>
            <p className="text-sm text-cafeflow-light/75 leading-relaxed">
              Monday - Sunday<br />
              07:00 AM - 11:00 PM
            </p>
          </div>
        </div>
        <div className="w-full pt-8 border-t border-cafeflow-accent/20 text-center text-xs text-cafeflow-light/50">
          &copy; {new Date().getFullYear()} CafeFlow. All rights reserved. Made with care.
        </div>
      </footer>
    </div>
  );
}
