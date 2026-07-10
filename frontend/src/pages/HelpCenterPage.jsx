import React from 'react';
import { HelpCircle, Info, BookOpen, User } from 'lucide-react';

const FAQS = [
  {
    icon: HelpCircle,
    question: 'How does the approval workflow operate?',
    answer: 'Farmers submit livestock listings (including required photos and a verification walkthrough video) via the PashuSetu mobile app. Once uploaded, listing metadata routes to the Admin Approval Queue where moderators inspect media quality, vaccination status, and price details before publishing them live to buyers.',
  },
  {
    icon: BookOpen,
    question: 'Can blocked sellers or buyers still access their accounts?',
    answer: 'No, blocking a user immediately restricts their access. Server-side middleware checks the block status during OTP verification and rejects all incoming JWT requests for restricted accounts.',
  },
  {
    icon: Info,
    question: 'What are the requirements for livestock videos?',
    answer: 'To prevent fraudulent listings, videos must show a continuous walkthrough of the animal. If a video is missing or blurry, administrators should reject the listing with a specific correction note (e.g., "Re-upload verification video showing walking stance").',
  },
];

export default function HelpCenterPage() {
  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Documentation & Support</h2>
          <p className="page-subtitle">Guide sheets and frequently asked questions for PashuSetu moderators.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
        {FAQS.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <div
              key={idx}
              className="card-flat"
              style={{
                padding: '20px 24px',
                animation: `slideUp 0.18s ${idx * 0.05}s both`,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: '700', color: 'var(--text-heading)', lineHeight: 1.4 }}>
                  {faq.question}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
