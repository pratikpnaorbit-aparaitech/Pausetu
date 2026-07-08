import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

export default function AuditLogsPage() {
  const { auditLogs } = useContext(AdminContext);

  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 20 }}>Audit Logs</h2>
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Admin Name</th>
              <th style={{ padding: 12 }}>Action</th>
              <th style={{ padding: 12 }}>Module</th>
              <th style={{ padding: 12 }}>Date & Time</th>
              <th style={{ padding: 12 }}>IP Address</th>
              <th style={{ padding: 12 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 12, fontWeight: '700', color: 'var(--text-heading)' }}>{log.adminName}</td>
                <td style={{ padding: 12 }}>{log.action}</td>
                <td style={{ padding: 12 }}>{log.module}</td>
                <td style={{ padding: 12 }}>{log.dateTime}</td>
                <td style={{ padding: 12 }}>{log.ipAddress}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 12, fontSize: 11, fontWeight: '700' }}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
