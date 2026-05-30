import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../config/supabase';

const PHARMACIES_MOCK = [
  {
    id: 'ph1', name: 'MedPlus Pharmacy', type: 'Verified Partner',
    address: 'Shop 12, DN Nagar, Andheri West',
    distance: '0.8 km', delivery: '8 min', rating: 4.8, reviews: 342,
    open: true, hours: '8 AM – 10 PM', tags: ['Rx', 'OTC', 'Cold Chain'],
    x: 52, y: 38, // % position on map
    color: 'var(--primary)',
  },
  {
    id: 'ph2', name: 'Apollo Pharmacy', type: 'Verified Partner',
    address: '14, Lokhandwala Complex, Andheri West',
    distance: '1.2 km', delivery: '12 min', rating: 4.6, reviews: 218,
    open: true, hours: '9 AM – 11 PM', tags: ['Rx', 'OTC', '24hr'],
    x: 30, y: 52,
    color: 'var(--secondary)',
  },
  {
    id: 'ph3', name: 'Wellness Forever', type: 'Standard Partner',
    address: '7, JP Road, Versova, Andheri West',
    distance: '1.8 km', delivery: '15 min', rating: 4.3, reviews: 156,
    open: true, hours: '8:30 AM – 9:30 PM', tags: ['OTC', 'Wellness'],
    x: 72, y: 28,
    color: 'var(--tertiary)',
  },
  {
    id: 'ph4', name: 'NetMeds Store', type: 'Standard Partner',
    address: '22, SVP Road, Andheri West',
    distance: '2.1 km', delivery: '18 min', rating: 4.1, reviews: 89,
    open: false, hours: '9 AM – 9 PM', tags: ['OTC'],
    x: 18, y: 70,
    color: 'var(--outline)',
  },
  {
    id: 'ph5', name: 'HealthKart Pharmacy', type: 'Verified Partner',
    address: '5, Four Bungalows, Andheri West',
    distance: '1.5 km', delivery: '14 min', rating: 4.5, reviews: 201,
    open: true, hours: '8 AM – 10:30 PM', tags: ['Rx', 'OTC', 'Supplements'],
    x: 65, y: 60,
    color: 'var(--primary)',
  },
  {
    id: 'ph6', name: 'MediBuddy Express', type: 'New Partner',
    address: '31, Yari Road, Versova',
    distance: '2.5 km', delivery: '20 min', rating: 4.0, reviews: 42,
    open: true, hours: '10 AM – 8 PM', tags: ['OTC', 'Wellness'],
    x: 82, y: 48,
    color: 'var(--on-surface-variant)',
  },
];

const FILTERS = [
  { key: 'all', label: 'All', icon: 'tune' },
  { key: 'open', label: 'Open Now', icon: 'schedule' },
  { key: 'nearby', label: 'Nearby', icon: 'near_me' },
  { key: 'topRated', label: 'Top Rated', icon: 'star' },
  { key: 'rx', label: 'Rx Available', icon: 'medication' },
  { key: '24hr', label: '24 Hour', icon: 'nights_stay' },
];

export default function ExploreScreen() {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState(PHARMACIES_MOCK);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const bottomSheetRef = useRef(null);
  const [userPulse, setUserPulse] = useState(true);

  // Fetch dynamic pharmacies from Supabase
  useEffect(() => {
    const isSupabaseLive = supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project-id');
    if (!isSupabaseLive) {
      console.log('💡 ExploreScreen: Supabase unset. Operating in local sandbox.');
      return;
    }

    const fetchPharmacies = async () => {
      try {
        console.log('🔄 Loading pharmacies from Supabase...');
        const { data, error } = await supabase
          .from('Pharmacy')
          .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map((dbPh, idx) => {
            const staticCoords = {
              ph1: { x: 52, y: 38, rating: 4.8, reviews: 342, tags: ['Rx', 'OTC', 'Cold Chain'], hours: '8 AM – 10 PM' },
              ph2: { x: 30, y: 52, rating: 4.6, reviews: 218, tags: ['Rx', 'OTC', '24hr'], hours: '9 AM – 11 PM' },
              ph3: { x: 72, y: 28, rating: 4.3, reviews: 156, tags: ['OTC', 'Wellness'], hours: '8:30 AM – 9:30 PM' },
              ph4: { x: 18, y: 70, rating: 4.1, reviews: 89, tags: ['OTC'], hours: '9 AM – 9 PM' },
              ph5: { x: 65, y: 60, rating: 4.5, reviews: 201, tags: ['Rx', 'OTC', 'Supplements'], hours: '8 AM – 10:30 PM' },
              ph6: { x: 82, y: 48, rating: 4.0, reviews: 42, tags: ['OTC', 'Wellness'], hours: '10 AM – 8 PM' },
            };

            const meta = staticCoords[dbPh.id] || { 
              x: 20 + (idx * 12) % 60, 
              y: 30 + (idx * 8) % 50, 
              rating: 4.2, 
              reviews: 80, 
              tags: ['Rx', 'OTC'], 
              hours: '9 AM – 9 PM' 
            };
            
            // Calculate distance relative to Jayesh's standard location (19.1235, 72.8258)
            const latDiff = Math.abs(dbPh.lat - 19.1235);
            const lngDiff = Math.abs(dbPh.lng - 72.8258);
            const calculatedDist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 110; // ~110km per degree
            const distanceStr = calculatedDist < 0.2 ? '0.1 km' : `${calculatedDist.toFixed(1)} km`;
            const deliveryMin = Math.round(calculatedDist * 8 + 6);

            return {
              id: dbPh.id,
              name: dbPh.name,
              type: dbPh.isVerified ? 'Verified Partner' : 'Standard Partner',
              address: dbPh.addressLine,
              distance: distanceStr,
              delivery: `${deliveryMin} min`,
              rating: meta.rating,
              reviews: meta.reviews,
              open: dbPh.isOnline,
              hours: meta.hours,
              tags: meta.tags,
              x: meta.x,
              y: meta.y,
              color: dbPh.isOnline ? (dbPh.isVerified ? 'var(--primary)' : 'var(--secondary)') : 'var(--outline)',
            };
          });

          console.log(`✅ Loaded ${mapped.length} pharmacies dynamically.`);
          setPharmacies(mapped);
        }
      } catch (err) {
        console.error('❌ Failed to load pharmacies from Supabase:', err);
      }
    };

    fetchPharmacies();
  }, []);

  // Pulse animation for user location dot
  useEffect(() => {
    const interval = setInterval(() => setUserPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredPharmacies = pharmacies.filter(ph => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ph.name.toLowerCase().includes(q) && !ph.address.toLowerCase().includes(q)) return false;
    }
    switch (activeFilter) {
      case 'open': return ph.open;
      case 'nearby': return parseFloat(ph.distance) <= 1.5;
      case 'topRated': return ph.rating >= 4.5;
      case 'rx': return ph.tags.includes('Rx');
      case '24hr': return ph.tags.includes('24hr');
      default: return true;
    }
  });

  const handleMarkerClick = useCallback((ph) => {
    setSelectedPharmacy(ph);
    setShowList(false);
  }, []);

  const renderStars = (rating) => (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className="material-symbols-outlined icon-fill" style={{
          fontSize: 12,
          color: star <= Math.round(rating) ? '#FFB800' : 'var(--outline-variant)',
        }}>star</span>
      ))}
    </div>
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--background)', overflow: 'hidden' }}>

      {/* ── Floating Search Bar ── */}
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14, zIndex: 40,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--canvas-white)', borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-lifted)', padding: '0 6px 0 18px', height: 52,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder="Search pharmacies nearby..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--on-surface)', outline: 'none',
            }}
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'var(--surface-container)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>close</span>
            </button>
          ) : (
            <button onClick={() => setShowList(!showList)} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: showList ? 'var(--primary)' : 'var(--surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 18, color: showList ? '#fff' : 'var(--on-surface-variant)',
              }}>{showList ? 'map' : 'list'}</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
          WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none',
        }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 'var(--radius-pill)', border: 'none',
                  background: isActive ? 'var(--primary)' : 'var(--canvas-white)',
                  color: isActive ? '#fff' : 'var(--on-surface)',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-global)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{f.icon}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map View ── */}
      {!showList && (
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, #e8f0fa 0%, #d4e2f0 30%, #c5d9ea 60%, #e0eaf2 100%)',
        }}>
          {/* Map grid / road pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.12,
            backgroundImage: `
              linear-gradient(var(--outline) 1px, transparent 1px),
              linear-gradient(90deg, var(--outline) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />

          {/* Simulated roads */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Main horizontal roads */}
            <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
            <line x1="0" y1="55" x2="100" y2="55" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
            {/* Main vertical roads */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
            {/* Diagonal roads */}
            <line x1="10" y1="20" x2="90" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            <line x1="15" y1="90" x2="85" y2="10" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          </svg>

          {/* Block fills (buildings) */}
          {[
            { x: 8, y: 12, w: 14, h: 18 },
            { x: 30, y: 8, w: 16, h: 22 },
            { x: 55, y: 5, w: 18, h: 25 },
            { x: 78, y: 15, w: 15, h: 15 },
            { x: 5, y: 42, w: 16, h: 10 },
            { x: 55, y: 42, w: 14, h: 10 },
            { x: 30, y: 60, w: 15, h: 12 },
            { x: 60, y: 68, w: 18, h: 14 },
            { x: 8, y: 78, w: 12, h: 16 },
            { x: 85, y: 60, w: 10, h: 18 },
          ].map((b, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${b.x}%`, top: `${b.y}%`,
              width: `${b.w}%`, height: `${b.h}%`,
              background: 'rgba(200,215,230,0.5)',
              borderRadius: 4,
            }} />
          ))}

          {/* Park/green areas */}
          {[
            { x: 38, y: 38, w: 10, h: 8 },
            { x: 70, y: 78, w: 12, h: 10 },
          ].map((p, i) => (
            <div key={`park-${i}`} style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              width: `${p.w}%`, height: `${p.h}%`,
              background: 'rgba(74,225,118,0.15)',
              borderRadius: 8,
            }} />
          ))}

          {/* Delivery radius circle */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 280, height: 280, borderRadius: '50%',
            border: '2px dashed rgba(0,81,223,0.2)',
            background: 'rgba(0,81,223,0.04)',
            pointerEvents: 'none',
          }} />

          {/* User location (center) */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 10,
            pointerEvents: 'none',
          }}>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute', inset: -16, borderRadius: '50%',
              background: 'rgba(0,81,223,0.12)',
              animation: 'searching-pulse 3s ease-in-out infinite',
            }} />
            {/* Dot */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--primary)', border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,81,223,0.4)',
            }} />
          </div>

          {/* Pharmacy Markers */}
          {filteredPharmacies.map(ph => {
            const isSelected = selectedPharmacy?.id === ph.id;
            return (
              <button
                key={ph.id}
                onClick={() => handleMarkerClick(ph)}
                style={{
                  position: 'absolute', left: `${ph.x}%`, top: `${ph.y}%`,
                  transform: `translate(-50%, -100%) ${isSelected ? 'scale(1.25)' : 'scale(1)'}`,
                  background: 'none', border: 'none', padding: 0,
                  zIndex: isSelected ? 20 : 5, cursor: 'pointer',
                  transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  animation: `slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both`,
                }}
              >
                {/* Pin shape */}
                <div style={{
                  width: isSelected ? 44 : 36, height: isSelected ? 44 : 36,
                  borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                  background: ph.open
                    ? (isSelected ? 'var(--primary)' : 'var(--canvas-white)')
                    : 'var(--surface-container-high)',
                  border: isSelected ? '3px solid var(--primary)' : '2px solid var(--border-hairline)',
                  boxShadow: isSelected ? '0 4px 16px rgba(0,81,223,0.35)' : 'var(--shadow-global)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span className="material-symbols-outlined icon-fill" style={{
                    fontSize: isSelected ? 20 : 17,
                    color: ph.open
                      ? (isSelected ? '#fff' : 'var(--primary)')
                      : 'var(--outline)',
                    transform: 'rotate(45deg)',
                  }}>local_pharmacy</span>
                </div>
                {/* Name label */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', bottom: -8, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)', color: '#fff',
                    padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                    fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,81,223,0.3)',
                    animation: 'fade-in 0.2s ease both',
                  }}>{ph.name}</div>
                )}
              </button>
            );
          })}

          {/* Zoom Controls */}
          <div style={{
            position: 'absolute', bottom: selectedPharmacy ? 220 : 100, right: 14,
            display: 'flex', flexDirection: 'column', gap: 2, zIndex: 20,
            transition: 'bottom 0.3s ease',
          }}>
            <button onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))} style={{
              width: 40, height: 40, borderRadius: '12px 12px 4px 4px',
              background: 'var(--canvas-white)', border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--shadow-global)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface)' }}>add</span>
            </button>
            <button onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.6))} style={{
              width: 40, height: 40, borderRadius: '4px 4px 12px 12px',
              background: 'var(--canvas-white)', border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--shadow-global)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface)' }}>remove</span>
            </button>
          </div>

          {/* My Location button */}
          <button style={{
            position: 'absolute', bottom: selectedPharmacy ? 220 : 100, left: 14,
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--canvas-white)', border: '1px solid var(--border-hairline)',
            boxShadow: 'var(--shadow-global)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 20,
            transition: 'bottom 0.3s ease',
          }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20, color: 'var(--primary)' }}>my_location</span>
          </button>

          {/* Pharmacy count badge */}
          <div style={{
            position: 'absolute', top: 128, left: 14, zIndex: 20,
            background: 'var(--canvas-white)', borderRadius: 'var(--radius-pill)',
            padding: '6px 14px', boxShadow: 'var(--shadow-global)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: 'var(--primary)' }}>local_pharmacy</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>
              {filteredPharmacies.length} pharmacies
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>in range</span>
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {showList && (
        <div style={{
          flex: 1, overflowY: 'auto', paddingTop: 130, paddingBottom: 90,
          background: 'var(--background)',
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--space-margin-mobile)' }}>
            <p className="font-label-caps" style={{
              fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 12, paddingLeft: 4,
            }}>{filteredPharmacies.length} pharmacies found</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPharmacies.map((ph, i) => (
                <div
                  key={ph.id}
                  className="card"
                  onClick={() => { setSelectedPharmacy(ph); setShowList(false); }}
                  style={{
                    padding: 16, cursor: 'pointer',
                    animation: `slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s both`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 14 }}>
                    {/* Pharmacy icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: ph.open ? 'var(--primary-fixed)' : 'var(--surface-container)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined icon-fill" style={{
                        fontSize: 28, color: ph.open ? 'var(--primary)' : 'var(--outline)',
                      }}>local_pharmacy</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <p className="font-body-sm" style={{ fontWeight: 700, fontSize: 15 }}>{ph.name}</p>
                        {ph.type === 'Verified Partner' && (
                          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: 'var(--primary)' }}>verified</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 6 }}>{ph.address}</p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 14, color: '#FFB800' }}>star</span>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{ph.rating}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>({ph.reviews})</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--border-hairline)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{ph.distance}</span>
                        <span style={{ fontSize: 11, color: 'var(--border-hairline)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 600 }}>~{ph.delivery}</span>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <span className="badge" style={{
                          background: ph.open ? 'rgba(0,110,47,0.08)' : 'rgba(186,26,26,0.08)',
                          color: ph.open ? 'var(--secondary)' : 'var(--error)',
                          fontSize: 9, padding: '2px 8px',
                        }}>{ph.open ? 'OPEN' : 'CLOSED'}</span>
                        {ph.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="badge" style={{
                            background: 'var(--surface-container)', color: 'var(--on-surface-variant)',
                            fontSize: 9, padding: '2px 8px',
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Sheet (Selected Pharmacy) ── */}
      {selectedPharmacy && !showList && (
        <div
          ref={bottomSheetRef}
          style={{
            position: 'absolute', bottom: 70, left: 0, right: 0, zIndex: 30,
            background: 'var(--canvas-white)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
            padding: '16px 20px 20px',
            maxWidth: 480, margin: '0 auto',
            animation: 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'var(--outline-variant)', margin: '0 auto 14px',
          }} />

          {/* Pharmacy Info */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: selectedPharmacy.open ? 'var(--primary-fixed)' : 'var(--surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined icon-fill" style={{
                fontSize: 30, color: selectedPharmacy.open ? 'var(--primary)' : 'var(--outline)',
              }}>local_pharmacy</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <h3 className="font-card-title" style={{ fontSize: 16 }}>{selectedPharmacy.name}</h3>
                {selectedPharmacy.type === 'Verified Partner' && (
                  <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: 'var(--primary)' }}>verified</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 6 }}>{selectedPharmacy.address}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {renderStars(selectedPharmacy.rating)}
                <span style={{ fontSize: 12, fontWeight: 700 }}>{selectedPharmacy.rating}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>({selectedPharmacy.reviews} reviews)</span>
              </div>
            </div>
            <button onClick={() => setSelectedPharmacy(null)} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'var(--surface-container)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>close</span>
            </button>
          </div>

          {/* Quick Info */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16,
          }}>
            {[
              { icon: 'near_me', value: selectedPharmacy.distance, label: 'Away' },
              { icon: 'bolt', value: selectedPharmacy.delivery, label: 'Delivery' },
              { icon: 'schedule', value: selectedPharmacy.hours.split(' – ')[1], label: 'Closes' },
            ].map(info => (
              <div key={info.label} style={{
                flex: 1, textAlign: 'center', padding: '10px 6px',
                background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)', display: 'block', marginBottom: 2 }}>{info.icon}</span>
                <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 1 }}>{info.value}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-secondary)' }}>{info.label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="badge" style={{
              background: selectedPharmacy.open ? 'rgba(0,110,47,0.1)' : 'rgba(186,26,26,0.1)',
              color: selectedPharmacy.open ? 'var(--secondary)' : 'var(--error)',
              fontSize: 10,
            }}>{selectedPharmacy.open ? 'OPEN NOW' : 'CLOSED'}</span>
            {selectedPharmacy.tags.map(tag => (
              <span key={tag} className="badge badge-primary" style={{ fontSize: 10 }}>{tag}</span>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => navigate('/user/rx-upload')}
              style={{ flex: 1, borderRadius: 'var(--radius-md)', minHeight: 48 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>medication</span>
              Order Now
            </button>
            <button className="btn-secondary" style={{
              borderRadius: 'var(--radius-md)', minHeight: 48, padding: '0 16px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>directions</span>
            </button>
            <button className="btn-secondary" style={{
              borderRadius: 'var(--radius-md)', minHeight: 48, padding: '0 16px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>call</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  );
}
