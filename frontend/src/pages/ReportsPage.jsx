import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { BarChart3, Download, FileText, Users } from 'lucide-react';

const REPORTS = [
  {
    id: 'animals',
    icon: BarChart3,
    title: 'Animals Report',
    description: 'Total listings, views aggregates, approval and rejection rates by category.',
    badge: 'Excel',
    badgeColor: '#16a34a',
    action: 'Animals Report Excel',
  },
  {
    id: 'users',
    icon: Users,
    title: 'Sellers & Buyers Report',
    description: 'Registrations, active locations, listing counts, and blocked accounts.',
    badge: 'PDF',
    badgeColor: '#ef4444',
    action: 'Users Report PDF',
  },
  {
    id: 'audit',
    icon: FileText,
    title: 'Audit Trail Export',
    description: 'Complete admin action log with timestamps, modules, and IP addresses.',
    badge: 'CSV',
    badgeColor: '#3b82f6',
    action: 'Audit Report CSV',
  },
];

export default function ReportsPage() {
  const { handleExport } = useContext(AdminContext);

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Statistical Reports</h2>
          <p className="page-subtitle">Generate and download data exports for offline analysis.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {REPORTS.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="card"
              style={{ padding: '22px 24px', animation: `slideUp 0.2s ${idx * 0.06}s both`, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${r.badgeColor}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={r.badgeColor} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: '800', padding: '3px 8px',
                  backgroundColor: `${r.badgeColor}18`,
                  color: r.badgeColor,
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.05em',
                }}>
                  {r.badge}
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: '700', color: 'var(--text-heading)' }}>
                  {r.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {r.description}
                </p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => typeof handleExport === 'function' && handleExport(r.action)}
              >
                <Download size={13} /> Generate {r.badge}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
