import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../config/supabase';

const PORTAL_CONFIGS = {
  user: {
    primary: 'var(--primary)',
    primaryFixed: 'var(--primary-fixed)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 81, 223, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
    badge: 'CUSTOMER PORTAL',
    badgeColor: 'var(--primary)',
    badgeBg: 'var(--primary-fixed)',
    title: 'Join Medio',
    subtitle: 'Your 10-minute neighborhood medicine cabinet.',
    defaultRoute: '/user',
    mockId: 'usr-jayesh',
    mockName: 'Jayesh Harrison',
  },
  pharmacy: {
    primary: 'var(--secondary)',
    primaryFixed: 'var(--secondary-container)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 110, 47, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
    badge: 'PARTNER PHARMACY',
    badgeColor: 'var(--secondary)',
    badgeBg: 'var(--secondary-container)',
    title: 'Partner Portal',
    subtitle: 'Fulfill prescription & OTC orders for your local community.',
    defaultRoute: '/pharmacy',
    mockId: 'ph1',
    mockName: 'MedPlus Pharmacy',
  },
  rider: {
    primary: 'var(--tertiary)',
    primaryFixed: 'var(--tertiary-fixed)',
    bgGradient: 'linear-gradient(135deg, rgba(133, 83, 0, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
    badge: 'RIDER DISPATCH',
    badgeColor: 'var(--tertiary)',
    badgeBg: 'var(--tertiary-fixed)',
    title: 'Rider Portal',
    subtitle: 'Earn on your schedule. Deliver health to patients in minutes.',
    defaultRoute: '/rider',
    mockId: 'rdr-rahul',
    mockName: 'Rahul S.',
  },
};

export default function AuthScreen({ portal = 'user' }) {
  const navigate = useNavigate();
  const { showToast, isSupabaseLive } = useApp();
  const config = PORTAL_CONFIGS[portal] || PORTAL_CONFIGS.user;

  // State
  const [step, setStep] = useState('INPUT'); // 'INPUT' | 'OTP'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  // Timer Ref
  const timerRef = useRef(null);

  // Restart OTP timer
  const startTimer = useCallback(() => {
    setTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      showToast('error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    const live = isSupabaseLive();
    
    try {
      // Normalize number
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.trim()}`;

      if (live) {
        console.log(`📡 Sending OTP via Supabase to ${formattedPhone}...`);
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
        if (error) throw error;
        
        showToast('success', 'Verification code sent!');
      } else {
        // Local Sandbox simulation
        console.log(`💡 Local Sandbox: Simulating OTP send to ${formattedPhone}`);
        showToast('info', 'Sandbox Mode: Simulated SMS code sent! Enter 123456 to bypass.');
      }
      
      setStep('OTP');
      startTimer();
    } catch (err) {
      console.error('❌ Supabase OTP trigger failed:', err);
      showToast('error', err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast('error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const live = isSupabaseLive();

    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.trim()}`;

      if (live) {
        console.log(`📡 Verifying OTP ${otp} for ${formattedPhone}...`);
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });
        
        if (error) throw error;
        
        // Save role metadata on signup
        if (data?.user) {
          await supabase.auth.updateUser({
            data: { role: portal }
          });
        }
        
        showToast('success', 'Login successful!');
        navigate(config.defaultRoute);
      } else {
        // Sandbox bypass
        if (otp === '123456' || otp === '000000') {
          showToast('success', `Welcome back, ${config.mockName}! (Sandbox Mode)`);
          navigate(config.defaultRoute);
        } else {
          showToast('error', 'Invalid code. Use 123456 to login inside local sandbox.');
        }
      }
    } catch (err) {
      console.error('❌ Supabase OTP verification failed:', err);
      showToast('error', err.message || 'Authentication failed. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    const live = isSupabaseLive();
    if (live) {
      try {
        console.log('📡 Initializing Google OAuth flow...');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}${config.defaultRoute}`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });
        if (error) throw error;
      } catch (err) {
        console.error('❌ OAuth error:', err);
        showToast('error', 'Google Sign-In failed.');
      }
    } else {
      showToast('success', `Welcome back, ${config.mockName}! (Google OAuth Simulation)`);
      navigate(config.defaultRoute);
    }
  };

  // Quick Sandbox Bypass Chip
  const handleSimulateQuickLogin = () => {
    showToast('success', `Logged in dynamically as ${config.mockName}`);
    navigate(config.defaultRoute);
  };

  return (
    <div className="screen" style={{
      background: 'var(--surface)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Immersive background decoration */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: config.primary,
        opacity: 0.08,
        filter: 'blur(60px)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-15%',
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'var(--primary)',
        opacity: 0.05,
        filter: 'blur(50px)',
        zIndex: 0,
      }} />

      {/* Main Glassmorphic Container Card */}
      <div className="card animate-slide-up" style={{
        width: '100%',
        maxWidth: 400,
        padding: '36px 28px',
        zIndex: 1,
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--border-hairline)',
        boxShadow: 'var(--shadow-lifted)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Portal Floating Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <span className="badge" style={{
            background: config.badgeBg,
            color: config.badgeColor,
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.08em',
            padding: '4px 12px',
            borderRadius: 6,
          }}>
            {config.badge}
          </span>
        </div>

        {/* Title & Description */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 className="font-heading-md" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: 'var(--on-surface)' }}>
            {config.title}
          </h1>
          <p className="font-body-sm" style={{ color: 'var(--ink-secondary)', fontSize: 13, lineHeight: '18px', padding: '0 8px' }}>
            {config.subtitle}
          </p>
        </div>

        {step === 'INPUT' ? (
          /* ================= PHONE NUMBER INPUT VIEW ================= */
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 6,
                paddingLeft: 2
              }}>
                Enter Mobile Number
              </label>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface-container-low)',
                border: '1.5px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '0 14px',
                transition: 'border-color 0.25s ease',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--outline)', marginRight: 8 }}>+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1,
                    height: 48,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--on-surface)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-pill"
              style={{
                background: config.primary,
                color: '#fff',
                height: 50,
                marginTop: 6,
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="material-symbols-outlined icon-spin" style={{ fontSize: 20 }}>progress_activity</span>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        ) : (
          /* ================= OTP VERIFICATION CODE VIEW ================= */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingLeft: 2
                }}>
                  Verification Code (OTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep('INPUT')}
                  style={{
                    background: 'none', border: 'none', color: 'var(--primary)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Edit Number
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface-container-low)',
                border: '1.5px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '0 14px',
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--outline)', marginRight: 10, fontSize: 20 }}>lock</span>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1,
                    height: 48,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--on-surface)',
                    letterSpacing: otp.length > 0 ? '0.2em' : 'normal',
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 6, paddingLeft: 2 }}>
                Sent to +91 {phone.substring(0, 5)} {phone.substring(5)}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-pill"
              style={{
                background: config.primary,
                color: '#fff',
                height: 50,
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="material-symbols-outlined icon-spin" style={{ fontSize: 20 }}>progress_activity</span>
              ) : (
                'Verify & Continue'
              )}
            </button>

            {/* Resend OTP handler */}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              {timer > 0 ? (
                <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Resend code in <strong style={{ color: 'var(--on-surface)' }}>{timer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none', border: 'none', color: config.primary,
                    fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  Resend Verification SMS
                </button>
              )}
            </div>
          </form>
        )}

        {/* OR Divider Line */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
          <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 700, letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
        </div>

        {/* Social Authentication buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--on-surface)',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-global)',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Native Inline Google Icon SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.97-1.07 2.05l3.22 2.5c1.88-1.73 2.9-4.28 2.9-6.38z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.22-2.5c-.9.6-2.05.96-3.22.96-3.11 0-5.74-2.1-6.68-4.96l-3.32 2.58C5.45 21.09 8.44 24 12 24z"/>
              <path fill="#FBBC05" d="M5.32 14.59c-.24-.7-.37-1.44-.37-2.22s.13-1.52.37-2.22L2 7.57C1.24 9.1 0.8 10.97 0 12.37c0 1.4.44 3.27 1.2 4.8l4.12-2.58z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.44 0 5.45 2.91 3.5 6.03L6.82 8.6c.94-2.85 3.57-4.95 6.68-4.95z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sandbox Quick Bypass Button */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={handleSimulateQuickLogin}
            style={{
              background: config.primaryFixed,
              color: config.primary,
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-global)',
              transition: 'opacity 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>construction</span>
            Simulate Sandbox Login
          </button>
        </div>
      </div>

      {/* Footer Details */}
      <div style={{
        marginTop: 20,
        textAlign: 'center',
        opacity: 0.5,
        zIndex: 1,
        fontSize: 11,
        color: 'var(--outline)'
      }}>
        <p>Medio is dynamic, real-time, and secure.</p>
        <p style={{ marginTop: 4 }}>© 2026 Medio Fulfillment Networks.</p>
      </div>
    </div>
  );
}
