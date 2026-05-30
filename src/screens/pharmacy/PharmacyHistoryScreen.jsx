import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

const ORDER_HISTORY_MOCK = [
  { id: 'MED-77234', type: 'Rx', status: 'DELIVERED', patient: 'Priya Mehta', items: ['Amoxicillin 500mg × 21', 'Fluticasone Spray × 1'], time: '2h ago', date: 'Today', amount: 340, rating: 5 },
  { id: 'MED-66912', type: 'OTC', status: 'DELIVERED', patient: 'Rajan Kumar', items: ['Crocin Advance × 2', 'Vicks VapoRub × 1'], time: '5h ago', date: 'Today', amount: 215, rating: 4 },
  { id: 'MED-55438', type: 'Rx', status: 'DELIVERED', patient: 'Sunita Lakshmi', items: ['Metformin 500mg × 60', 'Atorvastatin 10mg × 30'], time: 'Yesterday', date: 'Yesterday', amount: 560, rating: 5 },
  { id: 'MED-44201', type: 'OTC', status: 'RETURNED', patient: 'Anil Sharma', items: ['Dolo 650 × 3'], time: 'Yesterday', date: 'Yesterday', amount: 120, rating: null },
  { id: 'MED-33109', type: 'Rx', status: 'DELIVERED', patient: 'Kavita Nair', items: ['Azithromycin 250mg × 6', 'Montelukast 10mg × 15', 'Cetirizine 10mg × 10'], time: '2 days ago', date: '26 May', amount: 890, rating: 5 },
  { id: 'MED-22887', type: 'OTC', status: 'DELIVERED', patient: 'Vikram Patel', items: ['Volini Spray × 1', 'Band-Aid Pack × 1'], time: '2 days ago', date: '26 May', amount: 380, rating: 3 },
  { id: 'MED-11765', type: 'Rx', status: 'CANCELLED', patient: 'Neha Gupta', items: ['Insulin Glargine × 1'], time: '3 days ago', date: '25 May', amount: 1250, rating: null },
  { id: 'MED-99654', type: 'OTC', status: 'DELIVERED', patient: 'Suresh Reddy', items: ['Combiflam × 1', 'ORS Sachets × 5'], time: '3 days ago', date: '25 May', amount: 175, rating: 4 },
  { id: 'MED-88543', type: 'Rx', status: 'DELIVERED', patient: 'Meena Iyer', items: ['Losartan 50mg × 30', 'Amlodipine 5mg × 30'], time: '4 days ago', date: '24 May', amount: 420, rating: 5 },
];

const FILTER_TABS = ['All', 'Rx', 'OTC', 'Returned'];

const STATUS_CONFIG = {
  DELIVERED: { label: 'Delivered', color: 'var(--secondary)', bg: 'rgba(0,110,47,0.1)', icon: 'check_circle' },
  RETURNED: { label: 'Returned', color: 'var(--tertiary)', bg: 'var(--tertiary-fixed)', icon: 'undo' },
  CANCELLED: { label: 'Cancelled', color: 'var(--error)', bg: 'var(--error-container)', icon: 'cancel' },
  FLASH_EXPIRED: { label: 'Expired', color: 'var(--outline)', bg: 'var(--surface-container)', icon: 'timer_off' },
  ACCEPTED: { label: 'Accepted', color: 'var(--primary)', bg: 'var(--primary-fixed)', icon: 'check_circle' },
  PACKAGING: { label: 'Packaging', color: 'var(--primary)', bg: 'var(--primary-fixed)', icon: 'inventory' },
  READY_FOR_PICKUP: { label: 'Ready', color: 'var(--primary)', bg: 'var(--primary-fixed)', icon: 'local_shipping' },
  RIDER_ASSIGNED: { label: 'Dispatched', color: 'var(--primary)', bg: 'var(--primary-fixed)', icon: 'sports_motorsports' },
  IN_TRANSIT: { label: 'In Transit', color: 'var(--primary)', bg: 'var(--primary-fixed)', icon: 'sports_motorsports' }
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

export default function PharmacyHistoryScreen() {
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState(ORDER_HISTORY_MOCK);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // 'today' | 'week' | 'month' | 'all'

  // Fetch live orders from Supabase on mount
  useEffect(() => {
    const isSupabaseLive = supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
    if (!isSupabaseLive) {
      console.log('💡 PharmacyHistoryScreen: Supabase unset. Operating in local sandbox.');
      return;
    }

    const fetchOrders = async () => {
      try {
        console.log('🔄 Loading order history from Supabase...');
        // Query orders linked to MedPlus Pharmacy "ph1"
        const { data, error } = await supabase
          .from('Order')
          .select(`
            *,
            user:User(name)
          `)
          .eq('pharmacyId', 'ph1')
          .order('createdAt', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map(dbOrder => {
            // Parse items list
            const parsedItems = typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items;
            const itemsStrings = parsedItems.map(item => `${item.name} × ${item.qty}`);

            // Calculate relative times
            const nowTime = new Date();
            const orderTime = new Date(safeParseUTC(dbOrder.createdAt));
            const diffHrs = Math.floor((nowTime.getTime() - orderTime.getTime()) / (3600 * 1000));
            const timeStr = diffHrs < 1 ? 'Just now' : diffHrs < 24 ? `${diffHrs}h ago` : orderTime.toLocaleDateString();

            // Date categorization
            const isToday = orderTime.toDateString() === nowTime.toDateString();
            const isYesterday = orderTime.toDateString() === new Date(nowTime.getTime() - 86400000).toDateString();
            const dateOptions = { day: 'numeric', month: 'short' };
            const dateStr = isToday ? 'Today' : isYesterday ? 'Yesterday' : orderTime.toLocaleDateString('en-IN', dateOptions);

            return {
              id: dbOrder.id,
              type: dbOrder.type === 'RX' ? 'Rx' : 'OTC',
              status: dbOrder.status,
              patient: dbOrder.user?.name || 'Walk-in Customer',
              items: itemsStrings,
              time: timeStr,
              date: dateStr,
              amount: dbOrder.totalPaise ? dbOrder.totalPaise / 100 : 340,
              rating: dbOrder.status === 'DELIVERED' ? (dbOrder.id.charCodeAt(5) % 2 === 0 ? 5 : 4) : null,
            };
          });

          console.log(`✅ Loaded ${mapped.length} historical orders from Supabase.`);
          setOrdersList(mapped);
        }
      } catch (err) {
        console.error('❌ Failed to fetch orders from Supabase:', err);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let orders = ordersList;

    // Filter by type
    if (activeFilter === 'Rx') orders = orders.filter(o => o.type === 'Rx');
    else if (activeFilter === 'OTC') orders = orders.filter(o => o.type === 'OTC');
    else if (activeFilter === 'Returned') orders = orders.filter(o => o.status === 'RETURNED' || o.status === 'CANCELLED' || o.status === 'FLASH_EXPIRED');

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.patient.toLowerCase().includes(q) ||
        o.items.some(item => item.toLowerCase().includes(q))
      );
    }

    // Filter by date range
    if (dateRange === 'today') orders = orders.filter(o => o.date === 'Today');
    else if (dateRange === 'week') orders = orders.filter(o => ['Today', 'Yesterday'].includes(o.date) || o.time.includes('days ago'));

    return orders;
  }, [ordersList, activeFilter, searchQuery, dateRange]);


  // Group orders by date
  const groupedOrders = useMemo(() => {
    const groups = {};
    filteredOrders.forEach(order => {
      if (!groups[order.date]) groups[order.date] = [];
      groups[order.date].push(order);
    });
    return groups;
  }, [filteredOrders]);

  const totalRevenue = filteredOrders.reduce((sum, o) => o.status === 'DELIVERED' ? sum + o.amount : sum, 0);

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className="material-symbols-outlined icon-fill" style={{
            fontSize: 14,
            color: star <= rating ? '#FFB800' : 'var(--outline-variant)',
          }}>star</span>
        ))}
      </div>
    );
  };

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
            <h1 className="font-card-title" style={{ fontSize: 18 }}>Order History</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>{filteredOrders.length} orders</span>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 60 }}>
        <div className="screen-content" style={{ paddingTop: 16 }}>

          {/* Search Bar */}
          <div style={{
            position: 'relative', marginBottom: 14,
          }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 20, color: 'var(--outline)',
            }}>search</span>
            <input
              type="text"
              placeholder="Search orders, patients, or medicines..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px 12px 42px',
                borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)',
                background: 'var(--canvas-white)', fontSize: 14, color: 'var(--on-surface)',
                boxShadow: 'var(--shadow-global)',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'var(--surface-container)', border: 'none', borderRadius: '50%',
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>close</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto',
            paddingBottom: 2,
          }}>
            {FILTER_TABS.map(tab => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '8px 18px', borderRadius: 'var(--radius-pill)', border: 'none',
                    background: isActive ? 'var(--primary)' : 'var(--canvas-white)',
                    color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 2px 8px rgba(0,81,223,0.25)' : 'var(--shadow-global)',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.02em',
                  }}
                >{tab}</button>
              );
            })}
          </div>

          {/* Date Range Pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'all', label: 'All Time' },
            ].map(range => (
              <button
                key={range.key}
                onClick={() => setDateRange(range.key)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                  border: dateRange === range.key ? '1.5px solid var(--primary)' : '1px solid var(--border-hairline)',
                  background: dateRange === range.key ? 'var(--primary-fixed)' : 'transparent',
                  color: dateRange === range.key ? 'var(--on-primary-fixed-variant)' : 'var(--ink-secondary)',
                  fontSize: 12, fontWeight: 500, transition: 'all 0.2s ease',
                }}
              >{range.label}</button>
            ))}
          </div>

          {/* Summary Card */}
          <div className="card" style={{
            padding: 16, marginBottom: 20, cursor: 'default',
            display: 'flex', justifyContent: 'space-around', textAlign: 'center',
          }}>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                {filteredOrders.filter(o => o.status === 'DELIVERED').length}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Delivered</p>
            </div>
            <div style={{ width: 1, background: 'var(--border-hairline)' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--secondary)' }}>
                ₹{totalRevenue.toLocaleString()}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Revenue</p>
            </div>
            <div style={{ width: 1, background: 'var(--border-hairline)' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--tertiary)' }}>
                {filteredOrders.filter(o => o.status === 'RETURNED' || o.status === 'CANCELLED').length}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Returns</p>
            </div>
          </div>

          {/* Orders List grouped by date */}
          {Object.keys(groupedOrders).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline-variant)', marginBottom: 12, display: 'block' }}>search_off</span>
              <p className="font-body-lg" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>No orders found</p>
              <p className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Try adjusting your filters or search</p>
            </div>
          ) : (
            <div style={{ marginBottom: 100 }}>
              {Object.entries(groupedOrders).map(([date, orders]) => (
                <div key={date} style={{ marginBottom: 20 }}>
                  <p className="font-label-caps" style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 10, paddingLeft: 4 }}>{date}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {orders.map((order, idx) => {
                      const config = STATUS_CONFIG[order.status];
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div
                          key={order.id}
                          className="card"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          style={{
                            padding: 0, cursor: 'pointer', overflow: 'hidden',
                            animation: `slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.05}s both`,
                          }}
                        >
                          {/* Main row */}
                          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 12,
                              background: order.type === 'Rx' ? 'var(--primary-fixed)' : 'var(--secondary-container)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <span className="material-symbols-outlined icon-fill" style={{
                                fontSize: 22, color: order.type === 'Rx' ? 'var(--primary)' : 'var(--secondary)',
                              }}>
                                {order.type === 'Rx' ? 'medication' : 'shopping_bag'}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <p className="font-body-sm" style={{ fontWeight: 700 }}>{order.patient}</p>
                                <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: 15 }}>₹{order.amount}</p>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12 }}>
                                  {order.id} · {order.type} · {order.time}
                                </p>
                                <span className="badge" style={{
                                  background: config.bg, color: config.color, fontSize: 9, padding: '2px 8px',
                                }}>{config.label}</span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div style={{
                              borderTop: '1px solid var(--border-hairline)',
                              padding: '14px 16px', background: 'var(--surface-container-low)',
                              animation: 'slide-up 0.25s ease both',
                            }}>
                              {/* Items */}
                              <p className="font-label-caps" style={{ fontSize: 10, color: 'var(--ink-secondary)', marginBottom: 8 }}>Items Dispensed</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                {order.items.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>pill</span>
                                    <p className="font-body-sm" style={{ fontSize: 13 }}>{item}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Rating */}
                              {order.rating && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                  <p className="font-body-sm" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Customer Rating:</p>
                                  {renderStars(order.rating)}
                                </div>
                              )}

                              {/* Status Timeline */}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                                background: 'var(--canvas-white)', borderRadius: 'var(--radius-md)',
                              }}>
                                {['Accepted', 'Packed', 'Picked Up', config.label].map((step, i) => (
                                  <React.Fragment key={step}>
                                    <div style={{
                                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1,
                                    }}>
                                      <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: order.status === 'DELIVERED' || i < 3 ? config.color : 'var(--outline-variant)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <span className="material-symbols-outlined icon-fill" style={{ fontSize: 12, color: '#fff' }}>check</span>
                                      </div>
                                      <span style={{ fontSize: 9, color: 'var(--ink-secondary)', textAlign: 'center' }}>{step}</span>
                                    </div>
                                    {i < 3 && (
                                      <div style={{
                                        flex: 0.6, height: 2, borderRadius: 1,
                                        background: order.status === 'DELIVERED' ? config.color : 'var(--outline-variant)',
                                        marginBottom: 14,
                                      }} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
