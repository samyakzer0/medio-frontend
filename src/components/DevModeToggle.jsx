import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function DevModeToggle() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch, devFastForward, devSimulatePing, simulateBotAccept, showToast } = useApp();

  const isPharmacy = location.pathname.startsWith('/pharmacy');
  const isUser = location.pathname.startsWith('/user');
  const isRider = location.pathname.startsWith('/rider');

  const switchToUser = () => { navigate('/user'); setOpen(false); };
  const switchToPharmacy = () => { navigate('/pharmacy'); setOpen(false); };
  const switchToRider = () => { navigate('/rider'); setOpen(false); };

  const handleSimulatePing = () => {
    devSimulatePing();
    navigate('/pharmacy/flash');
    showToast('success', 'Flash ping sent to pharmacy!');
    setOpen(false);
  };

  const handleBotAccept = () => {
    simulateBotAccept(state);
    if (state.flashClaimedBy) {
      showToast('error', 'Race condition: order already claimed!');
    } else {
      showToast('success', 'Bot accepted the order first!');
    }
    setOpen(false);
  };

  const handleFastForward = () => {
    devFastForward();
    navigate('/user/tracking');
    showToast('success', 'Fast-forwarding order states...');
    setOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 88,
      right: 16,
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {/* Expanded menu */}
      {open && (
        <div style={{
          background: 'var(--inverse-surface)',
          borderRadius: 'var(--radius-card)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 200,
          boxShadow: 'var(--shadow-modal)',
          animation: 'slide-up 0.2s ease both',
        }}>
          <p style={{ color: 'var(--inverse-on-surface)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>DEV CONTROLS</p>

          {/* Mode switch */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={switchToUser}
              style={{
                flex: '1 1 30%', padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isUser ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                color: isUser ? '#fff' : 'var(--inverse-on-surface)',
                fontSize: 10, fontWeight: 600,
              }}>
              👤 USER
            </button>
            <button
              onClick={switchToPharmacy}
              style={{
                flex: '1 1 30%', padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isPharmacy ? 'var(--secondary)' : 'rgba(255,255,255,0.15)',
                color: isPharmacy ? '#fff' : 'var(--inverse-on-surface)',
                fontSize: 10, fontWeight: 600,
              }}>
              🏪 PHARM
            </button>
            <button
              onClick={switchToRider}
              style={{
                flex: '1 1 30%', padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isRider ? 'var(--tertiary)' : 'rgba(255,255,255,0.15)',
                color: isRider ? '#fff' : 'var(--inverse-on-surface)',
                fontSize: 10, fontWeight: 600,
              }}>
              🚴 RIDER
            </button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

          {/* Dev actions */}
          <DevBtn icon="bolt" label="Simulate Flash Ping" onClick={handleSimulatePing} color="#f59e0b" />
          <DevBtn icon="robot_2" label="Bot Accept (Race Test)" onClick={handleBotAccept} color="#ef4444" />
          <DevBtn icon="fast_forward" label="Fast-Forward Order" onClick={handleFastForward} color="#6bff8f" textDark />

          {/* Current state display */}
          <div style={{
            marginTop: 4, padding: '8px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>ORDER STATE</p>
            <p style={{ color: 'var(--secondary-container)', fontSize: 12, fontWeight: 700 }}>{state.orderStatus}</p>
            {state.orderId && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{state.orderId}</p>}
          </div>
        </div>
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--inverse-surface)',
          color: 'var(--inverse-on-surface)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-lifted)',
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          opacity: 0.88,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>code</span>
      </button>
    </div>
  );
}

function DevBtn({ icon, label, onClick, color, textDark }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: `${color}22`,
      color: textDark ? '#003c00' : color,
      fontSize: 12, fontWeight: 600, textAlign: 'left',
      transition: 'background 0.15s ease',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}
