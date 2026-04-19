import React, { useState, useEffect } from 'react';
import { Page, Tweaks, accentMap, tokens } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingProps {
  setPage: (p: Page) => void;
  tweaks: Tweaks;
}

interface ScanType {
  id: Page;
  label: string;
  desc: string;
  time: string;
  checks: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
  border: string;
}

// ─── Landing — Scan Type Selector ─────────────────────────────────────────────

export const Landing: React.FC<LandingProps> = ({ setPage, tweaks }) => {
  const [hovered, setHovered] = useState<Page | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 90);
    return () => clearInterval(id);
  }, []);

  const accent = accentMap[tweaks.accent] ?? accentMap.purple;
  const sweepAngle = (tick * 3.5) % 360;

  const scanTypes: ScanType[] = [
    {
      id: 'photo',
      label: 'Photo Scan',
      desc: 'Upload or capture a photo of the room.',
      time: '~10 seconds',
      checks: ['Hidden cameras', 'Suspicious objects', 'Wiring hazards', 'Lock visibility'],
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="9" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="18" cy="19" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="18" cy="19" r="2" fill="currentColor"/>
          <path d="M13 9L15.5 5H20.5L23 9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="28" cy="13" r="1.5" fill="currentColor"/>
        </svg>
      ),
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.06))',
      border: 'rgba(168,85,247,0.45)',
    },
    {
      id: 'video',
      label: 'Video Scan',
      desc: 'Record a slow pan of your room.',
      time: '~30 seconds',
      checks: ['360° coverage', 'IR lens detection', 'RF triangulation', 'Depth mapping'],
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="3" y="10" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M25 14L33 10V26L25 22V14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="14" cy="18" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="14" cy="18" r="1.2" fill="currentColor"/>
        </svg>
      ),
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, rgba(8,145,178,0.18), rgba(6,182,212,0.06))',
      border: 'rgba(6,182,212,0.45)',
    },
    {
      id: 'dashboard',
      label: 'Live Scan',
      desc: 'Point your camera at any area for instant, continuous threat detection.',
      time: '~60 seconds',
      checks: ['Live detection', 'RF sweep', 'Network audit', 'Full report'],
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="18" cy="18" r="1.8" fill="currentColor"/>
          <path d="M18 6V10M18 26V30M6 18H10M26 18H30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M9.51 9.51L12.34 12.34M23.66 23.66L26.49 26.49M26.49 9.51L23.66 12.34M12.34 23.66L9.51 26.49"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, rgba(21,128,61,0.18), rgba(34,197,94,0.06))',
      border: 'rgba(34,197,94,0.45)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(130,80,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(130,80,255,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', width: 700, height: 700,
        borderRadius: '50%', transform: 'translate(-50%, -30%)', pointerEvents: 'none',
        background: `radial-gradient(circle, ${accent.glow.replace('0.35', '0.12')} 0%, transparent 65%)`,
      }} />

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '52px 48px 44px', position: 'relative', zIndex: 2 }}>

        {/* Heading + animated radar orb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 16 }}>
          {/* Radar orb */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${accent.secondary}44`, animation: 'ringPulse 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: `1px solid ${accent.secondary}55`, animation: 'ringPulse 2s ease-out infinite 0.4s' }} />
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${accent.primary}33, ${accent.primary}11)`, border: `1.5px solid ${accent.secondary}88`, overflow: 'hidden' }}>
              {/* Sweep */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from ${sweepAngle}deg, ${accent.secondary}28 0deg, transparent 75deg)` }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '1.5px', transformOrigin: 'left center', transform: `rotate(${sweepAngle}deg)`, background: `linear-gradient(90deg, transparent, ${accent.secondary})`, boxShadow: `0 0 6px ${accent.secondary}` }} />
              {/* Crosshairs */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${accent.secondary}22`, transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${accent.secondary}22`, transform: 'translateX(-50%)' }} />
              {/* Blips */}
              <div style={{ position: 'absolute', top: '28%', left: '65%', width: 4, height: 4, borderRadius: '50%', background: tokens.red, boxShadow: `0 0 6px ${tokens.red}`, animation: 'blipPulse 1.8s infinite' }} />
              <div style={{ position: 'absolute', top: '62%', left: '30%', width: 3, height: 3, borderRadius: '50%', background: accent.secondary, boxShadow: `0 0 5px ${accent.secondary}`, animation: 'blipPulse 2.2s infinite 0.6s' }} />
              {/* Center */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 5, height: 5, borderRadius: '50%', background: accent.secondary, boxShadow: `0 0 8px ${accent.secondary}`, transform: 'translate(-50%,-50%)' }} />
            </div>
          </div>

          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, textAlign: 'left' }}>
            How would you like<br />
            <span style={{ background: `linear-gradient(135deg, ${accent.secondary}, ${accent.light})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              to scan your room?
            </span>
          </h1>
        </div>

        <p style={{ fontSize: 15, color: tokens.text2, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Choose your preferred scanning method. All modes generate a full AI-powered safety report.
        </p>
      </div>

      {/* Scan type cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: '0 48px 48px', flex: 1, position: 'relative', zIndex: 2, maxWidth: 1060, margin: '0 auto', width: '100%' }}>
        {scanTypes.map(s => {
          const isHov = hovered === s.id;
          return (
            <div
              key={s.id}
              onClick={() => setPage(s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '34px 28px 28px', borderRadius: 16, cursor: 'pointer',
                background: isHov ? s.gradient : tokens.surface2,
                border: `1px solid ${isHov ? s.border : tokens.border}`,
                transform: isHov ? 'translateY(-4px)' : 'none',
                boxShadow: isHov ? `0 12px 40px ${s.color}22` : 'none',
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, opacity: isHov ? 1 : 0.3, transition: 'opacity 0.22s' }} />

              {/* Icon */}
              <div style={{ width: 64, height: 64, borderRadius: 14, background: `${s.color}1a`, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 22, boxShadow: isHov ? `0 0 20px ${s.color}44` : 'none', transition: 'all 0.22s' }}>
                {s.icon}
              </div>
              <h2 style={{ fontFamily: tokens.fontHead, fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em', color: tokens.text }}>{s.label}</h2>
              <p style={{ fontSize: 13, color: tokens.text2, lineHeight: 1.7, marginBottom: 24, flex: 1 }}>{s.desc}</p>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
                {s.checks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 5px ${s.color}` }} />
                    <span style={{ fontSize: 12, color: tokens.text2 }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: `1px solid ${s.color}22` }}>
                <span style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3 }}>⏱ {s.time}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, fontSize: 13, fontWeight: 600, fontFamily: tokens.fontHead }}>
                  Start <span style={{ fontSize: 16, lineHeight: '1' }}>→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', padding: '0 48px 36px', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: 12, color: tokens.text3, fontFamily: tokens.fontMono, letterSpacing: '0.06em' }}>
          ALL SCANS GENERATE A SAFETY REPORT 
        </span>
      </div>

      <style>{`
        @keyframes pulse      { 0%,100% { opacity:1; transform:scale(1); }   50% { opacity:0.5; transform:scale(1.3); } }
        @keyframes ringPulse  { 0% { transform:scale(1); opacity:0.6; } 70%,100% { transform:scale(1.5); opacity:0; } }
        @keyframes blipPulse  { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.6); } }
      `}</style>
    </div>
  );
};
