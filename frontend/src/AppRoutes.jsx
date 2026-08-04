import React, { useContext, lazy, Suspense, useEffect, useState } from 'react';
import { AdminContext } from './context/AdminContext';
import SidebarLayout from './layouts/SidebarLayout';
import ConfirmModal from './components/ConfirmModal';
import RejectionModal from './components/RejectionModal';
import DetailsModal from './components/DetailsModal';
import LoginPage from './pages/LoginPage';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Search } from 'lucide-react';

// Lazy Load Pages
const DashboardPage        = lazy(() => import('./pages/DashboardPage'));
const PendingApprovalsPage = lazy(() => import('./pages/PendingApprovalsPage'));
const AnimalsPage          = lazy(() => import('./pages/AnimalsPage'));
const HistoryPage          = lazy(() => import('./pages/HistoryPage'));
const SellersPage          = lazy(() => import('./pages/SellersPage'));
const BuyersPage           = lazy(() => import('./pages/BuyersPage'));
const CategoriesPage       = lazy(() => import('./pages/CategoriesPage'));
const BreedsPage           = lazy(() => import('./pages/BreedsPage'));
const LocationsPage        = lazy(() => import('./pages/LocationsPage'));
const ComplaintsPage       = lazy(() => import('./pages/ComplaintsPage'));
const AuditLogsPage        = lazy(() => import('./pages/AuditLogsPage'));
const ReportsPage          = lazy(() => import('./pages/ReportsPage'));
const SettingsPage         = lazy(() => import('./pages/SettingsPage'));
const HelpCenterPage       = lazy(() => import('./pages/HelpCenterPage'));
const ErrorPagesDemo       = lazy(() => import('./pages/ErrorPagesDemo'));
const VerificationRequestsPage = lazy(() => import('./pages/VerificationRequestsPage'));
const ReviewsPage           = lazy(() => import('./pages/ReviewsPage'));
const SubscriptionDashboardPage = lazy(() => import('./pages/SubscriptionDashboardPage'));
const SubscriptionPlansPage = lazy(() => import('./pages/SubscriptionPlansPage'));
const SubscribersPage      = lazy(() => import('./pages/SubscribersPage'));
const NotificationsPage    = lazy(() => import('./pages/NotificationsPage'));

// Page skeleton while lazy chunk loads
function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
      <div className="skeleton" style={{ height: 28, width: 220 }} />
      <div className="skeleton" style={{ height: 14, width: 340 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {[1,2,3,4].map((i) => (
          <div key={i} className="skeleton" style={{ flex: '1 1 180px', height: 96, borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}

// Toast icon map
function ToastIcon({ type }) {
  const size = 16;
  if (type === 'error')   return <AlertCircle   size={size} />;
  if (type === 'warning') return <AlertTriangle size={size} />;
  if (type === 'info')    return <Info          size={size} />;
  return <CheckCircle2 size={size} />;
}

// Individual animated toast
function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 220);
  };

  const bgMap = {
    success: '#0f172a',
    error:   'var(--color-danger)',
    warning: '#b45309',
    info:    'var(--color-info)',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 12px 16px',
        backgroundColor: bgMap[toast.type] || bgMap.success,
        color: '#fff',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        fontSize: 13.5, fontWeight: '600',
        minWidth: 260, maxWidth: 380,
        animation: exiting
          ? 'toastOut 0.22s ease forwards'
          : 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        willChange: 'transform, opacity',
      }}
    >
      <ToastIcon type={toast.type} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', padding: 2,
          display: 'flex', alignItems: 'center',
          borderRadius: 4,
          transition: 'color 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function AppRoutes() {
  const {
    isAdminLoggedIn,
    isAuthReady,
    currentView,
    toasts,
    confirmModal,
    setConfirmModal,
    handleExecuteConfirm,
    rejectionModal,
    setRejectionModal,
    handleRejectListing,
    detailsModal,
    setDetailsModal,
    triggerConfirm,
    handleApproveListing,
    globalSearchQuery,
    setCurrentView,
    setGlobalSearchQuery,
    animals,
    sellers,
    buyers,
    categories,
    breeds,
  } = useContext(AdminContext);

  // Track dismissed toasts for exit animation
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const handleDismiss = (id) => setDismissedIds((prev) => new Set([...prev, id]));

  const visibleToasts = toasts.filter((t) => !dismissedIds.has(t.id));

  const getGlobalSearchResults = () => {
    if (!globalSearchQuery.trim()) return null;
    const q = globalSearchQuery.toLowerCase();
    return {
      animals:    animals.filter((a) => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)),
      sellers:    sellers.filter((s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)),
      buyers:     buyers.filter((b) => b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q)),
      categories: categories.filter((c) => c.name?.toLowerCase().includes(q)),
      breeds:     breeds.filter((b) => b.name?.toLowerCase().includes(q)),
    };
  };

  const searchResults = getGlobalSearchResults();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'Dashboard':         return <DashboardPage />;
      case 'Pending Approvals': return <PendingApprovalsPage />;
      case 'Verification Requests': return <Suspense fallback={<PageSkeleton />}><VerificationRequestsPage /></Suspense>;
      case 'Subscription Dashboard': return <Suspense fallback={<PageSkeleton />}><SubscriptionDashboardPage /></Suspense>;
      case 'Subscription Plans': return <Suspense fallback={<PageSkeleton />}><SubscriptionPlansPage /></Suspense>;
      case 'Subscribers':       return <Suspense fallback={<PageSkeleton />}><SubscribersPage /></Suspense>;
      case 'Animals':           return <AnimalsPage />;
      case 'History':           return <Suspense fallback={<PageSkeleton />}><HistoryPage /></Suspense>;
      case 'Sellers':           return <SellersPage />;
      case 'Buyers':            return <BuyersPage />;
      case 'Categories':        return <CategoriesPage />;
      case 'Breeds':            return <BreedsPage />;
      case 'Locations':         return <LocationsPage />;
      case 'Complaints':        return <Suspense fallback={<PageSkeleton />}><ComplaintsPage /></Suspense>;
      case 'App Reviews':       return <Suspense fallback={<PageSkeleton />}><ReviewsPage /></Suspense>;
      case 'Push Notification Manager':
      case 'Push Notifications': return <Suspense fallback={<PageSkeleton />}><NotificationsPage /></Suspense>;
      case 'Audit Logs':        return <AuditLogsPage />;
      case 'Reports':           return <ReportsPage />;
      case 'Settings':          return <SettingsPage />;
      case 'Help Center':       return <HelpCenterPage />;
      case 'Error Pages Demo':  return <ErrorPagesDemo />;
      default:                  return <DashboardPage />;
    }
  };

  // Auth readiness gate
  if (!isAuthReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <PageSkeleton />
      </div>
    );
  }

  // Protected Routes Check
  if (!isAdminLoggedIn) {
    return <LoginPage />;
  }

  return (
    <SidebarLayout>

      {/* ── Toast Stack ─────────────────────────────────────────────── */}
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 8,
          pointerEvents: 'none',
        }}
      >
        {visibleToasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast toast={t} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ConfirmModal
        modalState={confirmModal}
        onClose={() => setConfirmModal({ visible: false, type: '', data: null, message: '', action: null })}
        onExecute={handleExecuteConfirm}
      />

      <RejectionModal
        modalState={rejectionModal}
        onClose={() => setRejectionModal({ visible: false, data: null, reason: '' })}
        onExecute={handleRejectListing}
        onChangeReason={(reason) => setRejectionModal({ ...rejectionModal, reason })}
      />

      <DetailsModal
        modalState={detailsModal}
        onClose={() => setDetailsModal({ visible: false, data: null })}
        onApprove={(animal) => {
          setDetailsModal({ visible: false, data: null });
          triggerConfirm('Approve', animal, `Approve and publish "${animal.title}" to the live marketplace?`, () => handleApproveListing(animal));
        }}
        onReject={(animal) => {
          setDetailsModal({ visible: false, data: null });
          setRejectionModal({ visible: true, data: animal, reason: '' });
        }}
      />

      {/* ── Global Search Results ────────────────────────────────────── */}
      {globalSearchQuery.trim() !== '' ? (
        <div style={{ animation: 'fadeInScale 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="page-header">
            <div>
              <h2 className="page-title">Search Results</h2>
              <p className="page-subtitle">Matches for "{globalSearchQuery}"</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setGlobalSearchQuery('')}
            >
              <X size={13} /> Clear Search
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {searchResults?.animals?.length > 0 && (
              <div className="card-flat" style={{ padding: '16px 20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Animals ({searchResults.animals.length})
                </h4>
                {searchResults.animals.map((a) => (
                  <div key={a.id} style={{
                    padding: '10px 0', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.15s',
                  }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 14 }}>
                      {a.title}
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: '400' }}>
                        ₹{(a.price || 0).toLocaleString('en-IN')}
                      </span>
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setCurrentView('Animals'); setGlobalSearchQuery(''); }}
                    >
                      View Listings
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults?.sellers?.length > 0 && (
              <div className="card-flat" style={{ padding: '16px 20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Sellers ({searchResults.sellers.length})
                </h4>
                {searchResults.sellers.map((s) => (
                  <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 14 }}>
                      {s.name}
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: '400' }}>{s.email}</span>
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentView('Sellers'); setGlobalSearchQuery(''); }}>
                      View Sellers
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(!searchResults || (searchResults.animals.length === 0 && searchResults.sellers.length === 0)) && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search size={24} color="var(--text-muted)" />
                </div>
                <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
                  No results found
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                  Try different keywords or check for typos.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Suspense fallback={<PageSkeleton />}>
          <div key={currentView} className="page-enter">
            {renderCurrentView()}
          </div>
        </Suspense>
      )}
    </SidebarLayout>
  );
}
