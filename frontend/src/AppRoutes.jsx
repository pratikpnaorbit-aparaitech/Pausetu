import React, { useContext, lazy, Suspense } from 'react';
import { AdminContext } from './context/AdminContext';
import SidebarLayout from './layouts/SidebarLayout';
import ConfirmModal from './components/ConfirmModal';
import RejectionModal from './components/RejectionModal';
import DetailsModal from './components/DetailsModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Lazy Load Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PendingApprovalsPage = lazy(() => import('./pages/PendingApprovalsPage'));
const AnimalsPage = lazy(() => import('./pages/AnimalsPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const BuyersPage = lazy(() => import('./pages/BuyersPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BreedsPage = lazy(() => import('./pages/BreedsPage'));
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const ErrorPagesDemo = lazy(() => import('./pages/ErrorPagesDemo'));

export default function AppRoutes() {
  const {
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
    breeds
  } = useContext(AdminContext);

  const getGlobalSearchResults = () => {
    if (!globalSearchQuery.trim()) return null;
    const query = globalSearchQuery.toLowerCase();
    return {
      animals: animals.filter((a) => a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)),
      sellers: sellers.filter((s) => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)),
      buyers: buyers.filter((b) => b.name.toLowerCase().includes(query) || b.email.toLowerCase().includes(query)),
      categories: categories.filter((c) => c.name.toLowerCase().includes(query)),
      breeds: breeds.filter((b) => b.name.toLowerCase().includes(query))
    };
  };

  const searchResults = getGlobalSearchResults();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Pending Approvals':
        return <PendingApprovalsPage />;
      case 'Animals':
        return <AnimalsPage />;
      case 'Sellers':
        return <SellersPage />;
      case 'Buyers':
        return <BuyersPage />;
      case 'Categories':
        return <CategoriesPage />;
      case 'Breeds':
        return <BreedsPage />;
      case 'Locations':
        return <LocationsPage />;
      case 'Audit Logs':
        return <AuditLogsPage />;
      case 'Reports':
        return <ReportsPage />;
      case 'Settings':
        return <SettingsPage />;
      case 'Help Center':
        return <HelpCenterPage />;
      case 'Error Pages Demo':
        return <ErrorPagesDemo />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SidebarLayout>
      {/* Toast Alert Overlays */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 20px',
              backgroundColor: t.type === 'error' ? 'var(--color-danger)' : 'var(--bg-sidebar)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: '600',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        modalState={confirmModal}
        onClose={() => setConfirmModal({ visible: false, type: '', data: null, message: '', action: null })}
        onExecute={handleExecuteConfirm}
      />

      {/* Rejection Modal */}
      <RejectionModal
        modalState={rejectionModal}
        onClose={() => setRejectionModal({ visible: false, data: null, reason: '' })}
        onExecute={handleRejectListing}
        onChangeReason={(reason) => setRejectionModal({ ...rejectionModal, reason })}
      />

      {/* View Details Review Modal */}
      <DetailsModal
        modalState={detailsModal}
        onClose={() => setDetailsModal({ visible: false, data: null })}
        onApprove={(animal) => {
          setDetailsModal({ visible: false, data: null });
          triggerConfirm('Approve', animal, `Approve and release "${animal.title}" to public listings?`, () => handleApproveListing(animal));
        }}
        onReject={(animal) => {
          setDetailsModal({ visible: false, data: null });
          setRejectionModal({ visible: true, data: animal, reason: '' });
        }}
      />

      {/* Global Search Results Page View */}
      {globalSearchQuery.trim() !== '' ? (
        <div style={{ padding: 24, animation: 'fadeIn 0.2s' }}>
          <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 8px' }}>Global Search Results</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Showing matches for "{globalSearchQuery}"</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {searchResults && searchResults.animals.length > 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: '700' }}>Matched Animals ({searchResults.animals.length})</h3>
                {searchResults.animals.map((a) => (
                  <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{a.title} (Price: ₹{a.price.toLocaleString()})</span>
                    <button onClick={() => { setCurrentView('Animals'); setGlobalSearchQuery(''); }} style={{ color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700' }}>Go to listings</button>
                  </div>
                ))}
              </div>
            )}
            {searchResults && searchResults.sellers.length > 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: '700' }}>Matched Sellers ({searchResults.sellers.length})</h3>
                {searchResults.sellers.map((s) => (
                  <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{s.name} ({s.email})</span>
                    <button onClick={() => { setCurrentView('Sellers'); setGlobalSearchQuery(''); }} style={{ color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700' }}>Go to Sellers</button>
                  </div>
                ))}
              </div>
            )}
            {(!searchResults || (searchResults.animals.length === 0 && searchResults.sellers.length === 0)) && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No matches found for your search query.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Suspense fallback={<div style={{ padding: 24, fontSize: 14, color: 'var(--text-muted)' }}>Loading page...</div>}>
          {renderCurrentView()}
        </Suspense>
      )}
    </SidebarLayout>
  );
}
