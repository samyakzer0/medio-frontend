import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { state, dispatch } = useApp();
  const toast = state.toast;

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3200);
      return () => clearTimeout(t);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const bg = toast.type === 'error' ? 'var(--error)' :
    toast.type === 'success' ? 'var(--secondary)' :
    'var(--inverse-surface)';
  const icon = toast.type === 'error' ? 'error' :
    toast.type === 'success' ? 'check_circle' : 'info';

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: bg,
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 'var(--radius-pill)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: 'var(--shadow-modal)',
      animation: 'slide-up 0.3s ease both',
      whiteSpace: 'nowrap',
      maxWidth: '90vw',
    }}>
      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20 }}>{icon}</span>
      <span className="font-body-sm" style={{ color: '#fff', fontWeight: 500 }}>{toast.message}</span>
    </div>
  );
}
