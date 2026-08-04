import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { db } from './lib/db';
import { Navbar } from './components/Navbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { ProductsPage } from './pages/ProductsPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { WorkerDashboard } from './pages/dashboards/WorkerDashboard';
import { CustomerDashboard } from './pages/dashboards/CustomerDashboard';

import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';

const MainContent: React.FC = () => {
  const { role, user, logout } = useAuth();
  
  // Initialize page state based on URL parameters or path
  const [activePage, setActivePage] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const qPage = params.get('page');
    if (qPage && ['home', 'about', 'animals', 'products', 'gallery', 'contact', 'login', 'register', 'admin', 'worker', 'customer', 'dashboard'].includes(qPage)) {
      return qPage;
    }
    const path = window.location.pathname.toLowerCase().replace('/', '');
    if (['home', 'about', 'animals', 'products', 'gallery', 'contact', 'login', 'register', 'admin', 'worker', 'customer', 'dashboard'].includes(path)) {
      return path;
    }
    return 'home';
  });

  const [dashboardTab, setDashboardTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'overview';
  });

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qTab = params.get('tab') || 'overview';
      if (qPage) {
        setActivePage(qPage);
        setDashboardTab(qTab);
      } else {
        const path = window.location.pathname.toLowerCase().replace('/', '');
        if (['home', 'about', 'animals', 'products', 'gallery', 'contact', 'login', 'register', 'admin', 'worker', 'customer', 'dashboard'].includes(path)) {
          setActivePage(path);
        } else {
          setActivePage('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-redirect user upon login or unauthorized portal navigation
  useEffect(() => {
    if (user) {
      if (activePage === 'login' || activePage === 'register') {
        const targetPortal = role === 'admin' ? 'admin' : role === 'worker' ? 'worker' : 'customer';
        setActivePage(targetPortal);
        setDashboardTab('overview');
      } else if ((activePage === 'admin' || activePage === 'owner/dashboard') && role !== 'admin') {
        console.warn('Unauthorized access attempt to Owner Portal. Signing out.');
        logout();
        setActivePage('home');
      } else if ((activePage === 'worker' || activePage === 'worker/dashboard') && role !== 'worker') {
        console.warn('Unauthorized access attempt to Worker Portal. Signing out.');
        logout();
        setActivePage('home');
      } else if ((activePage === 'customer' || activePage === 'customer/dashboard') && role !== 'customer') {
        console.warn('Unauthorized access attempt to Customer Portal. Signing out.');
        logout();
        setActivePage('home');
      }
    }
  }, [user, role, activePage, logout]);

  // Synchronize browser navigation smoothly
  const handleNavigatePage = (page: string) => {
    setActivePage(page);
    try {
      const newUrl = page === 'home' ? '/' : `/?page=${page}`;
      window.history.pushState({ page }, '', newUrl);
    } catch {
      // fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTab = (tab: string) => {
    setDashboardTab(tab);
    try {
      const newUrl = `/?page=${activePage}&tab=${tab}`;
      window.history.pushState({ page: activePage, tab }, '', newUrl);
    } catch {
      // fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderAdminPortal = () => {
    if (!user) {
      return (
        <LoginPage
          initialTab="admin"
          onSuccess={() => {
            setActivePage('dashboard');
            setDashboardTab('overview');
          }}
          onNavigateRegister={() => handleNavigatePage('register')}
        />
      );
    }

    if (role !== 'admin' && role !== 'owner') {
      return (
        <AccessDeniedScreen
          message={`Access Denied. You are logged in as a ${role === 'worker' ? 'Farm Worker' : 'Customer'}. The Owner/Admin Portal is strictly restricted to authorized Administrators.`}
          onGoHome={() => handleNavigatePage('home')}
          onGoLogin={() => {
            logout();
            handleNavigatePage('login');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        activeTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    );
  };

  const renderWorkerPortal = () => {
    if (!user) {
      return (
        <LoginPage
          initialTab="worker"
          onSuccess={() => {
            setActivePage('dashboard');
            setDashboardTab('overview');
          }}
          onNavigateRegister={() => handleNavigatePage('register')}
        />
      );
    }

    if (role !== 'worker') {
      return (
        <AccessDeniedScreen
          message={`Access Denied. You are logged in as a ${role === 'admin' ? 'Owner/Admin' : 'Customer'}. The Farm Worker Portal is strictly restricted to registered Workers.`}
          onGoHome={() => handleNavigatePage('home')}
          onGoLogin={() => {
            logout();
            handleNavigatePage('login');
          }}
        />
      );
    }

    const map = db.getStaffApprovalMap();
    const deleted = db.getDeletedStaff();

    const isDeleted = deleted.includes(user.fullName);
    const isMapApproved = map[user.fullName] === true;
    const isMapDisapproved = map[user.fullName] === false;

    if (isDeleted || isMapDisapproved || user.status === 'Inactive' || user.status === 'Suspended' || user.status === 'Rejected') {
      return (
        <AccessDeniedScreen
          message="Your farm worker account is inactive or access has been removed by farm management."
          onGoHome={() => handleNavigatePage('home')}
          onGoLogin={() => {
            logout();
            handleNavigatePage('login');
          }}
        />
      );
    }

    if (!isMapApproved && (user.status === 'Pending Approval' || !user.isApproved)) {
      return (
        <PendingApprovalScreen
          pendingUser={user}
          onGoHome={() => handleNavigatePage('home')}
        />
      );
    }

    return (
      <WorkerDashboard
        activeTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    );
  };

  const renderCustomerPortal = () => {
    if (!user) {
      return (
        <LoginPage
          initialTab="customer"
          onSuccess={() => {
            setActivePage('dashboard');
            setDashboardTab('overview');
          }}
          onNavigateRegister={() => handleNavigatePage('register')}
        />
      );
    }

    if (role !== 'customer') {
      return (
        <AccessDeniedScreen
          message={`Access Denied. You are logged in as a ${role === 'admin' ? 'Owner/Admin' : 'Farm Worker'}. The Customer Portal is strictly restricted to Customer accounts.`}
          onGoHome={() => handleNavigatePage('home')}
          onGoLogin={() => {
            logout();
            handleNavigatePage('login');
          }}
        />
      );
    }

    return (
      <CustomerDashboard
        activeTab={dashboardTab}
        onTabChange={setDashboardTab}
        onNavigatePage={handleNavigatePage}
      />
    );
  };

  const renderDashboard = () => {
    if (!user) {
      return (
        <LoginPage
          initialTab="customer"
          onSuccess={() => {
            setActivePage('dashboard');
            setDashboardTab('overview');
          }}
          onNavigateRegister={() => handleNavigatePage('register')}
        />
      );
    }

    if (role === 'admin') return renderAdminPortal();
    if (role === 'worker') return renderWorkerPortal();
    return renderCustomerPortal();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage setActivePage={handleNavigatePage} />;
      case 'about':
        return <AboutPage />;
      case 'animals':
        return <AnimalsPage />;
      case 'products':
        return <ProductsPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'contact':
        return <ContactPage />;
      case 'login': {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = (urlParams.get('tab') as 'admin' | 'worker' | 'customer') || 'customer';
        return (
          <LoginPage
            initialTab={urlTab}
            onSuccess={() => {
              setActivePage('dashboard');
              setDashboardTab('overview');
            }}
            onNavigateRegister={() => handleNavigatePage('register')}
          />
        );
      }
      case 'register':
        return (
          <RegisterPage
            onSuccess={() => {
              setActivePage('dashboard');
              setDashboardTab('overview');
            }}
            onNavigateLogin={() => handleNavigatePage('login')}
          />
        );
      case 'admin':
        return renderAdminPortal();
      case 'worker':
        return renderWorkerPortal();
      case 'customer':
        return renderCustomerPortal();
      case 'dashboard':
        return renderDashboard();
      default:
        return <HomePage setActivePage={handleNavigatePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#04140E] text-[#F2F2ED] farm-gradient antialiased selection:bg-[#C5A059] selection:text-slate-950">
      
      {/* Sticky Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigatePage}
        dashboardTab={dashboardTab}
        setDashboardTab={handleNavigateTab}
      />

      {/* Interactive Breadcrumb Navigation & Back to Dashboard Control */}
      <Breadcrumbs
        activePage={activePage}
        dashboardTab={dashboardTab}
        onNavigatePage={handleNavigatePage}
        onNavigateTab={handleNavigateTab}
      />

      {/* Main Page Body with 200ms Smooth Transition */}
      <main className="flex-1 transition-opacity duration-300 ease-in-out">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer
        setActivePage={handleNavigatePage}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainContent />
      </CartProvider>
    </AuthProvider>
  );
}
