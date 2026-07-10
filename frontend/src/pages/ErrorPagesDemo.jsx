import React from 'react';
import { AlertTriangle, Ban, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

export default function ErrorPagesDemo() {
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Error States Layout Templates</h2>
          <p className="page-subtitle">Standardized system templates for network, routing, validation, and authorization errors.</p>
        </div>
      </div>
      
      {/* Error Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* 404 Card */}
        <div 
          className="card" 
          style={{ 
            padding: '40px 32px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 16 
          }}
          role="region"
          aria-labelledby="err-404-title"
        >
          <div style={{ 
            width: 68, 
            height: 68, 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--color-warning-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 0 4px var(--color-warning-light)'
          }}>
            <AlertTriangle size={32} color="var(--color-warning)" aria-hidden="true" />
          </div>
          
          <div>
            <h3 id="err-404-title" style={{ fontSize: 44, margin: 0, fontWeight: '900', color: 'var(--text-heading)', letterSpacing: '-0.04em', lineHeight: 1 }}>404</h3>
            <h4 style={{ fontSize: 16, margin: '8px 0 4px', fontWeight: '700', color: 'var(--text-heading)' }}>Page Not Found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              The page you are trying to access does not exist or has been permanently relocated.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" aria-label="Go back to dashboard home">
              <ArrowLeft size={13} /> Return Home
            </button>
            <button className="btn btn-secondary btn-sm" aria-label="Report broken link issue to support">
              Report Issue
            </button>
          </div>
        </div>

        {/* 403 Card */}
        <div 
          className="card" 
          style={{ 
            padding: '40px 32px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 16 
          }}
          role="region"
          aria-labelledby="err-403-title"
        >
          <div style={{ 
            width: 68, 
            height: 68, 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--color-danger-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 0 4px var(--color-danger-light)'
          }}>
            <Ban size={32} color="var(--color-danger)" aria-hidden="true" />
          </div>
          
          <div>
            <h3 id="err-403-title" style={{ fontSize: 44, margin: 0, fontWeight: '900', color: 'var(--text-heading)', letterSpacing: '-0.04em', lineHeight: 1 }}>403</h3>
            <h4 style={{ fontSize: 16, margin: '8px 0 4px', fontWeight: '700', color: 'var(--text-heading)' }}>Access Denied</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              You do not possess the required administrator credentials to view this directory or perform this action.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" aria-label="Request access from the platform administrator">
              <ShieldCheck size={13} /> Request Access
            </button>
            <button className="btn btn-secondary btn-sm" aria-label="Contact system support manager">
              <Mail size={13} /> Contact Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

