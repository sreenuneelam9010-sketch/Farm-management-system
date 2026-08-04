import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Order, OrderItem, ContactMessage, PaymentSettings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { printInvoice } from '../../lib/exportUtils';
import { storageService } from '../../lib/storage';
import { InAppChat } from '../../components/chat/InAppChat';
import { CustomerProfile } from '../../components/profile/CustomerProfile';
import { 
  ShoppingBag, 
  PackageCheck, 
  Printer, 
  MessageSquare, 
  User, 
  MapPin, 
  Phone, 
  Trash2, 
  CheckCircle,
  Plus,
  Minus,
  Camera,
  RefreshCw,
  AlertTriangle,
  X,
  Eye,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface CustomerDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigatePage?: (page: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  activeTab: propActiveTab,
  onTabChange,
  onNavigatePage
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [internalTab, setInternalTab] = useState<string>('cart');

  const activeTab = propActiveTab || internalTab;

  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [orders, setOrders] = useState<Order[]>(() => 
    db.getOrders().filter(o => o.customerId === user?.id || o.customerName === user?.fullName)
  );

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => db.getPaymentSettings());
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>(
    db.getPaymentSettings().defaultPaymentMethod || 'Cash on Delivery (Pay at Farm / On Handover)'
  );
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Synchronize payment settings
  useEffect(() => {
    const syncPaymentSettings = () => {
      const ps = db.getPaymentSettings();
      setPaymentSettings(ps);
      if (!ps.isOnlinePaymentEnabled) {
        setSelectedPaymentMode(ps.defaultPaymentMethod);
      }
    };
    window.addEventListener('payment_settings_updated', syncPaymentSettings);
    window.addEventListener('storage', syncPaymentSettings);
    return () => {
      window.removeEventListener('payment_settings_updated', syncPaymentSettings);
      window.removeEventListener('storage', syncPaymentSettings);
    };
  }, []);

  // Order Deletion State
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [orderDeleteSuccess, setOrderDeleteSuccess] = useState<string | null>(null);

  // Synchronize orders automatically when database or orders change
  useEffect(() => {
    const syncOrders = () => {
      setOrders(db.getOrders().filter(o => o.customerId === user?.id || o.customerName === user?.fullName));
    };
    window.addEventListener('lvf_orders_updated', syncOrders);
    window.addEventListener('storage', syncOrders);
    return () => {
      window.removeEventListener('lvf_orders_updated', syncOrders);
      window.removeEventListener('storage', syncOrders);
    };
  }, [user?.id, user?.fullName]);

  const handleConfirmDeleteOrder = (orderId: string) => {
    db.deleteOrder(orderId);
    setOrders(db.getOrders().filter(o => o.customerId === user?.id || o.customerName === user?.fullName));
    setDeleteConfirmOrder(null);
    setOrderDeleteSuccess("✅ Order deleted successfully.");
    setTimeout(() => setOrderDeleteSuccess(null), 4000);
  };

  // Profile Picture Management State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  
  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [previewStats, setPreviewStats] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    fileSizeMB: string;
  } | null>(null);

  // Message / Inquiry state
  const [msgSubject, setMsgSubject] = useState('General Inquiry');
  const [msgBody, setMsgBody] = useState('');
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      customerId: user?.id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: user?.fullName || 'Customer',
      mobile: user?.mobileNumber || '',
      email: user?.email || '',
      subject: msgSubject,
      message: msgBody.trim(),
      date: new Date().toISOString(),
      status: 'Unread',
      isRead: false
    };

    const currentMsgs = db.getMessages();
    db.saveMessages([newMessage, ...currentMsgs]);

    setMsgBody('');
    setMsgSentSuccess(true);
    setTimeout(() => setMsgSentSuccess(false), 5000);
  };

  // Profile Picture Select & Validate
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarSuccessMsg(null);
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // 1. Validate File Size (Max 10 MB = 10 * 1024 * 1024 bytes)
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setAvatarError('Selected photo exceeds 10 MB maximum limit. Please choose a smaller photo.');
      e.target.value = '';
      return;
    }

    // 2. Validate File Format (JPG, JPEG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!validTypes.includes(file.type) && (!ext || !validExts.includes(ext))) {
      setAvatarError('Unsupported image format. Please select a JPG, JPEG, PNG, or WEBP photo.');
      e.target.value = '';
      return;
    }

    // 3. Create preview object URL and obtain dimensions
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const ratioVal = (w / h).toFixed(2);
      let ratioText = 'Square (1:1)';
      if (w > h) ratioText = `Landscape (${ratioVal}:1)`;
      if (h > w) ratioText = `Portrait (1:${(h / w).toFixed(2)})`;

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      setPreviewStats({
        width: w,
        height: h,
        aspectRatio: ratioText,
        fileSizeMB: `${sizeInMB} MB`
      });
      setShowPreviewModal(true);
    };
    img.onerror = () => {
      setAvatarError('Failed to read photo file. Please choose another image.');
    };
    img.src = objectUrl;

    e.target.value = '';
  };

  // Save / Upload Profile Photo
  const handleSaveProfileAvatar = async () => {
    if (!selectedFile) return;
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const publicUrl = await storageService.uploadProfileImage(selectedFile, user?.id || 'customer');
      if (publicUrl && updateProfile) {
        updateProfile({ avatarUrl: publicUrl });
        setAvatarSuccessMsg('Profile picture updated and saved to your account!');
        setTimeout(() => setAvatarSuccessMsg(null), 5000);
        setShowPreviewModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Failed to save avatar:', err);
      setAvatarError('Failed to upload profile photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove Photo Handler
  const handleConfirmRemovePhoto = () => {
    if (updateProfile) {
      updateProfile({ avatarUrl: '' });
      setAvatarSuccessMsg('Profile picture removed. Reverted to default avatar.');
      setTimeout(() => setAvatarSuccessMsg(null), 5000);
    }
    setShowRemoveConfirmModal(false);
    setShowPreviewModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;

    const items: OrderItem[] = cart.map(c => ({
      productId: c.product.id,
      productName: c.product.name,
      unitPrice: c.product.price,
      quantity: c.quantity,
      totalPrice: c.product.price * c.quantity
    }));

    const effectivePaymentMode = paymentSettings.isOnlinePaymentEnabled
      ? selectedPaymentMode
      : paymentSettings.defaultPaymentMethod;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `LVF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: user?.id || 'usr-customer',
      customerName: user?.fullName || 'Customer',
      customerMobile: user?.mobileNumber || '',
      deliveryAddress,
      items,
      totalAmount,
      paymentMode: effectivePaymentMode,
      paymentStatus: 'Pending Payment',
      orderStatus: 'Confirmed',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const allOrders = db.getOrders();
    const updatedAll = [newOrder, ...allOrders];
    db.saveOrders(updatedAll);

    setOrders([newOrder, ...orders]);
    clearCart();
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  return (
    <div className="py-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Customer Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 shadow-lg overflow-hidden flex items-center justify-center relative">
                  <img
                    src={user.avatarUrl}
                    alt={user?.fullName || 'Profile'}
                    className="w-full h-full object-cover object-center transition-transform group-hover:scale-105 duration-300"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-emerald-950 border-2 border-emerald-500/60 shadow-lg flex items-center justify-center text-emerald-300 font-black text-2xl uppercase">
                  {user?.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
              )}

              {/* Profile Image Action Badges */}
              <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-500/40 shadow-xl backdrop-blur-sm">
                <label
                  title="Upload / Change Profile Photo (JPG, PNG, WEBP up to 10 MB)"
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
                >
                  {isUploadingAvatar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </label>

                {user?.avatarUrl && (
                  <button
                    onClick={() => setShowRemoveConfirmModal(true)}
                    title="Remove Profile Photo"
                    className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg transition-transform active:scale-95 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>Customer Account</span>
                {user?.avatarUrl && <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 rounded-full text-[10px] border border-emerald-500/30 font-medium">Custom Photo</span>}
              </div>
              <h1 className="text-2xl font-black mt-0.5">Hello, {user?.fullName || 'Sreenu Neelam'}</h1>
              <p className="text-xs text-slate-400">Manage Farm Orders, Track Delivery Status, and Checkout</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/919502756669"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Order: 9502756669
            </a>
            <a
              href="https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6"
              target="_blank"
              rel="noreferrer"
              id="btn-customer-dash-view-location"
              className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4" /> View Farm Location
            </a>
          </div>
        </div>

        {/* Profile Avatar Banners */}
        {avatarError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{avatarError}</span>
            </div>
            <button onClick={() => setAvatarError(null)} className="p-1 text-red-600 hover:text-red-900 font-bold">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {avatarSuccessMsg && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{avatarSuccessMsg}</span>
            </div>
            <button onClick={() => setAvatarSuccessMsg(null)} className="p-1 text-emerald-600 hover:text-emerald-900 font-bold">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Customer Navigation Sub-Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Dashboard Overview' },
            { id: 'cart', label: '🛒 Shopping Cart & Checkout' },
            { id: 'orders', label: '📦 My Orders' },
            { id: 'messages', label: '💬 Chat with Farm' },
            { id: 'profile', label: '👤 Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Customer Welcome Card */}
            <div className="bg-emerald-950 border border-[#C5A059]/40 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-extrabold uppercase rounded-full mb-2">
                  Customer Portal Overview
                </div>
                <h2 className="text-2xl font-black text-[#F2F2ED]">Welcome back, {user?.fullName || 'Valued Customer'}!</h2>
                <p className="text-xs text-emerald-200/80 mt-1">Manage your orders, browse organic livestock & poultry shop, or chat directly with farm management.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigatePage && onNavigatePage('products')}
                  className="px-5 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Browse Shop Catalog
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
              <div 
                onClick={() => setActiveTab('orders')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Total Orders</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{orders.length}</span>
                </div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                  <PackageCheck className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('cart')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Items in Cart</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{cart.length}</span>
                </div>
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('messages')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Farm Chat</span>
                  <span className="text-xs font-black text-emerald-700 mt-2 block">Direct Support Active</span>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('profile')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Profile Status</span>
                  <span className="text-xs font-black text-slate-800 mt-2 block">Active Member</span>
                </div>
                <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-700" /> Recent Order Activity
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-3">
                  <p className="text-xs">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => onNavigatePage && onNavigatePage('products')}
                    className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Explore Shop Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{order.orderNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">{order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-slate-900 text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">{order.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'profile' && user ? (
          <CustomerProfile
            user={user}
            onUpdateProfile={updateProfile}
            onLogout={logout}
            onNavigateTab={setActiveTab}
          />
        ) : activeTab === 'messages' ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-900/90 text-white rounded-2xl border border-[#C5A059]/40 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#F2F2ED]">Direct Chat with Farm Owners</h3>
                <p className="text-xs text-slate-300">
                  Send messages, photos, order questions, or documents directly to Neelam Ramachandraiah & Neelam Subbaiah.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#C5A059] text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                🔒 E2E Encrypted
              </span>
            </div>
            <InAppChat userRole="customer" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Cart & Checkout */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" /> Active Shopping Cart ({cart.length})
              </h3>

              {orderPlaced && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Order placed successfully! The farm owners will contact you for delivery.
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Your cart is empty. Browse products from the shop tab!
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-100">
                    {cart.map((item, idx) => (
                      <div key={`${item.product.id}_${item.product.weightKg}_${idx}`} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 text-sm">{item.product.name}</div>
                          <div className="text-xs text-slate-600 font-medium">
                            Weight: <strong className="text-emerald-900 font-extrabold">{item.product.weightKg} kg</strong> @ ₹{item.product.pricePerKg}/kg
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.weightKg)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-slate-900 px-2">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.weightKg)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.product.weightKg)}
                            className="text-[11px] text-red-600 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-xl text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handlePlaceOrder} className="pt-4 border-t border-slate-100 space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                      <textarea
                        required
                        rows={2}
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Payment Method</label>
                      {!paymentSettings.isOnlinePaymentEnabled ? (
                        <div className="space-y-2">
                          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5 font-extrabold text-slate-900 text-xs sm:text-sm">
                              <span className="text-base">💵</span>
                              <span>{paymentSettings.defaultPaymentMethod}</span>
                            </div>
                            <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              Active Method
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200/80 leading-relaxed font-medium">
                            {paymentSettings.noteText || "Currently, payments are accepted only at the time of product delivery or farm handover. Online payment methods such as UPI, PhonePe, Google Pay, and Direct Bank Transfer are disabled until enabled by the Owner/Admin."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              selectedPaymentMode === paymentSettings.defaultPaymentMethod 
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              <input
                                type="radio"
                                name="payment_mode"
                                value={paymentSettings.defaultPaymentMethod}
                                checked={selectedPaymentMode === paymentSettings.defaultPaymentMethod}
                                onChange={() => setSelectedPaymentMode(paymentSettings.defaultPaymentMethod)}
                                className="accent-emerald-700"
                              />
                              <span className="text-xs">💵 {paymentSettings.defaultPaymentMethod}</span>
                            </label>

                            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              selectedPaymentMode === 'Online Payment (UPI / Bank Transfer)' 
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              <input
                                type="radio"
                                name="payment_mode"
                                value="Online Payment (UPI / Bank Transfer)"
                                checked={selectedPaymentMode === 'Online Payment (UPI / Bank Transfer)'}
                                onChange={() => setSelectedPaymentMode('Online Payment (UPI / Bank Transfer)')}
                                className="accent-emerald-700"
                              />
                              <span className="text-xs">📲 Online Payment (UPI / QR / Bank)</span>
                            </label>
                          </div>

                          {selectedPaymentMode === 'Online Payment (UPI / Bank Transfer)' && (
                            <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-800 space-y-3">
                              <h5 className="font-extrabold text-xs text-[#C5A059] flex items-center gap-1.5">
                                💳 Online Payment Gateway & Transfer Details
                              </h5>
                              <div className="text-[11px] space-y-1.5 text-slate-200 font-mono">
                                {paymentSettings.upiId && <div><strong>UPI ID:</strong> {paymentSettings.upiId}</div>}
                                {paymentSettings.phonePeNumber && <div><strong>PhonePe:</strong> {paymentSettings.phonePeNumber}</div>}
                                {paymentSettings.googlePayNumber && <div><strong>GPay:</strong> {paymentSettings.googlePayNumber}</div>}
                                {paymentSettings.bankName && <div><strong>Bank Name:</strong> {paymentSettings.bankName}</div>}
                                {paymentSettings.bankAccountName && <div><strong>Account Holder:</strong> {paymentSettings.bankAccountName}</div>}
                                {paymentSettings.bankAccountNumber && <div><strong>Account No:</strong> {paymentSettings.bankAccountNumber}</div>}
                                {paymentSettings.ifscCode && <div><strong>IFSC Code:</strong> {paymentSettings.ifscCode}</div>}
                              </div>

                              {paymentSettings.qrCodeUrl && (
                                <div className="pt-2 border-t border-emerald-800 text-center">
                                  <img src={paymentSettings.qrCodeUrl} alt="Payment QR" className="w-32 h-32 mx-auto rounded-xl border border-white/20 bg-white p-1" />
                                  <span className="text-[10px] text-slate-300 block mt-1">Scan QR Code to Pay</span>
                                </div>
                              )}

                              {paymentSettings.additionalInstructions && (
                                <p className="text-[10px] text-emerald-200 italic pt-1 border-t border-emerald-800/60">
                                  {paymentSettings.additionalInstructions}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      id="btn-confirm-checkout"
                      className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg transition-colors text-sm"
                    >
                      Confirm Order & Place Request
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order History & Invoices */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-700" /> My Orders ({orders.length})
              </h3>

              {orderDeleteSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{orderDeleteSuccess}</span>
                </div>
              )}

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium italic">No active or previous orders found.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                          {o.orderNumber}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          o.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-700">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="font-bold">₹{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400">Total:</span>{' '}
                          <strong className="text-slate-900 text-sm">₹{o.totalAmount.toLocaleString('en-IN')}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => printInvoice(o)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Invoice
                          </button>
                          {(o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed') && (
                            <button
                              onClick={() => setDeleteConfirmOrder(o)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Inquiry to Farm Owner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-700" /> Send Inquiry to Farm Owner
              </h3>

              {msgSentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Your message has been sent directly to the Farm Owner!
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={msgSubject}
                    onChange={e => setMsgSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bulk Livestock Purchase">Bulk Livestock Purchase</option>
                    <option value="Super Napier Fodder Order">Super Napier Fodder Order</option>
                    <option value="Vaccination & Health Question">Vaccination & Health Question</option>
                    <option value="Farm Visit Request">Farm Visit Request</option>
                    <option value="Custom Order Request">Custom Order Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Type your message or inquiry here..."
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>

          </div>

        </div>
        )}

        {/* Profile Photo Preview Modal */}
        {showPreviewModal && previewUrl && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full border border-emerald-500/30 shadow-2xl overflow-hidden p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-950 rounded-xl border border-emerald-500/40 text-emerald-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Profile Picture Preview</h3>
                    <p className="text-xs text-slate-400">Preview & confirm your photo before saving</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Display Frame with fitMode toggle */}
              <div className="space-y-3">
                <div className="relative w-44 h-44 rounded-3xl bg-slate-950 border-2 border-emerald-500/60 shadow-2xl overflow-hidden flex items-center justify-center mx-auto group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-300`}
                  />
                  
                  {/* Mode Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/90 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 uppercase">
                    {fitMode}
                  </div>
                </div>

                {/* Display Mode Switcher */}
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Display Style:</span>
                  <button
                    type="button"
                    onClick={() => setFitMode('cover')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${fitMode === 'cover' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    Crop to Frame (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitMode('contain')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${fitMode === 'contain' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    Fit Entire Photo (Contain)
                  </button>
                </div>

                {/* File Details Grid */}
                {previewStats && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Dimensions</span>
                      <span className="font-bold text-emerald-300">{previewStats.width} × {previewStats.height} px</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Aspect Ratio</span>
                      <span className="font-bold text-emerald-300">{previewStats.aspectRatio}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">File Size</span>
                      <span className="font-bold text-emerald-300">{previewStats.fileSizeMB}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors">
                  Choose Different Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={handleSaveProfileAvatar}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Optimizing & Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Profile Photo
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Remove Photo Confirmation Modal */}
        {showRemoveConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-red-500/30 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 bg-red-950 rounded-2xl border border-red-500/40">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Remove Profile Photo?</h3>
                  <p className="text-xs text-slate-400">Revert to standard default initials avatar</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete your profile picture? This will remove your custom photo and revert your customer profile avatar to your default initials.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemovePhoto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Order Confirmation Modal */}
        {deleteConfirmOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Delete Order</h3>
                  <p className="text-xs text-slate-500 font-medium">Order #{deleteConfirmOrder.orderNumber}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
                <div><strong>Items:</strong> {deleteConfirmOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</div>
                <div><strong>Total Amount:</strong> ₹{deleteConfirmOrder.totalAmount.toLocaleString('en-IN')}</div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Are you sure you want to delete this order? This action cannot be undone.
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
                  <Trash2 className="w-3.5 h-3.5" /> Delete Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
