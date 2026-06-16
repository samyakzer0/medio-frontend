import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CountdownTimer from '../../components/CountdownTimer';

export default function LabsDashboard() {
  const navigate = useNavigate();
  const { state, acceptOrder, markReadyForPickup, dispatchAssociate, markDelivered, dispatch, showToast, isSupabaseLive } = useApp();
  const { orderStatus, orderId, pendingFlashPing, pharmacyName, riderName } = state;

  const isLabPing = pendingFlashPing && pendingFlashPing.orderType === 'lab';
  const showFlash = orderStatus === 'FLASH_WINDOW' && isLabPing;

  // Active lab job states
  const activeJob = (orderStatus !== 'IDLE' && orderStatus !== 'EXPIRED' && state.orderType === 'lab') ? {
    id: orderId,
    patientName: pendingFlashPing?.patientName || 'Jayesh Harrison',
    serviceName: pendingFlashPing?.items?.[0]?.name || 'Blood Pressure (BP) Checkup',
    status: orderStatus,
    price: pendingFlashPing?.items?.[0]?.price || 49
  } : null;

  const handleAcceptPing = () => {
    acceptOrder('lab-hub-1', 'Medio Diagnostics Lab');
    showToast('success', 'Service request accepted! Preparing diagnostics kit.');
  };

  const handleDeclinePing = () => {
    dispatch({ type: 'EXPIRE_ORDER' });
    showToast('success', 'Service request declined.');
  };

  // Lab progress state advances
  const handleMarkKitReady = () => {
    if (isSupabaseLive()) {
      markReadyForPickup();
      showToast('success', 'Kit assembled! Assigning associate...');
    } else {
      dispatch({ type: 'START_PACKAGING' });
      setTimeout(() => {
        dispatch({ type: 'MARK_READY' });
        showToast('success', 'Health associate dispatched!');
      }, 1000);
    }
  };

  const handleMarkArrival = () => {
    if (isSupabaseLive()) {
      dispatchAssociate();
      showToast('success', 'Associate en-route. Patient notified.');
    } else {
      dispatch({
        type: 'DISPATCH_RIDER',
        payload: { riderName: 'Nurse Amit S.', riderEta: 5 }
      });
      showToast('success', 'Associate en-route. Patient notified.');
    }
  };

  const handleCompleteScreening = () => {
    if (isSupabaseLive()) {
      markDelivered();
      showToast('success', 'Screening completed! Digital records sent.');
    } else {
      dispatch({ type: 'MARK_DELIVERED' });
      showToast('success', 'Screening completed! Digital records sent.');
    }
  };

  const handleResetScreen = () => {
    dispatch({ type: 'RESET_ORDER' });
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      color: 'var(--on-background)',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 40,
    }}>
      
      {/* ── AppBar ── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20 }}>🔬</span>
          </div>
          <div>
            <span className="font-heading-md" style={{ fontSize: 16, display: 'block', fontWeight: 700 }}>Medio Diagnostics</span>
            <span style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 600 }}>NABL REGISTERED • HUB-08</span>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'searching-pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, color: '#047857', fontWeight: 700, letterSpacing: '0.04em' }}>ONLINE</span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '24px 20px 0' }}>
        
        {/* Vitals Summary Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)',
          border: 'none',
          padding: '24px',
          color: '#fff',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 8px 32px rgba(139,92,246,0.25)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative glass glow */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(139,92,246,0.35)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          
          <span className="font-label-caps" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>LABORATORY PERFORMANCE</span>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 20px 0', fontFamily: 'Poppins' }}>₹4,890 <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>today</span></h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Completed', val: '24' },
              { label: 'Pending', val: activeJob ? '1' : '0' },
              { label: 'Quality Rating', val: '99.4%' }
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px 0' }}>{stat.val}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Job Tracker ── */}
        <section style={{ marginBottom: 28 }}>
          <h3 className="font-heading-md" style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: '#8b5cf6', fontSize: 20 }}>assignment</span>
            Active Diagnostics Job
          </h3>

          {activeJob ? (
            <div className="card" style={{ padding: 20, border: '2px solid rgba(139,92,246,0.3)', boxShadow: 'var(--shadow-lifted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
                    {activeJob.status}
                  </span>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{activeJob.serviceName}</h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: '2px 0 0 0' }}>Patient: <strong>{activeJob.patientName}</strong></p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>₹{activeJob.price}</span>
              </div>

              {/* Steps Progress Visualizer */}
              <div style={{
                background: 'var(--surface-container-low)', padding: 12, borderRadius: 12, border: '1px solid var(--border-hairline)', marginBottom: 20,
                fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--outline)' }}>Vitals Collection Address:</span>
                  <span style={{ fontWeight: 600 }}>DN Nagar, Andheri West</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--outline)' }}>Reference ID:</span>
                  <span style={{ fontWeight: 600 }}>{activeJob.id}</span>
                </div>
                {riderName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-hairline)', paddingTop: 6 }}>
                    <span style={{ color: 'var(--outline)' }}>Assigned Nurse/Associate:</span>
                    <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{riderName}</span>
                  </div>
                )}
              </div>

              {/* Lab Actions based on state */}
              {activeJob.status === 'ACCEPTED' && (
                <button className="btn-primary" onClick={handleMarkKitReady} style={{ width: '100%', height: 48, background: '#8b5cf6', boxShadow: 'none' }}>
                  <span className="material-symbols-outlined">work</span>
                  Assemble Kit &amp; Assign Associate
                </button>
              )}
              {activeJob.status === 'PACKAGING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--outline)', fontSize: 12 }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s linear infinite', fontSize: 18, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}>sync</span>
                    Assembling sterile kit tubes…
                  </div>
                  <button className="btn-primary" onClick={handleMarkKitReady} style={{ width: '100%', height: 48, background: '#8b5cf6', boxShadow: 'none' }}>
                    <span className="material-symbols-outlined">work</span>
                    Kit Ready - Dispatch Associate
                  </button>
                </div>
              )}
              {activeJob.status === 'READY_FOR_PICKUP' && (
                <button className="btn-primary" onClick={handleMarkArrival} style={{ width: '100%', height: 48, background: 'var(--secondary)', boxShadow: 'none' }}>
                  <span className="material-symbols-outlined">directions_bike</span>
                  Dispatch Associate (Amit S.)
                </button>
              )}
              {activeJob.status === 'RIDER_DISPATCHED' && (
                <button className="btn-primary" onClick={handleCompleteScreening} style={{ width: '100%', height: 48, background: 'var(--primary)', boxShadow: 'none' }}>
                  <span className="material-symbols-outlined">done_all</span>
                  Confirm screening completed
                </button>
              )}
              {activeJob.status === 'DELIVERED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#047857', padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                    ✓ Vitals check completed and reported successfully!
                  </div>
                  <button className="btn-secondary btn-pill" onClick={handleResetScreen} style={{ height: 40, fontSize: 12 }}>
                    Clear Job
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--outline-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--outline)', marginBottom: 8 }}>medical_information</span>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>No active appointments. Incoming requests will trigger a flash alert.</p>
            </div>
          )}
        </section>

        {/* ── Pathology Hub Catalog ── */}
        <section>
          <h3 className="font-heading-md" style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--secondary)', fontSize: 20 }}>biotech</span>
            Certified Services Catalog
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Blood Pressure Checkup', code: 'BP-01', std: 'Govt. Directive Sec 4' },
              { name: 'Blood Sugar / Glucose Screening', code: 'GLU-02', std: 'FDA Calibrated' },
              { name: 'Wound Dressing & First Aid Care', code: 'WND-03', std: 'Sterile Care Standard' },
              { name: 'ECG / Heart Rhythm Audit', code: 'ECG-04', std: 'Non-invasive FDA' },
            ].map(catalogItem => (
              <div key={catalogItem.code} style={{
                background: 'var(--canvas-white)', border: '1px solid var(--border-hairline)', borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{catalogItem.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--outline)' }}>STD: {catalogItem.std}</span>
                </div>
                <span style={{ fontSize: 10, background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: 4, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                  {catalogItem.code}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Realtime 10-Minute Labs Flash Alert Modal ── */}
      {showFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'radial-gradient(circle at center, rgba(30,27,75,0.92) 0%, rgba(15,12,30,0.98) 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '24px 20px',
        }}>
          {/* Header indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ba1a1a', padding: '6px 16px', borderRadius: 'var(--radius-pill)', marginBottom: 20 }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: '#fff' }}>bolt</span>
            <span className="font-label-caps" style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>LABS FLASH REQUEST</span>
          </div>

          {/* 10-Minute Countdown Timer */}
          <div style={{ marginBottom: 30 }}>
            <CountdownTimer
              endsAt={pendingFlashPing.expiresAt || (Date.now() + 10 * 60 * 1000)}
              onExpire={() => dispatch({ type: 'EXPIRE_ORDER' })}
            />
          </div>

          {/* Request details card */}
          <div className="card animate-bounce-in" style={{
            background: 'var(--canvas-white)', width: '100%', maxWidth: 400, padding: 24, borderRadius: 24,
            textAlign: 'center', boxShadow: '0 20px 48px rgba(0,0,0,0.5)', border: 'none'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'rgba(139,92,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              color: '#8b5cf6'
            }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 30 }}>biotech</span>
            </div>

            <h3 className="font-heading-md" style={{ fontSize: 18, marginBottom: 4 }}>New Service Screening</h3>
            <span style={{ fontSize: 11, background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 700 }}>
              LAB CHECKUP REQUEST
            </span>

            <div style={{ height: 1, background: 'var(--border-hairline)', margin: '18px 0' }} />

            {/* Patient & service details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--outline)', display: 'block', fontWeight: 600 }}>PATIENT NAME</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{pendingFlashPing.patientName}</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--outline)', display: 'block', fontWeight: 600 }}>DIAGNOSTIC SERVICE REQUESTED</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--secondary)' }}>{pendingFlashPing.items?.[0]?.name}</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--outline)', display: 'block', fontWeight: 600 }}>LOCATION DISTANCE</span>
                <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>1.2 km away • Andheri West</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400, marginTop: 30
          }}>
            <button
              onClick={handleAcceptPing}
              className="btn-primary btn-pill"
              style={{
                height: 56, fontSize: 16, background: '#8b5cf6', color: '#fff', border: 'none',
                boxShadow: '0 8px 24px rgba(139,92,246,0.45)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>done</span>
              Accept &amp; Schedule Associate
            </button>
            <button
              onClick={handleDeclinePing}
              className="btn-secondary btn-pill"
              style={{ height: 46, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Decline Request
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
