import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

export default function ReportsPage() {
  const { handleExport } = useContext(AdminContext);

  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 20 }}>Statistical Reports</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: '700' }}>Animals Report Summary</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Total listings compiled, including views aggregates and approval rates.</p>
          <button onClick={() => handleExport('Animals Report Excel')} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-sidebar)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: 13 }}>
            Generate Excel
          </button>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: '700' }}>Sellers & Buyers Report</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Details on registrations, active locations, and blocked accounts.</p>
          <button onClick={() => handleExport('Users Report PDF')} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-sidebar)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: 13 }}>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
