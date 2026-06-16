import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { useApp } from '../../context/AppContext';

const MEDICAL_SERVICES = [
  {
    id: 's1',
    name: 'Blood Pressure (BP) Checkup',
    category: 'Vitals',
    description: 'Blood pressure screening by certified pharmacy professionals using clinical-grade digital monitors.',
    price: 49,
    duration: '5 mins',
    icon: 'favorite',
    iconColor: 'var(--error)',
    badge: 'Essential',
    govReference: 'Sec. 4 Healthcare Reliance Rules',
  },
  {
    id: 's2',
    name: 'Blood Sugar / Glucose Test',
    category: 'Vitals',
    description: 'Fast, hygienic blood glucose monitoring (fasting/random) with sterile lancets. Immediate digital log.',
    price: 79,
    duration: '5 mins',
    icon: 'water_drop',
    iconColor: '#2b82f6',
    badge: 'Popular',
    govReference: 'CLIA Compliant Screening',
  },
  {
    id: 's3',
    name: 'First Aid & Wound Care',
    category: 'Primary Care',
    description: 'Minor wound cleansing, sterile dressing, and professional bandages administered by certified health assistants.',
    price: 149,
    duration: '15 mins',
    icon: 'healing',
    iconColor: 'var(--secondary)',
    badge: 'Standard Care',
    govReference: 'Primary Aid Directives 2024',
  },
  {
    id: 's4',
    name: 'Comprehensive Vitals Checkup',
    category: 'Wellness Pack',
    description: 'Complete health audit: BP, Glucose, SpO2, Pulse, and Temp. Includes instant digital health card.',
    price: 249,
    duration: '20 mins',
    icon: 'health_and_safety',
    iconColor: '#8b5cf6',
    badge: 'Best Value',
    govReference: 'General Wellness Guidelines',
  },
  {
    id: 's5',
    name: 'ECG / Heart Rhythm Screening',
    category: 'Cardiology',
    description: '1-Lead cardiac rhythm screening using pocket FDA-cleared devices to identify irregular heartbeats.',
    price: 399,
    duration: '10 mins',
    icon: 'vital_signs',
    iconColor: '#f43f5e',
    badge: 'Advanced',
    govReference: 'Non-invasive Rhythm Screen',
  },
  {
    id: 's6',
    name: 'Doorstep Lab Sample Collection',
    category: 'Diagnostics',
    description: 'Home sample collection by certified phlebotomists. Diagnostics processed at NABL-accredited labs.',
    price: 199,
    duration: '15 mins',
    icon: 'biotech',
    iconColor: '#f59e0b',
    badge: 'Diagnostic',
    govReference: 'NABL Accredited Partners',
  }
];

export default function ExploreScreen() {
  const navigate = useNavigate();
  const { state, dispatch, showToast, submitOrder } = useApp();
  const [searchVal, setSearchVal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookingService, setBookingService] = useState(null);
  
  // Booking Form State
  const [patientName, setPatientName] = useState('Jayesh Harrison');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingRefId, setBookingRefId] = useState('');

  const handleBookClick = (service) => {
    setBookingService(service);
    setBookingConfirmed(false);
    setPatientName('Jayesh Harrison');
    setSelectedDate('Today');
    setSelectedTimeSlot('Morning (9 AM - 12 PM)');
  };

  const handleConfirmBooking = () => {
    if (!patientName.trim()) {
      showToast('error', 'Please enter patient name');
      return;
    }
    
    // Submit the lab service request to initiate realtime flash ping
    submitOrder({
      orderType: 'lab',
      otcItems: [{ name: bookingService.name, qty: 1, price: bookingService.price, icon: bookingService.icon, iconColor: bookingService.iconColor }],
      patientName: patientName,
      totalPaise: bookingService.price * 100,
    });

    setBookingService(null);
    showToast('success', `Requesting ${bookingService.name} checkup...`);
    
    // Redirect to active tracking / history screen
    navigate('/user/tracking');
  };

  const filteredServices = MEDICAL_SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchVal.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchVal.toLowerCase());
    const matchesCat = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['All', 'Vitals', 'Primary Care', 'Wellness Pack', 'Cardiology', 'Diagnostics'];

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      
      {/* ── Top AppBar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 24px',
        backdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => navigate('/user')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 24 }}>arrow_back</span>
        </button>
        <div>
          <span className="font-heading-md" style={{ fontSize: 18, color: 'var(--primary)' }}>Medical Services</span>
        </div>
      </header>

      {/* ── Main Scroll Content ── */}
      <main style={{ paddingTop: 68, flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
        <div className="screen-content" style={{ paddingTop: 20 }}>
          
          {/* Location details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>location_on</span>
            <span className="font-body-sm" style={{ color: 'var(--ink-secondary)' }}>Serving area: <strong style={{ color: 'var(--on-surface)' }}>Andheri West, Mumbai</strong></span>
          </div>

          {/* Government compliance card */}
          <div style={{
            background: 'rgba(0, 110, 47, 0.05)',
            border: '1px solid rgba(0, 110, 47, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            marginBottom: 24,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 24, flexShrink: 0, marginTop: 2 }}>gavel</span>
            <div>
              <h4 style={{ color: 'var(--secondary)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Government Reliance Compliance</h4>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: '1.6' }}>
                All basic diagnostics, BP checkups, and sugar screenings are conducted by certified and trained pharmacy professionals. Advanced testing processed only with NABL-accredited diagnostic laboratory partners.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--canvas-white)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-hairline)',
            boxShadow: 'var(--shadow-global)',
            padding: '0 20px',
            height: 50,
            marginBottom: 20,
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: 20 }}>search</span>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search checkups, diagnostics..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, color: 'var(--on-surface)',
                outline: 'none',
              }}
            />
          </div>

          {/* Categories Filter Chips */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16,
            WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none',
            marginRight: '-24px', marginLeft: '-24px', paddingLeft: '24px', paddingRight: '24px'
          }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                    border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--border-hairline)'),
                    background: isSelected ? 'var(--primary)' : 'var(--canvas-white)',
                    color: isSelected ? '#fff' : 'var(--on-surface-variant)',
                    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-global)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Services List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <div key={service.id} className="card" style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Service Top details */}
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: service.iconColor + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 24, color: service.iconColor }}>{service.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 className="font-card-title" style={{ fontSize: 16, margin: 0, color: 'var(--on-surface)' }}>{service.name}</h3>
                        <span className="badge" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)', fontSize: 9 }}>{service.badge}</span>
                      </div>
                      <span className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 12, display: 'inline-block', marginBottom: 8 }}>{service.category} • {service.duration}</span>
                      <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: 0 }}>{service.description}</p>
                    </div>
                  </div>

                  {/* Service Footer actions */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border-hairline)', paddingTop: 14, marginTop: 4
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--ink-secondary)', display: 'block' }}>Charges</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>₹{service.price}</span>
                    </div>
                    <button
                      className="btn-primary btn-pill"
                      onClick={() => handleBookClick(service)}
                      style={{
                        padding: '0 20px', minHeight: 38, fontSize: 13,
                        boxShadow: '0 4px 12px ' + service.iconColor + '30',
                        background: service.iconColor
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                      BOOK NOW
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>search_off</span>
                <p className="font-body-sm">No services match your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Booking Bottom Sheet Modal ── */}
      {bookingService && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(25, 28, 31, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}
        onClick={() => setBookingService(null)}
        >
          <div style={{
            width: '100%', maxWidth: 480,
            background: 'var(--canvas-white)',
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            boxShadow: 'var(--shadow-modal)',
            maxHeight: '85dvh',
            overflowY: 'auto',
            animation: 'slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
          onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 className="font-heading-md" style={{ fontSize: 18, marginBottom: 4 }}>
                  {bookingConfirmed ? 'Booking Confirmed!' : 'Schedule Checkup'}
                </h3>
                <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
                  {bookingService.name}
                </span>
              </div>
              <button onClick={() => setBookingService(null)} style={{ background: 'var(--surface-container)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>close</span>
              </button>
            </div>

            {!bookingConfirmed ? (
              /* Booking Input Forms */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Patient Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: 8 }}>Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="Enter full name"
                    style={{
                      width: '100%', height: 48, borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-hairline)', padding: '0 16px',
                      fontSize: 14, color: 'var(--on-surface)', background: 'var(--surface-container-low)'
                    }}
                  />
                </div>

                {/* Date Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: 8 }}>Select Date</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Today', 'Tomorrow', 'Day After'].map(date => {
                      const isSelected = selectedDate === date;
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          style={{
                            flex: 1, height: 44, borderRadius: 'var(--radius-md)',
                            border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--border-hairline)'),
                            background: isSelected ? 'var(--primary)' : 'var(--canvas-white)',
                            color: isSelected ? '#fff' : 'var(--on-surface-variant)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: 8 }}>Preferred Time Window</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      'Morning (9 AM - 12 PM)',
                      'Afternoon (12 PM - 4 PM)',
                      'Evening (4 PM - 8 PM)'
                    ].map(slot => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedTimeSlot(slot)}
                          style={{
                            width: '100%', height: 44, borderRadius: 'var(--radius-md)',
                            border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--border-hairline)'),
                            background: isSelected ? 'var(--primary)' : 'var(--canvas-white)',
                            color: isSelected ? '#fff' : 'var(--on-surface-variant)',
                            fontSize: 13, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Address confirmation */}
                <div style={{
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  border: '1px solid var(--border-hairline)',
                  display: 'flex', gap: 10, alignItems: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>home</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--outline)', display: 'block', fontWeight: 600 }}>DELIVERING HEALTH AIDE TO</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface)', fontWeight: 500 }}>{state.userAddress || 'DN Nagar, Andheri West'}</span>
                  </div>
                </div>

                {/* Regulatory Stamp */}
                <p style={{ fontSize: 10, color: 'var(--outline)', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                  By proceeding, you agree to basic care guidelines. Safe distance & health hygiene measures will be followed by our clinical partner representative.
                </p>

                {/* Book Actions */}
                <button
                  className="btn-primary"
                  onClick={handleConfirmBooking}
                  style={{ width: '100%', height: 50, marginTop: 8 }}
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  CONFIRM APPOINTMENT (₹{bookingService.price})
                </button>
              </div>
            ) : (
              /* Booking Success Confirmation State */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0 0' }}>
                
                {/* Tick Animation */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(0, 110, 47, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'bounce-in 0.5s ease both'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--secondary)' }}>done</span>
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', margin: '0 0 6px' }}>Your medical service is scheduled!</p>
                  <span style={{ fontSize: 11, background: 'var(--surface-container-high)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 600, color: 'var(--on-surface)' }}>
                    Ref ID: {bookingRefId}
                  </span>
                </div>

                {/* Summary Info Box */}
                <div style={{
                  width: '100%',
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  border: '1px solid var(--border-hairline)',
                  display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>Service:</span>
                    <span style={{ fontWeight: 600 }}>{bookingService.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>Patient:</span>
                    <span style={{ fontWeight: 600 }}>{patientName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>Date:</span>
                    <span style={{ fontWeight: 600 }}>{selectedDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>Time Window:</span>
                    <span style={{ fontWeight: 600 }}>{selectedTimeSlot}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px dashed var(--border-hairline)', paddingTop: 10 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>Provider Code:</span>
                    <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{bookingService.govReference.split(' ')[0]} Compliant</span>
                  </div>
                </div>

                {/* Alert/Next steps */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18, marginTop: 2 }}>info</span>
                  <p style={{ fontSize: 11, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
                    A certified pharmacy clinical associate will contact you 30 minutes before arrival to confirm vitals preparation.
                  </p>
                </div>

                {/* Close Success Modal CTA */}
                <button
                  className="btn-pill"
                  onClick={() => setBookingService(null)}
                  style={{ width: '100%', height: 48, background: 'var(--primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  DONE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  );
}
