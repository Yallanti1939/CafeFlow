import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { productService, Product, Category, CustomizationGroup } from '../services/productService';
import { Plus, Edit2, Trash2, X, Image, Check, Star, RefreshCw } from 'lucide-react';

export default function ProductCrud() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customizationGroups, setCustomizationGroups] = useState<CustomizationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<'AVAILABLE' | 'OUT_OF_STOCK' | 'UNAVAILABLE'>('AVAILABLE');
  const [isVisible, setIsVisible] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const prodRes = await productService.getProducts();
      const catRes = await productService.getCategories();
      const custRes = await productService.getCustomizations();
      setProducts(prodRes);
      setCategories(catRes);
      setCustomizationGroups(custRes);
    } catch (e) {
      console.error('Failed to load menu metadata', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setPrice(0);
    setCategoryId(categories[0]?.id || 0);
    setAvailabilityStatus('AVAILABLE');
    setIsVisible(true);
    setSelectedGroupIds([]);
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditId(prod.id);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setCategoryId(prod.categoryId);
    setAvailabilityStatus(prod.availabilityStatus);
    setIsVisible(prod.isVisible);
    
    // Map existing groups
    const groupIds = prod.customizationGroups?.map(g => g.id!).filter(id => id !== undefined) || [];
    setSelectedGroupIds(groupIds);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      alert("Product soft-deleted successfully!");
    } catch (e) {
      alert("Failed to delete product.");
    }
  };

  const handleToggleGroupCheckbox = (id: number) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(gId => gId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      // Create groups DTO list
      const groupsDto = selectedGroupIds.map(id => ({ id }));

      const payload = {
        name,
        description,
        price,
        categoryId,
        availabilityStatus,
        isVisible,
        isActive: true,
        customizationGroups: groupsDto
      };

      let savedProduct: Product;
      if (editId !== null) {
        // Edit product
        savedProduct = await productService.updateProduct(editId, payload as any);
      } else {
        // Create product
        savedProduct = await productService.createProduct(payload as any);
      }

      // If an image is selected, upload it
      if (imageFile && savedProduct.id) {
        const imgFd = new FormData();
        imgFd.append('file', imageFile);
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://cafeflow-backend-8zgz.onrender.com' : 'http://localhost:8080');
        const token = localStorage.getItem('admin_token');

        const imgRes = await fetch(`${API_BASE_URL}/api/admin/products/${savedProduct.id}/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imgFd
        });

        if (!imgRes.ok) {
          alert("Product saved, but image upload failed.");
        }
      }

      alert("Product saved successfully!");
      setShowModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to save product details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Search filter
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== null && p.categoryId !== selectedCategoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex bg-cafeflow-bg min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Menu Products</h1>
            <p className="text-cafeflow-textMuted text-sm font-medium mt-1">Manage product pricing, details, stock, and customizable add-ons.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 bg-cafeflow-accent text-white rounded-2xl hover:bg-cafeflow-dark transition-all text-sm font-bold shadow-md"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-5 shadow-sm">
          <input 
            type="text" 
            placeholder="Search products by name or desc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[240px] bg-cafeflow-bg border border-cafeflow-light/65 rounded-2xl px-4 py-3 text-sm focus:outline-none text-cafeflow-text font-bold"
          />

          <select 
            value={selectedCategoryFilter || ''} 
            onChange={(e) => setSelectedCategoryFilter(e.target.value ? Number(e.target.value) : null)}
            className="bg-cafeflow-bg border border-cafeflow-light/65 rounded-2xl px-4 py-3 text-sm focus:outline-none text-cafeflow-text font-bold"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-cafeflow-textMuted hover:text-cafeflow-dark"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-serif text-3xl font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-3">
                {editId ? 'Edit Product' : 'Create Product'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5 text-sm font-bold text-cafeflow-textMuted">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="prod-name">Product Name</label>
                    <input 
                      id="prod-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="prod-category">Category</label>
                    <select 
                      id="prod-category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prod-desc">Description</label>
                  <textarea
                    id="prod-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="prod-price">Price (₹)</label>
                    <input 
                      id="prod-price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="prod-status">Stock Status</label>
                    <select 
                      id="prod-status"
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                      className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prod-image">Product Image File</label>
                  <input 
                    id="prod-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-cafeflow-text font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input 
                    id="prod-visible"
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-cafeflow-accent border-cafeflow-light/65"
                  />
                  <label htmlFor="prod-visible" className="text-sm font-bold text-cafeflow-dark">Visible on Customer Mobile App</label>
                </div>

                {/* Customization Groups Selection */}
                <div className="space-y-2 border-t border-cafeflow-light/20 pt-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-cafeflow-textMuted">Assign Customization Groups</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-cafeflow-bg rounded-xl border border-cafeflow-light/35">
                    {customizationGroups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 text-xs font-semibold text-cafeflow-dark hover:bg-cafeflow-card p-1 rounded cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedGroupIds.includes(g.id!)}
                          onChange={() => handleToggleGroupCheckbox(g.id!)}
                          className="w-3.5 h-3.5 text-cafeflow-accent"
                        />
                        <span>{g.name} ({g.selectionType})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-cafeflow-light/20">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-cafeflow-light/65 text-cafeflow-text font-bold text-sm hover:bg-cafeflow-bgSecondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-cafeflow-accent text-white font-bold text-sm shadow hover:bg-cafeflow-dark flex items-center gap-2"
                  >
                    {submitting ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-20 text-cafeflow-textMuted font-medium animate-pulse">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-3xl border border-cafeflow-light/35 shadow-sm">
            <p className="text-cafeflow-textMuted text-base font-semibold">No products found matching filters.</p>
          </div>
        ) : (
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-sm font-medium text-cafeflow-textMuted">
              <thead className="bg-cafeflow-bgSecondary text-xs font-bold text-cafeflow-accent uppercase tracking-wider">
                <tr>
                  <th className="p-5 w-24">Banner</th>
                  <th className="p-5">Name</th>
                  <th className="p-5">Category</th>
                  <th className="p-5">Price</th>
                  <th className="p-5 w-32 text-center">Stock</th>
                  <th className="p-5 w-32 text-center">Visibility</th>
                  <th className="p-5 w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafeflow-light/15">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-cafeflow-bgSecondary/25 transition-all">
                    <td className="p-5">
                      <div className="w-14 h-14 bg-cafeflow-bgSecondary rounded-2xl flex items-center justify-center text-cafeflow-light overflow-hidden shadow-sm">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6" />
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        <span className="font-bold text-cafeflow-dark text-base block">{prod.name}</span>
                        <span className="text-xs text-cafeflow-textMuted max-w-[240px] block truncate font-medium">{prod.description}</span>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-cafeflow-text">{prod.categoryName}</td>
                    <td className="p-5 font-extrabold text-cafeflow-dark text-base">₹{prod.price}</td>
                    <td className="p-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        prod.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        prod.availabilityStatus === 'OUT_OF_STOCK' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {prod.availabilityStatus}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        prod.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {prod.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleOpenEdit(prod)}
                          className="p-2 hover:bg-cafeflow-bgSecondary text-cafeflow-accent rounded-xl transition-all"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(prod.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
