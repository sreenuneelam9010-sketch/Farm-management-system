import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  KeyRound, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerificationModal } from '../components/EmailVerificationModal';

interface AuthPageProps {
  initialTab?: 'admin' | 'worker' | 'customer';
  initialMode?: 'login' | 'register';
  initialAccessDenied?: string | null;
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
  onNavigateLogin?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialTab = 'customer',
  initialMode = 'login',
  initialAccessDenied = null,
  onSuccess
}) => {
  const { loginWithEmail, registerCustomer, registerWorker } = useAuth();

  // Active Tab: 'admin' | 'worker' | 'customer'
  const [activeTab, setActiveTab] = useState<'admin' | 'worker' | 'customer'>(initialTab);
  // Active Mode: 'login' | 'register'
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(initialMode);

  // Common Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarId, setAadhaarId] = useState('');

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI Feedback States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(initialAccessDenied || null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Quick tab switch
  const handleTabChange = (tab: 'admin' | 'worker' | 'customer') => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
    setAccessDeniedMsg(null);
    setPendingApprovalNotice(null);
    if (tab === 'admin') {
      setActiveMode('login'); // Admins cannot register publicly
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAccessDeniedMsg(null);
    setPendingApprovalNotice(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithEmail(email, password, activeTab);
      
      if (res.accessDenied) {
        setAccessDeniedMsg(res.message || 'Access Denied. You are not an authorized farm administrator.');
      } else if (res.pendingApproval) {
        setPendingApprovalNotice(res.message || 'Your worker account is pending approval by farm management.');
      } else if (!res.success) {
        setError(res.message || 'Incorrect password. Please try again.');
      } else {
        setSuccessMsg(res.message || 'Signed in successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Worker Registration
  const handleWorkerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !password || !mobileNumber.trim() || !address.trim()) {
      setError('Please complete all required fields (*).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWorker({
        fullName,
        email,
        password,
        mobileNumber,
        address,
        aadhaarId
      });

      if (res.success) {
        setPendingApprovalNotice(res.message || 'Worker registration submitted! Please verify your email before logging in. Your account is pending approval by farm management.');
        setActiveMode('login');
      } else {
        setError(res.message || 'Worker registration failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Customer Registration
  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields (*).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerCustomer({
        fullName,
        email,
        password,
        mobileNumber,
        address
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Please verify your email before logging in.');
        setActiveMode('login');
      } else {
        setError(res.message || 'Customer registration failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-[#04140E] min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full dark-glass-card border border-[#C5A059]/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#062C1E] border border-[#C5A059]/40 rounded-2xl mb-1 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#C5A059]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-wide">
            Lakshmi Venkateshwara Portal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md mx-auto">
            Secure Supabase Authentication for Owners, Farm Workers & Valued Customers
          </p>
        </div>

        {/* 3 Main Role Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#062C1E] border border-[#C5A059]/30 rounded-2xl">
          
          {/* Tab 1: Owner / Admin */}
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-3 px-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#04140E]/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Owner / Admin</span>
          </button>

          {/* Tab 2: Farm Worker */}
          <button
            type="button"
            onClick={() => handleTabChange('worker')}
            className={`py-3 px-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'worker'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#04140E]/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Farm Worker</span>
          </button>

          {/* Tab 3: Customer */}
          <button
            type="button"
            onClick={() => handleTabChange('customer')}
            className={`py-3 px-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'customer'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#04140E]/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Customer</span>
          </button>

        </div>

        {/* Toggle Login / Register for Worker and Customer */}
        {activeTab !== 'admin' && (
          <div className="flex items-center justify-center gap-2 border-b border-[#C5A059]/20 pb-4">
            <button
              type="button"
              onClick={() => { setActiveMode('login'); setError(null); }}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeMode === 'login'
                  ? 'bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/50 shadow-sm'
                  : 'text-emerald-200/60 hover:text-white'
              }`}
            >
              Log In
            </button>
            <span className="text-emerald-200/30">|</span>
            <button
              type="button"
              onClick={() => { setActiveMode('register'); setError(null); }}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeMode === 'register'
                  ? 'bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/50 shadow-sm'
                  : 'text-emerald-200/60 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>
        )}

        {/* Notices & Alerts */}
        {accessDeniedMsg && (
          <div className="p-4 bg-red-950/90 border border-red-500/60 text-red-200 rounded-2xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{accessDeniedMsg}</span>
            </div>
            <p className="text-xs text-red-200/80 leading-relaxed pl-7">
              Please select the correct portal tab above (Owner / Admin, Farm Worker, or Customer) corresponding to your registered account type.
            </p>
          </div>
        )}

        {pendingApprovalNotice && (
          <div className="p-4 bg-[#062C1E] border border-[#C5A059] text-[#F2F2ED] rounded-2xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-[#C5A059]">
              <Clock className="w-5 h-5 flex-shrink-0 text-[#C5A059] animate-pulse" />
              <span>Farm Worker Account Pending Approval</span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              {pendingApprovalNotice}
            </p>
            <div className="pt-2 text-[11px] text-emerald-300 font-mono">
              ⚡ Status: Pending Owner Review | Dispatched to: admin@farm.com
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* TAB 1: OWNER / ADMIN LOGIN FORM */}
        {activeTab === 'admin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-[#062C1E]/80 p-3.5 rounded-2xl border border-[#C5A059]/30 text-xs text-emerald-200/80 space-y-1">
              <div className="font-bold text-[#C5A059] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Restricted Founder Access
              </div>
              <p className="text-[11px] leading-relaxed">
                Enter your authorized founder email address and password to sign into the Admin Management Panel.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Owner Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@farm.com / subbaiah@farm.com / sreenivasulu@farm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#C5A059] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#C5A059] hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Owner Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Log In as Owner / Admin
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: FARM WORKER FORM */}
        {activeTab === 'worker' && activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Worker Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="worker@farm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#C5A059] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#C5A059] hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Worker Login...
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" /> Log In as Farm Worker
                </>
              )}
            </button>
          </form>
        )}

        {/* WORKER REGISTRATION */}
        {activeTab === 'worker' && activeMode === 'register' && (
          <form onSubmit={handleWorkerRegisterSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-[#062C1E] border border-[#C5A059]/30 rounded-2xl text-xs text-emerald-200/80">
              📌 Note: Farm worker registrations require mandatory manual review and approval by farm owners before login access is granted.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                Worker Email Address *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="worker@farm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                Residential Address *
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Devarajapalli Village, Kamalapuram Mandal, Kadapa"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#C5A059] hover:text-white transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-[#C5A059] hover:text-white transition-colors"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Submit Worker Application for Approval
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: CUSTOMER FORM */}
        {activeTab === 'customer' && activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Customer Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="customer@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#C5A059] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-2xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#C5A059] hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In Customer...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Log In as Customer
                </>
              )}
            </button>
          </form>
        )}

        {/* CUSTOMER REGISTRATION */}
        {activeTab === 'customer' && activeMode === 'register' && (
          <form onSubmit={handleCustomerRegisterSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                Customer Email Address *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#C5A059] hover:text-white transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-[#C5A059] hover:text-white transition-colors"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#C5A059] uppercase mb-1">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#04140E] border border-[#C5A059]/30 rounded-xl text-xs text-[#F2F2ED] focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering Customer Account...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Register Customer Account
                </>
              )}
            </button>
          </form>
        )}

        {/* Forgot Password Modal */}
        <EmailVerificationModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
          onSuccess={(msg) => setSuccessMsg(msg)}
        />

      </div>
    </div>
  );
};
