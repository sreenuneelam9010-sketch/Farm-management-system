import React, { useState } from 'react';
import { User, Order } from '../../types';
import { db, FarmInfo } from '../../lib/db';
import { storageService } from '../../lib/storage';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Package, 
  Heart, 
  Lock, 
  Camera, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Edit3, 
  Save, 
  RefreshCw,
  Building,
  Navigation,
  ExternalLink
} from 'lucide-react';

interface CustomerProfileProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  user,
  onUpdateProfile,
  onLogout,
  onNavigateTab
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    mobileNumber: user.mobileNumber || user.mobile || '',
    email: user.email || '',
    address: user.address || '',
    city: user.city || 'Kamalapuram',
    state: user.state || 'Andhra Pradesh',
    pincode: user.pincode || '516289',
    avatarUrl: user.avatarUrl || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [farmInfo, setFarmInfo] = useState<FarmInfo>(() => db.getFarmInfo());

  // Favourites state stored in localStorage
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`lvf_favs_${user.id}`);
      return saved ? JSON.parse(saved) : ['Sheep Breed - Jodipi', 'Natu Kolla Chicks'];
    } catch {
      return ['Sheep Breed - Jodipi', 'Natu Kolla Chicks'];
    }
  });

  // Calculate Order statistics
  const orders: Order[] = db.getOrders().filter(o => 
    o.customerMobile === user.mobileNumber || o.customerMobile === user.mobile || o.customerName === user.fullName
  );
  
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Processing'].includes(o.orderStatus)).length;
  const completedOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled').length;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const url = await storageService.uploadAvatar(file, user.id);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      onUpdateProfile({ avatarUrl: url });
      setSuccessMsg('✅ Profile photo updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    onUpdateProfile({ avatarUrl: '' });
    setSuccessMsg('✅ Profile photo removed.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const mobileRegex = /^[0-9]{10}$/;
    const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    onUpdateProfile({
      fullName: formData.fullName.trim(),
      mobileNumber: cleanMobile,
      mobile: cleanMobile,
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      avatarUrl: formData.avatarUrl
    });

    setIsEditing(false);
    setSuccessMsg('✅ Profile updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passwordForm.newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setSuccessMsg('✅ Password changed successfully.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordSection(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const removeFavourite = (item: string) => {
    const updated = favourites.filter(f => f !== item);
    setFavourites(updated);
    localStorage.setItem(`lvf_favs_${user.id}`, JSON.stringify(updated));
  };

  const initials = formData.fullName
    ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CU';

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Profile Header Banner */}
      <div className="bg-[#062C1E] border-2 border-[#C5A059] rounded-3xl p-6 sm:p-8 text-[#F2F2ED] shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-[#C5A059] shadow-inner flex items-center justify-center overflow-hidden">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-[#C5A059] font-mono">{initials}</span>
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-[#F2F2ED]">{formData.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-extrabold rounded-full uppercase">
                Customer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-mono">
              <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {formData.email}
            </p>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> +91 {formData.mobileNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
          {formData.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Photo
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 text-xs font-black rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-900/90 border border-emerald-500 text-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-2 shadow animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950 border border-rose-500 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2 shadow animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Personal Info & Order Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Personal Information & Edit Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-700" /> Personal Information
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                ID: {user.id}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Number * (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.mobileNumber}
                      onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Door No, Street Name, Area..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Customer ID (Read-only)</span>
                  <span className="font-mono text-slate-900 font-extrabold">{user.id}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Registration Date</span>
                  <span className="font-mono text-slate-900 font-extrabold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Active Member'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Mobile Number</span>
                  <span className="font-mono text-slate-900 font-extrabold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    +91 {formData.mobileNumber}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Email Address</span>
                  <span className="font-mono text-slate-900 font-extrabold flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    {formData.email}
                  </span>
                </div>

                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Delivery Address
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {formData.address || 'No default address set. Click Edit Profile to add your delivery address.'}
                  </p>
                  <p className="text-slate-500 text-[11px] font-mono mt-1">
                    {formData.city}, {formData.state} - {formData.pincode}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Information & Shopping Shortcuts */}
        <div className="lg:col-span-5 space-y-6">

          {/* Order Summary Stats */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-700" /> Order Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-xs font-bold text-emerald-800 block">Total Orders</span>
                <span className="text-2xl font-black text-emerald-950 font-mono">{totalOrders}</span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-xs font-bold text-amber-800 block">Active Orders</span>
                <span className="text-2xl font-black text-amber-950 font-mono">{activeOrders}</span>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <span className="text-xs font-bold text-blue-800 block">Completed</span>
                <span className="text-2xl font-black text-blue-950 font-mono">{completedOrders}</span>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-xs font-bold text-rose-800 block">Cancelled</span>
                <span className="text-2xl font-black text-rose-950 font-mono">{cancelledOrders}</span>
              </div>
            </div>
          </div>

          {/* Shopping Shortcuts & History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" /> Shopping & History
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigateTab && onNavigateTab('cart')}
                className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl font-extrabold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">🛒 Active Shopping Cart</span>
                <span className="px-2.5 py-1 bg-emerald-700 text-white rounded-full text-[10px]">View Cart</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl font-extrabold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">📦 Previous Orders & History</span>
                <span className="text-slate-400 font-mono font-bold">{totalOrders} Orders</span>
              </button>
            </div>

            {/* Optional Favourite Products */}
            <div className="pt-2">
              <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Favourite Products
              </h4>

              {favourites.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No favourite products saved yet.</p>
              ) : (
                <div className="space-y-2">
                  {favourites.map((fav, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{fav}</span>
                      <button
                        onClick={() => removeFavourite(fav)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Farm Location Details Card */}
          <div className="bg-emerald-900 text-white p-6 rounded-3xl border border-emerald-700/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif-brand font-bold flex items-center gap-2 text-emerald-100">
                <MapPin className="w-5 h-5 text-[#C5A059]" /> {farmInfo.farmName} Location
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#C5A059] text-slate-950 px-2.5 py-1 rounded-full">
                Visit Us
              </span>
            </div>
            <a
              href={farmInfo.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-100 hover:text-[#C5A059] font-medium leading-relaxed block hover:underline transition-colors"
              title="Click to view on Google Maps"
            >
              📍 {farmInfo.address}
            </a>
            <div className="pt-2">
              <a
                href={farmInfo.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-customer-profile-view-location"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-transform active:scale-95 cursor-pointer"
              >
                View Farm Location <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Account Security & Password */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" /> Account Security
            </h3>

            {!showPasswordSection ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600 font-medium">Keep your account secure by updating your password regularly.</span>
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {onLogout && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={onLogout}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout Account
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
