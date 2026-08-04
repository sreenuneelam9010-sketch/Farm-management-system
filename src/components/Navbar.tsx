import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { BrandLogo } from './BrandLogo';
import { db } from '../lib/db';
import { getFounderAvatarUrl } from '../lib/storage';
import { 
  Phone, 
  ShoppingBag, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldAlert, 
  LogOut, 
  ShieldCheck,
  UserCheck,
  Briefcase,
  Crown,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  dashboardTab?: string;
  setDashboardTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  dashboardTab = 'overview',
  setDashboardTab
}) => {
  const { user, role, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      if (!user) {
        setUnreadChatCount(0);
        return;
      }
      const convs = db.getChatConversations();
      if (role === 'admin') {
        const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCountAdmin || 0), 0);
        setUnreadChatCount(totalUnread);
      } else if (role === 'customer') {
        const myConv = convs.find(c => c.customerId === user.id || c.id === `conv-${user.id}`);
        setUnreadChatCount(myConv ? (myConv.unreadCountCustomer || 0) : 0);
      } else {
        setUnreadChatCount(0);
      }
    };

    updateUnreadCount();
    window.addEventListener('lvf_chat_updated', updateUnreadCount);
    window.addEventListener('storage', updateUnreadCount);
    const interval = setInterval(updateUnreadCount, 2000);

    return () => {
      window.removeEventListener('lvf_chat_updated', updateUnreadCount);
      window.removeEventListener('storage', updateUnreadCount);
      clearInterval(interval);
    };
  }, [user, role]);

  const publicNavLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    ...(role !== 'customer' ? [{ name: 'Animals', id: 'animals' }] : []),
    { name: 'Products', id: 'products' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'Contact', id: 'contact' },
  ];

  // Role-specific navigation items according to requirements
  const adminMenuItems = [
    { name: 'Dashboard', page: 'dashboard', tab: 'overview' },
    { name: 'Orders & Sales', page: 'dashboard', tab: 'orders' },
    { name: 'Feed & Inventory', page: 'dashboard', tab: 'inventory' },
    { name: 'Income & Expenses', page: 'dashboard', tab: 'finance' },
    { name: 'Staff & Tasks', page: 'dashboard', tab: 'workers' },
    { name: 'Messages', page: 'dashboard', tab: 'messages' },
    { name: 'Media & Storage', page: 'dashboard', tab: 'media' },
    { name: 'Settings', page: 'dashboard', tab: 'settings' },
    { name: 'Profile', page: 'dashboard', tab: 'profile' },
  ];

  const workerMenuItems = [
    { name: 'Dashboard', page: 'dashboard', tab: 'overview' },
    { name: 'Daily Tasks', page: 'dashboard', tab: 'tasks' },
    { name: 'Attendance', page: 'dashboard', tab: 'attendance' },
    { name: 'Feed & Health Log', page: 'dashboard', tab: 'feed_health' },
    { name: 'Leave Management', page: 'dashboard', tab: 'leaves' },
    { name: 'Messages', page: 'dashboard', tab: 'messages' },
    { name: 'Profile', page: 'dashboard', tab: 'profile' },
  ];

  const customerMenuItems = [
    { name: 'Dashboard', page: 'dashboard', tab: 'overview' },
    { name: 'Shopping Cart', page: 'dashboard', tab: 'cart' },
    { name: 'My Orders', page: 'dashboard', tab: 'orders' },
    { name: 'Chat with Farm', page: 'dashboard', tab: 'messages' },
    { name: 'Profile', page: 'dashboard', tab: 'profile' },
  ];

  const getRoleMenuItems = () => {
    if (role === 'admin') return adminMenuItems;
    if (role === 'worker') return workerMenuItems;
    return customerMenuItems;
  };

  const handleNavClick = (pageId: string, tabId: string = 'overview') => {
    setActivePage(pageId);
    if (setDashboardTab) {
      setDashboardTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  const isMenuItemActive = (itemPage: string, itemTab: string) => {
    if (activePage !== itemPage) return false;
    if (itemPage === 'dashboard') {
      return dashboardTab === itemTab;
    }
    return true;
  };

  const getRoleLabel = () => {
    if (role === 'admin') return { label: 'Owner / Admin', icon: Crown, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (role === 'worker') return { label: 'Farm Worker', icon: Briefcase, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    return { label: 'Customer', icon: UserCheck, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
  };

  const roleMeta = getRoleLabel();
  const RoleIcon = roleMeta.icon;
  const roleMenuItems = getRoleMenuItems();

  return (
    <header className="sticky top-0 z-40 bg-[#04140E]/95 backdrop-blur-md text-[#F2F2ED] border-b border-[#C5A059]/20 shadow-2xl transition-all duration-300">
      {/* Top Banner Bar */}
      <div className="bg-[#062C1E] text-xs py-2 px-4 sm:px-6 border-b border-[#C5A059]/20 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2.5 items-center text-center">
          
          {/* Item 1: Farm Name */}
          <div className="flex items-center justify-center md:justify-start gap-1.5 font-bold text-[#F2F2ED] tracking-wide">
            <span className="text-sm shrink-0">🐑</span>
            <span>Lakshmi Venkateshwara Sheep & Natu Kolla Farm</span>
          </div>

          {/* Item 2: Farm Specialization */}
          <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-200 tracking-wide">
            <span className="text-sm shrink-0">🌿</span>
            <span>Authentic Local Sheep & Free-Range Natu Kollu</span>
          </div>

          {/* Item 3: Primary Contact */}
          <div className="flex items-center justify-center md:justify-end gap-1.5 font-bold text-[#C5A059] tracking-wide">
            <Phone className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <a
              href="tel:+919502756669"
              className="hover:text-white transition-colors flex items-center gap-1"
              title="Primary Contact: N. Ramachandraiah"
            >
              <span>Primary Contact: N. Ramachandraiah – 9502756669</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand - Always returns to user's dashboard if logged in */}
          <div 
            onClick={() => handleNavClick(user ? 'dashboard' : 'home', 'overview')} 
            className="cursor-pointer transition-transform active:scale-95"
          >
            <BrandLogo variant="horizontal" showTagline={false} size={44} />
          </div>

          {/* Public Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {publicNavLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                  activePage === link.id
                    ? 'bg-[#C5A059] text-slate-950 shadow-lg font-black'
                    : 'text-[#F2F2ED]/80 hover:text-[#C5A059] hover:bg-[#062C1E]'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Dashboard Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Cart Button */}
            <button
              onClick={() => handleNavClick(user && role === 'customer' ? 'dashboard' : 'products', user && role === 'customer' ? 'cart' : 'overview')}
              className="relative p-2.5 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] rounded-xl transition-all border border-[#C5A059]/30 active:scale-95"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C5A059] text-slate-950 text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Direct In-App Chat Button for logged-in Users (Customer/Admin) */}
            {user && role !== 'worker' && (
              <button
                onClick={() => handleNavClick('dashboard', 'messages')}
                className="relative p-2.5 bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] rounded-xl transition-all border border-[#C5A059]/30 active:scale-95"
                title="Direct Farm Chat"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Authenticated User Session Badge & Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                
                {/* User Profile Avatar Link */}
                <button
                  onClick={() => handleNavClick('dashboard', 'profile')}
                  className="relative p-0.5 rounded-full border-2 border-[#C5A059] hover:scale-105 transition-all cursor-pointer shadow-md overflow-hidden"
                  title="View Profile"
                >
                  <img
                    src={getFounderAvatarUrl(user.id, user.fullName, user.avatarUrl)}
                    alt={user.fullName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>

                {/* User Role Badge */}
                <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold ${roleMeta.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{user.fullName.split(' ')[0]} ({roleMeta.label})</span>
                </div>

                <button
                  onClick={() => handleNavClick('dashboard', 'overview')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 active:scale-95 ${
                    activePage === 'dashboard'
                      ? 'bg-[#C5A059] text-slate-950 font-black'
                      : 'bg-[#062C1E] hover:bg-[#093d29] text-[#C5A059] border border-[#C5A059]/40'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Dashboard
                </button>

                <button
                  onClick={logout}
                  className="p-2 bg-[#062C1E] hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-xl transition-all border border-slate-800 active:scale-95 flex items-center gap-1 text-xs font-bold"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-3.5 py-2 bg-transparent hover:bg-[#062C1E] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#C5A059] transition-all active:scale-95"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="px-3.5 py-2 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all active:scale-95"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#C5A059] hover:text-white rounded-xl bg-[#062C1E] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Secondary Menu Bar (Desktop) */}
      {user && (
        <div className="hidden lg:block bg-[#020b08] border-t border-[#C5A059]/20 px-4 py-1.5 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto text-xs py-1 scrollbar-none">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]/80 px-2 shrink-0 border-r border-[#C5A059]/20 mr-1">
              {roleMeta.label} Menu:
            </span>
            {roleMenuItems.map((item, idx) => {
              const active = isMenuItemActive(item.page, item.tab);
              return (
                <button
                  key={idx}
                  onClick={() => handleNavClick(item.page, item.tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#C5A059] text-slate-950 font-black shadow-md scale-105'
                      : 'text-[#F2F2ED]/70 hover:text-white hover:bg-[#062C1E]'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
            <button
              onClick={logout}
              className="ml-auto px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#04140E] border-b border-[#C5A059]/30 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {user && (
            <div className="pb-3 border-b border-[#C5A059]/20 space-y-2">
              <div className="text-[10px] uppercase tracking-widest font-black text-[#C5A059]">
                {roleMeta.label} Portal Navigation
              </div>
              <div className="grid grid-cols-2 gap-2">
                {roleMenuItems.map((item, idx) => {
                  const active = isMenuItemActive(item.page, item.tab);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavClick(item.page, item.tab)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                        active ? 'bg-[#C5A059] text-slate-950 font-black' : 'text-[#F2F2ED] bg-[#062C1E] hover:bg-[#093d29]'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-1 pt-1">
              Public Pages
            </div>
            {publicNavLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold ${
                  activePage === link.id ? 'bg-[#C5A059] text-slate-950 font-black' : 'text-[#F2F2ED] hover:bg-[#062C1E]'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {user && (
            <div className="pt-3 border-t border-[#C5A059]/20 flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#C5A059]">
                {user.fullName} ({roleMeta.label})
              </span>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="px-3 py-1.5 bg-rose-950 text-rose-300 rounded-lg text-xs font-bold border border-rose-500/30 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
