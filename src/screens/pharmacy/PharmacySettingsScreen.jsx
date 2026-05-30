import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_SETTINGS = {
  // Profile
  pharmacyName: 'MedPlus Pharmacy',
  ownerName: 'Dr. Rakesh Agarwal',
  phone: '+91 98765 43210',
  email: 'medplus.andheri@medio.in',
  gstin: '27AADCM1234F1ZK',
  license: 'MH-2024-PH-00421',

  // Operating Hours
  openTime: '08:00',
  closeTime: '22:00',
  workingDays: [true, true, true, true, true, true, false], // Mon-Sun

  // Notifications
  notifSound: true,
  notifVibrate: true,
  notifFlashPing: true,
  notifOrderUpdates: true,
  notifPromoAlerts: false,
  notifWeeklyReport: true,

  // Delivery
  deliveryRadius: 3,
  autoAccept: false,
  maxConcurrentOrders: 5,
  estimatedPrepTime: 8,

  // Display
  darkMode: false,
  compactView: false,
  language: 'English',
};

export default function PharmacySettingsScreen() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [activeSection, setActiveSection] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    showToast('success', 'Settings saved successfully!');
  };

  const toggleDay = (index) => {
    const newDays = [...settings.workingDays];
    newDays[index] = !newDays[index];
    update('workingDays', newDays);
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', padding: 2,
        background: checked ? 'var(--primary)' : 'var(--surface-container-high)',
        transition: 'background 0.2s ease', cursor: 'pointer', flexShrink: 0,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </button>
  );

  const SettingRow = ({ icon, label, sublabel, children, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
        borderBottom: '1px solid var(--border-hairline)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'var(--primary-fixed)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-body-sm" style={{ fontWeight: 600, marginBottom: 1 }}>{label}</p>
        {sublabel && <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{sublabel}</p>}
      </div>
      {children}
      {onClick && !children && (
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--outline)' }}>chevron_right</span>
      )}
    </div>
  );

  return (
    <div className="screen">
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/pharmacy')} style={{ background: 'none', border: 'none', padding: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--on-surface)' }}>arrow_back</span>
            </button>
            <h1 className="font-card-title" style={{ fontSize: 18 }}>Settings</h1>
          </div>
          {hasChanges && (
            <button onClick={handleSave} className="btn-primary" style={{
              padding: '8px 20px', minHeight: 36, fontSize: 13, borderRadius: 'var(--radius-pill)',
            }}>
              Save
            </button>
          )}
        </div>
      </header>

      <main style={{ paddingTop: 60 }}>
        <div className="screen-content" style={{ paddingTop: 16 }}>

          {/* Profile Card */}
          <div className="card" style={{
            padding: 20, marginBottom: 20, cursor: 'default',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
            border: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.3)',
              }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 30, color: '#fff' }}>storefront</span>
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-card-title" style={{ color: '#fff', fontSize: 17, marginBottom: 2 }}>{settings.pharmacyName}</p>
                <p className="font-body-sm" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{settings.ownerName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span className="badge" style={{
                    background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, padding: '2px 8px',
                  }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 10, marginRight: 3 }}>verified</span>
                    VERIFIED
                  </span>
                  <span className="badge" style={{
                    background: 'rgba(107,255,143,0.25)', color: '#fff', fontSize: 9, padding: '2px 8px',
                  }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Store Information</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="call" label="Phone" sublabel={settings.phone} />
              <SettingRow icon="mail" label="Email" sublabel={settings.email} />
              <SettingRow icon="receipt" label="GSTIN" sublabel={settings.gstin} />
              <SettingRow icon="verified_user" label="License No." sublabel={settings.license} />
            </div>
          </section>

          {/* Operating Hours */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Operating Hours</p>
            <div className="card" style={{ padding: 16, cursor: 'default' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 6, display: 'block' }}>Opens</label>
                  <input
                    type="time" value={settings.openTime}
                    onChange={e => update('openTime', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-hairline)', fontSize: 15, fontWeight: 600,
                      color: 'var(--on-surface)', background: 'var(--canvas-white)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 6, display: 'block' }}>Closes</label>
                  <input
                    type="time" value={settings.closeTime}
                    onChange={e => update('closeTime', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-hairline)', fontSize: 15, fontWeight: 600,
                      color: 'var(--on-surface)', background: 'var(--canvas-white)',
                    }}
                  />
                </div>
              </div>

              {/* Working days */}
              <label style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 8, display: 'block' }}>Working Days</label>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {DAYS_OF_WEEK.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i)}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: settings.workingDays[i] ? '2px solid var(--primary)' : '1px solid var(--border-hairline)',
                      background: settings.workingDays[i] ? 'var(--primary)' : 'transparent',
                      color: settings.workingDays[i] ? '#fff' : 'var(--ink-secondary)',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.2s ease',
                    }}
                  >{day.charAt(0)}</button>
                ))}
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Notifications</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="volume_up" label="Alert Sound" sublabel="Play sound on new orders">
                <ToggleSwitch checked={settings.notifSound} onChange={v => update('notifSound', v)} />
              </SettingRow>
              <SettingRow icon="vibration" label="Vibration" sublabel="Vibrate on flash pings">
                <ToggleSwitch checked={settings.notifVibrate} onChange={v => update('notifVibrate', v)} />
              </SettingRow>
              <SettingRow icon="bolt" label="Flash Ping Alerts" sublabel="Get notified for incoming orders">
                <ToggleSwitch checked={settings.notifFlashPing} onChange={v => update('notifFlashPing', v)} />
              </SettingRow>
              <SettingRow icon="local_shipping" label="Order Updates" sublabel="Rider pickup & delivery alerts">
                <ToggleSwitch checked={settings.notifOrderUpdates} onChange={v => update('notifOrderUpdates', v)} />
              </SettingRow>
              <SettingRow icon="campaign" label="Promotions" sublabel="Medio offers & announcements">
                <ToggleSwitch checked={settings.notifPromoAlerts} onChange={v => update('notifPromoAlerts', v)} />
              </SettingRow>
              <SettingRow icon="assessment" label="Weekly Report" sublabel="Summary every Monday at 9 AM">
                <ToggleSwitch checked={settings.notifWeeklyReport} onChange={v => update('notifWeeklyReport', v)} />
              </SettingRow>
            </div>
          </section>

          {/* Delivery Settings */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Delivery Preferences</p>
            <div className="card" style={{ padding: 16, cursor: 'default' }}>
              {/* Delivery Radius Slider */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-body-sm" style={{ fontWeight: 600 }}>Delivery Radius</span>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>{settings.deliveryRadius} km</span>
                </div>
                <input
                  type="range" min="1" max="10" value={settings.deliveryRadius}
                  onChange={e => update('deliveryRadius', parseInt(e.target.value))}
                  style={{
                    width: '100%', accentColor: 'var(--primary)', height: 4, outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>1 km</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>10 km</span>
                </div>
              </div>

              {/* Auto Accept */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid var(--border-hairline)',
              }}>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 600 }}>Auto-Accept Orders</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Automatically accept within radius</p>
                </div>
                <ToggleSwitch checked={settings.autoAccept} onChange={v => update('autoAccept', v)} />
              </div>

              {/* Max concurrent orders */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid var(--border-hairline)',
              }}>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 600 }}>Max Concurrent Orders</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Limit simultaneous fulfillments</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => update('maxConcurrentOrders', Math.max(1, settings.maxConcurrentOrders - 1))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-hairline)',
                      background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{settings.maxConcurrentOrders}</span>
                  <button onClick={() => update('maxConcurrentOrders', Math.min(20, settings.maxConcurrentOrders + 1))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-hairline)',
                      background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              </div>

              {/* Estimated Prep time */}
              <div style={{ padding: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-body-sm" style={{ fontWeight: 600 }}>Avg. Prep Time</span>
                  <span className="badge badge-warning" style={{ fontSize: 11 }}>{settings.estimatedPrepTime} min</span>
                </div>
                <input
                  type="range" min="3" max="30" value={settings.estimatedPrepTime}
                  onChange={e => update('estimatedPrepTime', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--tertiary)', height: 4, outline: 'none' }}
                />
              </div>
            </div>
          </section>

          {/* Account & Support */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Account & Support</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="lock" label="Change Password" onClick={() => showToast('info', 'Password reset link sent to email')} />
              <SettingRow icon="help" label="Help & Support" sublabel="FAQs, contact Medio team" onClick={() => {}} />
              <SettingRow icon="description" label="Terms of Service" onClick={() => {}} />
              <SettingRow icon="privacy_tip" label="Privacy Policy" onClick={() => {}} />
            </div>
          </section>

          {/* App Info */}
          <div style={{ textAlign: 'center', padding: '20px 0 100px', opacity: 0.5 }}>
            <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 4 }}>Medio Partner App</p>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Version 1.0.0 · Build 2024.05.28</p>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
