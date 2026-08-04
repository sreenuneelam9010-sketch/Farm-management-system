import React, { useState } from 'react';
import { db } from '../lib/db';
import { Product, ProductCategory } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { WeightSelectionModal } from '../components/WeightSelectionModal';
import { 
  ShoppingBag, CheckCircle, Plus, Search, Eye, AlertTriangle, 
  Image as ImageIcon, Scale, Tag, Edit, Trash2, Upload, X, ShieldAlert 
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null);

  // Admin Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formCategoryChoice, setFormCategoryChoice] = useState<string>('Sheep');
  const [formCustomCategory, setFormCustomCategory] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Product>>({
    category: 'Sheep',
    unit: 'per head',
    weightKg: 25,
    pricePerKg: 550,
    totalPrice: 13750,
    stockQuantity: 10,
    stockStatus: 'In Stock',
    isActive: true,
    isAvailable: true,
    imageUrl: ''
  });

  React.useEffect(() => {
    setProducts(db.getProducts());
  }, []);

  const refreshProducts = () => {
    const fresh = db.getProducts();
    setProducts(fresh);
  };

  // Dynamic unique categories extracted from products
  const availableCategories = Array.from(new Set(['Sheep', 'Goat', 'Natu Kolla', ...products.map(p => p.category)]));
  const filterTabs = ['All', ...availableCategories];

  // Filter products: Admin sees all, Customers/Workers see only active
  const displayedProducts = isAdmin ? products : products.filter(p => p.isActive !== false);

  const filteredProducts = displayedProducts.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.breed && p.breed.toLowerCase().includes(search.toLowerCase())) ||
                        p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (isOutOfStock(product)) return;
    setSelectedProductForWeight(product);
  };

  const handleOpenWeightModal = (product: Product) => {
    if (isOutOfStock(product)) return;
    setSelectedProductForWeight(product);
  };

  const handleConfirmWeightAndAddToCart = (customizedProduct: Product) => {
    addToCart(customizedProduct, 1);
    setAddedItemName(`${customizedProduct.name} (${customizedProduct.weightKg} kg)`);
    setTimeout(() => setAddedItemName(null), 3000);
  };

  const isOutOfStock = (product: Product) => {
    return product.stockQuantity <= 0 || product.stockStatus === 'Out of Stock' || product.isAvailable === false;
  };

  const getBadgeStyle = (product: Product) => {
    if (isOutOfStock(product)) {
      return 'bg-red-600 text-white font-bold border border-red-500';
    }
    if (product.stockStatus === 'Low Stock' || (product.stockQuantity > 0 && product.stockQuantity <= 5)) {
      return 'bg-amber-500 text-slate-950 font-bold';
    }
    return 'bg-emerald-600 text-white font-bold';
  };

  const getStockLabel = (product: Product) => {
    if (isOutOfStock(product)) return 'Out of Stock';
    if (product.stockStatus === 'Low Stock' || (product.stockQuantity > 0 && product.stockQuantity <= 5)) return `Low Stock (${product.stockQuantity} left)`;
    return 'In Stock';
  };

  // Admin Actions
  const handleOpenAddModal = () => {
    setFormCategoryChoice('Sheep');
    setFormCustomCategory('');
    setFormData({
      name: '',
      category: 'Sheep',
      breed: 'Local',
      weightRange: '25–50 kg',
      unit: 'per head',
      weightKg: 35,
      pricePerKg: 550,
      totalPrice: 19250,
      price: 19250,
      stockQuantity: 10,
      stockStatus: 'In Stock',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=85',
      isActive: true,
      isAvailable: true
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    const isStandardCat = ['Sheep', 'Goat', 'Natu Kolla'].includes(product.category);
    if (isStandardCat) {
      setFormCategoryChoice(product.category);
      setFormCustomCategory('');
    } else {
      setFormCategoryChoice('Custom');
      setFormCustomCategory(product.category);
    }

    setFormData({ ...product });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const finalCat = formCategoryChoice === 'Custom' ? (formCustomCategory.trim() || 'General') : formCategoryChoice;
    const weight = Number(formData.weightKg) || 1;
    const rate = Number(formData.pricePerKg) || 1;
    const total = Math.round(weight * rate);

    if (editingProduct) {
      // Update existing
      const updatedList = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...formData,
            name: formData.name || p.name,
            category: finalCat as ProductCategory,
            weightKg: weight,
            pricePerKg: rate,
            totalPrice: total,
            price: total,
            updatedAt: new Date().toISOString()
          } as Product;
        }
        return p;
      });
      db.saveProducts(updatedList);
      setEditingProduct(null);
    } else {
      // Create new
      const newProd: Product = {
        id: `prd-${Date.now()}`,
        name: formData.name || 'New Product',
        category: finalCat as ProductCategory,
        breed: formData.breed || 'Local',
        weightRange: formData.weightRange || (finalCat === 'Natu Kolla' ? '1–5 kg' : '25–50 kg'),
        weightKg: weight,
        pricePerKg: rate,
        totalPrice: total,
        price: total,
        unit: formData.unit || (finalCat === 'Natu Kolla' ? 'per bird' : 'per head'),
        stockQuantity: formData.stockQuantity ?? 10,
        stockStatus: (formData.stockQuantity ?? 10) <= 0 ? 'Out of Stock' : (formData.stockQuantity ?? 10) <= 5 ? 'Low Stock' : 'In Stock',
        description: formData.description || 'Quality product reared on organic farm.',
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=85',
        isActive: formData.isActive !== false,
        isAvailable: formData.stockQuantity ? formData.stockQuantity > 0 : true,
        createdBy: 'Admin',
        updatedAt: new Date().toISOString()
      };
      db.saveProducts([newProd, ...products]);
      setShowAddModal(false);
    }

    refreshProducts();
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product from the shop catalog?')) {
      const updated = products.filter(p => p.id !== productId);
      db.saveProducts(updated);
      refreshProducts();
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="py-12 bg-[#04140E] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3">
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> Direct Farm Fresh Shop
          </span>
          <h1 className="text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            Farm Product Shop Catalog
          </h1>
          <p className="mt-3 text-emerald-200/80 text-base">
            Browse authentic village-reared Sheep, Goat, Natu Kolla, and farm supplies directly. View live weight, daily Price per KG, total price, and real photos.
          </p>

          {/* Owner/Admin Banner Action */}
          {isAdmin && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="px-6 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          )}
        </div>

        {/* Added to cart notification */}
        {addedItemName && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#062C1E] text-[#F2F2ED] px-5 py-3 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
            <CheckCircle className="w-5 h-5 text-[#C5A059]" />
            <span className="text-xs font-bold">Added <strong className="text-[#C5A059]">{addedItemName}</strong> to cart!</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="dark-glass-card p-4 rounded-2xl border border-[#C5A059]/20 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {filterTabs.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-[#C5A059] text-slate-950 shadow-lg'
                    : 'bg-[#062C1E] text-emerald-200/80 border border-[#C5A059]/20 hover:border-[#C5A059]/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search products, breed, category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059] focus:outline-none placeholder:text-emerald-200/40"
              />
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="hidden md:flex px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all whitespace-nowrap items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => {
            const outOfStock = isOutOfStock(product);
            const isNatuKolla = product.category === 'Natu Kolla' || product.id === 'prd-3' || product.name.includes('Natu Kolla');
            const weightRangeLabel = product.weightRange || (isNatuKolla ? '1–5 kg' : '25–50 kg');

            return (
              <div
                key={product.id}
                className={`dark-glass-card rounded-3xl overflow-hidden border shadow-xl hover:border-[#C5A059]/60 transition-all duration-300 flex flex-col group ${
                  product.isActive === false ? 'opacity-60 border-slate-700' : 'border-[#C5A059]/20'
                }`}
              >
                <div 
                  onClick={() => !outOfStock && handleOpenWeightModal(product)}
                  className="relative h-56 overflow-hidden bg-[#062C1E] flex items-center justify-center cursor-pointer"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <ImageIcon className="w-10 h-10 text-[#C5A059]/50 mx-auto" />
                      <span className="text-xs text-emerald-200/60 font-mono block">Farm Product Image</span>
                    </div>
                  )}

                  <span className="absolute top-4 left-4 bg-[#04140E]/90 text-[#C5A059] border border-[#C5A059]/30 font-bold text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
                    {product.category}
                  </span>
                  <span className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-lg shadow uppercase tracking-wider ${getBadgeStyle(product)}`}>
                    {getStockLabel(product)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-[#04140E]/80 hover:bg-[#C5A059] hover:text-slate-950 text-[#C5A059] rounded-xl transition-all shadow-lg backdrop-blur-sm"
                    title="Quick Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 
                      onClick={() => !outOfStock && handleOpenWeightModal(product)}
                      className="text-lg font-serif-brand font-bold text-[#F2F2ED] mb-2 leading-snug cursor-pointer hover:text-[#C5A059] transition-colors"
                    >
                      {product.name}
                    </h3>

                    {/* Specifications */}
                    <div className="p-3 bg-[#062C1E]/80 rounded-xl border border-[#C5A059]/20 space-y-1.5 text-xs my-3">
                      <div className="flex items-center justify-between text-emerald-200/90">
                        <span className="flex items-center gap-1 font-semibold text-emerald-300/80">
                          <Tag className="w-3 h-3 text-[#C5A059]" /> Breed:
                        </span>
                        <strong className="text-[#F2F2ED]">{product.breed || 'Local'}</strong>
                      </div>

                      <div className="flex items-center justify-between text-emerald-200/90">
                        <span className="flex items-center gap-1 font-semibold text-emerald-300/80">
                          <Scale className="w-3 h-3 text-[#C5A059]" /> Weight Range:
                        </span>
                        <strong className="text-[#F2F2ED]">
                          {weightRangeLabel}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/15">
                        <span className="font-bold text-[#C5A059]">Price per KG:</span>
                        <strong className="text-base font-extrabold text-[#C5A059]">₹{product.pricePerKg}/kg</strong>
                      </div>
                    </div>

                    <p className="text-xs text-emerald-200/70 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#C5A059]/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-200/60 uppercase font-bold block">
                        Rate per KG
                      </span>
                      <span className="text-xl font-serif-brand font-bold text-[#C5A059]">
                        ₹{product.pricePerKg}
                      </span>
                      <span className="text-[11px] text-emerald-300/70 font-medium ml-1">/ kg</span>
                    </div>

                    <button
                      onClick={() => handleOpenWeightModal(product)}
                      disabled={outOfStock}
                      className={`inline-flex items-center px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all ${
                        outOfStock
                          ? 'bg-rose-950/80 text-rose-300/70 border border-rose-500/30 cursor-not-allowed'
                          : 'bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 active:scale-95'
                      }`}
                    >
                      {outOfStock ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" /> Out of Stock
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 mr-1" /> Select Weight & Buy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Owner/Admin Actions on Card */}
                  {isAdmin && (
                    <div className="pt-3 border-t border-[#C5A059]/20 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="flex-1 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#C5A059]" /> Edit Product
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-1 transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Product Quick Preview Modal */}
        {previewProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="dark-glass-card border border-[#C5A059]/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
                <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">{previewProduct.category}</span>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="text-emerald-200/60 hover:text-white font-bold text-xl"
                >
                  ×
                </button>
              </div>

              <div className="relative h-64 rounded-2xl overflow-hidden bg-[#062C1E] flex items-center justify-center">
                {previewProduct.imageUrl ? (
                  <img
                    src={previewProduct.imageUrl}
                    alt={previewProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <ImageIcon className="w-12 h-12 text-[#C5A059]/50 mx-auto" />
                    <span className="text-xs text-emerald-200/60 font-mono block">Product Photo</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED]">{previewProduct.name}</h3>
                
                {(() => {
                  const isNK = previewProduct.category === 'Natu Kolla' || previewProduct.id === 'prd-3' || previewProduct.name.includes('Natu Kolla');
                  const rangeLabel = previewProduct.weightRange || (isNK ? '1–5 kg' : '25–50 kg');

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-[#062C1E]/80 rounded-xl border border-[#C5A059]/20 text-xs my-3">
                        <div>Breed: <strong className="text-[#F2F2ED]">{previewProduct.breed || 'Local'}</strong></div>
                        <div>Weight Range: <strong className="text-[#F2F2ED]">{rangeLabel}</strong></div>
                        <div>Rate/kg: <strong className="text-[#C5A059]">₹{previewProduct.pricePerKg}/kg</strong></div>
                        <div>Stock Status: <strong className="text-[#C5A059]">{getStockLabel(previewProduct)}</strong></div>
                      </div>

                      <p className="text-xs text-emerald-200/80 leading-relaxed">{previewProduct.description}</p>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#C5A059]/20">
                <div>
                  <span className="text-xs text-emerald-200/60 block">Price per KG</span>
                  <span className="text-2xl font-bold text-[#C5A059]">
                    ₹{previewProduct.pricePerKg}
                    <span className="text-xs font-normal text-emerald-200/70"> / kg</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    const p = previewProduct;
                    setPreviewProduct(null);
                    handleOpenWeightModal(p);
                  }}
                  disabled={isOutOfStock(previewProduct)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    isOutOfStock(previewProduct)
                      ? 'bg-rose-900/60 text-rose-300 cursor-not-allowed'
                      : 'bg-[#C5A059] text-slate-950 hover:bg-[#b38f48]'
                  }`}
                >
                  {isOutOfStock(previewProduct) ? 'Out of Stock' : 'Select Weight & Buy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OWNER / ADMIN ADD / EDIT PRODUCT MODAL */}
        {(showAddModal || editingProduct) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-xl font-serif-brand font-bold text-slate-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-slate-400 hover:text-slate-800 font-bold text-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="e.g. Local Sheep, Local Goat, Local Natu Kolla"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Product Category</label>
                    <select
                      value={formCategoryChoice}
                      onChange={e => {
                        const val = e.target.value;
                        setFormCategoryChoice(val);
                        if (val !== 'Custom') {
                          setFormData({ ...formData, category: val });
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="Sheep">Sheep</option>
                      <option value="Goat">Goat</option>
                      <option value="Natu Kolla">Natu Kolla (Country Hen)</option>
                      <option value="Custom">+ Add Custom Category...</option>
                    </select>

                    {formCategoryChoice === 'Custom' && (
                      <input
                        type="text"
                        required
                        placeholder="Enter custom category (e.g. Animal Feed, Medicine)..."
                        value={formCustomCategory}
                        onChange={e => {
                          setFormCustomCategory(e.target.value);
                          setFormData({ ...formData, category: e.target.value });
                        }}
                        className="mt-2 w-full p-2.5 bg-white border border-emerald-600 rounded-xl text-xs font-bold text-black placeholder:text-gray-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Breed / Type</label>
                    <input
                      type="text"
                      required
                      value={formData.breed || ''}
                      onChange={e => setFormData({ ...formData, breed: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500"
                      placeholder="e.g. Local"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Weight Range</label>
                    <input
                      type="text"
                      value={formData.weightRange || ''}
                      onChange={e => setFormData({ ...formData, weightRange: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500"
                      placeholder="e.g. 25–50 kg, 1–5 kg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Unit Label</label>
                    <input
                      type="text"
                      required
                      value={formData.unit || 'per head'}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500"
                      placeholder="e.g. per head, per bird"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step="any"
                      value={formData.weightKg || 1}
                      onChange={e => {
                        const w = Number(e.target.value);
                        const rate = formData.pricePerKg || 500;
                        setFormData({ ...formData, weightKg: w, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Price / KG (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.pricePerKg || 500}
                      onChange={e => {
                        const rate = Number(e.target.value);
                        const w = formData.weightKg || 1;
                        setFormData({ ...formData, pricePerKg: rate, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Total Price (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={Math.round((formData.weightKg || 1) * (formData.pricePerKg || 500))}
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Stock Qty</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.stockQuantity ?? 10}
                      onChange={e => {
                        const qty = Number(e.target.value);
                        const status = qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock';
                        setFormData({ ...formData, stockQuantity: qty, stockStatus: status });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Stock Status</label>
                    <select
                      value={formData.stockStatus || 'In Stock'}
                      onChange={e => setFormData({ ...formData, stockStatus: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Product Image URL or Upload</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL or select file below..."
                      value={formData.imageUrl || ''}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileSelect}
                          className="hidden"
                        />
                      </label>
                      {isUploading && <span className="text-[10px] text-amber-600 font-mono font-bold">Processing photo...</span>}
                      {formData.imageUrl && <span className="text-[10px] text-emerald-700 font-mono font-bold">Image attached ✓</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder:text-gray-500"
                    placeholder="Details about health, vaccination, diet, or specs..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product to Catalog'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl border border-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMER WEIGHT SELECTION MODAL */}
        {selectedProductForWeight && (
          <WeightSelectionModal
            product={selectedProductForWeight}
            onClose={() => setSelectedProductForWeight(null)}
            onConfirm={handleConfirmWeightAndAddToCart}
          />
        )}

      </div>
    </div>
  );
};


