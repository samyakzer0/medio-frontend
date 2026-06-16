
import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';

// Safe parser to convert database date strings (which might lack timezone suffix) consistently to UTC
const safeParseUTC = (dateVal) => {
  if (!dateVal) return Date.now();
  if (typeof dateVal === 'number') return dateVal;
  if (dateVal instanceof Date) return dateVal.getTime();
  
  let str = String(dateVal).trim();
  
  // If it already ends with Z or has timezone offset like +05:30, parse directly
  if (str.endsWith('Z') || str.includes('+') || /-[0-9]{2}:[0-9]{2}$/.test(str)) {
    return new Date(str).getTime();
  }
  
  // If it's a timestamp without timezone, e.g. "2026-05-30 07:26:10.908" or "2026-05-30T07:26:10.908"
  // Normalize to ISO-8601 format and append 'Z' to force Javascript to parse as UTC
  str = str.replace(' ', 'T');
  if (!str.endsWith('Z')) {
    str = str + 'Z';
  }
  return new Date(str).getTime();
};

// ================================================================
// ORDER STATE MACHINE
// ================================================================
// States: IDLE → FLASH_WINDOW → ACCEPTED | EXPIRED → PACKAGING →
//         READY_FOR_PICKUP → RIDER_DISPATCHED → DELIVERED
// ================================================================

const INITIAL_STATE = {
  // App mode
  appMode: 'user', // 'user' | 'pharmacy'

  // Order flow
  orderStatus: 'IDLE',
  // IDLE | FLASH_WINDOW | ACCEPTED | EXPIRED | PACKAGING | READY_FOR_PICKUP | RIDER_DISPATCHED | DELIVERED

  orderId: null,
  orderType: null, // 'rx' | 'otc'
  rxImageUrl: null,
  otcItems: [],
  deliveryAddress: 'Flat 402, Sunshine Heights, DN Nagar, Andheri West',
  userLocation: [19.1235, 72.8258],
  userAddress: 'Flat 402, Sunshine Heights, DN Nagar, Andheri West',
  flashWindowEndsAt: null,
  acceptedByPharmacy: null,
  pharmacyName: null,
  riderName: null,
  riderEta: null,

  // Cart
  cart: [],

  // Flash ping visible to pharmacy
  pendingFlashPing: null, // { orderId, orderType, items, rxImageUrl, expiresAt }

  // Race condition: track which pharmacy accepted
  flashClaimedBy: null,

  // Toast notifications
  toast: null,

  // Services history
  servicesHistory: [
    { id: 'SRV-88310', name: 'Blood Pressure (BP) Checkup', patientName: 'Jayesh Harrison', status: 'COMPLETED', date: '2026-06-12', timeSlot: 'Morning (10:00 AM)', price: 49, icon: 'favorite', iconColor: 'var(--error)' },
    { id: 'SRV-77123', name: 'Comprehensive Vitals Checkup', patientName: 'Jayesh Harrison', status: 'COMPLETED', date: '2026-06-05', timeSlot: 'Evening (5:30 PM)', price: 249, icon: 'health_and_safety', iconColor: '#8b5cf6' }
  ],
};

function orderReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, appMode: action.payload };

    // === CART ACTIONS ===
    case 'ADD_TO_CART': {
      const existing = state.cart.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, qty: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.id !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        cart: state.cart.map(i =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ).filter(i => i.qty > 0),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };

    // === ORDER SUBMISSION ===
    case 'SUBMIT_ORDER': {
      const isLab = action.payload.orderType === 'lab';
      const orderId = action.payload.orderId || (isLab ? 'LAB-' + Math.floor(10000 + Math.random() * 90000) : 'MED-' + Math.floor(10000 + Math.random() * 90000));
      const duration = isLab ? 10 * 60 * 1000 : 3 * 60 * 1000;
      const expiresAt = action.payload.flashExpiresAt || (Date.now() + duration);
      return {
        ...state,
        orderStatus: 'FLASH_WINDOW',
        orderId,
        orderType: action.payload.orderType,
        rxImageUrl: action.payload.rxImageUrl || null,
        otcItems: action.payload.otcItems || state.cart,
        deliveryAddress: action.payload.deliveryAddress || state.deliveryAddress,
        flashWindowEndsAt: expiresAt,
        flashClaimedBy: action.payload.pharmacyId || null,
        acceptedByPharmacy: action.payload.pharmacyId || null,
        pendingFlashPing: {
          orderId,
          orderType: action.payload.orderType,
          items: action.payload.otcItems || state.cart,
          rxImageUrl: action.payload.rxImageUrl || null,
          expiresAt,
          patientName: action.payload.patientName || 'Jayesh Harrison',
          distance: '1.2 km away',
        },
      };
    }

    // === FORCE SYNC FROM DB (RECOVERY) ===
    case 'FORCE_SYNC_ORDER':
      return {
        ...state,
        ...action.payload
      };

    // === PHARMACY ACCEPT (race condition lock) ===
    case 'ACCEPT_ORDER': {
      if (state.flashClaimedBy && state.flashClaimedBy !== action.payload.pharmacyId) return state;
      return {
        ...state,
        flashClaimedBy: action.payload.pharmacyId,
        orderStatus: 'ACCEPTED',
        acceptedByPharmacy: action.payload.pharmacyId,
        pharmacyName: action.payload.pharmacyName || 'MedPlus Pharmacy',
        pendingFlashPing: null,
      };
    }
    case 'RACE_CONDITION_REJECT':
      return {
        ...state,
        toast: { type: 'error', message: 'Order already claimed by another pharmacy!' },
      };

    // === ORDER EXPIRED ===
    case 'EXPIRE_ORDER':
      return {
        ...state,
        orderStatus: 'EXPIRED',
        pendingFlashPing: null,
        flashWindowEndsAt: null,
      };

    // === PACKAGING FLOW ===
    case 'START_PACKAGING':
      return { ...state, orderStatus: 'PACKAGING' };
    case 'MARK_READY':
      return { ...state, orderStatus: 'READY_FOR_PICKUP' };
    case 'DISPATCH_RIDER':
      return {
        ...state,
        orderStatus: 'RIDER_DISPATCHED',
        riderName: action.payload?.riderName || 'Rahul S.',
        riderEta: action.payload?.riderEta || 12,
      };
    case 'MARK_DELIVERED':
      return { ...state, orderStatus: 'DELIVERED' };

    // === RESET ===
    case 'RESET_ORDER':
      return {
        ...INITIAL_STATE,
        appMode: state.appMode,
        cart: [],
        userLocation: state.userLocation,
        userAddress: state.userAddress,
        deliveryAddress: state.userAddress || state.deliveryAddress,
      };

    // === DELIVERY ADDRESS ===
    case 'SET_ADDRESS':
      return { ...state, deliveryAddress: action.payload };

    // === USER LOCATION & ADDRESS ===
    case 'UPDATE_USER_LOCATION':
      return {
        ...state,
        userLocation: [action.payload.lat, action.payload.lng]
      };
    case 'UPDATE_USER_ADDRESS':
      return {
        ...state,
        userAddress: action.payload,
        deliveryAddress: action.payload
      };

    // === TOAST ===
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'ADD_SERVICE_BOOKING':
      return {
        ...state,
        servicesHistory: [action.payload, ...(state.servicesHistory || [])]
      };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(orderReducer, INITIAL_STATE);
  const timerRef = useRef(null);
  const riderTimerRef = useRef(null);

  // Fetch user's current location and reverse-geocode it
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Global Geolocation: [${latitude}, ${longitude}]`);
          
          dispatch({
            type: 'UPDATE_USER_LOCATION',
            payload: { lat: latitude, lng: longitude }
          });

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              const addressStr = data.display_name;
              console.log(`📍 Resolved address: ${addressStr}`);
              dispatch({
                type: 'UPDATE_USER_ADDRESS',
                payload: addressStr
              });
            }
          } catch (err) {
            console.error('⚠️ Reverse geocoding failed:', err);
            dispatch({
              type: 'UPDATE_USER_ADDRESS',
              payload: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          console.warn('⚠️ Global Geolocation failed:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Check if Supabase connection is live
  const isSupabaseLive = useCallback(() => {
    return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
  }, []);

  // Map backend status to frontend state machine status
  const mapBackendStatus = (status) => {
    const statusMap = {
      'PENDING_FLASH': 'FLASH_WINDOW',
      'FLASH_EXPIRED': 'EXPIRED',
      'ACCEPTED': 'ACCEPTED',
      'PACKAGING': 'PACKAGING',
      'READY_FOR_PICKUP': 'READY_FOR_PICKUP',
      'RIDER_ASSIGNED': 'RIDER_DISPATCHED',
      'IN_TRANSIT': 'RIDER_DISPATCHED',
      'DELIVERED': 'DELIVERED',
      'CANCELLED': 'EXPIRED'
    };
    return statusMap[status] || 'IDLE';
  };

  // 1. RECOVERY & SYNC STATE ON MOUNT
  useEffect(() => {
    if (!isSupabaseLive()) {
      console.log('💡 AppProvider: Supabase credentials unset. Operating in local sandbox mode.');
      return;
    }

    const restoreActiveOrder = async () => {
      try {
        console.log('🔄 Fetching active order for usr-jayesh...');
        // Find most recent active order
        const { data, error } = await supabase
          .from('Order')
          .select(`
            *,
            pharmacy:Pharmacy(name)
          `)
          .eq('userId', 'usr-jayesh')
          .order('createdAt', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const activeOrder = data[0];
          const terminalStates = ['DELIVERED', 'CANCELLED', 'FLASH_EXPIRED'];
          
          if (!terminalStates.includes(activeOrder.status)) {
            console.log(`🏠 Recovered active order session: ${activeOrder.id} (${activeOrder.status})`);
            const status = mapBackendStatus(activeOrder.status);
            const itemsList = typeof activeOrder.items === 'string' 
              ? JSON.parse(activeOrder.items) 
              : activeOrder.items;

            const isDbLab = activeOrder.id && activeOrder.id.startsWith('LAB-');
            dispatch({
              type: 'FORCE_SYNC_ORDER',
              payload: {
                orderStatus: status,
                orderId: activeOrder.id,
                orderType: isDbLab ? 'lab' : activeOrder.type.toLowerCase(),
                rxImageUrl: activeOrder.rxImageUrl,
                otcItems: itemsList,
                deliveryAddress: activeOrder.deliveryAddress,
                flashWindowEndsAt: safeParseUTC(activeOrder.flashExpiresAt),
                acceptedByPharmacy: (isDbLab && activeOrder.pharmacyId === 'ph1') ? 'lab-hub-1' : activeOrder.pharmacyId,
                pharmacyName: isDbLab ? 'Medio Diagnostics Lab' : (activeOrder.pharmacy?.name || 'Partner Pharmacy'),
                riderName: activeOrder.riderId ? (isDbLab ? 'Nurse Amit S.' : 'Rahul S.') : null,
                riderEta: activeOrder.riderId ? 10 : null,
                pendingFlashPing: status === 'FLASH_WINDOW' ? {
                  orderId: activeOrder.id,
                  orderType: isDbLab ? 'lab' : activeOrder.type.toLowerCase(),
                  items: itemsList,
                  rxImageUrl: activeOrder.rxImageUrl,
                  expiresAt: safeParseUTC(activeOrder.flashExpiresAt),
                  patientName: 'Jayesh Harrison',
                  distance: '1.2 km away',
                } : null
              }
            });
          }
        }
      } catch (err) {
        console.error('❌ Active order recovery failed:', err);
      }
    };

    restoreActiveOrder();
  }, [isSupabaseLive]);

  // 2. SUPABASE REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!isSupabaseLive()) return;

    console.log('📡 Initializing Supabase Realtime channel subscription for Order table...');
    
    const channel = supabase
      .channel('live-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        async (payload) => {
          console.log('⚡ Realtime Update Received:', payload);
          const { eventType, new: newRow } = payload;

          if (eventType === 'INSERT') {
            // A new order submitted by a user
            console.log(`🆕 Live Order Submitted: ${newRow.id}`);
            const itemsList = typeof newRow.items === 'string' ? JSON.parse(newRow.items) : newRow.items;
            const isDbLab = newRow.id && newRow.id.startsWith('LAB-');
            dispatch({
              type: 'SUBMIT_ORDER',
              payload: {
                orderId: newRow.id,
                orderType: isDbLab ? 'lab' : newRow.type.toLowerCase(),
                rxImageUrl: newRow.rxImageUrl,
                otcItems: itemsList,
                deliveryAddress: newRow.deliveryAddress,
                flashExpiresAt: safeParseUTC(newRow.flashExpiresAt),
                patientName: 'Jayesh Harrison'
              }
            });
          } else if (eventType === 'UPDATE') {
            // An order state was updated (either user-side or pharmacy-side)
            const status = mapBackendStatus(newRow.status);
            
            // Get pharmacy name if accepted
            let pharmacyName = 'MedPlus Pharmacy';
            if (newRow.pharmacyId) {
              const { data } = await supabase
                .from('Pharmacy')
                .select('name')
                .eq('id', newRow.pharmacyId)
                .single();
              if (data) pharmacyName = data.name;
            }

            console.log(`📈 Order ${newRow.id} updated to status: ${newRow.status}`);

            const isDbLab = newRow.id && newRow.id.startsWith('LAB-');

            // Dispatch update to sync all open browsers
            dispatch({
              type: 'FORCE_SYNC_ORDER',
              payload: {
                orderStatus: status,
                orderId: newRow.id,
                orderType: isDbLab ? 'lab' : (newRow.type ? newRow.type.toLowerCase() : null),
                acceptedByPharmacy: (isDbLab && newRow.pharmacyId === 'ph1') ? 'lab-hub-1' : newRow.pharmacyId,
                pharmacyName: isDbLab ? 'Medio Diagnostics Lab' : pharmacyName,
                riderName: newRow.riderId ? (isDbLab ? 'Nurse Amit S.' : 'Rahul S.') : null,
                riderEta: newRow.riderId ? 10 : null,
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`🟢 Supabase Realtime Channel Status: ${status}`);
      });

    return () => {
      console.log('🔌 Unsubscribing from Realtime channel...');
      supabase.removeChannel(channel);
    };
  }, [isSupabaseLive]);

  // ── Submit order → starts flash window ──
  const submitOrder = useCallback(async (payload) => {
    const isLab = payload.orderType === 'lab';
    const orderId = isLab ? 'LAB-' + Math.floor(10000 + Math.random() * 90000) : 'MED-' + Math.floor(10000 + Math.random() * 90000);
    const duration = isLab ? 10 * 60 * 1000 : 3 * 60 * 1000;
    const expiresAtMs = Date.now() + duration;

    if (!isSupabaseLive()) {
      // Sandbox fallback
      dispatch({ type: 'SUBMIT_ORDER', payload: { ...payload, orderId, flashExpiresAt: expiresAtMs } });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'EXPIRE_ORDER' });
      }, duration);
      return;
    }

    try {
      console.log(`💾 Inserting order ${orderId} in Supabase...`);
      const { error } = await supabase
        .from('Order')
        .insert([{
          id: orderId,
          type: payload.orderType === 'lab' ? 'OTC' : payload.orderType.toUpperCase(),
          status: 'PENDING_FLASH',
          userId: 'usr-jayesh',
          items: payload.otcItems,
          deliveryAddress: payload.deliveryAddress || state.userAddress || 'Flat 402, Sunshine Heights, Andheri West',
          deliveryLat: payload.deliveryLat || state.userLocation[0],
          deliveryLng: payload.deliveryLng || state.userLocation[1],
          flashExpiresAt: new Date(expiresAtMs).toISOString(),
          rxImageUrl: payload.rxImageUrl || null,
          totalPaise: payload.totalPaise || 34000,
          subtotalPaise: payload.subtotalPaise || 30000,
          deliveryPaise: payload.deliveryPaise || 4000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]);

      if (error) throw error;
      console.log(`✅ Order ${orderId} successfully saved to Supabase.`);
      // Sync local state immediately to trigger active window in UI
      dispatch({ type: 'SUBMIT_ORDER', payload: { ...payload, orderId, flashExpiresAt: expiresAtMs } });
    } catch (err) {
      console.error('❌ Failed to insert order in Supabase:', err);
      // Fallback
      dispatch({ type: 'SUBMIT_ORDER', payload: { ...payload, orderId, flashExpiresAt: expiresAtMs } });
    }
  }, [isSupabaseLive, state.userAddress, state.userLocation]);

  // ── Pharmacy accepts order (race-condition safe) ──
  const acceptOrder = useCallback(async (pharmacyId, pharmacyName) => {
    if (!isSupabaseLive()) {
      // Sandbox fallback
      dispatch({ type: 'ACCEPT_ORDER', payload: { pharmacyId, pharmacyName } });
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Auto-advance to packaging after 1.5s (simulate backend acknowledgement)
      setTimeout(() => {
        dispatch({ type: 'START_PACKAGING' });
      }, 1500);
      return;
    }

    try {
      console.log(`✍️ Updating Order ${state.orderId} in Supabase: status -> ACCEPTED, pharmacy -> ${pharmacyId}`);
      
      const dbPharmacyId = pharmacyId.startsWith('lab') ? 'ph1' : pharmacyId;
      
      // Real optimistic-lock update
      const { data, error } = await supabase
        .from('Order')
        .update({
          status: 'ACCEPTED',
          pharmacyId: dbPharmacyId,
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', state.orderId)
        .is('pharmacyId', null) // Avoid race conditions! Prevents double claim.
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`✅ Pharmacy won race! Order claimed successfully.`);
        // Wait 1.5s, then advance status to PACKAGING in the database
        setTimeout(async () => {
          await supabase
            .from('Order')
            .update({
              status: 'PACKAGING',
              packagingStartAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('id', state.orderId);
        }, 1500);
      } else {
        console.warn(`🛑 Claim failed: Order already claimed by another pharmacy.`);
        dispatch({ type: 'RACE_CONDITION_REJECT' });
      }
    } catch (err) {
      console.error('❌ Failed to accept order in Supabase:', err);
      dispatch({ type: 'ACCEPT_ORDER', payload: { pharmacyId, pharmacyName } });
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Simulate competing pharmacy (bot) — race condition test ──
  const simulateBotAccept = useCallback(async (currentState) => {
    if (!isSupabaseLive()) {
      if (currentState.flashClaimedBy) {
        dispatch({ type: 'RACE_CONDITION_REJECT' });
      } else {
        dispatch({ type: 'ACCEPT_ORDER', payload: { pharmacyId: 'bot-pharmacy', pharmacyName: 'Apollo Pharmacy' } });
      }
      return;
    }

    try {
      console.log(`🤖 Simulating Bot accept on order ${state.orderId}...`);
      const { data } = await supabase
        .from('Order')
        .update({ status: 'ACCEPTED', pharmacyId: 'ph2' }) // Apollo
        .eq('id', state.orderId)
        .is('pharmacyId', null)
        .select();

      if (!data || data.length === 0) {
        dispatch({ type: 'RACE_CONDITION_REJECT' });
      }
    } catch (err) {
      console.error('Bot simulation error:', err);
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Mark ready for pickup → dispatches rider ──
  const markReadyForPickup = useCallback(async () => {
    if (!isSupabaseLive()) {
      dispatch({ type: 'MARK_READY' });
      if (riderTimerRef.current) clearTimeout(riderTimerRef.current);
      riderTimerRef.current = setTimeout(() => {
        dispatch({ type: 'DISPATCH_RIDER' });
      }, 2000);
      return;
    }

    try {
      console.log(`📦 Updating order ${state.orderId} status in DB: READY_FOR_PICKUP`);
      const { error } = await supabase
        .from('Order')
        .update({
          status: 'READY_FOR_PICKUP',
          packedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', state.orderId);

      if (error) throw error;

      // Simulate a dispatch assignment after 2 seconds
      if (state.orderType !== 'lab') {
        setTimeout(async () => {
          console.log(`🚴 Auto-assigning Rider "rdr-rahul" to Order ${state.orderId}...`);
          await supabase
            .from('Order')
            .update({
              status: 'RIDER_ASSIGNED',
              riderId: 'rdr-rahul',
              riderAssignedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('id', state.orderId);
        }, 2000);
      }

    } catch (err) {
      console.error('❌ Failed to update order status to READY_FOR_PICKUP:', err);
      dispatch({ type: 'MARK_READY' });
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Dispatch Associate (for lab orders) ──
  const dispatchAssociate = useCallback(async () => {
    if (!isSupabaseLive()) {
      dispatch({
        type: 'DISPATCH_RIDER',
        payload: { riderName: 'Nurse Amit S.', riderEta: 5 }
      });
      return;
    }

    try {
      console.log(`🚴 Dispatching Associate for Lab Order ${state.orderId}...`);
      const { error } = await supabase
        .from('Order')
        .update({
          status: 'IN_TRANSIT',
          riderId: 'rdr-rahul',
          riderAssignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', state.orderId);

      if (error) throw error;
    } catch (err) {
      console.error('❌ Failed to dispatch associate:', err);
      dispatch({
        type: 'DISPATCH_RIDER',
        payload: { riderName: 'Nurse Amit S.', riderEta: 5 }
      });
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Mark delivered ──
  const markDelivered = useCallback(async () => {
    if (!isSupabaseLive()) {
      dispatch({ type: 'MARK_DELIVERED' });
      return;
    }

    try {
      console.log(`🏁 Updating order ${state.orderId} status in DB: DELIVERED`);
      const { error } = await supabase
        .from('Order')
        .update({
          status: 'DELIVERED',
          deliveredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', state.orderId);

      if (error) throw error;
    } catch (err) {
      console.error('❌ Failed to mark order delivered:', err);
      dispatch({ type: 'MARK_DELIVERED' });
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Dev: fast forward through all states ──
  const devFastForward = useCallback(async () => {
    if (!isSupabaseLive()) {
      const states = ['PACKAGING', 'READY_FOR_PICKUP', 'RIDER_DISPATCHED', 'DELIVERED'];
      let i = 0;
      const advance = () => {
        if (i < states.length) {
          const actionMap = {
            PACKAGING: 'START_PACKAGING',
            READY_FOR_PICKUP: 'MARK_READY',
            RIDER_DISPATCHED: 'DISPATCH_RIDER',
            DELIVERED: 'MARK_DELIVERED',
          };
          dispatch({ type: actionMap[states[i]] });
          i++;
          setTimeout(advance, 800);
        }
      };
      advance();
      return;
    }

    try {
      const dbStates = ['PACKAGING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'DELIVERED'];
      let i = 0;
      const advanceDb = async () => {
        if (i < dbStates.length) {
          console.log(`⏩ Dev Fast Forward: Setting order ${state.orderId} -> ${dbStates[i]}`);
          const updateData = { status: dbStates[i] };
          if (dbStates[i] === 'RIDER_ASSIGNED') {
            updateData.riderId = 'rdr-rahul';
          }
          await supabase
            .from('Order')
            .update(updateData)
            .eq('id', state.orderId);
          i++;
          setTimeout(advanceDb, 1000);
        }
      };
      advanceDb();
    } catch (err) {
      console.error('Fast-forward error:', err);
    }
  }, [isSupabaseLive, state.orderId]);

  // ── Dev: simulate flash ping to pharmacy ──
  const devSimulatePing = useCallback(() => {
    submitOrder({
      orderType: 'rx',
      rxImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnXySYeC0CbtGL9ft5GZjQAHxhK2Y9C2E19_1JACjS1swMqwWXNSlrHU1zt7B0BbsyncKvS6bMy_r7tE3tgihWQGDG9qxvub6UjXY3YfDBloQ9C6-Ra57wbaDwG8wHPn7xtlEag9S9EeQtLBGsgAQAvEnME539KZVJV4pyEWWCyIxNdcIpUqlco_IUtz0d72-kw5t61a0sdIkXDS-Gvdolj1ieWjCQZ87WgcvXigYfLNLNTP2vX2g075SJY9X6KfuJcXLw4Axf1IY',
      otcItems: [
        { id: 'rx-1', name: 'Amoxicillin 500mg', detail: 'Capsules • Qty: 21', inStock: true },
        { id: 'rx-2', name: 'Fluticasone Propionate', detail: 'Nasal Spray • Qty: 1', inStock: true },
      ],
    });
  }, [submitOrder]);

  const showToast = useCallback((type, message) => {
    dispatch({ type: 'SHOW_TOAST', payload: { type, message } });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000);
  }, []);

  const value = {
    state,
    dispatch,
    submitOrder,
    acceptOrder,
    simulateBotAccept,
    markReadyForPickup,
    dispatchAssociate,
    markDelivered,
    devFastForward,
    devSimulatePing,
    showToast,
    isSupabaseLive,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
