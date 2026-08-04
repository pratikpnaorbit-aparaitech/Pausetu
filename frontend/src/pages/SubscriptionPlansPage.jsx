import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAllPlans, createPlan, updatePlan, deletePlan, togglePlanStatus } from '../api/subscriptionAdminApi';
import { useSubscriptionAutoRefresh } from '../hooks/useSubscriptionAutoRefresh';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Power, Tag, ShieldCheck } from 'lucide-react';

const AVAILABLE_FEATURES = [
  { key: 'unlimited_listings', label: 'Unlimited Animal Listings' },
  { key: 'ai_feed_planner', label: 'AI Feed Planner' },
  { key: 'cow_estimator', label: 'Cow Estimator' },
  { key: 'featured_listings', label: 'Featured Listings' },
  { key: 'premium_badge', label: 'Premium Badge' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'future_premium_features', label: 'Future Premium Features' }
];

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    planType: '1_month',
    durationDays: 30,
    price: '',
    originalPrice: '',
    badge: '',
    displayOrder: 0,
    features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'premium_badge'],
    isActive: true
  });

  const fetchPlans = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await getAllPlans();
      if (res && res.data && res.data.plans) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      if (!isBackground) setError(err.response?.data?.message || 'Failed to load subscription plans');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans(false);
  }, [fetchPlans]);

  useSubscriptionAutoRefresh(fetchPlans, {
    pageKey: 'SubscriptionPlansPage',
    isEditing: isModalOpen
  });

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      planType: '1_month',
      durationDays: 30,
      price: '',
      originalPrice: '',
      badge: '',
      displayOrder: 0,
      features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'premium_badge'],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      planType: plan.planType,
      durationDays: plan.durationDays,
      price: plan.price,
      originalPrice: plan.originalPrice || '',
      badge: plan.badge || '',
      displayOrder: plan.displayOrder || 0,
      features: plan.features || [],
      isActive: plan.isActive
    });
    setIsModalOpen(true);
  };

  const handlePlanTypeChange = (e) => {
    const val = e.target.value;
    let days = 30;
    if (val === '3_months') days = 90;
    else if (val === '6_months') days = 180;
    else if (val === '12_months') days = 365;

    setForm(prev => ({
      ...prev,
      planType: val,
      durationDays: days
    }));
  };

  const handleFeatureToggle = (featureKey) => {
    setForm(prev => {
      const exists = prev.features.includes(featureKey);
      const updated = exists
        ? prev.features.filter(f => f !== featureKey)
        : [...prev.features, featureKey];
      return { ...prev, features: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlan(editingPlan._id, form);
      } else {
        await createPlan(form);
      }
      setIsModalOpen(false);
      fetchPlans(false);
      refreshManager.emit(REFRESH_EVENTS.PLAN_UPDATED);
      refreshManager.emit(REFRESH_EVENTS.SUBSCRIPTION_UPDATED);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await togglePlanStatus(plan._id);
      fetchPlans(false);
      refreshManager.emit(REFRESH_EVENTS.PLAN_UPDATED);
      refreshManager.emit(REFRESH_EVENTS.SUBSCRIPTION_UPDATED);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle plan status');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        await deletePlan(planId);
        fetchPlans(false);
        refreshManager.emit(REFRESH_EVENTS.PLAN_UPDATED);
        refreshManager.emit(REFRESH_EVENTS.SUBSCRIPTION_UPDATED);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 22, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
            Plan Management
          </h2>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
            Create and configure subscription pricing plans, durations, badges, and dynamic feature access
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Create New Plan
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Plans Table */}
      <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="skeleton" style={{ height: 200, width: '100%' }} />
        ) : plans.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No subscription plans found. Click "Create New Plan" to add one.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11 }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Order</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Plan Name</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Price (INR)</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Badge</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Features Enabled</th>
                  <th style={{ textAlign: 'center', padding: '10px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '800', color: '#64748b' }}>
                      #{plan.displayOrder}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0f172a' }}>
                      {plan.name}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>
                      {plan.durationDays} Days ({plan.planType.replace('_', ' ')})
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '800', color: '#7c3aed' }}>
                      ₹{plan.price} {plan.originalPrice ? <span style={{ textDecoration: 'line-through', fontSize: 11, color: '#94a3b8', fontWeight: 'normal', marginLeft: 4 }}>₹{plan.originalPrice}</span> : null}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {plan.badge ? (
                        <span style={{ fontSize: 11, fontWeight: '800', backgroundColor: '#fef3c7', color: '#d97706', padding: '3px 8px', borderRadius: 6 }}>
                          {plan.badge}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ fontSize: 12, color: '#047857', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: 6, fontWeight: '600' }}>
                        {plan.features?.length || 0} Features Active
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(plan)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 4
                        }}
                        title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                      >
                        {plan.isActive ? (
                          <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <CheckCircle2 size={16} /> Active
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <XCircle size={16} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(plan)} style={{ padding: '6px 10px' }}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlan(plan._id)} style={{ padding: '6px 10px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Modal (Create / Edit) */}
      {isModalOpen && createPortal(
        <div className="custom-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="custom-modal-container">
            {/* Header (Sticky / Fixed at top) */}
            <div className="custom-modal-header">
              <h3 className="custom-modal-title">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              {/* Body (Scrollable with custom 8px scrollbar) */}
              <div className="custom-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Plan Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. 3 Months Gold Plan"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Plan Duration Type</label>
                      <select
                        className="input"
                        value={form.planType}
                        onChange={handlePlanTypeChange}
                        style={{ width: '100%' }}
                      >
                        <option value="1_month">1 Month (30 Days)</option>
                        <option value="3_months">3 Months (90 Days)</option>
                        <option value="6_months">6 Months (180 Days)</option>
                        <option value="12_months">12 Months (365 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Duration in Days</label>
                      <input
                        type="number"
                        className="input"
                        required
                        value={form.durationDays}
                        onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Selling Price (₹ INR)</label>
                      <input
                        type="number"
                        className="input"
                        required
                        placeholder="499"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Original Price (₹ INR)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="899 (Optional for savings %)"
                        value={form.originalPrice}
                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Badge / Tag</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. POPULAR, BEST VALUE"
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 4 }}>Display Order</label>
                      <input
                        type="number"
                        className="input"
                        value={form.displayOrder}
                        onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Plan Features Checkboxes */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: '700', color: '#475569', display: 'block', marginBottom: 8 }}>
                      Enabled Features (Select with Checkboxes):
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {AVAILABLE_FEATURES.map((feat) => {
                        const checked = form.features.includes(feat.key);
                        return (
                          <label key={feat.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleFeatureToggle(feat.key)}
                              style={{ width: 16, height: 16, accentColor: '#7c3aed' }}
                            />
                            <span style={{ fontWeight: checked ? '700' : 'normal', color: checked ? '#7c3aed' : '#334155' }}>
                              {feat.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer (Sticky / Fixed at bottom) */}
              <div className="custom-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
