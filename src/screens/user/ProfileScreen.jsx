import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

const USER_DATA = {
  name: 'Jayesh Harrison',
  email: 'jayesh.harrison@gmail.com',
  phone: '+91 87654 32100',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASd4rh1ytISTiF_soGYYA3ZvSZqDSAQRRlGurLqwlPyBy7eTveheEm7IYXB2rRfD82hnDT2CK1fmZURHVZ3hapHPHUb00FcM-CJcwCvMlO7rZzwKGTIzs12DG4I2-YLC4QGNadY2yYzcL9vYiK1J6skI6L0M2AKJxuILSKj3veOjlXrWkZdCN09Xs7ybe0eFpDbBguK8yuF7Q4zD05ICFUNsrFPoAXAr6DRPU3n2h_T2ty0b0lczr1u5NAyp8DZbpx01MkOIDrfV4',
  memberSince: 'March 2024',
  ordersCount: 23,
  savedAmount: 1240,
};

const SAVED_ADDRESSES = [
  { id: 'a1', label: 'Home', address: 'Flat 302, Shree Sai CHS, DN Nagar, Andheri West, Mumbai 400053', icon: 'home', isDefault: true },
  { id: 'a2', label: 'Office', address: '7th Floor, Oberoi Commerz, Goregaon East, Mumbai 400063', icon: 'work', isDefault: false },
];

const PAYMENT_METHODS = [
  { id: 'pm1', label: 'Google Pay', sublabel: 'jayesh@okaxis', icon: 'account_balance_wallet', type: 'UPI', isDefault: true },
  { id: 'pm2', label: 'HDFC Debit Card', sublabel: '•••• 4521', icon: 'credit_card', type: 'Card', isDefault: false },
];

const HEALTH_PROFILE = {
  bloodGroup: 'B+',
  allergies: ['Penicillin', 'Sulfa drugs'],
  conditions: ['Mild hypertension'],
  emergencyContact: 'Priya Harrison · +91 98765 43210',
};

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [stats, setStats] = useState({
    ordersCount: USER_DATA.ordersCount,
    savedAmount: USER_DATA.savedAmount,
    memberSince: USER_DATA.memberSince,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const isSupabaseLive = useCallback(() => {
    return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
  }, []);

  const fetchProfileStats = useCallback(async () => {
    const live = isSupabaseLive();
    if (!live) {
      setLoadingStats(false);
      return;
    }

    try {
      console.log('🔄 Fetching real profile stats from Supabase...');
      const { data, error } = await supabase
        .from('Order')
        .select('status, totalPaise, createdAt')
        .eq('userId', 'usr-jayesh');

      if (error) throw error;

      if (data) {
        const deliveredOrders = data.filter(o => o.status === 'DELIVERED');
        const ordersCount = deliveredOrders.length;
        
        // Calculate savings: 10% of total expenditure
        const totalSpent = deliveredOrders.reduce((sum, o) => sum + (o.totalPaise || 0) / 100, 0);
        const savedAmount = Math.round(totalSpent * 0.1);

        // Calculate memberSince based on oldest order, fallback to "March 2024"
        let memberSince = USER_DATA.memberSince;
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const oldestDate = new Date(sorted[0].createdAt);
          memberSince = oldestDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          });
        }

        setStats({
          ordersCount,
          savedAmount,
          memberSince
        });
      }
    } catch (err) {
      console.error('❌ Failed to fetch profile stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [isSupabaseLive]);

  useEffect(() => {
    fetchProfileStats();

    const live = isSupabaseLive();
    if (!live) return;

    console.log('📡 Subscribing to Order table for real-time profile stats...');
    const channel = supabase
      .channel('profile-stats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        () => {
          console.log('⚡ Realtime order update. Refreshing profile stats...');
          fetchProfileStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfileStats, isSupabaseLive]);

  const [settings, setSettings] = useState({
    notifOrders: true,
    notifDeals: false,
    notifReminders: true,
    darkMode: false,
    language: 'English',
    biometric: true,
    orderHistory: true,
    shareAnalytics: false,
  });

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
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

  const SettingRow = ({ icon, label, sublabel, children, onClick, danger }) => (
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
        background: danger ? 'var(--error-container)' : 'var(--primary-fixed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 20, color: danger ? 'var(--error)' : 'var(--primary)',
        }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-body-sm" style={{ fontWeight: 600, color: danger ? 'var(--error)' : 'var(--on-surface)', marginBottom: 1 }}>{label}</p>
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
          <h1 className="font-card-title" style={{ fontSize: 18 }}>Profile</h1>
          <button onClick={() => showToast('success', 'Settings synced!')} style={{
            background: 'none', border: 'none', padding: 4,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--on-surface-variant)' }}>sync</span>
          </button>
        </div>
      </header>

      <main style={{ paddingTop: 60 }}>
        <div className="screen-content" style={{ paddingTop: 16 }}>

          {/* ── Profile Card ── */}
          <div className="card" style={{
            padding: 24, marginBottom: 20, cursor: 'default',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
            border: 'none', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                overflow: 'hidden', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                <img src={USER_DATA.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p className="font-card-title" style={{ color: '#fff', fontSize: 18, marginBottom: 2 }}>{USER_DATA.name}</p>
                <p className="font-body-sm" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 8 }}>{USER_DATA.email}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9 }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 10, marginRight: 3 }}>verified</span>
                    VERIFIED
                  </span>
                  <span className="badge" style={{ background: 'rgba(107,255,143,0.25)', color: '#fff', fontSize: 9 }}>
                    MEDIO PLUS
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'space-around', marginTop: 20, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 1,
            }}>
              {[
                { value: stats.ordersCount, label: 'Orders' },
                { value: `₹${stats.savedAmount}`, label: 'Saved' },
                { value: stats.memberSince.split(' ')[0], label: stats.memberSince.split(' ')[1] },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: 18, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[
              { icon: 'inventory_2', label: 'Orders', color: 'var(--primary)', path: '/user/tracking' },
              { icon: 'favorite', label: 'Saved', color: 'var(--error)', path: null },
              { icon: 'headset_mic', label: 'Support', color: 'var(--secondary)', path: null },
            ].map((action, i) => (
              <div
                key={action.label}
                className="card"
                onClick={() => action.path && navigate(action.path)}
                style={{
                  padding: '16px 8px', textAlign: 'center',
                  cursor: action.path ? 'pointer' : 'default',
                  animation: `slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
                }}
              >
                <span className="material-symbols-outlined icon-fill" style={{
                  fontSize: 24, color: action.color, display: 'block', marginBottom: 6,
                }}>{action.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{action.label}</span>
              </div>
            ))}
          </div>

          {/* ── Health Profile ── */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Health Profile</p>
            <div className="card" style={{ padding: 16, cursor: 'default' }}>
              {/* Blood group badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'var(--error-container)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--error)', fontFamily: 'Poppins, sans-serif' }}>{HEALTH_PROFILE.bloodGroup}</span>
                </div>
                <div>
                  <p className="font-body-sm" style={{ fontWeight: 700 }}>Blood Group</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Type {HEALTH_PROFILE.bloodGroup}</p>
                </div>
              </div>

              {/* Allergies */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>warning</span>
                  <p className="font-body-sm" style={{ fontWeight: 600, fontSize: 13 }}>Known Allergies</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 24 }}>
                  {HEALTH_PROFILE.allergies.map(a => (
                    <span key={a} className="badge badge-warning" style={{ fontSize: 11 }}>{a}</span>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>monitor_heart</span>
                  <p className="font-body-sm" style={{ fontWeight: 600, fontSize: 13 }}>Medical Conditions</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 24 }}>
                  {HEALTH_PROFILE.conditions.map(c => (
                    <span key={c} className="badge badge-primary" style={{ fontSize: 11 }}>{c}</span>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: 'var(--error-container)',
                borderRadius: 'var(--radius-md)', marginTop: 4,
              }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--error)' }}>emergency</span>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--on-error-container)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Emergency Contact</p>
                  <p className="font-body-sm" style={{ color: 'var(--on-error-container)', fontSize: 13 }}>{HEALTH_PROFILE.emergencyContact}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Saved Addresses ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 4 }}>
              <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Saved Addresses</p>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>+ Add New</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SAVED_ADDRESSES.map((addr, i) => (
                <div key={addr.id} className="card" style={{
                  padding: 14, cursor: 'default',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  border: addr.isDefault ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                  animation: `slide-up 0.3s ease ${i * 0.08}s both`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: addr.isDefault ? 'var(--primary-fixed)' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined icon-fill" style={{
                      fontSize: 20, color: addr.isDefault ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}>{addr.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <p className="font-body-sm" style={{ fontWeight: 700 }}>{addr.label}</p>
                      {addr.isDefault && (
                        <span className="badge badge-primary" style={{ fontSize: 9, padding: '1px 6px' }}>DEFAULT</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: '17px' }}>{addr.address}</p>
                  </div>
                  <button style={{ background: 'none', border: 'none', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>edit</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Payment Methods ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 4 }}>
              <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Payment Methods</p>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>+ Add New</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_METHODS.map((pm, i) => (
                <div key={pm.id} className="card" style={{
                  padding: 14, cursor: 'default',
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: pm.isDefault ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                  animation: `slide-up 0.3s ease ${i * 0.08}s both`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: pm.isDefault ? 'var(--primary-fixed)' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined icon-fill" style={{
                      fontSize: 20, color: pm.isDefault ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}>{pm.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <p className="font-body-sm" style={{ fontWeight: 700 }}>{pm.label}</p>
                      {pm.isDefault && (
                        <span className="badge badge-primary" style={{ fontSize: 9, padding: '1px 6px' }}>DEFAULT</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{pm.sublabel} · {pm.type}</p>
                  </div>
                  <button style={{ background: 'none', border: 'none', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>more_vert</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Notifications ── */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Notifications</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="local_shipping" label="Order Updates" sublabel="Track delivery in real-time">
                <ToggleSwitch checked={settings.notifOrders} onChange={v => update('notifOrders', v)} />
              </SettingRow>
              <SettingRow icon="local_offer" label="Deals & Offers" sublabel="Get notified about discounts">
                <ToggleSwitch checked={settings.notifDeals} onChange={v => update('notifDeals', v)} />
              </SettingRow>
              <SettingRow icon="alarm" label="Medicine Reminders" sublabel="Never miss a dose">
                <ToggleSwitch checked={settings.notifReminders} onChange={v => update('notifReminders', v)} />
              </SettingRow>
            </div>
          </section>

          {/* ── Preferences ── */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Preferences</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="fingerprint" label="Biometric Login" sublabel="Use fingerprint or face ID">
                <ToggleSwitch checked={settings.biometric} onChange={v => update('biometric', v)} />
              </SettingRow>
              <SettingRow icon="history" label="Order History" sublabel="Show past orders on home">
                <ToggleSwitch checked={settings.orderHistory} onChange={v => update('orderHistory', v)} />
              </SettingRow>
              <SettingRow icon="translate" label="Language" sublabel={settings.language} onClick={() => {}} />
              <SettingRow icon="analytics" label="Share Analytics" sublabel="Help improve Medio">
                <ToggleSwitch checked={settings.shareAnalytics} onChange={v => update('shareAnalytics', v)} />
              </SettingRow>
            </div>
          </section>

          {/* ── Support & Legal ── */}
          <section style={{ marginBottom: 24 }}>
            <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>Support & Legal</p>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="help" label="Help Center" sublabel="FAQs and guides" onClick={() => {}} />
              <SettingRow icon="chat" label="Chat with Us" sublabel="24/7 support" onClick={() => {}} />
              <SettingRow icon="bug_report" label="Report a Problem" onClick={() => showToast('success', 'Bug report form opened')} />
              <SettingRow icon="description" label="Terms of Service" onClick={() => {}} />
              <SettingRow icon="privacy_tip" label="Privacy Policy" onClick={() => {}} />
              <SettingRow icon="gavel" label="Licenses" onClick={() => {}} />
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section style={{ marginBottom: 24 }}>
            <div className="card" style={{ padding: '4px 16px', cursor: 'default' }}>
              <SettingRow icon="logout" label="Log Out" sublabel="Sign out of this device" danger onClick={async () => {
                 try {
                   const live = isSupabaseLive();
                   if (live) await supabase.auth.signOut();
                 } catch (e) {
                   console.error(e);
                 }
                 showToast('info', 'Logged out successfully!');
                 navigate('/user/login');
               }} />
              <SettingRow icon="delete_forever" label="Delete Account" sublabel="Permanently delete all data" danger onClick={() => showToast('error', 'Account deletion requires confirmation')} />
            </div>
          </section>

          {/* App Version */}
          <div style={{ textAlign: 'center', padding: '16px 0 100px', opacity: 0.4 }}>
            <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 2 }}>Medio</p>
            <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>v1.0.0 · Build 2024.05.28</p>
            <p style={{ fontSize: 10, color: 'var(--ink-secondary)', marginTop: 4 }}>Made with ❤️ in Mumbai</p>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
