import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, Plus, Minus, Star, Coffee } from 'lucide-react';
import { productService, Product, CustomizationGroup, CustomizationOption } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import { SelectedCustomizationOption } from '../services/cartService';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const cartItemCount = useCartStore((state) => state.getCartItemCount());

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedCustomizationOption[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        const data = await productService.getProductById(Number(id));
        setProduct(data);
        
        // Initialize default options for required single-select customization groups
        const defaults: SelectedCustomizationOption[] = [];
        data.customizationGroups.forEach((group) => {
          if (group.isRequired && group.selectionType === 'SINGLE' && group.options.length > 0) {
            const availableOption = group.options.find(o => o.isAvailable) || group.options[0];
            defaults.push({
              groupName: group.name,
              optionName: availableOption.name,
              price: availableOption.price,
            });
          }
        });
        setSelectedOptions(defaults);
      } catch (err: any) {
        setError(err.response?.data || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleSelectOption = (group: CustomizationGroup, option: CustomizationOption) => {
    const isSingle = group.selectionType === 'SINGLE';
    
    if (isSingle) {
      // Replace existing option for this group
      setSelectedOptions((prev) => [
        ...prev.filter((o) => o.groupName !== group.name),
        {
          groupName: group.name,
          optionName: option.name,
          price: option.price,
        },
      ]);
    } else {
      // Toggle multi-select option
      setSelectedOptions((prev) => {
        const exists = prev.find((o) => o.groupName === group.name && o.optionName === option.name);
        if (exists) {
          return prev.filter((o) => !(o.groupName === group.name && o.optionName === option.name));
        } else {
          return [
            ...prev,
            {
              groupName: group.name,
              optionName: option.name,
              price: option.price,
            },
          ];
        }
      });
    }
  };

  const getOptionSelectedState = (groupName: string, optionName: string): boolean => {
    return !!selectedOptions.find((o) => o.groupName === groupName && o.optionName === optionName);
  };

  // Calculations
  const customizationPrice = selectedOptions.reduce((acc, o) => acc + o.price, 0);
  const basePrice = product ? product.price : 0;
  const unitFinalPrice = basePrice + customizationPrice;
  const finalPrice = unitFinalPrice * quantity;

  const handleAddToCart = async () => {
    if (!product) return;

    // Validate that all required customization groups have a selection
    for (const group of product.customizationGroups) {
      if (group.isRequired) {
        const selectedForGroup = selectedOptions.filter((o) => o.groupName === group.name);
        if (selectedForGroup.length === 0) {
          alert(`Please select an option for "${group.name}".`);
          return;
        }
      }
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl,
      quantity,
      basePrice,
      customizationPrice,
      selectedCustomizations: selectedOptions,
    };

    await addItem(cartItem);
    setAddedToCart(true);
    
    setToastMessage(`${product.name} added to cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse">Loading craft details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-2xl font-bold text-cafeflow-dark mb-2">Something went wrong</h2>
        <p className="text-cafeflow-textMuted mb-4">{error || 'Product not found.'}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-cafeflow-accent text-white rounded">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-cafeflow-accent text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-semibold tracking-wide flex items-center gap-2 animate-bounce">
          <ShoppingBag className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> Back to Menu
          </button>
          
          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Customize Craft</span>

          <button 
            onClick={() => navigate('/cart')}
            className="relative p-3 hover:bg-cafeflow-bgSecondary rounded-2xl transition-all"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-7 h-7 text-cafeflow-dark" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cafeflow-cta text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Product Image */}
        <div className="space-y-4">
          <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-3xl aspect-square flex items-center justify-center text-cafeflow-light overflow-hidden relative shadow-md">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Coffee className="w-36 h-36 stroke-[1]" />
            )}
            {product.availabilityStatus !== 'AVAILABLE' && (
              <div className="absolute inset-0 bg-cafeflow-dark/40 backdrop-blur-sm flex items-center justify-center">
                <span className="font-serif text-2xl text-white font-bold tracking-wider uppercase px-4 py-2 border-2 border-white rounded-xl">Out of Stock</span>
              </div>
            )}
          </div>
          
          <div className="p-5 bg-cafeflow-card border border-cafeflow-light/30 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-amber-500 text-base font-bold">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-cafeflow-text">4.8</span>
              <span className="text-cafeflow-textMuted font-normal text-sm">(24 reviews)</span>
            </div>
            <p className="text-cafeflow-textMuted text-sm leading-relaxed italic">
              "Outstanding flavor and rich velvety texture. Instantly becomes a favorite!"
            </p>
          </div>
        </div>

        {/* Right Column: Customization Forms */}
        <div className="space-y-8">
          <div>
            <span className="text-xs font-bold text-cafeflow-accent uppercase tracking-widest">{product.categoryName}</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark mt-1">{product.name}</h1>
            <p className="text-base md:text-lg text-cafeflow-textMuted leading-relaxed mt-3">{product.description}</p>
            <span className="inline-block text-3xl md:text-4xl font-bold text-cafeflow-dark mt-4">₹{product.price}</span>
          </div>

          {/* Customization Options lists */}
          {product.customizationGroups && product.customizationGroups.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-cafeflow-light/35">
              {product.customizationGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg md:text-xl font-bold text-cafeflow-dark tracking-wide">{group.name}</span>
                    <div className="flex items-center gap-2">
                      {group.isRequired && <span className="text-xs font-bold bg-cafeflow-accent/10 text-cafeflow-accent px-2.5 py-1 rounded-md">Required</span>}
                      <span className="text-xs text-cafeflow-textMuted font-mono uppercase tracking-wider">{group.selectionType === 'SINGLE' ? 'Single Select' : 'Multi-Select'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {group.options.map((opt) => {
                      const isSelected = getOptionSelectedState(group.name, opt.name);
                      return (
                        <button
                          key={opt.id}
                          disabled={!opt.isAvailable}
                          onClick={() => handleSelectOption(group, opt)}
                          className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-24 ${
                            !opt.isAvailable 
                              ? 'bg-cafeflow-light/20 border-transparent text-cafeflow-textMuted/40 cursor-not-allowed'
                              : isSelected
                                ? 'bg-cafeflow-card border-cafeflow-cta text-cafeflow-dark shadow-md scale-[1.02]'
                                : 'bg-cafeflow-card border-cafeflow-light/50 text-cafeflow-textMuted hover:border-cafeflow-accent/40'
                          }`}
                        >
                          <span className="text-base font-bold text-cafeflow-dark">{opt.name}</span>
                          <span className="text-sm font-semibold text-cafeflow-accent">
                            {opt.price > 0 ? `+₹${opt.price}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Controls and Add to Cart Button */}
          <div className="pt-6 border-t border-cafeflow-light/35 flex items-center justify-between gap-6">
            <div className="flex items-center border-2 border-cafeflow-light/60 bg-cafeflow-card rounded-2xl p-2 shadow-inner">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-cafeflow-bgSecondary hover:bg-cafeflow-light/40 flex items-center justify-center transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 text-cafeflow-dark stroke-[2.5]" />
              </button>
              <span className="w-10 text-center font-sans text-xl md:text-2xl font-extrabold text-cafeflow-dark">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-cafeflow-bgSecondary hover:bg-cafeflow-light/40 flex items-center justify-center transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 text-cafeflow-dark stroke-[2.5]" />
              </button>
            </div>

            {addedToCart ? (
              <button
                onClick={() => navigate('/cart')}
                className="flex-1 font-bold text-lg py-4 px-8 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 bg-emerald-700 text-white hover:bg-emerald-800 hover:scale-[1.02]"
              >
                <ShoppingBag className="w-6 h-6" />
                Go to Cart →
              </button>
            ) : (
              <button
                disabled={product.availabilityStatus !== 'AVAILABLE'}
                onClick={handleAddToCart}
                className={`flex-1 font-bold text-lg py-4 px-8 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                  product.availabilityStatus === 'AVAILABLE'
                    ? 'bg-cafeflow-cta text-white hover:bg-cafeflow-accent hover:shadow-xl'
                    : 'bg-cafeflow-light/50 text-cafeflow-textMuted/60 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
                Add to Cart • ₹{finalPrice}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
