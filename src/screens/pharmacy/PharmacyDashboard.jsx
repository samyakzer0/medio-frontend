import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

const MOCK_RECENT_ORDERS = [
  { id: 'MED-77234', type: 'Rx', status: 'DELIVERED', patient: 'Priya M.', time: '2h ago', amount: '₹340' },
  { id: 'MED-66912', type: 'OTC', status: 'DELIVERED', patient: 'Rajan K.', time: '5h ago', amount: '₹215' },
  { id: 'MED-55438', type: 'Rx', status: 'DELIVERED', patient: 'Sunita L.', time: 'Yesterday', amount: '₹560' },
];

const STATUS_CONFIG = {
  DELIVERED: { label: 'DELIVERED', color: 'var(--secondary)', bg: 'rgba(0,110,47,0.1)' },
  RETURNED: { label: 'RETURNED', color: 'var(--tertiary)', bg: 'var(--tertiary-fixed)' },
  CANCELLED: { label: 'CANCELLED', color: 'var(--error)', bg: 'var(--error-container)' },
  FLASH_EXPIRED: { label: 'EXPIRED', color: 'var(--outline)', bg: 'var(--surface-container)' },
  ACCEPTED: { label: 'ACCEPTED', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  PACKAGING: { label: 'PACKAGING', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  READY_FOR_PICKUP: { label: 'READY', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  RIDER_ASSIGNED: { label: 'DISPATCHED', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  IN_TRANSIT: { label: 'IN TRANSIT', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  PENDING_FLASH: { label: 'PENDING', color: 'var(--tertiary)', bg: 'rgba(133,83,0,0.1)' }
};

const safeParseUTC = (dateVal) => {
  if (!dateVal) return Date.now();
  if (typeof dateVal === 'number') return dateVal;
  if (dateVal instanceof Date) return dateVal.getTime();
  
  let str = String(dateVal).trim();
  if (str.endsWith('Z') || str.includes('+') || /-[0-9]{2}:[0-9]{2}$/.test(str)) {
    return new Date(str).getTime();
  }
  str = str.replace(' ', 'T');
  if (!str.endsWith('Z')) {
    str = str + 'Z';
  }
  return new Date(str).getTime();
};

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { state, isSupabaseLive } = useApp();

  // Dynamic Dashboard States
  const [recentOrders, setRecentOrders] = useState(MOCK_RECENT_ORDERS);
  const [stats, setStats] = useState({
    ordersToday: '12',
    earnings: '₹2.4k',
    avgTime: '8 min'
  });

  // Fetch live stats & recent orders from database
  const fetchDashboardData = useCallback(async () => {
    const live = isSupabaseLive && isSupabaseLive();
    if (!live) {
      console.log('💡 PharmacyDashboard: Supabase credentials unset. Operating in local sandbox mode.');
      return;
    }

    try {
      console.log('🔄 [PharmacyDashboard] Querying live order data and stats...');
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          user:User(name)
        `)
        .eq('pharmacyId', 'ph1')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data) {
        const now = new Date();
        const todayStr = now.toDateString();

        // 1. Calculate Today's stats
        const todayOrders = data.filter(o => new Date(safeParseUTC(o.createdAt)).toDateString() === todayStr);
        const todayDelivered = todayOrders.filter(o => o.status === 'DELIVERED');
        const todayRev = todayDelivered.reduce((sum, o) => sum + (o.totalPaise || 0) / 100, 0);

        // Calculate average packaging/fulfillment time (acceptedAt to packedAt)
        let totalFulfillmentMinutes = 0;
        let fulfillmentCount = 0;
        data.forEach(o => {
          if (o.acceptedAt && o.packedAt) {
            const minutes = (safeParseUTC(o.packedAt) - safeParseUTC(o.acceptedAt)) / 60000;
            if (minutes > 0) {
              totalFulfillmentMinutes += minutes;
              fulfillmentCount++;
            }
          }
        });
        const avgTimeMin = fulfillmentCount > 0 ? Math.round(totalFulfillmentMinutes / fulfillmentCount) : 8;

        setStats({
          ordersToday: todayOrders.length.toString(),
          earnings: todayRev >= 1000 ? `₹${(todayRev / 1000).toFixed(1)}k` : `₹${todayRev}`,
          avgTime: `${avgTimeMin} min`
        });

        // 2. Map recent 5 orders
        const mappedRecent = data.slice(0, 5).map(dbOrder => {
          const orderTime = new Date(safeParseUTC(dbOrder.createdAt));
          const diffHrs = Math.floor((now.getTime() - orderTime.getTime()) / (3600 * 1000));
          const timeStr = diffHrs < 1 ? 'Just now' : diffHrs < 24 ? `${diffHrs}h ago` : orderTime.toLocaleDateString();

          return {
            id: dbOrder.id,
            type: dbOrder.type === 'RX' ? 'Rx' : 'OTC',
            status: dbOrder.status,
            patient: dbOrder.user?.name || 'Jayesh Harrison',
            time: timeStr,
            amount: `₹${dbOrder.totalPaise ? dbOrder.totalPaise / 100 : 340}`
          };
        });

        if (mappedRecent.length > 0) {
          setRecentOrders(mappedRecent);
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch Pharmacy Dashboard data:', err);
    }
  }, [isSupabaseLive]);

  // Load and subscribe to updates
  useEffect(() => {
    fetchDashboardData();

    const live = isSupabaseLive && isSupabaseLive();
    if (!live) return;

    console.log('📡 [PharmacyDashboard] Subscribing to Order changes...');
    const channel = supabase
      .channel('pharmacy-dashboard-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        () => {
          console.log('⚡ [PharmacyDashboard] Realtime update detected. Reloading metrics...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [PharmacyDashboard] Unsubscribing from Realtime...');
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData, isSupabaseLive]);

  // If there's an active flash ping, redirect to flash terminal
  useEffect(() => {
    if (state.pendingFlashPing && state.orderStatus === 'FLASH_WINDOW') {
      navigate('/pharmacy/flash');
    }
  }, [state.pendingFlashPing, state.orderStatus, navigate]);

  // After acceptance, show packaging
  useEffect(() => {
    if (state.orderStatus === 'PACKAGING' || state.orderStatus === 'ACCEPTED') {
      navigate('/pharmacy/packaging');
    }
  }, [state.orderStatus, navigate]);

  return (
    <div className="screen">
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>medication</span>
          <div>
            <span className="font-heading-md" style={{ color: 'var(--primary)', fontSize: 18 }}>Medio</span>
            <span className="font-body-sm" style={{ color: 'var(--ink-secondary)', marginLeft: 6, fontSize: 12 }}>Partner</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--secondary-container)', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', animation: 'searching-pulse 2s ease-in-out infinite' }} />
          <span className="font-label-caps" style={{ color: 'var(--on-secondary-container)', fontSize: 11 }}>ONLINE</span>
        </div>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>

          {/* Pharmacy Info Card */}
          <div className="card" style={{ padding: 20, marginBottom: 20, cursor: 'default', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 28, color: '#fff' }}>storefront</span>
              </div>
              <div>
                <p className="font-card-title" style={{ color: '#fff', fontSize: 17 }}>MedPlus Pharmacy</p>
                <p className="font-body-sm" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Andheri West · 1.2 km coverage</p>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Orders Today', value: stats.ordersToday, icon: 'receipt_long', color: 'var(--primary)' },
              { label: 'Earnings', value: stats.earnings, icon: 'currency_rupee', color: 'var(--secondary)' },
              { label: 'Avg Time', value: stats.avgTime, icon: 'timer', color: 'var(--tertiary)' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '14px 10px', textAlign: 'center', cursor: 'default' }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 24, color: stat.color, marginBottom: 6, display: 'block' }}>{stat.icon}</span>
                <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--on-surface)', marginBottom: 2 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-secondary)', lineHeight: '14px' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Awaiting flash ping */}
          <div style={{
            background: 'var(--primary-fixed)',
            borderRadius: 'var(--radius-card)',
            padding: 20,
            marginBottom: 24,
            textAlign: 'center',
            border: '1.5px dashed var(--primary)',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,81,223,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'searching-pulse 3s ease-in-out infinite' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary)' }}>notifications_active</span>
            </div>
            <p className="font-body-lg" style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>Awaiting Flash Ping</p>
            <p className="font-body-sm" style={{ color: 'var(--on-primary-fixed-variant)' }}>New orders will appear here instantly</p>
          </div>

          {/* Recent Orders */}
          <section style={{ marginBottom: 100 }}>
            <h2 className="font-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Recent Orders</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map(order => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.DELIVERED;
                return (
                  <div key={order.id} className="card" style={{ padding: 14, cursor: 'default', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: order.type === 'Rx' ? 'var(--primary-fixed)' : 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: order.type === 'Rx' ? 'var(--primary)' : 'var(--secondary)' }}>
                        {order.type === 'Rx' ? 'receipt_long' : 'shopping_bag'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="font-body-sm" style={{ fontWeight: 600, marginBottom: 2 }}>{order.id}</p>
                      <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>{order.patient} · {order.time}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{order.amount}</p>
                      <span className="badge" style={{
                        background: config.bg,
                        color: config.color,
                        fontSize: 9,
                        padding: '2px 8px',
                        fontWeight: 700,
                        borderRadius: 4
                      }}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
