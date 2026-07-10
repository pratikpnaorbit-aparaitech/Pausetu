import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Shield, Search } from 'lucide-react';

const MODULE_COLORS = {
  Animals:    { bg: 'var(--color-primary-light)', text: '#15803d' },
  Sellers:    { bg: 'var(--color-info-light)',    text: 'var(--color-info)' },
  Buyers:     { bg: '#ede9fe',                    text: '#6d28d9' },
  Categories: { bg: 'var(--color-warning-light)', text: '#92400e' },
  System:     { bg: '#f3f4f6',                    text: 'var(--text-muted)' },
};

export default function AuditLogsPage() {
  const { auditLogs } = useContext(AdminContext);
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    return (
      !q ||
      log.adminName?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Audit Logs</h2>
          <p className="page-subtitle">{auditLogs.length} total admin actions recorded.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input input-search"
            style={{ paddingLeft: 34 }}
            type="text"
            placeholder="Search actions, modules, admins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ border: 'none' }}>
            <div className="empty-state-icon">
              <Shield size={24} color="var(--text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
              No audit logs
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Admin actions will be recorded here as they happen.
            </p>
          </div>
        ) : (
          <table className="resizable-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Module</th>
                <th>Date &amp; Time</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const mod = MODULE_COLORS[log.module] || MODULE_COLORS.System;
                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: 13 }}>
                        {log.adminName}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{log.action}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ backgroundColor: mod.bg, color: mod.text }}
                      >
                        {log.module}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {log.dateTime}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ipAddress}
                    </td>
                    <td>
                      <span className="badge badge-approved">{log.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
