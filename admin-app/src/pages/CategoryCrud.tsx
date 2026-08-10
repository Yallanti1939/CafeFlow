import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { productService, Category } from '../services/productService';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Image } from 'lucide-react';

export default function CategoryCrud() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setDisplayOrder(categories.length + 1);
    setIsVisible(true);
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description);
    setDisplayOrder(cat.displayOrder);
    setIsVisible(cat.isVisible);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this category? All associated products might be modified.");
    if (!confirmDelete) return;

    try {
      await productService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      alert("Category deleted successfully!");
    } catch (e) {
      alert("Failed to delete category. Ensure no active products are using it.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description);
    fd.append('displayOrder', displayOrder.toString());
    fd.append('isVisible', isVisible.toString());
    if (imageFile) {
      fd.append('image', imageFile);
    }

    try {
      if (editId !== null) {
        await productService.updateCategory(editId, fd);
        alert("Category updated successfully!");
      } else {
        await productService.createCategory(fd);
        alert("Category created successfully!");
      }
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex bg-cafeflow-bg min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Menu Categories</h1>
            <p className="text-cafeflow-textMuted text-sm font-medium mt-1">Organize coffee shop menu structure and display hierarchy.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 bg-cafeflow-accent text-white rounded-2xl hover:bg-cafeflow-dark transition-all text-sm font-bold shadow-md"
          >
            <Plus className="w-5 h-5" /> Add Category
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-cafeflow-textMuted hover:text-cafeflow-dark"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-serif text-3xl font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-3">
                {editId ? 'Edit Category' : 'Create Category'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5 text-sm font-bold text-cafeflow-textMuted">
                <div className="space-y-1.5">
                  <label htmlFor="cat-name">Category Name</label>
                  <input 
                    id="cat-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cat-order">Display Sequence</label>
                    <input 
                      id="cat-order"
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      className="w-full bg-cafeflow-bg border border-cafeflow-light/65 rounded-xl px-4 py-3 text-cafeflow-text focus:outline-none font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cat-image">Category Banner File</label>
                    <input 
                      id="cat-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-cafeflow-text font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input 
                    id="cat-visible"
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-cafeflow-accent border-cafeflow-light/65"
                  />
                  <label htmlFor="cat-visible" className="text-sm font-bold text-cafeflow-dark">Show Category on Customer Menu Page</label>
                </div>

                <div className="pt-4 border-t border-cafeflow-light/20 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-cafeflow-accent text-white font-bold py-3 rounded-xl text-sm hover:bg-cafeflow-dark shadow-md"
                  >
                    {submitting ? 'Saving...' : 'Save Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 bg-cafeflow-bgSecondary text-cafeflow-text font-bold rounded-xl text-sm hover:bg-cafeflow-light/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Categories Table */}
        {loading ? (
          <div className="text-center py-20 text-cafeflow-textMuted font-medium animate-pulse">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-cafeflow-card rounded-3xl border border-cafeflow-light/35 shadow-sm">
            <p className="text-cafeflow-textMuted text-base font-semibold">No categories registered yet.</p>
          </div>
        ) : (
          <div className="bg-cafeflow-card border border-cafeflow-light/35 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-sm font-medium text-cafeflow-textMuted">
              <thead className="bg-cafeflow-bgSecondary text-xs font-bold text-cafeflow-accent uppercase tracking-wider">
                <tr>
                  <th className="p-5 w-20 text-center">Seq</th>
                  <th className="p-5 w-24">Banner</th>
                  <th className="p-5">Name</th>
                  <th className="p-5">Description</th>
                  <th className="p-5 w-32 text-center">Status</th>
                  <th className="p-5 w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafeflow-light/15">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-cafeflow-bgSecondary/25 transition-all">
                    <td className="p-5 text-center font-bold text-lg text-cafeflow-dark">{cat.displayOrder}</td>
                    <td className="p-5">
                      <div className="w-14 h-14 bg-cafeflow-bgSecondary rounded-2xl flex items-center justify-center text-cafeflow-light overflow-hidden shadow-sm">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6" />
                        )}
                      </div>
                    </td>
                    <td className="p-5 font-bold text-cafeflow-dark text-base">{cat.name}</td>
                    <td className="p-5 max-w-xs truncate text-xs md:text-sm font-medium">{cat.description}</td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        cat.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {cat.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {cat.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 hover:bg-cafeflow-bgSecondary text-cafeflow-accent rounded-xl transition-all"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
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
