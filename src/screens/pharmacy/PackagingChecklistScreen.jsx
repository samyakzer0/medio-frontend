import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

export default function PackagingChecklistScreen() {
  const navigate = useNavigate();
  const { state, markReadyForPickup, showToast } = useApp();
  const { otcItems } = state;

  // Checklist state — one entry per item
  const items = (otcItems.length > 0 ? otcItems : [
    { id: 'rx-1', name: 'Amoxicillin 500mg', detail: 'Capsules • Qty: 21', dosage: 'Take 1 capsule twice daily after meals for 7 days', inStock: true },
    { id: 'rx-2', name: 'Fluticasone Propionate', detail: 'Nasal Spray • Qty: 1', dosage: '2 sprays in each nostril once daily in the morning', inStock: true },
  ]).map(i => ({ ...i, dosage: i.dosage || 'As directed by physician' }));

  const [checked, setChecked] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allChecked = items.every(i => checked[i.id]);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const handleReady = () => {
    if (!allChecked) { showToast('error', 'Please confirm all items are packed!'); return; }
    setSubmitting(true);
    setTimeout(() => {
      markReadyForPickup();
      showToast('success', 'Rider dispatched! Order handed off.');
      navigate('/pharmacy');
    }, 1200);
  };

  return (
    <div className="screen">
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--secondary)', fontSize: 22 }}>inventory_2</span>
          <h1 className="font-card-title" style={{ fontSize: 18 }}>Packaging Checklist</h1>
        </div>
        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>ORDER ACCEPTED</span>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>

          {/* Progress bar */}
          <div className="card" style={{ padding: 20, marginBottom: 20, cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="font-body-sm" style={{ fontWeight: 600 }}>Packing Progress</p>
              <p className="font-label-caps" style={{ color: allChecked ? 'var(--secondary)' : 'var(--primary)', fontSize: 12 }}>
                {checkedCount}/{items.length} ITEMS
              </p>
            </div>
            <div style={{ height: 8, background: 'var(--surface-container)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: allChecked ? 'var(--secondary)' : 'var(--primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.4s ease, background 0.3s ease',
              }} />
            </div>
          </div>

          {/* Instructions */}
          <div style={{ background: 'var(--tertiary-fixed)', borderRadius: 'var(--radius-card)', padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--on-tertiary-fixed-variant)', flexShrink: 0, marginTop: 2 }}>package_2</span>
            <div>
              <p className="font-body-sm" style={{ fontWeight: 600, color: 'var(--on-tertiary-fixed-variant)', marginBottom: 4 }}>Packaging Instructions</p>
              <p className="font-body-sm" style={{ color: 'var(--on-tertiary-fixed)', fontSize: 12, lineHeight: '18px' }}>
                Pack each medicine in a labeled zip-lock bag. Write the dosage schedule clearly on each label before sealing.
              </p>
            </div>
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${checked[item.id] ? 'var(--secondary)' : 'var(--border-hairline)'}`,
                  boxShadow: 'var(--shadow-global)',
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.15s ease',
                  background: checked[item.id] ? 'rgba(0,110,47,0.04)' : 'var(--canvas-white)',
                  transform: checked[item.id] ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Checkbox */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${checked[item.id] ? 'var(--secondary)' : 'var(--outline-variant)'}`,
                    background: checked[item.id] ? 'var(--secondary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s ease, border-color 0.2s ease',
                  }}>
                    {checked[item.id] && (
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18, color: '#fff' }}>check</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <p className="font-body-sm" style={{ fontWeight: 700, color: 'var(--on-surface)', textDecoration: checked[item.id] ? 'line-through' : 'none', opacity: checked[item.id] ? 0.6 : 1 }}>
                        {item.name}
                      </p>
                      <span className="badge badge-success" style={{ fontSize: 10, flexShrink: 0, marginLeft: 8 }}>IN STOCK</span>
                    </div>
                    <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, marginBottom: 8 }}>{item.detail}</p>

                    {/* Dosage Label Box */}
                    <div style={{
                      background: checked[item.id] ? 'var(--secondary-container)' : 'var(--primary-fixed)',
                      borderRadius: 10, padding: '10px 12px',
                      borderLeft: `3px solid ${checked[item.id] ? 'var(--secondary)' : 'var(--primary)'}`,
                      transition: 'background 0.2s ease, border-color 0.2s ease',
                    }}>
                      <p className="font-label-caps" style={{ fontSize: 10, color: checked[item.id] ? 'var(--secondary)' : 'var(--primary)', marginBottom: 4 }}>DOSAGE LABEL</p>
                      <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--on-surface)', lineHeight: '18px' }}>{item.dosage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* All done indicator */}
          {allChecked && (
            <div className="animate-bounce-in" style={{
              background: 'var(--secondary-container)',
              borderRadius: 'var(--radius-card)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 28, color: 'var(--secondary)' }}>task_alt</span>
              <div>
                <p className="font-body-sm" style={{ fontWeight: 700, color: 'var(--on-secondary-container)' }}>All items packed!</p>
                <p className="font-body-sm" style={{ color: 'var(--on-secondary-container)', fontSize: 12 }}>Ready to handoff to rider</p>
              </div>
            </div>
          )}

          {/* Ready for Pickup CTA */}
          <button
            onClick={handleReady}
            disabled={!allChecked || submitting}
            className="btn-primary btn-pill"
            style={{
              width: '100%', height: 58, fontSize: 16, marginBottom: 100,
              background: allChecked ? 'var(--secondary)' : 'var(--surface-container-high)',
              color: allChecked ? '#fff' : 'var(--on-surface-variant)',
              boxShadow: allChecked ? '0 6px 24px rgba(0,110,47,0.3)' : 'none',
              cursor: allChecked ? 'pointer' : 'not-allowed',
              transition: 'background 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {submitting ? (
              <><span className="material-symbols-outlined" style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>progress_activity</span> Dispatching Rider…</>
            ) : (
              <><span className="material-symbols-outlined icon-fill" style={{ fontSize: 22 }}>pedal_bike</span>
                {allChecked ? 'READY FOR PICKUP' : `Pack all ${items.length} items first`}</>
            )}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
