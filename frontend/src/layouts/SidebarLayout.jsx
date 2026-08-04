import React, { useContext, useState, useCallback } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  LayoutDashboard, Clock, Layers, Users, UserCheck,
  FolderTree, Tag, MapPin, Shield, BarChart3, Settings,
  AlertCircle, HelpCircle, LogOut, Search, User, X, Menu, Archive, Star, CreditCard, Bell
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard',        icon: LayoutDashboard, section: 'main' },
  { name: 'Pending Approvals',icon: Clock,           section: 'main', badgeType: 'approvals' },
  { name: 'Verification Requests', icon: Shield,     section: 'main', badgeType: 'verifications' },
  { name: 'Animals',          icon: Layers,          section: 'main' },
  { name: 'History',          icon: Archive,         section: 'main' },
  { name: 'Sellers',          icon: Users,           section: 'main' },
  { name: 'Buyers',           icon: UserCheck,       section: 'main' },
  { name: 'Push Notification Manager', icon: Bell,    section: 'notifications' },
  { name: 'Subscription Dashboard', icon: BarChart3, section: 'monetization' },
  { name: 'Subscription Plans', icon: CreditCard,   section: 'monetization' },
  { name: 'Subscribers',       icon: UserCheck,      section: 'monetization' },
  { name: 'Categories',       icon: FolderTree,      section: 'catalog' },
  { name: 'Breeds',           icon: Tag,             section: 'catalog' },
  { name: 'Locations',        icon: MapPin,          section: 'catalog' },
  { name: 'Complaints',       icon: AlertCircle,     section: 'system' },
  { name: 'App Reviews',      icon: Star,            section: 'system' },
  { name: 'Audit Logs',       icon: Shield,          section: 'system' },
  { name: 'Reports',          icon: BarChart3,       section: 'system' },
  { name: 'Settings',         icon: Settings,        section: 'system' },
  { name: 'Error Pages Demo', icon: AlertCircle,     section: 'system' },
];

const SECTIONS = [
  { key: 'main',          label: 'Overview' },
  { key: 'notifications', label: 'Push Notifications' },
  { key: 'monetization',  label: 'Subscriptions' },
  { key: 'catalog',       label: 'Master Data' },
  { key: 'system',        label: 'System' },
];

export default function SidebarLayout({ children }) {
  const {
    currentView,
    setCurrentView,
    animals,
    pendingVerificationCount,
    dashboardStats,
    adminDetails,
    logoutAdmin,
    triggerConfirm,
    globalSearchQuery,
    setGlobalSearchQuery,
    serverStatus
  } = useContext(AdminContext);

  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = animals.filter((a) => a.status === 'pending' && !a.isDeleted).length;
  const pendingVerificationsCount = dashboardStats?.kpis?.pendingVerificationRequests ?? pendingVerificationCount ?? 0;

  const handleNav = useCallback((name) => {
    setCurrentView(name);
    setGlobalSearchQuery('');
    setMobileOpen(false); // Close sidebar on nav (mobile support)
  }, [setCurrentView, setGlobalSearchQuery]);

  return (
    <div className="sidebar-layout">

      {/* ── Mobile Sidebar Overlay Backdrop ───────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 190,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease both',
          }}
        />
      )}

      {/* ── Sidebar Panel ─────────────────────────────────────────────── */}
      <aside className={`sidebar-aside ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo-box">
              <Layers size={18} color="#fff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="sidebar-brand-text" style={{ fontSize: 14.5, fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>
                PASHUSETU
              </span>
              <span className="sidebar-brand-subtitle" style={{ fontSize: 10, color: '#475569', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                Admin Console
              </span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', display: 'none', padding: 4
            }}
            className="sidebar-menu-btn"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map((section) => {
            const items = NAV_ITEMS.filter((i) => i.section === section.key);
            return (
              <div key={section.key} style={{ marginBottom: 8 }}>
                <p className="sidebar-section-title">{section.label}</p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.name;
                  
                  let badge = 0;
                  if (item.badgeType === 'approvals') {
                    badge = pendingCount;
                  } else if (item.badgeType === 'verifications') {
                    badge = pendingVerificationsCount;
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNav(item.name)}
                      className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.name}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={17} style={{ flexShrink: 0 }} />
                        <span className="sidebar-nav-label" style={{ fontSize: 13, lineHeight: 1 }}>{item.name}</span>
                      </span>
                      {badge > 0 && (
                        <span className="sidebar-badge">{badge > 99 ? '99+' : badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile Card & Sign out */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {/* User Profile */}
          <div className="sidebar-profile-card">
            <div className="avatar-container">
              <AdminAvatar src={adminDetails.photo} />
              <div className="avatar-status-dot" title="Online" />
            </div>
            <div className="sidebar-profile-details" style={{ minWidth: 0 }}>
              <span style={{
                display: 'block', fontSize: 13, color: '#f8fafc',
                fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {adminDetails.name}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 1 }}>
                {adminDetails.role}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => triggerConfirm('Logout', null, 'End your active administration session?', () => logoutAdmin())}
            className="sidebar-signout-btn"
            aria-label="Sign out session"
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            <span className="sidebar-nav-label" style={{ fontSize: 13 }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>

        {/* Top Header */}
        <header className="top-header" style={{
          height: 60,
          backgroundColor: '#fff',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: '0 1px 0 var(--border-color)',
          gap: 16,
        }}>
          {/* Hamburger toggle + Search bar wrap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', maxWidth: 460 }}>
            {/* Hamburger button on mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-main)', padding: 6, display: 'none',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', transition: 'background-color 0.2s',
              }}
              className="sidebar-menu-btn"
              aria-label="Open navigation menu"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu size={18} />
            </button>

            {/* Search */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: searchFocused ? 'var(--color-primary)' : 'var(--text-light)',
                  transition: 'color 0.2s',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="input input-search"
                style={{ paddingLeft: 34, paddingRight: globalSearchQuery ? 34 : 12, height: 36 }}
                placeholder="Search listings, sellers, buyers…"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Global search"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className="btn-ghost btn-icon"
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 4 }}
                  aria-label="Clear search"
                >
                  <X size={12} color="var(--text-muted)" />
                </button>
              )}
            </div>
          </div>

          {/* Right rail controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => setCurrentView('Help Center')}
              className="btn-ghost btn-icon"
              title="Help Center"
              aria-label="Help Center"
              style={{ padding: 6 }}
            >
              <HelpCircle size={18} color="var(--text-muted)" />
            </button>

            <div style={{ width: 1, height: 20, backgroundColor: 'var(--border-color)' }} />

            {/* Server status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: serverStatus === 'Connected' ? 'var(--color-primary)' : 'var(--color-danger)',
                boxShadow: serverStatus === 'Connected'
                  ? '0 0 0 2px rgba(22,163,74,0.2)'
                  : '0 0 0 2px rgba(239,68,68,0.2)',
                transition: 'background-color 0.3s, box-shadow 0.3s',
              }} />
              <span className="sidebar-nav-label" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {serverStatus === 'Connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="main-content-container" style={{ flex: 1, padding: '24px 24px 36px', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminAvatar({ src }) {
  const [error, setError] = React.useState(false);
  const style = {
    width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
    flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.08)',
  };
  if (error || !src) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' }}>
        <User size={14} color="#64748b" />
      </div>
    );
  }
  return <img src={src} style={style} onError={() => setError(true)} alt="" aria-hidden="true" />;
}
