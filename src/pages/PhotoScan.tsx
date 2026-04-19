import React, { useState } from 'react';
import { Page, tokens } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoScanProps {
  setPage: (p: Page) => void;
}

type Phase = 'capture' | 'analyzing' | 'done';

interface Check {
  label: string;
  status: 'pending' | 'running' | 'done' | null;
}

const CHECK_LIST: Check[] = [
  { label: 'Lens reflection sweep',    status: null },
  { label: 'Object classification',    status: null },
  { label: 'Wiring hazard analysis',   status: null },
  { label: 'Lock & door detection',    status: null },
  { label: 'Unknown device scan',      status: null },
];

const corners = ['tl', 'tr', 'bl', 'br'] as const;

// ─── PhotoScan ────────────────────────────────────────────────────────────────

export const PhotoScan: React.FC<PhotoScanProps> = ({ setPage }) => {
  const [phase, setPhase]       = useState<Phase>('capture');
  const [progress, setProgress] = useState(0);
  const [checks, setChecks]     = useState<Check[]>([]);

  const startAnalysis = () => {
    setPhase('analyzing');
    setChecks(CHECK_LIST.map(c => ({ ...c, status: 'pending' })));

    let i = 0;

    const next = () => {
      if (i >= CHECK_LIST.length) {
        setTimeout(() => setPhase('done'), 600);
        return;
      }

      setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'running' } : c));

      setTimeout(() => {
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'done' } : c));
        setProgress(Math.round(((i + 1) / CHECK_LIST.length) * 100));
        i++;
        setTimeout(next, 400);
      }, 900);
    };

    setTimeout(next, 300);
  };

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <button
          onClick={() => setPage('landing')}
          style={{ background: 'none', border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.text3, cursor: 'pointer', padding: '7px 14px', fontSize: 13, fontFamily: tokens.fontBody }}
        >← Back</button>
        <div>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.violet, letterSpacing: '0.12em' }}>PHOTO SCAN</div>
          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 24, fontWeight: 700, color: tokens.text }}>Static Image Analysis</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, flex: 1 }}>

        {/* ── Viewport ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            flex: 1, borderRadius: 14, minHeight: 340, position: 'relative', overflow: 'hidden', cursor: phase === 'capture' ? 'pointer' : 'default',
            border: `2px dashed ${phase === 'capture' ? tokens.borderBright : tokens.border}`,
            background: tokens.surface1, transition: 'all 0.3s',
          }}>
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0e0e1c, #13132a)', backgroundImage: `linear-gradient(rgba(130,80,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(130,80,255,0.03) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

            {/* Capture state */}
            {phase === 'capture' && (
              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                <div style={{ width: 72, height: 72, borderRadius: 16, border: `2px solid ${tokens.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.violet, background: 'rgba(124,58,237,0.08)' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="3" y="8" width="26" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="16" cy="17" r="5" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="16" cy="17" r="1.8" fill="currentColor"/>
                    <path d="M11 8L13 5H19L21 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.text, marginBottom: 6 }}>Drop photo or tap to capture</div>
                  <div style={{ fontSize: 12, color: tokens.text3 }}>JPG, PNG, HEIC · Max 20MB</div>
                </div>
                <button className="btn-primary" onClick={startAnalysis} style={{ fontSize: 14 }}>Analyze Photo →</button>
              </div>
            )}

            {/* Analyzing state */}
            {phase === 'analyzing' && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${tokens.violet}, transparent)`, animation: 'scanline 1.4s linear infinite', boxShadow: `0 0 10px ${tokens.violet}`, zIndex: 3 }} />
                {/* Detection box */}
                <div style={{ position: 'absolute', top: '22%', left: '58%', width: '18%', height: '24%', border: `1.5px solid ${tokens.red}`, boxShadow: `0 0 12px rgba(239,68,68,0.4)`, borderRadius: 2, zIndex: 2 }}>
                  <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 9, color: tokens.red, fontFamily: tokens.fontMono, background: 'rgba(239,68,68,0.15)', padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>CAMERA DETECTED</div>
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <div style={{ fontFamily: tokens.fontMono, fontSize: 12, color: tokens.violet, animation: 'blink 1s infinite' }}>ANALYZING IMAGE…</div>
                </div>
              </>
            )}

            {/* Done state */}
            {phase === 'done' && (
              <>
                <div style={{ position: 'absolute', top: '22%', left: '58%', width: '18%', height: '24%', border: `1.5px solid ${tokens.red}`, boxShadow: `0 0 12px rgba(239,68,68,0.4)`, borderRadius: 2, zIndex: 2 }}>
                  <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 9, color: tokens.red, fontFamily: tokens.fontMono, background: 'rgba(239,68,68,0.15)', padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>CAMERA DETECTED</div>
                </div>
                <div style={{ position: 'absolute', bottom: '18%', left: '15%', width: '14%', height: '18%', border: `1.5px solid ${tokens.amber}`, boxShadow: `0 0 10px rgba(245,158,11,0.4)`, borderRadius: 2, zIndex: 2 }}>
                  <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 9, color: tokens.amber, fontFamily: tokens.fontMono, background: 'rgba(245,158,11,0.15)', padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>UNKNOWN DEVICE</div>
                </div>
              </>
            )}

            {/* Corner brackets */}
            {corners.map(c => (
              <div key={c} style={{ position: 'absolute', [c[0]==='t'?'top':'bottom']: 14, [c[1]==='l'?'left':'right']: 14, width: 18, height: 18, zIndex: 4, borderTop: c[0]==='t' ? `2px solid ${tokens.violet}` : 'none', borderBottom: c[0]==='b' ? `2px solid ${tokens.violet}` : 'none', borderLeft: c[1]==='l' ? `2px solid ${tokens.violet}` : 'none', borderRight: c[1]==='r' ? `2px solid ${tokens.violet}` : 'none', opacity: 0.6 }} />
            ))}
          </div>

          {phase === 'done' && (
            <button className="btn-primary" onClick={() => setPage('results')} style={{ padding: '14px', fontSize: 15, width: '100%' }}>
              View Results →
            </button>
          )}
        </div>

        {/* ── AI Checks panel ── */}
        <div className="card" style={{ padding: '22px', height: 'fit-content' }}>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 18 }}>AI CHECKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(checks.length ? checks : CHECK_LIST).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: tokens.surface3, border: `1px solid ${c.status === 'done' ? 'rgba(34,197,94,0.25)' : c.status === 'running' ? tokens.borderBright : tokens.border}`, transition: 'all 0.3s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${c.status === 'done' ? tokens.green : c.status === 'running' ? tokens.violet : tokens.text3}`, background: c.status === 'done' ? 'rgba(34,197,94,0.15)' : 'transparent', transition: 'all 0.3s' }}>
                  {c.status === 'done'    && <span style={{ fontSize: 10, color: tokens.green }}>✓</span>}
                  {c.status === 'running' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.violet, animation: 'pulse 0.8s infinite' }} />}
                </div>
                <span style={{ fontSize: 12, color: c.status === 'done' ? tokens.text : c.status === 'running' ? tokens.lavender : tokens.text3, transition: 'color 0.3s' }}>{c.label}</span>
              </div>
            ))}
          </div>

          {progress > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tokens.text3, fontFamily: tokens.fontMono, marginBottom: 6 }}>
                <span>Progress</span><span>{progress}%</span>
              </div>
              <div style={{ height: 3, background: tokens.surface4, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${tokens.purple}, ${tokens.violet})`, borderRadius: 2, transition: 'width 0.4s', boxShadow: `0 0 6px ${tokens.glow}` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline { from { top: 0 } to { top: 100% } }
        @keyframes blink    { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        @keyframes pulse    { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(1.3) } }
      `}</style>
    </div>
  );
};
