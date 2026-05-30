import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CountdownTimer from '../../components/CountdownTimer';

export default function FlashTerminalScreen() {
  const navigate = useNavigate();
  const { state, acceptOrder, dispatch, showToast } = useApp();
  const { pendingFlashPing, flashClaimedBy, orderStatus } = state;

  // If order was claimed by someone else or expired, go back to dashboard
  useEffect(() => {
    if (orderStatus === 'EXPIRED') {
      showToast('error', 'Flash window expired. No acceptance.');
      navigate('/pharmacy');
    }
  }, [orderStatus, navigate, showToast]);

  // After acceptance, advance to packaging
  useEffect(() => {
    if (orderStatus === 'PACKAGING' || orderStatus === 'ACCEPTED') {
      navigate('/pharmacy/packaging');
    }
  }, [orderStatus, navigate]);

  if (!pendingFlashPing && orderStatus !== 'FLASH_WINDOW') {
    return null;
  }

  const ping = pendingFlashPing || {};
  const items = ping.items || [
    { id: 'rx-1', name: 'Amoxicillin 500mg', detail: 'Capsules • Qty: 21', inStock: true },
    { id: 'rx-2', name: 'Fluticasone Propionate', detail: 'Nasal Spray • Qty: 1', inStock: true },
  ];

  const handleAccept = () => {
    // Race condition check: if already claimed, show error
    if (flashClaimedBy) {
      showToast('error', 'Order already claimed by another pharmacy!');
      navigate('/pharmacy');
      return;
    }
    acceptOrder('ph1', 'MedPlus Pharmacy');
    showToast('success', 'Order accepted! Prepare for packaging.');
  };

  const handleDecline = () => {
    showToast('success', 'Order declined.');
    navigate('/pharmacy');
  };

  const isRx = ping.orderType === 'rx';

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at top, #f0f4ff 0%, var(--surface) 60%)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Top App Bar — suppressed to full-screen focus */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--primary)', fontSize: 22 }}>emergency</span>
          <span className="font-heading-md" style={{ color: 'var(--primary)', fontSize: 18 }}>Medio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--error-container)', padding: '5px 12px', borderRadius: 'var(--radius-pill)' }}>
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: 'var(--error)' }}>bolt</span>
          <span className="font-label-caps" style={{ color: 'var(--on-error-container)', fontSize: 11 }}>FLASH REQUEST</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>

        {/* Countdown Timer */}
        <div className="animate-bounce-in" style={{ marginBottom: 24 }}>
          <CountdownTimer
            endsAt={ping.expiresAt || (Date.now() + 3 * 60 * 1000)}
            onExpire={() => dispatch({ type: 'EXPIRE_ORDER' })}
          />
        </div>

        {/* Order meta */}
        <div className="animate-slide-up" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 className="font-heading-md" style={{ marginBottom: 6 }}>
            {isRx ? 'New Prescription Order' : 'New OTC Order'}
          </h1>
          <p className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>
            Order #{ping.orderId || 'MED-88291'} · {ping.distance || '1.2 km away'}
          </p>
        </div>

        {/* Prescription image OR OTC badge */}
        {isRx && ping.rxImageUrl ? (
          <div className="card animate-fade-in" style={{
            width: '100%', overflow: 'hidden', marginBottom: 20,
            borderRadius: 'var(--radius-card)', cursor: 'zoom-in', padding: 0,
          }}>
            <div style={{ position: 'relative', aspectRatio: '4/3' }}>
              <img src={ping.rxImageUrl} alt="Prescription" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Scrim */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 60%)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span className="font-label-caps" style={{ color: 'var(--primary)', fontSize: 11 }}>PATIENT ID</span>
                    <p className="font-body-sm" style={{ fontWeight: 700, color: 'var(--on-surface)' }}>
                      {ping.patientName || 'J. Harrison'} <span style={{ color: 'var(--secondary)', fontSize: 12 }}>✓ Verified</span>
                    </p>
                  </div>
                  <button style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-hairline)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18 }}>zoom_in</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card animate-fade-in" style={{ width: '100%', padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'default' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 28, color: 'var(--secondary)' }}>shopping_bag</span>
            </div>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 4, display: 'inline-block' }}>OTC ORDER</span>
              <p className="font-body-sm" style={{ fontWeight: 600 }}>{items.length} items requested</p>
            </div>
          </div>
        )}

        {/* Items to fulfill */}
        <div className="card animate-slide-up" style={{ width: '100%', padding: 20, marginBottom: 20, cursor: 'default' }}>
          <h3 className="font-card-title" style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--secondary)', fontSize: 22 }}>inventory_2</span>
            Items to Fulfill
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                background: 'var(--surface-container-low)',
                borderRadius: 12,
                border: '1px solid var(--border-hairline)',
              }}>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{item.name}</p>
                  <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>{item.detail}</p>
                </div>
                <span className="badge badge-success">IN STOCK</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer for fixed footer */}
        <div style={{ height: 140 }} />
      </div>

      {/* Fixed Action Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-hairline)',
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 50,
        maxWidth: 480, width: '100%',
      }}>
        <button
          onClick={handleAccept}
          className="btn-primary btn-pill"
          style={{ height: 60, fontSize: 17, width: '100%', boxShadow: '0 6px 24px rgba(0,81,223,0.35)' }}
        >
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 24 }}>check_circle</span>
          Accept &amp; Fulfill Order
        </button>
        <button
          onClick={handleDecline}
          className="btn-secondary btn-pill"
          style={{ height: 48, width: '100%' }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
