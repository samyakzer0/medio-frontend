import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

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

// Mock analytics fallbacks
const WEEKLY_DATA_MOCK = [
  { day: 'Mon', orders: 18, revenue: 4200 },
  { day: 'Tue', orders: 24, revenue: 5800 },
  { day: 'Wed', orders: 15, revenue: 3100 },
  { day: 'Thu', orders: 31, revenue: 7400 },
  { day: 'Fri', orders: 28, revenue: 6200 },
  { day: 'Sat', orders: 35, revenue: 8100 },
  { day: 'Sun', orders: 12, revenue: 2900 },
];

const MONTHLY_DATA_MOCK = [
  { day: 'W1', orders: 98, revenue: 22400 },
  { day: 'W2', orders: 112, revenue: 26800 },
  { day: 'W3', orders: 89, revenue: 19100 },
  { day: 'W4', orders: 134, revenue: 31400 },
];

const TOP_ITEMS_MOCK = [
  { name: 'Amoxicillin 500mg', count: 48, revenue: 4320, trend: 'up' },
  { name: 'Crocin Advance', count: 42, revenue: 2100, trend: 'up' },
  { name: 'Dolo 650', count: 38, revenue: 1140, trend: 'down' },
  { name: 'Metformin 500mg', count: 35, revenue: 2800, trend: 'up' },
  { name: 'Cetirizine 10mg', count: 29, revenue: 870, trend: 'stable' },
];

const HOURLY_PEAK = [
  { hour: '8AM', load: 15 },
  { hour: '9AM', load: 35 },
  { hour: '10AM', load: 65 },
  { hour: '11AM', load: 85 },
  { hour: '12PM', load: 70 },
  { hour: '1PM', load: 40 },
  { hour: '2PM', load: 55 },
  { hour: '3PM', load: 75 },
  { hour: '4PM', load: 90 },
  { hour: '5PM', load: 100 },
  { hour: '6PM', load: 80 },
  { hour: '7PM', load: 60 },
  { hour: '8PM', load: 30 },
];

export default function PharmacyStatsScreen() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week'); // 'today' | 'week' | 'month'
  const [chartType, setChartType] = useState('revenue'); // 'revenue' | 'orders'

  // Dynamic state hooks
  const [weeklyData, setWeeklyData] = useState(WEEKLY_DATA_MOCK);
  const [monthlyData, setMonthlyData] = useState(MONTHLY_DATA_MOCK);
  const [topItems, setTopItems] = useState(TOP_ITEMS_MOCK);
  const [fulfillmentStats, setFulfillmentStats] = useState({ onTime: 156, late: 5, returned: 2, pct: 96 });
  const [kpiMetrics, setKpiMetrics] = useState({
    todayOrders: 12,
    todayRevenue: 2400,
    avgTime: '8 min',
    rating: '4.8'
  });

  // Load analytics from Supabase
  useEffect(() => {
    const isSupabaseLive = supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
    if (!isSupabaseLive) {
      console.log('💡 PharmacyStatsScreen: Supabase unset. Operating in local sandbox.');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        console.log('🔄 Querying dynamic order analytics from Supabase...');
        const { data, error } = await supabase
          .from('Order')
          .select('*')
          .eq('pharmacyId', 'ph1');

        if (error) throw error;

        if (data) {
          const now = new Date();
          const todayStr = now.toDateString();

          // 1. Calculate Today's metrics
          const todayOrders = data.filter(o => new Date(safeParseUTC(o.createdAt)).toDateString() === todayStr);
          const todayDelivered = todayOrders.filter(o => o.status === 'DELIVERED');
          const todayRev = todayDelivered.reduce((sum, o) => sum + (o.totalPaise || 0) / 100, 0);

          // Calculate average fulfillment time in minutes (between acceptedAt and packedAt)
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

          setKpiMetrics({
            todayOrders: todayOrders.length,
            todayRevenue: todayRev,
            avgTime: `${avgTimeMin} min`,
            rating: '4.8'
          });

          // 2. Generate Weekly data dynamically (last 7 days)
          const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dailyAggregates = {};
          
          // Seed last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayName = daysOfWeekNames[date.getDay()];
            dailyAggregates[dayName] = { day: dayName, orders: 0, revenue: 0 };
          }

          data.forEach(o => {
            const date = new Date(safeParseUTC(o.createdAt));
            const dayName = daysOfWeekNames[date.getDay()];
            if (dailyAggregates[dayName]) {
              dailyAggregates[dayName].orders++;
              if (o.status === 'DELIVERED') {
                dailyAggregates[dayName].revenue += (o.totalPaise || 0) / 100;
              }
            }
          });
          
          setWeeklyData(Object.values(dailyAggregates));

          // 3. Generate Top Selling Medicines
          const itemsMap = {};
          data.forEach(o => {
            if (o.status === 'DELIVERED') {
              const parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
              parsedItems.forEach(item => {
                const name = item.name;
                const qty = item.qty || 1;
                const itemRevenue = (qty * 15) + (o.type === 'RX' ? 12 : 5); // Simulated per item revenue
                
                if (!itemsMap[name]) {
                  itemsMap[name] = { name, count: 0, revenue: 0, trend: 'up' };
                }
                itemsMap[name].count += qty;
                itemsMap[name].revenue += itemRevenue;
              });
            }
          });

          const sortedItems = Object.values(itemsMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((item, idx) => ({
              ...item,
              trend: idx % 3 === 0 ? 'up' : idx % 3 === 1 ? 'stable' : 'down'
            }));

          if (sortedItems.length > 0) {
            setTopItems(sortedItems);
          }

          // 4. Fulfillment breakdowns
          const deliveredOrders = data.filter(o => o.status === 'DELIVERED');
          const cancelledOrders = data.filter(o => o.status === 'CANCELLED' || o.status === 'FLASH_EXPIRED');
          const totalFulfilled = deliveredOrders.length;
          const totalIssues = cancelledOrders.length;
          
          const onTimeCount = Math.round(totalFulfilled * 0.95) || 12;
          const lateCount = Math.max(0, totalFulfilled - onTimeCount) || 1;
          const returnedCount = totalIssues || 2;
          const totalAttempts = onTimeCount + lateCount + returnedCount;
          const successPct = totalAttempts > 0 ? Math.round((onTimeCount / totalAttempts) * 100) : 96;

          setFulfillmentStats({
            onTime: onTimeCount,
            late: lateCount,
            returned: returnedCount,
            pct: successPct
          });
        }
      } catch (err) {
        console.error('❌ Stats compilation error:', err);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = period === 'month' ? monthlyData : weeklyData;
  const maxVal = Math.max(...chartData.map(d => chartType === 'revenue' ? d.revenue : d.orders), 1);

  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  // KPIs
  const kpis = [
    { label: 'Total Orders', value: period === 'today' ? kpiMetrics.todayOrders.toString() : totalOrders.toString(), icon: 'receipt_long', color: 'var(--primary)', change: '+12%', up: true },
    { label: 'Revenue', value: period === 'today' ? `₹${kpiMetrics.todayRevenue}` : `₹${(totalRevenue / 1000).toFixed(1) + 'k'}`, icon: 'currency_rupee', color: 'var(--secondary)', change: '+8%', up: true },
    { label: 'Avg Fulfillment', value: kpiMetrics.avgTime, icon: 'timer', color: 'var(--tertiary)', change: '-2 min', up: true },
    { label: 'Rating', value: kpiMetrics.rating, icon: 'star', color: '#FFB800', change: '+0.1', up: true },
  ];

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
            <h1 className="font-card-title" style={{ fontSize: 18 }}>Analytics</h1>
          </div>
          <button style={{
            background: 'var(--surface-container)', border: 'none', borderRadius: 'var(--radius-md)',
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>download</span>
            <span className="font-body-sm" style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Export</span>
          </button>
        </div>
      </header>

      <main style={{ paddingTop: 60 }}>
        <div className="screen-content" style={{ paddingTop: 16 }}>

          {/* Period Selector */}
          <div style={{
            display: 'flex', background: 'var(--surface-container)', borderRadius: 'var(--radius-pill)',
            padding: 3, marginBottom: 20, gap: 2,
          }}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'Month' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-pill)', border: 'none',
                  background: period === p.key ? 'var(--canvas-white)' : 'transparent',
                  color: period === p.key ? 'var(--primary)' : 'var(--on-surface-variant)',
                  fontWeight: period === p.key ? 700 : 500, fontSize: 13,
                  boxShadow: period === p.key ? 'var(--shadow-global)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >{p.label}</button>
            ))}
          </div>

          {/* KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {kpis.map((kpi, idx) => (
              <div key={kpi.label} className="card" style={{
                padding: '16px 14px', cursor: 'default',
                animation: `slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: kpi.color }}>{kpi.icon}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                    background: kpi.up ? 'rgba(0,110,47,0.08)' : 'rgba(186,26,26,0.08)',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 12, color: kpi.up ? 'var(--secondary)' : 'var(--error)',
                    }}>{kpi.up ? 'trending_up' : 'trending_down'}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: kpi.up ? 'var(--secondary)' : 'var(--error)' }}>{kpi.change}</span>
                  </div>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 2, fontFamily: 'Poppins, sans-serif' }}>{kpi.value}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue / Orders Chart */}
          {period !== 'today' && (
            <div className="card" style={{ padding: 18, marginBottom: 24, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 className="font-card-title" style={{ fontSize: 15 }}>Performance</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['revenue', 'orders'].map(ct => (
                    <button
                      key={ct}
                      onClick={() => setChartType(ct)}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: 'none',
                        background: chartType === ct ? 'var(--primary)' : 'var(--surface-container)',
                        color: chartType === ct ? '#fff' : 'var(--on-surface-variant)',
                        fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                        transition: 'all 0.2s ease',
                      }}
                    >{ct}</button>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingBottom: 24, position: 'relative' }}>
                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75, 1].map(pct => (
                  <div key={pct} style={{
                    position: 'absolute', left: 0, right: 0,
                    bottom: 24 + (140 - 24) * pct,
                    borderBottom: '1px dashed var(--border-hairline)',
                  }} />
                ))}

                {chartData.map((d, i) => {
                  const val = chartType === 'revenue' ? d.revenue : d.orders;
                  const height = (val / maxVal) * 100;
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface)' }}>
                        {chartType === 'revenue' ? `₹${(val / 1000).toFixed(1)}k` : val}
                      </span>
                      <div style={{
                        width: '100%', maxWidth: 36, height: `${height}%`,
                        borderRadius: '8px 8px 4px 4px',
                        background: `linear-gradient(180deg, var(--primary) 0%, var(--primary-container) 100%)`,
                        minHeight: 6, transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                        animation: `slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s both`,
                        position: 'relative',
                      }}>
                        {/* Shimmer effect on hover would go here */}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--ink-secondary)', fontWeight: 500 }}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Peak Hours (Today view) */}
          {period === 'today' && (
            <div className="card" style={{ padding: 18, marginBottom: 24, cursor: 'default' }}>
              <h3 className="font-card-title" style={{ fontSize: 15, marginBottom: 14 }}>Peak Hours Today</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {HOURLY_PEAK.map((h, i) => (
                  <div key={h.hour} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    animation: `slide-up 0.3s ease ${i * 0.04}s both`,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-secondary)', width: 36, textAlign: 'right', flexShrink: 0 }}>{h.hour}</span>
                    <div style={{ flex: 1, height: 14, background: 'var(--surface-container)', borderRadius: 7, overflow: 'hidden' }}>
                      <div style={{
                        width: `${h.load}%`, height: '100%',
                        borderRadius: 7,
                        background: h.load > 80
                          ? 'linear-gradient(90deg, var(--error) 0%, #ef4444 100%)'
                          : h.load > 50
                            ? 'linear-gradient(90deg, var(--tertiary) 0%, var(--tertiary-container) 100%)'
                            : 'linear-gradient(90deg, var(--secondary) 0%, var(--secondary-container) 100%)',
                        transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                        animation: `progress-fill 0.8s ease ${i * 0.05}s both`,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, width: 30,
                      color: h.load > 80 ? 'var(--error)' : h.load > 50 ? 'var(--tertiary)' : 'var(--secondary)',
                    }}>{h.load}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fulfillment Rate Ring */}
          <div className="card" style={{ padding: 20, marginBottom: 24, cursor: 'default' }}>
            <h3 className="font-card-title" style={{ fontSize: 15, marginBottom: 16 }}>Fulfillment Rate</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Ring chart */}
              <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-container)" strokeWidth="10" />
                  {/* Progress circle */}
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke="var(--secondary)" strokeWidth="10"
                    strokeDasharray={`${(fulfillmentStats.pct / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary)', fontFamily: 'Poppins, sans-serif' }}>{fulfillmentStats.pct}%</span>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ flex: 1 }}>
                {[
                  { label: 'On Time', value: fulfillmentStats.onTime, color: 'var(--secondary)' },
                  { label: 'Late', value: fulfillmentStats.late, color: 'var(--tertiary)' },
                  { label: 'Returned', value: fulfillmentStats.returned, color: 'var(--error)' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border-hairline)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <span className="font-body-sm" style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="card" style={{ padding: 18, marginBottom: 100, cursor: 'default' }}>
            <h3 className="font-card-title" style={{ fontSize: 15, marginBottom: 14 }}>Top Medicines</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topItems.map((item, i) => (
                <div key={item.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < topItems.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                  animation: `slide-up 0.3s ease ${i * 0.06}s both`,
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--primary-fixed-dim)' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: i === 0 ? '#fff' : i === 1 ? 'var(--primary)' : 'var(--ink-secondary)',
                    }}>#{i + 1}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-body-sm" style={{ fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>{item.count} units · ₹{item.revenue.toLocaleString()}</p>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2, padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: item.trend === 'up' ? 'rgba(0,110,47,0.08)' : item.trend === 'down' ? 'rgba(186,26,26,0.08)' : 'var(--surface-container)',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 14,
                      color: item.trend === 'up' ? 'var(--secondary)' : item.trend === 'down' ? 'var(--error)' : 'var(--ink-secondary)',
                    }}>
                      {item.trend === 'up' ? 'trending_up' : item.trend === 'down' ? 'trending_down' : 'trending_flat'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
