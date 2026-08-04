import React from 'react';
import { ChevronRight, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BreadcrumbsProps {
  activePage: string;
  dashboardTab: string;
  onNavigatePage: (page: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  activePage,
  dashboardTab,
  onNavigatePage,
  onNavigateTab
}) => {
  const { user, role } = useAuth();

  if (!user) return null;

  const getRoleDashboardLabel = () => {
    if (role === 'admin') return 'Admin Dashboard';
    if (role === 'worker') return 'Worker Dashboard';
    return 'Customer Dashboard';
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'animals': return 'Animals Tagging';
      case 'products': return 'Product Catalog';
      case 'orders': return role === 'customer' ? 'My Orders' : 'Orders & Sales';
      case 'inventory': return 'Feed & Inventory';
      case 'finance': return 'Income & Expenses';
      case 'workers': return 'Staff & Tasks';
      case 'messages': return 'Messages';
      case 'media': return 'Media & Storage';
      case 'settings': return 'Farm Settings';
      case 'tasks': return 'My Tasks';
      case 'attendance': return 'Daily Attendance';
      case 'feed_health': return 'Feed & Health Log';
      case 'leaves': return 'Leave Management';
      case 'notifications': return 'Notifications';
      case 'profile': return 'Profile';
      case 'cart': return 'Shopping Cart';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  const getPageLabel = (page: string) => {
    switch (page) {
      case 'home': return 'Home';
      case 'about': return 'About Us';
      case 'animals': return 'Animals Tagging';
      case 'products': return 'Products Catalog';
      case 'gallery': return 'Farm Gallery';
      case 'contact': return 'Contact & Inquiry';
      case 'dashboard': return getRoleDashboardLabel();
      default: return page.charAt(0).toUpperCase() + page.slice(1);
    }
  };

  const isRootDashboard = activePage === 'dashboard' && (dashboardTab === 'overview' || !dashboardTab);

  return (
    <div className="bg-[#062C1E]/90 border-b border-[#C5A059]/20 text-[#F2F2ED] text-xs py-2.5 px-4 sm:px-6 shadow-sm sticky top-[73px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Breadcrumb Path */}
        <nav className="flex items-center gap-1.5 font-bold overflow-x-auto py-0.5 text-slate-300">
          <button
            onClick={() => {
              onNavigatePage('dashboard');
              onNavigateTab('overview');
            }}
            className="flex items-center gap-1 text-[#C5A059] hover:text-white transition-colors shrink-0"
            title="Go to Dashboard Overview"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {activePage !== 'dashboard' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-white font-extrabold">{getPageLabel(activePage)}</span>
            </>
          )}

          {activePage === 'dashboard' && dashboardTab && dashboardTab !== 'overview' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-white font-extrabold">{getTabLabel(dashboardTab)}</span>
            </>
          )}
        </nav>

        {/* Back to Dashboard Button */}
        {!isRootDashboard && (
          <button
            onClick={() => {
              onNavigatePage('dashboard');
              onNavigateTab('overview');
            }}
            className="px-3 py-1 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black text-[11px] rounded-lg shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}

      </div>
    </div>
  );
};
