import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { 
  Animal, 
  Product, 
  ProductCategory,
  PriceHistoryRecord,
  Order, 
  InventoryItem, 
  FinancialRecord, 
  Task, 
  ContactMessage, 
  User,
  PaymentSettings
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeModal } from '../../components/QRCodeModal';
import { ImageManager } from '../../components/ImageManager';
import { GalleryManager } from '../../components/admin/GalleryManager';
import { DocumentManager } from '../../components/admin/DocumentManager';
import { AnimalTaggingModule } from '../../components/AnimalTaggingModule';
import { FeedMedicineInventory } from '../../components/FeedMedicineInventory';
import { IncomeExpenseManager } from '../../components/admin/IncomeExpenseManager';
import { StaffTaskManager } from '../../components/admin/StaffTaskManager';
import { WorkerAttendanceManager } from '../../components/admin/WorkerAttendanceManager';
import { AnimalHealthFeedLogManager } from '../../components/admin/AnimalHealthFeedLogManager';
import { WorkerLeaveManager } from '../../components/admin/WorkerLeaveManager';
import { CustomerMessagesManager } from '../../components/admin/CustomerMessagesManager';
import { AdminProfile } from '../../components/profile/AdminProfile';
import { UserProfileModal } from '../../components/profile/UserProfileModal';
import founder1 from '@/assets/founders/1.jpg';
import founder2 from '@/assets/founders/2.jpg';
import founder3 from '@/assets/founders/3.jpg';
import { storageService } from '../../lib/storage';
import { 
  exportAnimalsCSV, 
  exportFinancialsCSV, 
  exportOrdersCSV, 
  printInvoice 
} from '../../lib/exportUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Tag, 
  ShoppingBag, 
  Boxes, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  QrCode, 
  Printer, 
  MessageSquare, 
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  History,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  CreditCard,
  Building2,
  Smartphone,
  Lock
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab: propActiveTab,
  onTabChange
}) => {
  const { user, updateProfile } = useAuth();
  const [internalTab, setInternalTab] = useState<string>('overview');

  const activeTab = propActiveTab || internalTab;

  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [workerSubTab, setWorkerSubTab] = useState<'all' | 'tasks' | 'attendance' | 'feed_health' | 'leaves'>('all');

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => db.getPaymentSettings());
  const [showPaymentSettingsModal, setShowPaymentSettingsModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentSettings>(() => db.getPaymentSettings());
  const [paymentSettingsSuccessMsg, setPaymentSettingsSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const syncPaymentSettings = () => {
      const ps = db.getPaymentSettings();
      setPaymentSettings(ps);
    };
    window.addEventListener('payment_settings_updated', syncPaymentSettings);
    window.addEventListener('storage', syncPaymentSettings);
    return () => {
      window.removeEventListener('payment_settings_updated', syncPaymentSettings);
      window.removeEventListener('storage', syncPaymentSettings);
    };
  }, []);

  const handleOpenPaymentSettingsModal = () => {
    setPaymentForm(db.getPaymentSettings());
    setShowPaymentSettingsModal(true);
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.savePaymentSettings(paymentForm, user?.fullName || 'Owner / Admin');
    setPaymentSettings(updated);
    setPaymentSettingsSuccessMsg('✅ Payment settings saved and updated throughout application.');
    setShowPaymentSettingsModal(false);
    setTimeout(() => setPaymentSettingsSuccessMsg(null), 4000);
  };

  // State
  const [animals, setAnimals] = useState<Animal[]>(() => db.getAnimals());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());

  // Order Deletion State
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [orderDeleteSuccess, setOrderDeleteSuccess] = useState<string | null>(null);

  // Synchronize orders automatically when database or orders change
  useEffect(() => {
    const syncOrders = () => {
      setOrders(db.getOrders());
    };
    window.addEventListener('lvf_orders_updated', syncOrders);
    window.addEventListener('storage', syncOrders);
    return () => {
      window.removeEventListener('lvf_orders_updated', syncOrders);
      window.removeEventListener('storage', syncOrders);
    };
  }, []);

  const handleConfirmDeleteOrder = (orderId: string) => {
    const updated = db.deleteOrder(orderId);
    setOrders(updated);
    setDeleteConfirmOrder(null);
    setOrderDeleteSuccess("✅ Order deleted successfully.");
    setTimeout(() => setOrderDeleteSuccess(null), 4000);
  };
  const [inventory, setInventory] = useState<InventoryItem[]>(() => db.getInventory());
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => db.getFinancials());
  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks());
  const [messages, setMessages] = useState<ContactMessage[]>(() => db.getMessages());
  const [users] = useState<User[]>(() => db.getUsers());
  const [selectedModalUser, setSelectedModalUser] = useState<User | null>(null);

  // Modal State for Adding Animal
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedAnimalForQR, setSelectedAnimalForQR] = useState<Animal | null>(null);

  // New Animal Form
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
    tagNumber: `LV-SHP-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Sheep',
    breed: 'Local Jodipi',
    gender: 'Male',
    ageMonths: 12,
    weightKg: 35,
    purchasePrice: 10000,
    sellingPrice: 15000,
    status: 'Healthy',
    vaccinationStatus: 'Up to Date',
    medicalHistory: 'Regular grazing & vitamins',
    photoUrl: ''
  });

  // Product Management State
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState<Partial<Product>>({});
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null);
  const [previewProductAdmin, setPreviewProductAdmin] = useState<Product | null>(null);
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState<Product | null>(null);

  // Bulk Daily Rate State
  const [categoryRates, setCategoryRates] = useState<{ [key in ProductCategory]: number }>({
    'Sheep': 550,
    'Goat': 580,
    'Natu Kolla': 750
  });

  const [newProductCategoryChoice, setNewProductCategoryChoice] = useState<string>('Sheep');
  const [newProductCustomCategory, setNewProductCustomCategory] = useState<string>('');

  const [editProductCategoryChoice, setEditProductCategoryChoice] = useState<string>('Sheep');
  const [editProductCustomCategory, setEditProductCustomCategory] = useState<string>('');

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: 'Local Sheep',
    category: 'Sheep',
    breed: 'Local',
    weightRange: '25–50 kg',
    weightKg: 35,
    pricePerKg: 550,
    totalPrice: 19250,
    unit: 'per head',
    stockQuantity: 10,
    stockStatus: 'In Stock',
    description: '100% pure Local breed live sheep. Reared on organic fodder.',
    imageUrl: '',
    isActive: true,
    isAvailable: true
  });

  // Financial Metrics & Inventory Alerts
  const totalIncome = financials.filter(f => f.type === 'Income').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = financials.filter(f => f.type === 'Expense').reduce((s, f) => s + f.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const lowStockAlerts = inventory.filter(i => i.currentStock <= i.minAlertStock);

  const handleAddAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Animal = {
      ...newAnimal as Animal,
      id: `anm-${Date.now()}`,
      addedDate: new Date().toISOString().slice(0, 10)
    };
    const updated = [created, ...animals];
    setAnimals(updated);
    db.saveAnimals(updated);
    setShowAddAnimal(false);
  };

  const handleUpdateCategoryPrice = (cat: ProductCategory) => {
    const rate = categoryRates[cat];
    if (!rate || rate <= 0) return;
    const updated = db.updateCategoryPricePerKg(cat, rate, 'Owner / Admin');
    setProducts(updated);
    alert(`Successfully updated Price per KG for all ${cat} products to ₹${rate}/kg! Total prices auto-recalculated.`);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingProduct(true);
    let imageUrl = newProduct.imageUrl || '';

    if (productImageFile) {
      try {
        imageUrl = await storageService.uploadProductImage(productImageFile);
      } catch (err) {
        console.error('Error uploading product image:', err);
      }
    }

    const cat = (newProduct.category as ProductCategory) || 'Sheep';
    const rawWeight = Number(newProduct.weightKg) || 10;
    const weightKg = cat === 'Natu Kolla' ? (rawWeight >= 1 && rawWeight <= 5 ? rawWeight : 2.5) : rawWeight;
    const pricePerKg = Number(newProduct.pricePerKg) || 500;
    const totalPrice = Math.round(weightKg * pricePerKg);
    const stockQty = Number(newProduct.stockQuantity) || 0;
    const stockStatusVal = newProduct.stockStatus || (stockQty <= 0 ? 'Out of Stock' : stockQty <= 5 ? 'Low Stock' : 'In Stock');

    const created: Product = {
      id: `prd-${Date.now()}`,
      name: newProduct.name || `${cat} Product`,
      category: cat,
      breed: newProduct.breed || 'Local',
      weightRange: newProduct.weightRange || (cat === 'Natu Kolla' ? '1–5 kg' : '25–50 kg'),
      weightKg,
      pricePerKg,
      totalPrice,
      price: totalPrice,
      unit: newProduct.unit || (cat === 'Natu Kolla' ? 'per bird' : 'per head'),
      stockQuantity: stockQty,
      stockStatus: stockStatusVal,
      description: newProduct.description || '',
      imageUrl,
      isActive: newProduct.isActive !== undefined ? newProduct.isActive : true,
      isAvailable: stockStatusVal !== 'Out of Stock',
      createdBy: 'Owner / Admin',
      updatedBy: 'Owner / Admin',
      updatedAt: new Date().toISOString(),
      priceHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          oldPricePerKg: pricePerKg,
          newPricePerKg: pricePerKg,
          oldTotalPrice: totalPrice,
          newTotalPrice: totalPrice,
          updatedBy: 'Owner / Admin',
          timestamp: new Date().toISOString()
        }
      ]
    };

    const updated = [created, ...products];
    setProducts(updated);
    db.saveProducts(updated);
    setShowAddProduct(false);
    setProductImageFile(null);
    setIsUploadingProduct(false);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    const isStd = ['Sheep', 'Goat', 'Natu Kolla'].includes(product.category);
    if (isStd) {
      setEditProductCategoryChoice(product.category);
      setEditProductCustomCategory('');
    } else {
      setEditProductCategoryChoice('Custom');
      setEditProductCustomCategory(product.category);
    }

    setEditProductForm({
      name: product.name,
      category: product.category,
      breed: product.breed,
      weightRange: product.weightRange || (product.category === 'Natu Kolla' ? '1–5 kg' : '25–50 kg'),
      weightKg: product.weightKg,
      pricePerKg: product.pricePerKg,
      totalPrice: product.totalPrice,
      unit: product.unit,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      description: product.description,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    });
    setEditProductImageFile(null);
  };

  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUploadingProduct(true);

    let imageUrl = editProductForm.imageUrl || editingProduct.imageUrl || '';

    if (editProductImageFile) {
      try {
        imageUrl = await storageService.uploadProductImage(editProductImageFile, editingProduct.id);
      } catch (err) {
        console.error('Error uploading product image:', err);
      }
    }

    const productCat = (editProductForm.category as ProductCategory) || editingProduct.category;
    const rawWeight = Number(editProductForm.weightKg) ?? editingProduct.weightKg ?? 10;
    const newWeightKg = productCat === 'Natu Kolla' ? (rawWeight >= 1 && rawWeight <= 5 ? rawWeight : 2.5) : rawWeight;
    const newPricePerKg = Number(editProductForm.pricePerKg) ?? editingProduct.pricePerKg ?? 500;
    const newTotalPrice = Math.round(newWeightKg * newPricePerKg);

    const priceChanged = newPricePerKg !== editingProduct.pricePerKg || newWeightKg !== editingProduct.weightKg;

    const updatedPriceHistory = [...(editingProduct.priceHistory || [])];
    if (priceChanged) {
      updatedPriceHistory.unshift({
        date: new Date().toISOString().split('T')[0],
        oldPricePerKg: editingProduct.pricePerKg || 0,
        newPricePerKg,
        oldTotalPrice: editingProduct.totalPrice || editingProduct.price || 0,
        newTotalPrice,
        updatedBy: 'Owner / Admin',
        timestamp: new Date().toISOString()
      });
    }

    const stockQty = Number(editProductForm.stockQuantity) ?? editingProduct.stockQuantity;
    const stockStatusVal = editProductForm.stockStatus || (stockQty <= 0 ? 'Out of Stock' : stockQty <= 5 ? 'Low Stock' : 'In Stock');

    const updatedProduct: Product = {
      ...editingProduct,
      name: editProductForm.name || editingProduct.name,
      category: (editProductForm.category as ProductCategory) || editingProduct.category,
      breed: editProductForm.breed || editingProduct.breed || 'Local',
      weightRange: editProductForm.weightRange || editingProduct.weightRange || (editProductForm.category === 'Natu Kolla' ? '1–5 kg' : '25–50 kg'),
      weightKg: newWeightKg,
      pricePerKg: newPricePerKg,
      totalPrice: newTotalPrice,
      price: newTotalPrice,
      unit: editProductForm.unit || editingProduct.unit,
      stockQuantity: stockQty,
      stockStatus: stockStatusVal,
      description: editProductForm.description || editingProduct.description,
      imageUrl,
      isActive: editProductForm.isActive !== undefined ? editProductForm.isActive : editingProduct.isActive,
      isAvailable: stockStatusVal !== 'Out of Stock',
      updatedBy: 'Owner / Admin',
      updatedAt: new Date().toISOString(),
      priceHistory: updatedPriceHistory
    };

    const updated = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
    setProducts(updated);
    db.saveProducts(updated);
    setEditingProduct(null);
    setEditProductImageFile(null);
    setIsUploadingProduct(false);
  };

  const handleToggleActiveProduct = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          isActive: p.isActive === false ? true : false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Farm Management'
        };
      }
      return p;
    });
    setProducts(updated);
    db.saveProducts(updated);
  };

  const handleReplaceProductImage = async (productId: string, file: File) => {
    try {
      const publicUrl = await storageService.uploadProductImage(file, productId);
      const updated = products.map(p => p.id === productId ? {
        ...p,
        imageUrl: publicUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Farm Management'
      } : p);
      setProducts(updated);
      db.saveProducts(updated);
    } catch (err) {
      console.error('Failed to replace product image:', err);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    db.saveProducts(updated);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o);
    setOrders(updated);
    db.saveOrders(updated);
  };

  return (
    <div className="py-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Owner & Admin Dashboard</div>
            <h1 className="text-2xl font-black mt-1">Lakshmi Venkateshwara Farm Control</h1>
            <p className="text-xs text-slate-400">Managing Livestock, Workers, Sales, Finances, and Inventory</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => exportAnimalsCSV(animals)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Animals CSV
            </button>
            <button
              onClick={() => exportFinancialsCSV(financials)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Finance CSV
            </button>
            <button
              onClick={() => exportOrdersCSV(orders)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Sales CSV
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Sub-Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'animals', label: '🐑 Animals Tagging' },
            { id: 'products', label: '🛒 Product Catalog' },
            { id: 'orders', label: '📦 Orders & Sales' },
            { id: 'inventory', label: '🌾 Feed & Inventory' },
            { id: 'finance', label: '💰 Income & Expenses' },
            { id: 'workers', label: '🚜 Staff & Tasks' },
            { id: 'messages', label: '💬 Messages' },
            { id: 'media', label: '🖼️ Media & Storage' },
            { id: 'settings', label: '⚙️ Settings' },
            { id: 'profile', label: '👤 Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Livestock</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{animals.length} Head</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {animals.filter(a => a.category === 'Sheep').length} Sheep • {animals.filter(a => a.category === 'Natu Kolla').length} Natu Kolla
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Income</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalIncome.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">From animal & grass sales</div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Expenses</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">₹{totalExpenses.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Feed, salaries, medicines</div>
                </div>
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Net Profit</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{netProfit.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1">Margin: {Math.round((netProfit / (totalIncome || 1)) * 100)}%</div>
                </div>
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-base mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" /> Low Stock Inventory Warning
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {lowStockAlerts.map(item => (
                    <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900">{item.itemName}</strong>
                        <div className="text-slate-500">Supplier: {item.supplierName} ({item.supplierContact})</div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg">
                        Stock: {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANIMALS MANAGEMENT */}
        {activeTab === 'animals' && (
          <AnimalTaggingModule 
            userRole="admin" 
            onStockUpdated={() => {
              setProducts(db.getProducts());
              setAnimals(db.getAnimals());
            }} 
          />
        )}

        {/* TAB 3: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" /> Product Shop Catalog ({products.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage categories (Sheep, Goat, Natu Kolla), real storage images, daily Price per KG rates, and total pricing.
                </p>
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>

            {/* Owner/Admin Daily Rate Updater Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#C5A059]" />
                  <span className="font-bold text-sm text-[#F2F2ED]">Daily Category Price per KG Quick Updater</span>
                </div>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">
                  Owner / Admin Permission Granted
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Sheep', 'Goat', 'Natu Kolla'] as ProductCategory[]).map(cat => (
                  <div key={cat} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">{cat} Rate</span>
                      <span className="text-[10px] text-slate-400">Current Rate / KG</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-24">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-[#C5A059]">₹</span>
                        <input
                          type="number"
                          value={categoryRates[cat] || ''}
                          onChange={e => setCategoryRates({ ...categoryRates, [cat]: Number(e.target.value) })}
                          className="w-full pl-6 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-[#F2F2ED]"
                        />
                      </div>
                      <button
                        onClick={() => handleUpdateCategoryPrice(cat)}
                        className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-extrabold rounded-lg shadow whitespace-nowrap"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => {
                const isHidden = p.isActive === false;
                const isOutOfStock = p.stockQuantity <= 0 || p.stockStatus === 'Out of Stock';
                const calculatedTotal = p.totalPrice || Math.round(p.weightKg * p.pricePerKg);

                return (
                  <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${isHidden ? 'border-slate-300 opacity-75 bg-slate-50' : 'border-slate-200'}`}>
                    <div>
                      <div className="relative h-48 bg-slate-950 overflow-hidden group flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="w-8 h-8 text-[#C5A059]/60 mx-auto mb-1" />
                            <span className="text-[11px] font-mono text-emerald-300/80 block">Storage Photo Pending</span>
                            <span className="text-[10px] text-slate-400">Click 'Upload Photo' to attach</span>
                          </div>
                        )}

                        {/* Category Badge */}
                        <span className="absolute top-3 left-3 text-[10px] font-bold text-emerald-900 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md uppercase shadow-sm border border-emerald-100">
                          {p.category}
                        </span>

                        {/* Active/Hidden Toggle Badge */}
                        <button
                          onClick={() => handleToggleActiveProduct(p.id)}
                          className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border flex items-center gap-1 transition-all ${
                            isHidden
                              ? 'bg-slate-800 text-slate-200 border-slate-700'
                              : 'bg-emerald-700 text-white border-emerald-600'
                          }`}
                          title={isHidden ? 'Hidden from customers - Click to Enable' : 'Visible in Customer Shop - Click to Hide'}
                        >
                          {isHidden ? (
                            <>
                              <ToggleLeft className="w-3 h-3 text-slate-400" /> Hidden
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-3 h-3 text-emerald-300" /> Active
                            </>
                          )}
                        </button>

                        {/* Stock Status Pill */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm ${
                            isOutOfStock
                              ? 'bg-red-600 text-white'
                              : p.stockStatus === 'Low Stock' || p.stockQuantity <= 5
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-emerald-800 text-white'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : p.stockStatus === 'Low Stock' ? `Low Stock (${p.stockQuantity})` : `In Stock (${p.stockQuantity})`}
                          </span>
                        </div>

                        {/* Change Photo Overlay Button */}
                        <label
                          title="Upload Real Product Image to Supabase Storage"
                          className="absolute bottom-3 right-3 p-1.5 bg-slate-900/90 hover:bg-emerald-700 text-white rounded-lg cursor-pointer text-xs font-bold transition-all flex items-center gap-1 shadow-lg backdrop-blur-sm border border-slate-700"
                        >
                          <Upload className="w-3 h-3 text-[#C5A059]" />
                          <span className="text-[10px]">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleReplaceProductImage(p.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="p-5 space-y-3">
                        <h4 className="font-bold text-slate-900 text-base leading-snug">{p.name}</h4>

                        {/* Product Spec Table */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Breed:</span>
                            <strong className="text-slate-900">{p.breed || 'Local'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Weight Range:</span>
                            <strong className="text-slate-900">{p.weightRange || (p.category === 'Natu Kolla' ? '1–5 kg' : '25–50 kg')}</strong>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="font-bold text-emerald-800">Rate / KG:</span>
                            <strong className="text-emerald-700 font-extrabold">₹{p.pricePerKg}/kg</strong>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Price ({p.weightKg}kg × ₹{p.pricePerKg})</span>
                            <div className="text-lg font-black text-emerald-800">
                              ₹{calculatedTotal.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ {p.unit}</span>
                            </div>
                          </div>
                          
                          {p.priceHistory && p.priceHistory.length > 0 && (
                            <button
                              onClick={() => setShowPriceHistoryModal(p)}
                              className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                              title="View Price History Log"
                            >
                              <History className="w-3.5 h-3.5 text-emerald-700" /> Price Trail
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewProductAdmin(p)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                          title="Customer Preview"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Preview
                        </button>
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-700" /> Edit
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS & SALES */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Customer Sales Orders ({orders.length})</h3>

            {orderDeleteSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orderDeleteSuccess}</span>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 font-medium">
                No orders found.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">
                          {o.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500">{o.createdAt}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-lg mt-2">{o.customerName} ({o.customerMobile})</div>
                      <div className="text-xs text-slate-600">Address: {o.deliveryAddress}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Payment: <strong>{o.paymentMode}</strong> ({o.paymentStatus})
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-black text-emerald-700">₹{o.totalAmount.toLocaleString('en-IN')}</div>
                      <div className="flex items-center gap-2">
                        <select
                          value={o.orderStatus}
                          onChange={e => handleUpdateOrderStatus(o.id, e.target.value as any)}
                          className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => printInvoice(o)}
                          className="p-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmOrder(o)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: INVENTORY */}
        {activeTab === 'inventory' && (
          <FeedMedicineInventory 
            userRole="admin" 
            onInventoryChanged={() => setInventory(db.getInventory())} 
          />
        )}

        {/* TAB 6: FINANCE */}
        {activeTab === 'finance' && (
          <IncomeExpenseManager onFinancialsChanged={() => setFinancials(db.getFinancials())} />
        )}

        {/* TAB 7: WORKERS & TASKS */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            
            {/* Authorized Owners Header Card */}
            <div className="dark-glass-card p-6 rounded-3xl border border-[#C5A059]/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                    Authorized System Administrators
                  </div>
                  <h3 className="text-xl font-serif-brand font-bold text-[#F2F2ED]">
                    Pre-Authorized Farm Owners (3 Accounts)
                  </h3>
                </div>
                <span className="px-3 py-1 bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] rounded-full text-xs font-bold">
                  Strict Authorization Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#04140E] p-4 rounded-2xl border border-[#C5A059]/25 flex items-center gap-3">
                  <img
                    src={founder1}
                    alt="Neelam Ramachandraiah"
                    className="w-12 h-12 rounded-full object-cover border border-[#C5A059] shadow shrink-0"
                  />
                  <div>
                    <div className="font-serif-brand font-bold text-xs text-[#F2F2ED]">Neelam Ramachandraiah</div>
                    <div className="text-[11px] text-[#C5A059] font-mono">+91 9502756669</div>
                  </div>
                </div>

                <div className="bg-[#04140E] p-4 rounded-2xl border border-[#C5A059]/25 flex items-center gap-3">
                  <img
                    src={founder2}
                    alt="Neelam Subbaiah"
                    className="w-12 h-12 rounded-full object-cover border border-[#C5A059] shadow shrink-0"
                  />
                  <div>
                    <div className="font-serif-brand font-bold text-xs text-[#F2F2ED]">Neelam Subbaiah</div>
                    <div className="text-[11px] text-[#C5A059] font-mono">+91 8897288390</div>
                  </div>
                </div>

                <div className="bg-[#04140E] p-4 rounded-2xl border border-[#C5A059]/25 flex items-center gap-3">
                  <img
                    src={founder3}
                    alt="Neelam Sreenivasulu"
                    className="w-12 h-12 rounded-full object-cover border border-[#C5A059] shadow shrink-0"
                  />
                  <div>
                    <div className="font-serif-brand font-bold text-xs text-[#F2F2ED]">Sreenu Neelam (Owner)</div>
                    <div className="text-[11px] text-[#C5A059] font-mono">+91 9392589010</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Worker Approval Requests */}
            {(() => {
              const pendingWorkers = db.getUsers().filter(u => u.role === 'worker' && (u.status === 'Pending Approval' || !u.isApproved));
              return (
                <div className="dark-glass-card p-6 rounded-3xl border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-serif-brand font-bold text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Pending Worker Approval Requests ({pendingWorkers.length})
                    </h4>
                    <span className="text-xs text-emerald-200/70">
                      Requires Owner Approval to Activate
                    </span>
                  </div>

                  {pendingWorkers.length === 0 ? (
                    <div className="p-6 bg-[#04140E]/80 rounded-2xl text-center text-xs text-emerald-200/60 border border-[#C5A059]/20">
                      No worker accounts currently pending approval. All registered workers are verified.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingWorkers.map(pw => (
                        <div key={pw.id} className="bg-[#04140E] p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#F2F2ED]">{pw.fullName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Pending Approval
                              </span>
                            </div>
                            <div className="text-xs text-emerald-200/80 mt-1">
                              Mobile: <strong className="text-[#C5A059]">+91 {pw.mobileNumber}</strong> | Email: {pw.email} | Registered: {pw.createdAt}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                db.approveWorkerOrStaff({ userId: pw.id, staffName: pw.fullName, email: pw.email });
                                alert(`Worker account for ${pw.fullName} activated successfully!`);
                                window.location.reload();
                              }}
                              className="px-4 py-2 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors cursor-pointer"
                            >
                              Approve & Activate
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete this staff member?`)) {
                                  db.deleteWorkerOrStaff({ userId: pw.id, staffName: pw.fullName, email: pw.email });
                                  alert(`Worker account for ${pw.fullName} deleted.`);
                                  window.location.reload();
                                }
                              }}
                              className="px-3 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sub-Tab Navigation Bar for Worker Operations */}
            <div className="bg-[#04140E] p-2 rounded-2xl border border-[#C5A059]/30 shadow-md flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'all', label: '👥 All Operations' },
                { id: 'tasks', label: '🚜 Staff & Tasks' },
                { id: 'attendance', label: '⏱️ Attendance & Check-In/Out' },
                { id: 'feed_health', label: '🌿 Feed & Health Inspection' },
                { id: 'leaves', label: '📅 Worker Leave Management' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setWorkerSubTab(st.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    workerSubTab === st.id
                      ? 'bg-[#C5A059] text-slate-950 shadow-lg scale-105'
                      : 'text-emerald-200/80 hover:bg-[#062C1E]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Active Workers & Assigned Tasks */}
            {(workerSubTab === 'all' || workerSubTab === 'tasks') && (
              <StaffTaskManager onTasksChanged={() => setTasks(db.getTasks())} />
            )}

            {/* Daily Attendance & Check-in / Check-out Module */}
            {(workerSubTab === 'all' || workerSubTab === 'attendance') && (
              <WorkerAttendanceManager
                userRole="admin"
                currentWorkerId={user?.id || 'usr-admin-1'}
                currentWorkerName={user?.fullName || 'Neelam Ramachandraiah'}
                isDarkMode={true}
              />
            )}

            {/* Daily Feed & Health Inspection Module */}
            {(workerSubTab === 'all' || workerSubTab === 'feed_health') && (
              <AnimalHealthFeedLogManager
                userRole="admin"
                currentWorkerId={user?.id || 'usr-admin-1'}
                currentWorkerName={user?.fullName || 'Neelam Ramachandraiah'}
                isDarkMode={true}
              />
            )}

            {/* Worker Leave Management Module */}
            {(workerSubTab === 'all' || workerSubTab === 'leaves') && (
              <WorkerLeaveManager 
                userRole="admin" 
                currentWorkerId={user?.id || 'usr-admin-1'} 
                currentWorkerName={user?.fullName || 'Neelam Ramachandraiah'} 
                isDarkMode={true} 
              />
            )}

          </div>
        )}

        {/* TAB 8: MESSAGES */}
        {activeTab === 'messages' && (
          <CustomerMessagesManager onMessagesChanged={() => setMessages(db.getMessages())} />
        )}

        {/* TAB 8.5: MEDIA & STORAGE MANAGEMENT */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            <GalleryManager />
            <DocumentManager />
            <div className="border-t border-slate-300 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Owner Profiles & Batch Storage Tools</h3>
              <ImageManager />
            </div>
          </div>
        )}

        {/* Modal: Add Animal */}
        {showAddAnimal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Register New Livestock Animal</h3>
              <form onSubmit={handleAddAnimal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">Tag Number</label>
                  <input
                    type="text"
                    required
                    value={newAnimal.tagNumber}
                    onChange={e => setNewAnimal({ ...newAnimal, tagNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select
                      value={newAnimal.category}
                      onChange={e => setNewAnimal({ ...newAnimal, category: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Sheep">Sheep</option>
                      <option value="Natu Kolla">Natu Kolla</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Breed Name</label>
                    <input
                      type="text"
                      required
                      value={newAnimal.breed}
                      onChange={e => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      value={newAnimal.weightKg}
                      onChange={e => setNewAnimal({ ...newAnimal, weightKg: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newAnimal.sellingPrice}
                      onChange={e => setNewAnimal({ ...newAnimal, sellingPrice: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-3 bg-emerald-700 text-white font-bold rounded-xl shadow">
                    Save Animal Record
                  </button>
                  <button type="button" onClick={() => setShowAddAnimal(false)} className="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Product */}
        {showAddProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-700" /> Add New Shop Product
                  </h3>
                  <p className="text-xs text-slate-500">Only Sheep, Goat, and Natu Kolla categories allowed</p>
                </div>
                <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name || ''}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. Pure Jodipi Breeding Sheep Ram"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Category</label>
                    <select
                      value={newProductCategoryChoice}
                      onChange={e => {
                        const val = e.target.value;
                        setNewProductCategoryChoice(val);
                        if (val !== 'Custom') {
                          setNewProduct({ ...newProduct, category: val as any });
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="Sheep">Sheep</option>
                      <option value="Goat">Goat</option>
                      <option value="Natu Kolla">Natu Kolla</option>
                      <option value="Custom">+ Add Custom Category...</option>
                    </select>

                    {newProductCategoryChoice === 'Custom' && (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Animal Feed, Medicines, Equipment..."
                        value={newProductCustomCategory}
                        onChange={e => {
                          setNewProductCustomCategory(e.target.value);
                          setNewProduct({ ...newProduct, category: e.target.value as any });
                        }}
                        className="mt-2 w-full p-2 bg-slate-50 border border-emerald-500 rounded-xl text-xs font-bold text-emerald-900"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Breed</label>
                    <input
                      type="text"
                      required
                      value={newProduct.breed || ''}
                      onChange={e => setNewProduct({ ...newProduct, breed: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      placeholder="e.g. Jodipi, Jamnapari, Aseel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Weight Range</label>
                    <input
                      type="text"
                      value={newProduct.weightRange || ''}
                      onChange={e => setNewProduct({ ...newProduct, weightRange: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      placeholder="e.g. 25–50 kg, 1–5 kg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Unit Label</label>
                    <input
                      type="text"
                      required
                      value={newProduct.unit || 'per head'}
                      onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      placeholder="e.g. per head, per bird"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step="any"
                      value={newProduct.weightKg || 10}
                      onChange={e => {
                        const w = Number(e.target.value);
                        const rate = newProduct.pricePerKg || 500;
                        setNewProduct({ ...newProduct, weightKg: w, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Price per KG (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProduct.pricePerKg || 500}
                      onChange={e => {
                        const rate = Number(e.target.value);
                        const w = newProduct.weightKg || 10;
                        setNewProduct({ ...newProduct, pricePerKg: rate, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Total Price (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={Math.round((newProduct.weightKg || 10) * (newProduct.pricePerKg || 500))}
                      className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Stock Qty</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProduct.stockQuantity || 0}
                      onChange={e => {
                        const qty = Number(e.target.value);
                        const status = qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock';
                        setNewProduct({ ...newProduct, stockQuantity: qty, stockStatus: status });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Stock Status</label>
                    <select
                      value={newProduct.stockStatus || 'In Stock'}
                      onChange={e => setNewProduct({ ...newProduct, stockStatus: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Visibility</label>
                    <select
                      value={newProduct.isActive ? 'active' : 'hidden'}
                      onChange={e => setNewProduct({ ...newProduct, isActive: e.target.value === 'active' })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="active">Active (Show)</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Upload Photo to Storage</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setProductImageFile(e.target.files[0]);
                      }
                    }}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white file:font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={newProduct.description || ''}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Provide details about diet, vaccination, health, or lineage..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingProduct}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all"
                  >
                    {isUploadingProduct ? 'Saving & Uploading...' : 'Save Product to Shop'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false);
                      setProductImageFile(null);
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Product */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-emerald-700" /> Edit Product ({editingProduct.name})
                  </h3>
                  <p className="text-xs text-slate-500">Update Price per KG, Weight, Breed, or Storage photo</p>
                </div>
                <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
              </div>

              <form onSubmit={handleSaveEditedProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editProductForm.name || ''}
                    onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Category</label>
                    <select
                      value={editProductCategoryChoice}
                      onChange={e => {
                        const val = e.target.value;
                        setEditProductCategoryChoice(val);
                        if (val !== 'Custom') {
                          setEditProductForm({ ...editProductForm, category: val as any });
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="Sheep">Sheep</option>
                      <option value="Goat">Goat</option>
                      <option value="Natu Kolla">Natu Kolla</option>
                      <option value="Custom">+ Add Custom Category...</option>
                    </select>

                    {editProductCategoryChoice === 'Custom' && (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Animal Feed, Medicines, Equipment..."
                        value={editProductCustomCategory}
                        onChange={e => {
                          setEditProductCustomCategory(e.target.value);
                          setEditProductForm({ ...editProductForm, category: e.target.value as any });
                        }}
                        className="mt-2 w-full p-2 bg-slate-50 border border-emerald-500 rounded-xl text-xs font-bold text-emerald-900"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Breed</label>
                    <input
                      type="text"
                      required
                      value={editProductForm.breed || ''}
                      onChange={e => setEditProductForm({ ...editProductForm, breed: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Weight Range</label>
                    <input
                      type="text"
                      value={editProductForm.weightRange || ''}
                      onChange={e => setEditProductForm({ ...editProductForm, weightRange: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      placeholder="e.g. 25–50 kg, 1–5 kg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Unit Label</label>
                    <input
                      type="text"
                      required
                      value={editProductForm.unit || ''}
                      onChange={e => setEditProductForm({ ...editProductForm, unit: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step="any"
                      value={editProductForm.weightKg || 10}
                      onChange={e => {
                        const w = Number(e.target.value);
                        const rate = editProductForm.pricePerKg || 500;
                        setEditProductForm({ ...editProductForm, weightKg: w, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Price per KG (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editProductForm.pricePerKg || 500}
                      onChange={e => {
                        const rate = Number(e.target.value);
                        const w = editProductForm.weightKg || 10;
                        setEditProductForm({ ...editProductForm, pricePerKg: rate, totalPrice: Math.round(w * rate) });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Total Price (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={Math.round((editProductForm.weightKg || 10) * (editProductForm.pricePerKg || 500))}
                      className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Stock Qty</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editProductForm.stockQuantity ?? 0}
                      onChange={e => {
                        const qty = Number(e.target.value);
                        const status = qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock';
                        setEditProductForm({ ...editProductForm, stockQuantity: qty, stockStatus: status });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Stock Status</label>
                    <select
                      value={editProductForm.stockStatus || 'In Stock'}
                      onChange={e => setEditProductForm({ ...editProductForm, stockStatus: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Visibility</label>
                    <select
                      value={editProductForm.isActive ? 'active' : 'hidden'}
                      onChange={e => setEditProductForm({ ...editProductForm, isActive: e.target.value === 'active' })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="active">Active (Show)</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Upload New Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setEditProductImageFile(e.target.files[0]);
                      }
                    }}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white file:font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editProductForm.description || ''}
                    onChange={e => setEditProductForm({ ...editProductForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingProduct}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all"
                  >
                    {isUploadingProduct ? 'Saving Updates...' : 'Save Product Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setEditProductImageFile(null);
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Admin Customer Preview */}
        {previewProductAdmin && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="dark-glass-card border border-[#C5A059]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
                <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Customer Shop View
                </span>
                <button
                  onClick={() => setPreviewProductAdmin(null)}
                  className="text-emerald-200/60 hover:text-white font-bold text-xl"
                >
                  ×
                </button>
              </div>

              <div className="relative h-52 rounded-2xl overflow-hidden bg-[#062C1E] flex items-center justify-center border border-[#C5A059]/30">
                {previewProductAdmin.imageUrl ? (
                  <img
                    src={previewProductAdmin.imageUrl}
                    alt={previewProductAdmin.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-[#C5A059]/60 mx-auto mb-1" />
                    <span className="text-xs font-mono text-[#C5A059]">Storage Photo Pending</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-[#04140E]/90 text-[#C5A059] border border-[#C5A059]/30 font-bold text-xs px-2.5 py-1 rounded-lg">
                  {previewProductAdmin.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif-brand font-bold text-[#F2F2ED]">{previewProductAdmin.name}</h3>
                <div className="text-xs text-emerald-200/80 mt-1 flex gap-3 font-mono">
                  <span>Breed: {previewProductAdmin.breed}</span>
                  <span>Weight: {previewProductAdmin.weightKg}kg</span>
                  <span>Rate: ₹{previewProductAdmin.pricePerKg}/kg</span>
                </div>
                <p className="text-xs text-emerald-200/70 mt-2 leading-relaxed">{previewProductAdmin.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#C5A059]/20">
                <div>
                  <span className="text-[10px] text-emerald-200/60 block uppercase">Total Calculated Price</span>
                  <span className="text-xl font-bold text-[#C5A059]">₹{(previewProductAdmin.totalPrice || Math.round(previewProductAdmin.weightKg * previewProductAdmin.pricePerKg)).toLocaleString('en-IN')} <span className="text-xs text-emerald-200/70 font-normal">/ {previewProductAdmin.unit}</span></span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-200/60 block">Stock Status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block ${
                    previewProductAdmin.stockQuantity <= 0 || previewProductAdmin.stockStatus === 'Out of Stock'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-800 text-white'
                  }`}>
                    {previewProductAdmin.stockQuantity <= 0 || previewProductAdmin.stockStatus === 'Out of Stock' ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Price History Audit Trail */}
        {showPriceHistoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-700" /> Price Audit Trail Log
                  </h3>
                  <p className="text-xs text-slate-500">{showPriceHistoryModal.name} ({showPriceHistoryModal.category})</p>
                </div>
                <button onClick={() => setShowPriceHistoryModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
                {showPriceHistoryModal.priceHistory && showPriceHistoryModal.priceHistory.length > 0 ? (
                  showPriceHistoryModal.priceHistory.map((h, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="font-bold text-slate-700 text-[11px] font-mono">Date: {h.date}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Updated By: {h.updatedBy || 'Owner / Admin'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Price per KG</span>
                          <div className="font-bold">
                            <span className="text-slate-400 line-through mr-1.5">₹{h.oldPricePerKg}/kg</span>
                            <span className="text-emerald-700 font-extrabold">₹{h.newPricePerKg}/kg</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Calculated Total Price</span>
                          <div className="font-bold">
                            <span className="text-slate-400 line-through mr-1.5">₹{h.oldTotalPrice?.toLocaleString('en-IN')}</span>
                            <span className="text-emerald-800 font-black">₹{h.newTotalPrice?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pt-1 text-right">
                        Timestamp: {new Date(h.timestamp || h.updatedAt || Date.now()).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4">No price history recorded yet.</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => setShowPriceHistoryModal(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow"
                >
                  Close Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: FARM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" /> Farm Settings & Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage farm branding, primary contacts, payment accounts, low-stock thresholds, and system backups.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Farm Identity */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    🐑 Farm Profile & Contact Details
                  </h4>
                  <div className="text-xs space-y-2 text-slate-700">
                    <div><strong>Farm Name:</strong> Lakshmi Venkateshwara Sheep & Natu Kolla Farm</div>
                    <div><strong>Primary Contact:</strong> N. Ramachandraiah (+91 9502756669)</div>
                    <div>
                      <strong>Address & Location:</strong>{' '}
                      <a
                        href="https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline block my-1"
                        title="Click to view location on Google Maps"
                      >
                        Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.
                      </a>
                      <a
                        href="https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6"
                        target="_blank"
                        rel="noreferrer"
                        id="btn-admin-dash-view-location"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg shadow transition-colors cursor-pointer mt-1"
                      >
                        View Farm Location ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* System Controls & Operational Parameters */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      ⚙️ Operational Parameters
                    </h4>
                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={handleOpenPaymentSettingsModal}
                        id="btn-edit-payment-settings"
                        className="px-3.5 py-2 bg-emerald-950 hover:bg-black text-[#C5A059] border border-[#C5A059]/40 text-xs font-black rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <CreditCard className="w-4 h-4 text-[#C5A059]" /> Edit Payment Settings
                      </button>
                    )}
                  </div>

                  {paymentSettingsSuccessMsg && (
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                      {paymentSettingsSuccessMsg}
                    </div>
                  )}

                  <div className="text-xs space-y-3 text-slate-700">
                    <div><strong>Low Feed Threshold:</strong> 20 Bags / KGs</div>
                    
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">Default Payment Method:</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {paymentSettings.defaultPaymentMethod}
                        </span>
                      </div>

                      {/* Operational Payment Note */}
                      <p className="text-[11px] text-slate-600 bg-amber-50/90 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium">
                        {paymentSettings.noteText || "Currently, payments are accepted only at the time of product delivery or farm handover. Online payment methods such as UPI, PhonePe, Google Pay, and Direct Bank Transfer are disabled until enabled by the Owner/Admin."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <strong>Online Payment Gateway:</strong>
                      {paymentSettings.isOnlinePaymentEnabled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          🟢 Enabled by Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                          🔒 Disabled (Cash on Delivery Only)
                        </span>
                      )}
                    </div>
                    <div><strong>Worker Task Auto-Approval:</strong> Enabled</div>
                    <div><strong>Order Deletion Privilege:</strong> Owner / Admin Only</div>
                  </div>
                </div>
              </div>

              {/* Data Backup & Export Actions */}
              <div className="p-5 bg-emerald-950 text-white rounded-2xl border border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">💾 System Database Export</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Export all farm records, orders, animals, feeds, and accounts as CSV files.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      exportAnimalsCSV(animals);
                      exportOrdersCSV(orders);
                      exportFinancialsCSV(financials);
                    }}
                    className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
                  >
                    Export Full Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: ADMIN & FARM PROFILE */}
        {activeTab === 'profile' && user && (
          <AdminProfile
            user={user}
            onUpdateProfile={updateProfile}
          />
        )}

        {/* Modal: QR Code */}
        <QRCodeModal
          animal={selectedAnimalForQR}
          onClose={() => setSelectedAnimalForQR(null)}
        />

        {/* Modal: Read-only User Profile View */}
        <UserProfileModal
          user={selectedModalUser}
          onClose={() => setSelectedModalUser(null)}
        />

        {/* Delete Customer Order Confirmation Modal */}
        {deleteConfirmOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Delete Order</h3>
                  <p className="text-xs text-slate-500 font-semibold">Order #{deleteConfirmOrder.orderNumber}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
                <div><strong>Customer Name:</strong> {deleteConfirmOrder.customerName} ({deleteConfirmOrder.customerMobile})</div>
                <div><strong>Delivery Address:</strong> {deleteConfirmOrder.deliveryAddress}</div>
                <div><strong>Total Amount:</strong> ₹{deleteConfirmOrder.totalAmount.toLocaleString('en-IN')}</div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Are you sure you want to permanently delete this customer order? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteOrder(deleteConfirmOrder.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Payment Settings */}
        {showPaymentSettingsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
              {/* Header */}
              <div className="p-6 bg-emerald-950 text-white border-b border-[#C5A059]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#C5A059]/20 border border-[#C5A059]/40 rounded-2xl text-[#C5A059]">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#F2F2ED]">Edit Payment Configuration</h3>
                    <p className="text-xs text-emerald-200/80 font-medium">Manage default payment mode, online payment gateways & bank info</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentSettingsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePaymentSettings} className="p-6 space-y-5 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
                {/* Enable/Disable Online Payments Toggle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">Enable Online Payments</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        When disabled, Cash on Delivery is enforced for all customers and online options are hidden during checkout.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentForm.isOnlinePaymentEnabled}
                      onChange={e => setPaymentForm({ ...paymentForm, isOnlinePaymentEnabled: e.target.checked })}
                      className="w-5 h-5 accent-emerald-700 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Default Payment Method Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Payment Method Name *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.defaultPaymentMethod}
                    onChange={e => setPaymentForm({ ...paymentForm, defaultPaymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-700"
                  />
                </div>

                {/* Operational Payment Note */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational Payment Note for Customers *</label>
                  <textarea
                    required
                    rows={3}
                    value={paymentForm.noteText}
                    onChange={e => setPaymentForm({ ...paymentForm, noteText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-700"
                  ></textarea>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Displayed under the default payment method in Operational Parameters and Checkout.
                  </span>
                </div>

                {/* Online Payment Configuration Fields */}
                <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 ${!paymentForm.isOnlinePaymentEnabled ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" /> Online Gateways & Bank Account Configuration
                    </h4>
                    {!paymentForm.isOnlinePaymentEnabled && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                        Online Payments Currently Disabled
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 9502756669@upi"
                        value={paymentForm.upiId || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PhonePe Mobile Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 9502756669"
                        value={paymentForm.phonePeNumber || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, phonePeNumber: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Google Pay Mobile Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 9502756669"
                        value={paymentForm.googlePayNumber || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, googlePayNumber: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        value={paymentForm.bankName || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Lakshmi Venkateshwara Farm"
                        value={paymentForm.bankAccountName || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, bankAccountName: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 390123456789"
                        value={paymentForm.bankAccountNumber || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, bankAccountNumber: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={paymentForm.ifscCode || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, ifscCode: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none uppercase focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment QR Code Image URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={paymentForm.qrCodeUrl || ''}
                        onChange={e => setPaymentForm({ ...paymentForm, qrCodeUrl: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Additional Payment Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions for online bank transfer / UPI..."
                      value={paymentForm.additionalInstructions || ''}
                      onChange={e => setPaymentForm({ ...paymentForm, additionalInstructions: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-700"
                    ></textarea>
                  </div>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPaymentSettingsModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Save Payment Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
