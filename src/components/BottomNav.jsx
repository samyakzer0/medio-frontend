import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const userTabs = [
  { icon: 'home', label: 'HOME', path: '/user' },
  { icon: 'medical_services', label: 'SERVICES', path: '/user/explore' },
  { icon: 'add_circle', label: 'ORDER', path: '/user/rx-upload', isFab: true },
  { icon: 'history', label: 'HISTORY', path: '/user/tracking' },
  { icon: 'person', label: 'PROFILE', path: '/user/profile' },
];

const pharmacyTabs = [
  { icon: 'dashboard', label: 'DASH', path: '/pharmacy' },
  { icon: 'history', label: 'HISTORY', path: '/pharmacy/history' },
  { icon: 'storefront', label: 'STORE', path: '/pharmacy/store', isFab: true },
  { icon: 'analytics', label: 'STATS', path: '/pharmacy/stats' },
  { icon: 'settings', label: 'SETTINGS', path: '/pharmacy/settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

  const isPharmacy = location.pathname.startsWith('/pharmacy');
  const tabs = isPharmacy ? pharmacyTabs : userTabs;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-hairline)',
      boxShadow: '0px -8px 24px rgba(0,0,0,0.04)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0 calc(env(safe-area-inset-bottom, 0px) + 12px)',
      maxWidth: '100vw',
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        if (tab.isFab) {
          return (
            <button
              key={tab.label}
              onClick={() => tab.path !== '#' && navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                marginTop: -32,
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-primary)',
                boxShadow: '0 4px 16px rgba(0,81,223,0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 28 }}>{tab.icon}</span>
              </div>
              <span className="font-label-caps" style={{ fontSize: 10, color: 'var(--primary)' }}>{tab.label}</span>
            </button>
          );
        }
        return (
          <button
            key={tab.label}
            onClick={() => tab.path !== '#' && navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
              padding: '4px 8px',
              borderRadius: 12,
              position: 'relative',
              minWidth: 48,
              transition: 'color 0.15s ease',
            }}
          >
            <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`} style={{ fontSize: 24 }}>{tab.icon}</span>
            <span className="font-label-caps" style={{ fontSize: 10 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
