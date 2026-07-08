import React from 'react';
import { AlertTriangle, Ban } from 'lucide-react';

export default function ErrorPagesDemo() {
  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 20 }}>Error States Layout Templates</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* 404 block */}
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 32, border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--color-warning)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 40, margin: 0, fontWeight: '900', color: 'var(--text-heading)' }}>404</h3>
          <h4 style={{ margin: '4px 0 8px', fontWeight: '700' }}>Page Not Found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>The page you are trying to access does not exist or has been relocated.</p>
        </div>

        {/* 403 block */}
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 32, border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <Ban size={48} color="var(--color-danger)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 40, margin: 0, fontWeight: '900', color: 'var(--text-heading)' }}>403</h3>
          <h4 style={{ margin: '4px 0 8px', fontWeight: '700' }}>Access Denied</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>You do not possess the required administrator credentials to view this directory.</p>
        </div>
      </div>
    </div>
  );
}
