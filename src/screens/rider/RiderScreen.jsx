import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../config/supabase';

export default function RiderScreen() {
  const navigate = useNavigate();
  const { state, dispatch, showToast, isSupabaseLive } = useApp();
  
  const [activeOrder, setActiveOrder] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);
  
  // Bottom sheet expansion state for the map screen
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // 1. Fetch active order and history
  const fetchData = useCallback(async () => {
    if (!isSupabaseLive()) {
      setLoading(false);
      return;
    }

    try {
      // Query active order assigned to Rahul
      const { data: activeData, error: activeErr } = await supabase
        .from('Order')
        .select(`
          *,
          pharmacy:Pharmacy(name, addressLine, phone)
        `)
        .eq('riderId', 'rdr-rahul')
        .in('status', ['RIDER_ASSIGNED', 'IN_TRANSIT', 'READY_FOR_PICKUP'])
        .order('createdAt', { ascending: false })
        .limit(1);

      if (activeErr) throw activeErr;
      setActiveOrder(activeData && activeData.length > 0 ? activeData[0] : null);

      // Query past completed deliveries
      const { data: historyData, error: historyErr } = await supabase
        .from('Order')
        .select('*')
        .eq('riderId', 'rdr-rahul')
        .eq('status', 'DELIVERED')
        .order('deliveredAt', { ascending: false })
        .limit(5);

      if (historyErr) throw historyErr;
      setRecentDeliveries(historyData || []);

    } catch (err) {
      console.error('❌ Rider data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseLive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Real-time Subscription to receive new assignments immediately
  useEffect(() => {
    if (!isSupabaseLive()) return;

    console.log('📡 [RIDER] Subscribing to Order updates for Rahul...');
    const channel = supabase
      .channel('rider-order-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        (payload) => {
          const { eventType, new: newRow } = payload;
          console.log('⚡ [RIDER] Realtime Event:', eventType, newRow);
          
          if (newRow && newRow.riderId === 'rdr-rahul') {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [RIDER] Unsubscribing rider-order-channel...');
      supabase.removeChannel(channel);
    };
  }, [isSupabaseLive, fetchData]);

  // 3. Confirm Pickup (Transition RIDER_ASSIGNED -> IN_TRANSIT)
  const handlePickup = async () => {
    if (!activeOrder) return;
    setUpdating(true);
    try {
      console.log(`🚴 Rider picking up order ${activeOrder.id}...`);
      
      const { error: updateErr } = await supabase
        .from('Order')
        .update({
          status: 'IN_TRANSIT',
          pickedUpAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      if (updateErr) throw updateErr;

      showToast('success', 'Order picked up! Navigate to delivery address.');
      
      // Update global context state if unified session
      dispatch({
        type: 'FORCE_SYNC_ORDER',
        payload: { orderStatus: 'RIDER_DISPATCHED' }
      });

      // Expand bottom sheet by default to give clear "deliver" option
      setIsSheetExpanded(false);

      await fetchData();
    } catch (err) {
      console.error('❌ Pickup failed:', err);
      showToast('error', 'Failed to confirm pickup.');
    } finally {
      setUpdating(false);
    }
  };

  // 4. Mark Delivered (Transition IN_TRANSIT -> DELIVERED)
  const handleDeliver = async () => {
    if (!activeOrder) return;
    setUpdating(true);
    try {
      console.log(`🏁 Rider completed delivery for order ${activeOrder.id}...`);
      
      // Update order status to DELIVERED
      const { error: orderErr } = await supabase
        .from('Order')
        .update({
          status: 'DELIVERED',
          deliveredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      if (orderErr) throw orderErr;

      // Update rider status to available
      const { error: riderErr } = await supabase
        .from('Rider')
        .update({ isAvailable: true })
        .eq('id', 'rdr-rahul');

      if (riderErr) throw riderErr;

      showToast('success', 'Order delivered successfully! Good job!');
      
      // Update global context state if unified session
      dispatch({
        type: 'FORCE_SYNC_ORDER',
        payload: { orderStatus: 'DELIVERED' }
      });

      setActiveOrder(null);
      setIsSheetExpanded(false);
      await fetchData();
    } catch (err) {
      console.error('❌ Delivery completion failed:', err);
      showToast('error', 'Failed to complete delivery.');
    } finally {
      setUpdating(false);
    }
  };

  const activeItems = activeOrder?.items 
    ? (typeof activeOrder.items === 'string' ? JSON.parse(activeOrder.items) : activeOrder.items)
    : [];

  const isInTransit = activeOrder && activeOrder.status === 'IN_TRANSIT';

  return (
    <div className="screen" style={{ 
      background: isInTransit ? '#14161d' : 'var(--surface)', 
      overflow: isInTransit ? 'hidden' : 'auto',
      paddingBottom: isInTransit ? 0 : 80
    }}>
      
      {/* Dynamic Keyframes injected for animated map road/vehicle effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes scooter-travel {
          0% {
            offset-distance: 0%;
          }
          50% {
            offset-distance: 100%;
          }
          100% {
            offset-distance: 0%;
          }
        }
        @keyframes map-ripple {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}} />

      {/* Header — Suppressed in active navigation mode for full-screen immersive view */}
      {!isInTransit && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--canvas-white)', borderBottom: '1px solid var(--border-hairline)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', boxShadow: 'var(--shadow-global)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--tertiary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 22 }}>two_wheeler</span>
            </div>
            <div>
              <h1 className="font-card-title" style={{ fontSize: 16, lineHeight: '18px' }}>Rider Dashboard</h1>
              <p className="font-body-sm" style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>rdr-rahul (Rahul S.)</p>
            </div>
          </div>

          {/* Duty Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isOnDuty ? 'var(--secondary)' : 'var(--outline)' }}>
              {isOnDuty ? 'ON DUTY' : 'OFFLINE'}
            </span>
            <button 
              onClick={() => setIsOnDuty(o => !o)}
              style={{
                background: isOnDuty ? 'var(--secondary-container)' : 'var(--surface-container-high)',
                border: 'none', borderRadius: 'var(--radius-pill)',
                width: 48, height: 26, padding: 3, cursor: 'pointer',
                display: 'flex', justifyContent: isOnDuty ? 'flex-end' : 'flex-start',
                transition: 'background 0.25s ease'
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: isOnDuty ? 'var(--secondary)' : 'var(--outline)', transition: 'background 0.25s ease' }} />
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      {isInTransit ? (
        /* ==================== ACTIVE IN-TRANSIT UBER-STYLE MAP SCREEN ==================== */
        <div style={{ position: 'relative', width: '100vw', height: '100dvh', background: '#111216', overflow: 'hidden' }}>
          
          {/* 1. Uber Night Map Canvas (Stylized SVG Road Map) */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">
            <defs>
              {/* Radial gradient to highlight the active viewport */}
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e2230" />
                <stop offset="100%" stopColor="#111216" />
              </radialGradient>
              {/* Drop shadow for pins */}
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* Background Map glow */}
            <rect width="360" height="640" fill="url(#glow)" />

            {/* Road Grid Lines (Sleek dark grid representing roads) */}
            <g stroke="#1d202b" strokeWidth="2.5" opacity="0.6">
              {/* Horizontal Streets */}
              <line x1="-50" y1="120" x2="450" y2="120" />
              <line x1="-50" y1="220" x2="450" y2="220" />
              <line x1="-50" y1="320" x2="450" y2="320" />
              <line x1="-50" y1="420" x2="450" y2="420" />
              <line x1="-50" y1="520" x2="450" y2="520" />
              
              {/* Vertical Avenues */}
              <line x1="80" y1="-50" x2="80" y2="700" />
              <line x1="180" y1="-50" x2="180" y2="700" />
              <line x1="280" y1="-50" x2="280" y2="700" />
            </g>

            {/* Diagonal Highway/Bypass */}
            <line x1="-50" y1="-50" x2="450" y2="450" stroke="#1d202b" strokeWidth="4" opacity="0.4" />

            {/* 2. Glowing Neon Navigation Route Line */}
            {/* The active pathway goes from Pharmacy (180, 420) to Destination (280, 220) via a corner */}
            <path 
              id="nav-path"
              d="M 180 420 L 180 220 L 280 220" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0px 0px 8px var(--primary-container))',
                opacity: 0.85
              }}
            />
            {/* Animated Traffic dots moving along path */}
            <path 
              d="M 180 420 L 180 220 L 280 220" 
              fill="none" 
              stroke="#6bff8f" 
              strokeWidth="2.5" 
              strokeDasharray="8, 12" 
              strokeLinecap="round"
              style={{
                animation: 'dash 15s linear infinite',
                opacity: 0.9
              }}
            />

            {/* 3. PULSING RADAR RIPPLES (GPS Location accuracy rings) */}
            {/* Pharmacy Radar */}
            <circle cx="180" cy="420" r="16" fill="rgba(0, 110, 47, 0.15)" />
            <circle cx="180" cy="420" r="8" fill="none" stroke="var(--secondary)" strokeWidth="1.5" style={{ animation: 'map-ripple 2s infinite ease-out' }} />
            
            {/* Destination Radar */}
            <circle cx="280" cy="220" r="18" fill="rgba(0, 81, 223, 0.15)" />
            <circle cx="280" cy="220" r="8" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ animation: 'map-ripple 2s infinite ease-out' }} />

            {/* 4. PIN MARKERS */}
            {/* Pharmacy Pin (Origin) */}
            <g transform="translate(180, 420)" filter="url(#shadow)">
              <circle cx="0" cy="0" r="12" fill="var(--secondary)" />
              <circle cx="0" cy="0" r="9" fill="#14161d" />
              <span style={{ display: 'none' }}>local_pharmacy</span>
              <circle cx="0" cy="0" r="4" fill="var(--secondary)" />
            </g>

            {/* Patient Home Pin (Destination) */}
            <g transform="translate(280, 220)" filter="url(#shadow)">
              <path d="M 0 0 C -8 -12 -12 -16 -12 -24 C -12 -32 -6 -36 0 -36 C 6 -36 12 -32 12 -24 C 12 -16 8 -12 0 0 Z" fill="var(--primary)" />
              <circle cx="0" cy="-24" r="5" fill="#fff" />
            </g>

            {/* 5. ANIMATED RIDER SCOOTER (Glide along path using CSS offsetPath) */}
            <g style={{
              offsetPath: "path('M 180 420 L 180 220 L 280 220')",
              animation: 'scooter-travel 24s linear infinite',
              transformBox: 'fill-box',
              transformOrigin: 'center'
            }}>
              {/* Ripple under rider */}
              <circle cx="0" cy="0" r="14" fill="rgba(245, 158, 11, 0.25)" />
              <circle cx="0" cy="0" r="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" style={{ animation: 'map-ripple 1.5s infinite ease-out' }} />
              
              {/* Scooter marker base bubble */}
              <circle cx="0" cy="0" r="10" fill="#f59e0b" filter="url(#shadow)" />
              {/* Tiny internal scooter symbol dot */}
              <circle cx="0" cy="0" r="4" fill="#fff" />
            </g>
          </svg>

          {/* 6. Uber-style Floating Top HUD (Active directions/status) */}
          <div className="animate-slide-up" style={{
            position: 'absolute', top: 20, left: 16, right: 16, zIndex: 100,
            background: '#1a1d26', borderRadius: 16, border: '1.5px solid #282c3b',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff', cursor: 'default'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0
            }}>
              <span className="material-symbols-outlined animate-pulse-countdown" style={{ fontSize: 22 }}>navigation</span>
            </div>
            <div style={{ flex: 1 }}>
              <p className="font-body-sm" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>EN ROUTE TO PATIENT</p>
              <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 14 }}>Deliver package to Jayesh H.</p>
              <p className="font-body-sm" style={{ color: 'var(--primary-fixed-dim)', fontSize: 12, marginTop: 1 }}>ETA: ~8 minutes (1.2 km away)</p>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#6bff8f', fontSize: 20 }}>gps_fixed</span>
          </div>

          {/* 7. Tactical Drawer Tab / Sliding Bottom Sheet */}
          {/* Bottom sheet backdrop overlay when expanded */}
          {isSheetExpanded && (
            <div 
              onClick={() => setIsSheetExpanded(false)}
              style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                zIndex: 1000, transition: 'opacity 0.3s ease', animation: 'fade-in 0.2s ease'
              }}
            />
          )}

          {/* Bottom Sheet wrapper */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1001,
            maxWidth: 480, width: '100%',
            background: 'var(--canvas-white)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
            height: isSheetExpanded ? '460px' : '96px',
            transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {/* Drag Handle Bar / Interactive Tab Header */}
            <div 
              onClick={() => setIsSheetExpanded(!isSheetExpanded)}
              style={{
                padding: '12px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', borderBottom: '1px solid var(--border-hairline)',
                background: 'var(--canvas-white)', flexShrink: 0
              }}
            >
              {/* Drag handle */}
              <div style={{ width: 44, height: 5, borderRadius: 2.5, background: 'var(--outline-variant)', marginBottom: 8 }} />
              
              {/* Compact collapsed preview */}
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 22 }}>local_shipping</span>
                  <div>
                    <h3 className="font-body-sm" style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>
                      Active Assignment Details
                    </h3>
                    <p className="font-body-sm" style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                      Fulfill: {activeOrder.pharmacy?.name || 'MedPlus Pharmacy'}
                    </p>
                  </div>
                </div>
                
                {/* Arrow toggle */}
                <span className="material-symbols-outlined" style={{
                  color: 'var(--outline)',
                  transform: isSheetExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  keyboard_arrow_up
                </span>
              </div>
            </div>

            {/* Bottom Sheet Expanded Contents (Mark as Delivered options) */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 24px', 
              opacity: isSheetExpanded ? 1 : 0, transition: 'opacity 0.25s ease'
            }}>
              
              {/* Patient delivery info */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>person</span>
                </div>
                <div>
                  <p className="font-label-caps" style={{ fontSize: 9, color: 'var(--ink-secondary)', marginBottom: 2 }}>PATIENT NAME</p>
                  <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 15 }}>Jayesh Harrison</p>
                  <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{activeOrder.deliveryAddress}</p>
                </div>
              </div>

              {/* Items checklist block */}
              <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 16, border: '1px solid var(--border-hairline)', marginBottom: 24 }}>
                <p className="font-label-caps" style={{ fontSize: 9, color: 'var(--ink-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>checklist</span>
                  CHECKLIST FOR HANDOVER
                </p>
                {activeItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, padding: '6px 0', borderBottom: idx < activeItems.length - 1 ? '1px solid var(--border-hairline)' : 'none' }}>
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--primary)' }}>Qty: {item.qty || 1}</span>
                  </div>
                ))}
              </div>

              {/* Mark as Delivered Call to Action button */}
              <button
                onClick={handleDeliver}
                disabled={updating}
                className="btn-primary btn-pill"
                style={{
                  width: '100%', height: 60, fontSize: 16,
                  background: 'var(--secondary)',
                  boxShadow: '0 8px 24px rgba(0,110,47,0.4)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {updating ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>progress_activity</span> Confirming Delivery…</>
                ) : (
                  <><span className="material-symbols-outlined icon-fill" style={{ fontSize: 24 }}>check_circle</span> COMPLETE DELIVERY</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== NORMAL STANDARD RIDER DASHBOARD FLOW ==================== */
        <>
          <main style={{ paddingTop: 68, paddingBottom: 60 }}>
            <div className="screen-content" style={{ paddingTop: 20 }}>
              
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 100 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)', animation: 'spin 1.2s linear infinite' }}>progress_activity</span>
                  <p className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Synchronizing GPS & delivery dispatch...</p>
                </div>
              ) : (
                <>
                  {/* Active Delivery Section */}
                  <h2 className="font-heading-md" style={{ fontSize: 18, marginBottom: 14 }}>Active Assignment</h2>
                  
                  {activeOrder ? (
                    /* This is RIDER_ASSIGNED state (awaiting pickup confirmation) */
                    <div className="card animate-bounce-in" style={{
                      background: 'var(--canvas-white)', borderRadius: 'var(--radius-card)',
                      padding: 20, border: '2px solid var(--tertiary-container)',
                      boxShadow: 'var(--shadow-lifted)', marginBottom: 24, cursor: 'default'
                    }}>
                      {/* Status Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span className="badge" style={{
                          background: 'rgba(133,83,0,0.1)', color: 'var(--tertiary)',
                          fontWeight: 700, fontSize: 11
                        }}>
                          📦 READY FOR PICKUP
                        </span>
                        <span className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)', fontWeight: 600 }}>
                          #{activeOrder.id}
                        </span>
                      </div>

                      {/* Pickup Location details */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>store</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p className="font-label-caps" style={{ fontSize: 9, color: 'var(--ink-secondary)', marginBottom: 2 }}>PICKUP FROM PHARMACY</p>
                          <p className="font-body-sm" style={{ fontWeight: 700 }}>{activeOrder.pharmacy?.name || 'Partner Pharmacy'}</p>
                          <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{activeOrder.pharmacy?.addressLine || 'Shop 12, DN Nagar, Andheri West'}</p>
                        </div>
                      </div>

                      {/* Divider line */}
                      <div style={{ borderLeft: '2px dashed var(--border-hairline)', height: 24, marginLeft: 15, marginTop: -16, marginBottom: -4 }} />

                      {/* Delivery Location details */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>location_on</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p className="font-label-caps" style={{ fontSize: 9, color: 'var(--ink-secondary)', marginBottom: 2 }}>DELIVER TO PATIENT</p>
                          <p className="font-body-sm" style={{ fontWeight: 700 }}>Jayesh Harrison</p>
                          <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{activeOrder.deliveryAddress}</p>
                        </div>
                      </div>

                      {/* Items list */}
                      <div style={{ background: 'var(--surface-container-lowest)', padding: 14, borderRadius: 12, border: '1px solid var(--border-hairline)', marginBottom: 20 }}>
                        <p className="font-label-caps" style={{ fontSize: 9, color: 'var(--ink-secondary)', marginBottom: 8 }}>ITEMS TO HANDOVER</p>
                        {activeItems.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, padding: '4px 0', borderBottom: idx < activeItems.length - 1 ? '1px solid var(--border-hairline)' : 'none' }}>
                            <span>{item.name}</span>
                            <span style={{ color: 'var(--primary)' }}>x{item.qty || 1}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={handlePickup}
                        disabled={updating || !isOnDuty}
                        className="btn-primary btn-pill"
                        style={{
                          width: '100%', height: 56, fontSize: 15,
                          background: 'var(--primary)',
                          boxShadow: '0 6px 20px rgba(0,81,223,0.3)',
                          cursor: isOnDuty ? 'pointer' : 'not-allowed',
                          opacity: isOnDuty ? 1 : 0.6
                        }}
                      >
                        {updating ? (
                          <><span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>progress_activity</span> Processing Pickup…</>
                        ) : (
                          <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_shipping</span> CONFIRM PICKUP &amp; START TRANSIT</>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* No Active Order (Pulse radar animation) */
                    <div className="card" style={{
                      background: 'var(--canvas-white)', borderRadius: 'var(--radius-card)',
                      padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 16, textAlign: 'center', border: '1px dashed var(--outline-variant)',
                      marginBottom: 24, cursor: 'default'
                    }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: isOnDuty ? 'var(--tertiary-fixed)' : 'var(--surface-container-high)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: isOnDuty ? 'searching-pulse 2s ease-in-out infinite' : 'none'
                      }}>
                        <span className="material-symbols-outlined" style={{
                          fontSize: 32,
                          color: isOnDuty ? 'var(--tertiary)' : 'var(--outline)'
                        }}>
                          {isOnDuty ? 'wifi_tethering' : 'wifi_tethering_off'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-card-title" style={{ fontSize: 16, marginBottom: 4 }}>
                          {isOnDuty ? 'Waiting for Assignments' : 'You are Offline'}
                        </h3>
                        <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, maxWidth: 260 }}>
                          {isOnDuty 
                            ? 'Your live GPS location is active. Fulfilling pharmacies will auto-assign orders shortly.' 
                            : 'Switch to On Duty to receive nearby prescription and OTC delivery requests.'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recent Deliveries List */}
                  <h2 className="font-heading-md" style={{ fontSize: 18, marginBottom: 14 }}>My Completed Deliveries</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentDeliveries.length > 0 ? (
                      recentDeliveries.map((delivery) => (
                        <div key={delivery.id} className="card" style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 16px', background: 'var(--canvas-white)'
                        }}>
                          <div>
                            <p className="font-body-sm" style={{ fontWeight: 700 }}>Order #{delivery.id}</p>
                            <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                              {delivery.deliveryAddress.split(',').slice(-2).join(',').trim()}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>
                              DELIVERED
                            </span>
                            <p className="font-body-sm" style={{ fontSize: 10, color: 'var(--ink-secondary)', marginTop: 4 }}>
                              {new Date(delivery.deliveredAt || delivery.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', textAlign: 'center', padding: '12px 0' }}>
                        No deliveries completed today yet.
                      </p>
                    )}
                  </div>
                </>
              )}

            </div>
          </main>
        </>
      )}
    </div>
  );
}
