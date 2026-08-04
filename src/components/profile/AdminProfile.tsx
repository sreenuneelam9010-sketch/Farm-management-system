import React, { useState, useEffect } from 'react';
import { User, Animal, Product, Order } from '../../types';
import { db, FarmInfo, FarmDescriptionLog } from '../../lib/db';
import { storageService, getFounderAvatarUrl } from '../../lib/storage';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Sparkles, 
  Boxes, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Lock, 
  Bell, 
  Camera, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Save, 
  RefreshCw,
  Award,
  Navigation,
  ExternalLink,
  Locate,
  Globe,
  X,
  Clock,
  History,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AdminProfileProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => void;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({
  user,
  onUpdateProfile
}) => {
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingFarm, setIsEditingFarm] = useState(false);

  const [farmInfo, setFarmInfo] = useState<FarmInfo>(() => db.getFarmInfo());
  const [isEditingDescOnly, setIsEditingDescOnly] = useState(false);
  const [descInput, setDescInput] = useState(farmInfo.farmDescription);
  const [showDescLogs, setShowDescLogs] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = db.getFarmInfo();
      setFarmInfo(updated);
      setDescInput(updated.farmDescription);
    };
    window.addEventListener('farm_info_updated', handleUpdate);
    return () => window.removeEventListener('farm_info_updated', handleUpdate);
  }, []);

  const [personalForm, setPersonalForm] = useState({
    fullName: user.fullName || 'Neelam Ramachandraiah',
    mobileNumber: user.mobileNumber || user.mobile || '9502756669',
    email: user.email || 'ramachandraiah@lakshmifarm.com',
    avatarUrl: user.avatarUrl || ''
  });

  const [farmForm, setFarmForm] = useState({
    farmName: user.farmName || 'Lakshmi Venkateshwara Sheep & Natu Kolla Farm',
    farmDescription: user.farmDescription || 'Lakshmi Venkateshwara Sheep & Natu Kolla Farm is dedicated to breeding and supplying healthy Local Jodipi Sheep and Free-Range Natu Kolla. We follow natural farming practices and focus on quality livestock, animal welfare, customer satisfaction, and sustainable farming.',
    village: user.village || 'Devarajapalli Village',
    mandal: user.mandal || 'Kamalapuram Mandal',
    district: user.district || 'YSR Kadapa District',
    state: user.state || 'Andhra Pradesh',
    pincode: user.pincode || '516289',
    country: user.country || 'India',
    googleMapsUrl: user.googleMapsUrl || 'https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute Dashboard Metrics
  const animals: Animal[] = db.getAnimals();
  const products: Product[] = db.getProducts();
  const orders: Order[] = db.getOrders();
  const users: User[] = db.getUsers();

  const totalAnimals = animals.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalWorkers = users.filter(u => u.role === 'worker').length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const url = await storageService.uploadAvatar(file, user.id);
      setPersonalForm(prev => ({ ...prev, avatarUrl: url }));
      onUpdateProfile({ avatarUrl: url });
      setSuccessMsg('✅ Profile photo updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPersonalForm(prev => ({ ...prev, avatarUrl: '' }));
    onUpdateProfile({ avatarUrl: '' });
    setSuccessMsg('✅ Profile photo removed.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const mobileRegex = /^[0-9]{10}$/;
    const cleanMobile = personalForm.mobileNumber.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalForm.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    onUpdateProfile({
      fullName: personalForm.fullName.trim(),
      mobileNumber: cleanMobile,
      mobile: cleanMobile,
      email: personalForm.email.trim(),
      avatarUrl: personalForm.avatarUrl
    });

    setIsEditingPersonal(false);
    setSuccessMsg('✅ Profile updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFarmForm(prev => ({
          ...prev,
          googleMapsUrl: mapsUrl
        }));
        setGettingLocation(false);
        setSuccessMsg('📍 Location coordinates captured for Google Maps URL.');
        setTimeout(() => setSuccessMsg(null), 3000);
      },
      (error) => {
        setGettingLocation(false);
        setErrorMsg(`Could not fetch location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const handleSaveDescOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanDesc = descInput.trim();
    if (!cleanDesc) {
      setErrorMsg('Farm Description cannot be empty.');
      return;
    }

    if (cleanDesc.length > 1000) {
      setErrorMsg('Farm Description cannot exceed 1000 characters.');
      return;
    }

    const updaterName = user.fullName || user.username || user.email || 'Owner / Admin';
    const updated = db.saveFarmInfo({ farmDescription: cleanDesc }, updaterName);
    onUpdateProfile({ farmDescription: cleanDesc });
    setFarmInfo(updated);
    setFarmForm(prev => ({ ...prev, farmDescription: cleanDesc }));
    setIsEditingDescOnly(false);
    setSuccessMsg('✅ Farm Description updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCancelDescOnly = () => {
    setDescInput(farmInfo.farmDescription);
    setIsEditingDescOnly(false);
    setErrorMsg(null);
  };

  const handleSaveFarm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!farmForm.farmName.trim()) {
      setErrorMsg('Farm Name is required.');
      return;
    }

    if (!farmForm.farmDescription.trim()) {
      setErrorMsg('Farm Description cannot be empty.');
      return;
    }

    if (farmForm.farmDescription.length > 1000) {
      setErrorMsg('Farm Description cannot exceed 1000 characters.');
      return;
    }

    if (!farmForm.village.trim() || !farmForm.district.trim() || !farmForm.state.trim()) {
      setErrorMsg('Village, District, and State are required for Address & Location.');
      return;
    }

    const constructedAddress = [
      farmForm.village.trim(),
      farmForm.mandal.trim(),
      farmForm.district.trim(),
      farmForm.state.trim() ? `${farmForm.state.trim()}${farmForm.pincode.trim() ? ` - ${farmForm.pincode.trim()}` : ''}` : '',
      farmForm.country.trim()
    ].filter(Boolean).join(', ');

    const updaterName = user.fullName || user.username || user.email || 'Owner / Admin';
    const cleanDesc = farmForm.farmDescription.trim();

    const updated = db.saveFarmInfo({
      farmName: farmForm.farmName.trim(),
      farmDescription: cleanDesc,
      address: constructedAddress,
      village: farmForm.village.trim(),
      mandal: farmForm.mandal.trim(),
      district: farmForm.district.trim(),
      state: farmForm.state.trim(),
      pincode: farmForm.pincode.trim(),
      country: farmForm.country.trim(),
      googleMapsUrl: farmForm.googleMapsUrl.trim()
    }, updaterName);

    onUpdateProfile({
      farmName: farmForm.farmName.trim(),
      farmDescription: cleanDesc,
      address: constructedAddress,
      village: farmForm.village.trim(),
      mandal: farmForm.mandal.trim(),
      district: farmForm.district.trim(),
      state: farmForm.state.trim(),
      pincode: farmForm.pincode.trim(),
      country: farmForm.country.trim(),
      googleMapsUrl: farmForm.googleMapsUrl.trim()
    });

    setFarmInfo(updated);
    setIsEditingFarm(false);
    setSuccessMsg('✅ Farm Description updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCancelFarmEdit = () => {
    const farmInfo = db.getFarmInfo();
    setFarmForm({
      farmName: user.farmName || farmInfo.farmName,
      farmDescription: user.farmDescription || farmInfo.farmDescription,
      village: user.village || farmInfo.village,
      mandal: user.mandal || farmInfo.mandal,
      district: user.district || farmInfo.district,
      state: user.state || farmInfo.state,
      pincode: user.pincode || farmInfo.pincode,
      country: user.country || farmInfo.country,
      googleMapsUrl: user.googleMapsUrl || farmInfo.googleMapsUrl
    });
    setIsEditingFarm(false);
    setErrorMsg(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
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

    setSuccessMsg('✅ Owner password updated successfully.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordSection(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const initials = personalForm.fullName
    ? personalForm.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'OW';

  const fullAddressDisplay = [
    farmForm.village,
    farmForm.mandal,
    farmForm.district,
    farmForm.state ? `${farmForm.state}${farmForm.pincode ? ` - ${farmForm.pincode}` : ''}` : '',
    farmForm.country
  ].filter(Boolean).join(', ') || user.address || 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289, India.';

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header Banner - Black & Gold Theme */}
      <div className="bg-[#062C1E] border-2 border-[#C5A059] rounded-3xl p-6 sm:p-8 text-[#F2F2ED] shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-[#C5A059] shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src={getFounderAvatarUrl(user.id, personalForm.fullName, personalForm.avatarUrl)}
                alt={personalForm.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-[#F2F2ED]">{personalForm.fullName}</h2>
              <span className="px-3 py-1 bg-[#C5A059] text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                Owner / Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-mono">
              <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {personalForm.email}
            </p>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> +91 {personalForm.mobileNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
          {personalForm.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Photo
            </button>
          )}

          <button
            onClick={() => setIsEditingPersonal(!isEditingPersonal)}
            className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 text-xs font-black rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> {isEditingPersonal ? 'Cancel Edit' : 'Edit Profile'}
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

      {/* Overview Statistics Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700" /> Farm Overview Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] font-bold text-emerald-800 block">Total Animals</span>
            <span className="text-xl font-black text-emerald-950 font-mono">{totalAnimals}</span>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-[11px] font-bold text-blue-800 block">Catalog Items</span>
            <span className="text-xl font-black text-blue-950 font-mono">{totalProducts}</span>
          </div>

          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
            <span className="text-[11px] font-bold text-purple-800 block">Total Orders</span>
            <span className="text-xl font-black text-purple-950 font-mono">{totalOrders}</span>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-800 block">Total Revenue</span>
            <span className="text-xl font-black text-amber-950 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <span className="text-[11px] font-bold text-indigo-800 block">Farm Workers</span>
            <span className="text-xl font-black text-indigo-950 font-mono">{totalWorkers}</span>
          </div>

          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl">
            <span className="text-[11px] font-bold text-teal-800 block">Customers</span>
            <span className="text-xl font-black text-teal-950 font-mono">{totalCustomers}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Personal & Farm Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Personal Information & Security */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-700" /> Owner Primary Contact & Personal Info
              </h3>
            </div>

            {isEditingPersonal ? (
              <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={personalForm.fullName}
                    onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })}
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
                      value={personalForm.mobileNumber}
                      onChange={e => setPersonalForm({ ...personalForm, mobileNumber: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={personalForm.email}
                      onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Primary Designation</span>
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> Farm Owner & Administrator
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Primary Contact Name</span>
                  <span className="font-extrabold text-slate-900">{personalForm.fullName}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Primary Mobile</span>
                  <span className="font-mono text-slate-900 font-extrabold">+91 {personalForm.mobileNumber}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Email Address</span>
                  <span className="font-mono text-slate-900 font-extrabold truncate">{personalForm.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Security & Password */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" /> Security & Password Settings
            </h3>

            {!showPasswordSection ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600 font-medium">Update your administrative credentials securely.</span>
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Change Owner Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
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
                    className="px-4 py-2 bg-emerald-700 text-white font-extrabold rounded-xl shadow"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Farm Branding & Business Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-700" /> Farm Branding & Business Details
              </h3>
              {!isEditingFarm ? (
                <button
                  onClick={() => setIsEditingFarm(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" /> Edit Details
                </button>
              ) : (
                <button
                  onClick={handleCancelFarmEdit}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            {isEditingFarm ? (
              <form onSubmit={handleSaveFarm} className="space-y-5 text-xs">

                {/* 1. Farm Name */}
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Farm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Farm Name"
                    value={farmForm.farmName}
                    onChange={e => setFarmForm({ ...farmForm, farmName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* 2. Farm Description with Live Character Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-extrabold text-slate-800">
                      Farm Description <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${farmForm.farmDescription.length >= 950 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {farmForm.farmDescription.length} / 1000 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    maxLength={1000}
                    placeholder="Describe your farm products, livestock, and business operations..."
                    value={farmForm.farmDescription}
                    onChange={e => setFarmForm({ ...farmForm, farmDescription: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-sm resize-y"
                  />
                </div>

                {/* 3. Address & Location Grid */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-700" /> Location Details
                    </h4>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Locate className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                      {gettingLocation ? 'Locating...' : 'Use Current Location'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Village / Colony <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Village name"
                        value={farmForm.village}
                        onChange={e => setFarmForm({ ...farmForm, village: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mandal / Tehsil</label>
                      <input
                        type="text"
                        placeholder="Mandal name"
                        value={farmForm.mandal}
                        onChange={e => setFarmForm({ ...farmForm, mandal: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">District <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="District name"
                        value={farmForm.district}
                        onChange={e => setFarmForm({ ...farmForm, district: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="State name"
                        value={farmForm.state}
                        onChange={e => setFarmForm({ ...farmForm, state: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        value={farmForm.pincode}
                        onChange={e => setFarmForm({ ...farmForm, pincode: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={farmForm.country}
                        onChange={e => setFarmForm({ ...farmForm, country: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Google Maps Location Link */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-600" /> Google Maps Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={farmForm.googleMapsUrl}
                      onChange={e => setFarmForm({ ...farmForm, googleMapsUrl: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Form Action Buttons: Edit / Save Changes / Cancel */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelFarmEdit}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#C5A059]" /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold block">Farm Name</span>
                  <span className="text-base font-black text-emerald-950">{farmForm.farmName}</span>
                </div>

                {/* Farm Description Section with Inline Edit, Validation, Counter, & Activity Log */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-emerald-700" /> Farm Description
                    </span>
                    {user.role === 'admin' && !isEditingDescOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setDescInput(farmInfo.farmDescription);
                          setIsEditingDescOnly(true);
                          setErrorMsg(null);
                        }}
                        className="px-3 py-1.5 bg-[#04140E] hover:bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        id="btn-edit-farm-description"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" /> ✏️ Edit
                      </button>
                    )}
                  </div>

                  {isEditingDescOnly ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          Edit Farm Description (Max 1000 characters)
                        </span>
                        <span className={`text-[11px] font-mono font-bold ${descInput.length >= 950 ? 'text-amber-600 font-extrabold' : 'text-slate-400'}`}>
                          {descInput.length} / 1000 characters
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={1000}
                        placeholder="Describe your farm products, livestock, and business operations..."
                        value={descInput}
                        onChange={e => setDescInput(e.target.value)}
                        className="w-full p-3.5 bg-white border-2 border-emerald-600 rounded-2xl font-medium text-slate-900 text-xs leading-relaxed outline-none shadow-inner focus:ring-2 focus:ring-emerald-500/20 resize-y"
                        autoFocus
                      />

                      {/* Edit Actions: 💾 Save Changes / ❌ Cancel */}
                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelDescOnly}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          ❌ Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDescOnly}
                          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          id="btn-save-farm-description"
                        >
                          <Save className="w-3.5 h-3.5 text-[#C5A059]" /> 💾 Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line text-xs bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        {farmInfo.farmDescription}
                      </p>

                      {/* Last Updated Timestamp & Updater */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold pt-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          Last updated: <strong className="text-slate-800">{formatDateTime(farmInfo.lastUpdatedDescriptionAt)}</strong>
                          {farmInfo.lastUpdatedDescriptionBy && (
                            <> by <strong className="text-slate-800">{farmInfo.lastUpdatedDescriptionBy}</strong></>
                          )}
                        </span>
                      </div>

                      {/* Activity Log Dropdown */}
                      {farmInfo.descriptionLogs && farmInfo.descriptionLogs.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => setShowDescLogs(!showDescLogs)}
                            className="w-full flex items-center justify-between text-[11px] font-bold text-emerald-900 hover:text-emerald-700 py-1 cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-[#C5A059]" />
                              📜 Description Activity Log ({farmInfo.descriptionLogs.length} updates)
                            </span>
                            {showDescLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {showDescLogs && (
                            <div className="mt-2.5 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {farmInfo.descriptionLogs.map((log) => (
                                <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-[11px] space-y-1.5">
                                  <div className="flex items-center justify-between text-slate-500 font-bold">
                                    <span>Updated by: <span className="text-emerald-950 font-extrabold">{log.updatedBy}</span></span>
                                    <span>{formatDateTime(log.timestamp)}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-slate-400 line-through bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                      {log.previousDescription}
                                    </div>
                                    <div className="text-slate-800 font-semibold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-emerald-950">
                                      {log.newDescription}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-slate-400 font-bold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Address & Location
                  </span>
                  <a
                    href={farmForm.googleMapsUrl || 'https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-800 hover:text-emerald-800 font-semibold leading-relaxed block hover:underline transition-colors"
                    title="Click to view location on Google Maps"
                  >
                    {fullAddressDisplay}
                  </a>

                  {farmForm.googleMapsUrl && (
                    <div className="pt-2 border-t border-slate-200">
                      <a
                        href={farmForm.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
                        id="btn-admin-profile-view-location"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" /> View Farm Location
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
