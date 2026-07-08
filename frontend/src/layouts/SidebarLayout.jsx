import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  LayoutDashboard,
  Clock,
  Layers,
  Users,
  UserCheck,
  FolderTree,
  Tag,
  MapPin,
  Shield,
  BarChart3,
  Settings,
  AlertCircle,
  HelpCircle,
  LogOut,
  Search,
  User
} from 'lucide-react';

export default function SidebarLayout({ children }) {
  const {
    currentView,
    setCurrentView,
    animals,
    adminDetails,
    setIsAdminLoggedIn,
    triggerConfirm,
    globalSearchQuery,
    setGlobalSearchQuery,
    serverStatus
  } = useContext(AdminContext);

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Pending Approvals', icon: Clock, badge: animals.filter((a) => a.status === 'pending').length },
    { name: 'Animals', icon: Layers },
    { name: 'Sellers', icon: Users },
    { name: 'Buyers', icon: UserCheck },
    { name: 'Categories', icon: FolderTree },
    { name: 'Breeds', icon: Tag },
    { name: 'Locations', icon: MapPin },
    { name: 'Audit Logs', icon: Shield },
    { name: 'Reports', icon: BarChart3 },
    { name: 'Settings', icon: Settings },
    { name: 'Error Pages Demo', icon: AlertCircle }
  ];

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar Panel */}
      <aside style={{ width: 260, backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ backgroundColor: 'var(--bg-sidebar-active)', padding: 6, borderRadius: 'var(--radius-sm)' }}>
            <Layers size={24} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: '800', color: '#fff', tracking: '0.5px' }}>PASHUSETU</span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-light)', fontWeight: '600' }}>Admin Console</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setCurrentView(item.name);
                  setGlobalSearchQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: '600',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{ backgroundColor: 'var(--color-danger)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Image src={adminDetails.photo} style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div>
              <span style={{ display: 'block', fontSize: 13, color: '#fff', fontWeight: '700' }}>{adminDetails.name}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-light)' }}>{adminDetails.role}</span>
            </div>
          </div>
          <button
            onClick={() => triggerConfirm('Logout', null, 'Are you sure you want to end your active administration session?', () => setIsAdminLoggedIn(false))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: '700'
            }}
          >
            <LogOut size={16} />
            <span>Session Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Contents Panel Wrap */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        <header style={{ height: 72, backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justify: 'space-between', paddingHorizontal: 24, position: 'sticky', top: 0, zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '40%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                style={{
                  width: '100%',
                  height: 40,
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  paddingLeft: 40,
                  paddingRight: 16,
                  fontSize: 14,
                  outline: 'none'
                }}
                placeholder="Global search listings, sellers, buyers..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setCurrentView('Help Center')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Help Center"
            >
              <HelpCircle size={22} />
            </button>
            <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: '600' }}>
                {serverStatus === 'Connected' ? 'Server Connected' : 'Server Offline'}
              </span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: serverStatus === 'Connected' ? 'var(--color-primary)' : 'var(--color-danger)' }} />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Image({ src, style }) {
  const [error, setError] = React.useState(false);
  if (error || !src) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
        <User size={18} color="#64748b" />
      </div>
    );
  }
  return <img src={src} style={style} onError={() => setError(true)} alt="" />;
}
