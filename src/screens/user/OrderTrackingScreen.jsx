import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CountdownTimer from '../../components/CountdownTimer';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

const STATE_CONFIG = {
  FLASH_WINDOW: {
    icon: 'manage_search',
    iconColor: 'var(--primary)',
    iconBg: 'var(--primary-fixed)',
    title: 'Searching for Pharmacy',
    sub: 'We\'re finding the best nearby pharmacy for your order',
    stepsDone: 1,
  },
  ACCEPTED: {
    icon: 'store',
    iconColor: 'var(--secondary)',
    iconBg: 'var(--secondary-container)',
    title: 'Order Accepted!',
    sub: 'Your pharmacy is reviewing and packaging your items',
    stepsDone: 2,
  },
  PACKAGING: {
    icon: 'inventory_2',
    iconColor: 'var(--secondary)',
    iconBg: 'var(--secondary-container)',
    title: 'Packaging Your Order',
    sub: 'Items are being carefully packed with dosage labels',
    stepsDone: 2,
  },
  READY_FOR_PICKUP: {
    icon: 'pedal_bike',
    iconColor: 'var(--tertiary)',
    iconBg: 'var(--tertiary-fixed)',
    title: 'Ready for Pickup',
    sub: 'Your order is packed. Dispatching a rider now…',
    stepsDone: 3,
  },
  RIDER_DISPATCHED: {
    icon: 'two_wheeler',
    iconColor: 'var(--primary)',
    iconBg: 'var(--primary-fixed)',
    title: 'Rider on the Way!',
    sub: 'Your delivery partner is heading to you',
    stepsDone: 3,
  },
  DELIVERED: {
    icon: 'check_circle',
    iconColor: 'var(--secondary)',
    iconBg: 'var(--secondary-container)',
    title: 'Order Delivered!',
    sub: 'Your medicines have been delivered. Feel better soon! 💊',
    stepsDone: 4,
  },
  EXPIRED: {
    icon: 'timer_off',
    iconColor: 'var(--error)',
    iconBg: 'var(--error-container)',
    title: 'No Pharmacy Found',
    sub: 'Unfortunately, no pharmacy was available. Please try again.',
    stepsDone: 0,
  },
};

const STEPS = [
  { label: 'Order Placed', icon: 'receipt_long' },
  { label: 'Pharmacy Found', icon: 'store' },
  { label: 'Out for Delivery', icon: 'two_wheeler' },
  { label: 'Delivered', icon: 'home' },
];

const MOCK_PAST_ORDERS = [
  { id: 'MED-55102', type: 'OTC', status: 'DELIVERED', createdAt: '2026-05-28T14:30:00.000Z', totalPaise: 24500, items: [{ name: 'Crocin Advance 500mg', qty: 2 }, { name: 'Dolo 650mg Tabs', qty: 1 }] },
  { id: 'MED-44289', type: 'RX', status: 'DELIVERED', createdAt: '2026-05-25T11:15:00.000Z', totalPaise: 56000, items: [{ name: 'Amoxicillin 500mg', qty: 21 }] }
];

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

export default function OrderTrackingScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { orderStatus, orderId, pharmacyName, riderName, riderEta, flashWindowEndsAt } = state;
  const confettiRef = useRef(null);

  // Dynamic user past orders state
  const [pastOrders, setPastOrders] = useState(MOCK_PAST_ORDERS);
  const [loadingPast, setLoadingPast] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const config = STATE_CONFIG[orderStatus] || STATE_CONFIG.FLASH_WINDOW;

  const isSupabaseLive = useCallback(() => {
    return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
  }, []);

  // Fetch live past orders
  const fetchPastOrders = useCallback(async () => {
    const live = isSupabaseLive();
    if (!live) {
      setLoadingPast(false);
      return;
    }
    try {
      console.log('🔄 [OrderTracking] Fetching user orders from database...');
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          pharmacy:Pharmacy(name)
        `)
        .eq('userId', 'usr-jayesh')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter out current active in-progress order so it is not shown twice
        const activeStates = ['PENDING_FLASH', 'ACCEPTED', 'PACKAGING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'IN_TRANSIT'];
        const list = data.filter(o => {
          if (o.id === orderId && activeStates.includes(o.status)) {
            return false;
          }
          return true;
        });
        setPastOrders(list);
      }
    } catch (err) {
      console.error('❌ [OrderTracking] History query failed:', err);
    } finally {
      setLoadingPast(false);
    }
  }, [orderId, isSupabaseLive]);

  useEffect(() => {
    fetchPastOrders();

    const live = isSupabaseLive();
    if (!live) return;

    // Realtime Postgres sync for user orders list
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        () => {
          console.log('⚡ [OrderTracking] Live update detected. Refreshing list...');
          fetchPastOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPastOrders, isSupabaseLive]);

  // Trigger confetti on delivery
  useEffect(() => {
    if (orderStatus === 'DELIVERED' && confettiRef.current) {
      confettiRef.current.style.display = 'flex';
    }
  }, [orderStatus]);

  return (
    <div className="screen" style={{ background: 'var(--surface)', paddingBottom: 100 }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <button onClick={() => navigate('/user')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--on-surface)', padding: 4 }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-card-title" style={{ fontSize: 18 }}>My Orders</h1>
      </header>

      <main style={{ paddingTop: 68 }}>
        <div className="screen-content" style={{ paddingTop: 16 }}>

          {/* Confetti overlay (delivered) */}
          <div ref={confettiRef} style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 80 }}>
            {[...Array(18)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 8, height: 16,
                background: ['#0051df', '#006e2f', '#855300', '#ba1a1a', '#6bff8f', '#b5c4ff'][i % 6],
                borderRadius: 2,
                left: `${5 + (i * 5.5)}%`,
                top: '-10px',
                animation: `confetti-fall ${1.2 + (i % 4) * 0.3}s ease-out ${i * 0.08}s forwards`,
                opacity: 0,
              }} />
            ))}
          </div>

          {/* ==================== ACTIVE ORDER TRACKING (TOP) ==================== */}
          {orderStatus !== 'IDLE' ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'searching-pulse 1.5s infinite' }} />
                <h2 className="font-label-caps" style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>ACTIVE TRACKING</h2>
                {orderId && <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginLeft: 'auto' }}>#{orderId}</span>}
              </div>

              <div className="card" style={{ padding: 20, border: '2.5px solid var(--primary-fixed-dim)', boxShadow: 'var(--shadow-lifted)' }}>
                {/* Status icon */}
                <div className="animate-bounce-in" style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: config.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                    animation: orderStatus === 'FLASH_WINDOW' ? 'searching-pulse 2s ease-in-out infinite' : 'bounce-in 0.5s ease both',
                  }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 32, color: config.iconColor }}>{config.icon}</span>
                  </div>
                  <h3 className="font-card-title" style={{ fontSize: 16, marginBottom: 4 }}>{config.title}</h3>
                  <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, maxWidth: 260, margin: '0 auto' }}>{config.sub}</p>
                </div>

                {/* Countdown for flash window */}
                {orderStatus === 'FLASH_WINDOW' && flashWindowEndsAt && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <CountdownTimer
                      endsAt={flashWindowEndsAt}
                      onExpire={() => dispatch({ type: 'EXPIRE_ORDER' })}
                    />
                  </div>
                )}

                {/* Pharmacy info */}
                {(orderStatus === 'ACCEPTED' || orderStatus === 'PACKAGING' || orderStatus === 'READY_FOR_PICKUP' || orderStatus === 'RIDER_DISPATCHED' || orderStatus === 'DELIVERED') && pharmacyName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-container-low)', padding: 12, borderRadius: 12, border: '1px solid var(--border-hairline)', marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--secondary)' }}>store</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>{pharmacyName}</p>
                      <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 11 }}>1.2 km away · Partner Pharmacy</p>
                    </div>
                  </div>
                )}

                {/* Rider info */}
                {(orderStatus === 'RIDER_DISPATCHED') && riderName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-container-low)', padding: 12, borderRadius: 12, border: '1px solid var(--border-hairline)', marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-fixed)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCSA6uA-ucfoSz3_3OzXTZZxgzeOnxiaYpaGH-GHI2g4jsgCQXpJbK20oD8b0UM00gAzMmtsv5rELzcTVli7QgrGFkmHvlc1Q8R9EaMY5OIz06-UodsYBV5_0JACl2aa7AoLAE0ovY-09yyUWV0qk68CZ-BTlmK5R6ysjCDNhsWwWVuYB0fRjp2gQnJ5sJb63xhXVccyeCq7o-3c0l5sFbwY53bmObKseUFI2pNK_83hKlmT1FF3ywfHyoHdQlL86Iic13O04G4L0" alt={riderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 13 }}>{riderName}</p>
                      <p className="font-body-sm" style={{ color: 'var(--primary)', fontSize: 11 }}>ETA: ~{riderEta} minutes</p>
                    </div>
                    <button style={{ background: 'var(--primary-fixed)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 16 }}>call</span>
                    </button>
                  </div>
                )}

                {/* Progress Steps */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', background: 'var(--surface-container-lowest)', padding: '12px 10px', borderRadius: 12, border: '1px solid var(--border-hairline)', marginBottom: 20 }}>
                  <div style={{ position: 'absolute', top: 22, left: '12.5%', right: '12.5%', height: 2, background: 'var(--surface-container)', zIndex: 0 }} />
                  {orderStatus !== 'EXPIRED' && (
                    <div style={{
                      position: 'absolute', top: 22, left: '12.5%', height: 2, zIndex: 1,
                      background: 'var(--secondary)',
                      width: `${Math.min(75, (config.stepsDone - 1) * 25)}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  )}
                  {STEPS.map((step, idx) => {
                    const done = config.stepsDone > idx && orderStatus !== 'EXPIRED';
                    const active = config.stepsDone === idx + 1 && orderStatus !== 'EXPIRED';
                    return (
                      <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 2, width: '25%' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: done ? 'var(--secondary)' : active ? 'var(--primary)' : 'var(--surface-container)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${done ? 'var(--secondary)' : active ? 'var(--primary)' : 'var(--border-hairline)'}`,
                          transition: 'background 0.3s ease',
                        }}>
                          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 12, color: done || active ? '#fff' : 'var(--outline)' }}>{step.icon}</span>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: done || active ? 600 : 400, color: done || active ? 'var(--on-surface)' : 'var(--ink-secondary)', textAlign: 'center', lineHeight: '12px' }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {orderStatus === 'EXPIRED' && (
                  <button className="btn-primary btn-pill" style={{ width: '100%', height: 48 }} onClick={() => { dispatch({ type: 'RESET_ORDER' }); navigate('/user'); }}>
                    Try Again
                  </button>
                )}
                {orderStatus === 'DELIVERED' && (
                  <button className="btn-primary btn-pill" style={{ width: '100%', height: 48, background: 'var(--secondary)', boxShadow: '0 4px 16px rgba(0,110,47,0.25)' }} onClick={() => { dispatch({ type: 'RESET_ORDER' }); fetchPastOrders(); }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18 }}>check_circle</span>
                    DISMISS &amp; COMPLETE
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* ==================== PAST ORDERS SECTION ==================== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="font-heading-md" style={{ fontSize: 18 }}>
              {showAllOrders ? `Order History (${pastOrders.length} orders)` : 'Order History'}
            </h2>
            {!showAllOrders && pastOrders.length > 0 && (
              <span className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, fontWeight: 600 }}>Showing Top 5</span>
            )}
          </div>

          {loadingPast ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--primary)', animation: 'spin 1.2s linear infinite' }}>progress_activity</span>
            </div>
          ) : pastOrders.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {(showAllOrders ? pastOrders : pastOrders.slice(0, 5)).map((order, idx) => {
                  const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                  const formattedDate = new Date(safeParseUTC(order.createdAt)).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div key={order.id} className="card animate-slide-up" style={{
                      padding: 16, cursor: 'default',
                      animationDelay: `${idx * 0.05}s`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span className="badge" style={{
                              background: order.status === 'DELIVERED' ? 'rgba(0,110,47,0.08)' : 'var(--surface-container-high)',
                              color: order.status === 'DELIVERED' ? 'var(--secondary)' : 'var(--outline)',
                              fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 700
                            }}>{order.status}</span>
                            <span style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>{order.type === 'RX' ? 'Rx Prescription' : 'OTC Order'}</span>
                          </div>
                          <h4 className="font-body-sm" style={{ fontWeight: 700, fontSize: 14 }}>Order #{order.id}</h4>
                          <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 11, marginTop: 2 }}>{formattedDate}</p>
                        </div>
                        <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>
                          ₹{order.totalPaise ? order.totalPaise / 100 : 340}
                        </p>
                      </div>

                      {/* Order contents summary box */}
                      <div style={{ background: 'var(--surface-container-lowest)', padding: 12, borderRadius: 12, border: '1px solid var(--border-hairline)' }}>
                        {itemsList && itemsList.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: i < itemsList.length - 1 ? '1px solid var(--border-hairline)' : 'none' }}>
                            <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{item.name}</span>
                            <span style={{ color: 'var(--ink-secondary)', fontWeight: 500 }}>x{item.qty || 1}</span>
                          </div>
                        ))}
                      </div>

                      {/* Fulfilling pharmacy details */}
                      {order.pharmacy?.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingLeft: 2 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--secondary)' }}>store</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 500 }}>Fulfilled by {order.pharmacy.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showAllOrders && pastOrders.length > 5 && (
                <button
                  onClick={() => setShowAllOrders(true)}
                  style={{
                    width: '100%', height: 48, borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'var(--surface-container-high)', border: '1px solid var(--border-hairline)',
                    color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: 'var(--shadow-global)', transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
                  View All ({pastOrders.length} orders)
                </button>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--outline-variant)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--outline)' }}>receipt_long</span>
              </div>
              <h3 className="font-card-title" style={{ fontSize: 15, marginBottom: 4 }}>No Past Orders</h3>
              <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, maxWidth: 220, margin: '0 auto' }}>You haven't placed any medical orders yet. Start exploring now!</p>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
