import React, { useState, useEffect, useRef } from 'react';

/**
 * CountdownTimer — live 3-minute countdown
 * Props:
 *   endsAt: timestamp (ms) when window expires
 *   onExpire: callback when reaches 0
 */
export default function CountdownTimer({ endsAt, onExpire }) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  const callbackRef = useRef(onExpire);
  callbackRef.current = onExpire;

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        callbackRef.current?.();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [endsAt]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = totalSeconds <= 30;
  const isCritical = totalSeconds <= 10;
  const progressPct = Math.min(100, (remaining / (3 * 60 * 1000)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Circular progress ring */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-container)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={isCritical ? 'var(--error)' : isWarning ? 'var(--tertiary-container)' : 'var(--primary)'}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span
            className="font-hero-lg-mobile animate-pulse-countdown"
            style={{
              color: isCritical ? 'var(--error)' : isWarning ? 'var(--tertiary)' : 'var(--primary)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              animation: isWarning ? 'countdown-pulse 0.8s ease-in-out infinite' : 'countdown-pulse 1.5s ease-in-out infinite',
            }}
          >
            {display}
          </span>
        </div>
      </div>
      <span className="font-label-caps" style={{ color: 'var(--ink-secondary)', fontSize: 11 }}>
        {isCritical ? '⚠ EXPIRING SOON' : isWarning ? 'TIME RUNNING OUT' : 'TIME TO CLAIM'}
      </span>
    </div>
  );
}
