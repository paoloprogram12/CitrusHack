import React, { useState, useEffect, useRef } from 'react';
import { Page, Tweaks, Severity, Finding, severityColor, tokens } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  setPage: (p: Page) => void;
  tweaks?: Tweaks;
}

type ScanState = 'idle' | 'scanning' | 'complete';

// ─── Camera Feed placeholder ───────────────────────────────────────────────────
// TODO: Replace this component with your own camera implementation.
// Props: scanState — use to apply visual effects during scanning.

interface CameraFeedProps {
  scanState: ScanState;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ scanState }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0e0e1c 0%, #141425 40%, #0c0c18 100%)' }}>
    {/* Placeholder room shapes — replace with real camera output */}
    <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '18%', height: '35%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }} />
    <div style={{ position: 'absolute', bottom: '15%', left: '30%', width: '40%', height: '28%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 4 }} />
    <div style={{ position: 'absolute', bottom: '15%', right: '8%',  width: '14%', height: '22%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }} />
    {scanState === 'scanning' && (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.06)', pointerEvents: 'none' }} />
    )}
  </div>
);

// ─── Mock findings ────────────────────────────────────────────────────────────

const MOCK_FINDINGS: Finding[] = [
  { id: 1, type: 'Hidden Camera',     category: 'surveillance', severity: 'CRITICAL', location: 'Clock radio — nightstand', confidence: 97, desc: '', action: '', time: '09:14:22' },
  { id: 2, type: 'Unknown Device',    category: 'network',      severity: 'HIGH',     location: 'Air purifier — corner',    confidence: 84, desc: '', action: '', time: '09:14:38' },
  { id: 3, type: 'Smoke Detector',    category: 'fire',         severity: 'MEDIUM',   location: 'Missing in bathroom',      confidence: 99, desc: '', action: '', time: '09:14:55' },
  { id: 4, type: 'Lock Vulnerability',category: 'access',       severity: 'HIGH',     location: 'Secondary door lock',      confidence: 91, desc: '', action: '', time: '09:15:08' },
];

const CHECKS = [
  'Initializing AI vision model…',
  'Scanning for RF transmissions…',
  'Analyzing visual field for lens reflections…',
  'Checking smoke detector placement…',
  'Mapping door & lock hardware…',
  'Identifying unknown electronic devices…',
  'Running wiring hazard analysis…',
  'Cross-referencing property database…',
  'Generating threat assessment…',
  'Compiling safety report…',
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [progress, setProgress]   = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');
  const [tick, setTick]           = useState(0);
  const [findings, setFindings]   = useState<Finding[]>([]);

  // Sweep animation tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  // Scan progress
  useEffect(() => {
    if (scanState !== 'scanning') return;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(id);
          setScanState('complete');
          setFindings(MOCK_FINDINGS);
          return 100;
        }
        const next = p + 1.1;
        const idx  = Math.min(Math.floor((next / 100) * CHECKS.length), CHECKS.length - 1);
        setCurrentCheck(CHECKS[idx]);
        return next;
      });
    }, 60);
    return () => clearInterval(id);
  }, [scanState]);

  const sweepAngle = (tick * 4) % 360;

  const startScan = () => {
    setScanState('scanning');
    setProgress(0);
    setFindings([]);
    setCurrentCheck(CHECKS[0]);
  };

  const resetScan = () => {
    setScanState('idle');
    setProgress(0);
    setFindings([]);
  };

  const severityBadgeClass = (s: Severity) =>
    s === 'CRITICAL' ? 'badge-red' : s === 'HIGH' ? 'badge-amber' : 'badge-purple';

  const corners = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.violet, letterSpacing: '0.12em', marginBottom: 8 }}>LIVE SCAN CONSOLE</div>
          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: tokens.text }}>Room Scan</h1>
        </div>
        {scanState === 'complete' && (
          <button className="btn-primary" onClick={() => setPage('results')} style={{ fontSize: 13 }}>View Results →</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

        {/* ── Camera viewport ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${tokens.borderBright}`, background: '#000', aspectRatio: '16/9', boxShadow: '0 0 40px rgba(124,58,237,0.15)' }}>

            {/* Camera feed — replace with your own implementation */}
            <CameraFeed scanState={scanState} />

            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(130,80,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(130,80,255,0.04) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', zIndex: 2 }} />

            {/* Scan sweep */}
            {scanState === 'scanning' && (
              <>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${sweepAngle}deg, rgba(168,85,247,0.06) 0%, transparent 60%)`, pointerEvents: 'none', zIndex: 3 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${tokens.violet}, transparent)`, animation: 'scanline 2.2s linear infinite', boxShadow: `0 0 10px ${tokens.violet}`, zIndex: 4 }} />
              </>
            )}

            {/* Threat bounding boxes */}
            {findings.map((f, i) => {
              const positions = [
                { top: '18%', left: '62%', width: '16%', height: '22%' },
                { top: '54%', left: '8%',  width: '13%', height: '18%' },
                { top: '30%', left: '40%', width: '11%', height: '16%' },
                { top: '62%', left: '60%', width: '10%', height: '13%' },
              ];
              const pos = positions[i] ?? positions[0];
              const c   = severityColor(f.severity);
              return (
                <div key={f.id} style={{ position: 'absolute', ...pos, border: `1.5px solid ${c}`, boxShadow: `0 0 14px ${c}55`, borderRadius: 3, animation: 'fadeIn 0.5s ease', zIndex: 5 }}>
                  <div style={{ position: 'absolute', top: -20, left: 0, fontSize: 9, fontFamily: tokens.fontMono, color: c, whiteSpace: 'nowrap', background: `${c}22`, padding: '2px 6px', borderRadius: 3, backdropFilter: 'blur(4px)' }}>{f.type.toUpperCase()}</div>
                  {corners.map(corner => (
                    <div key={corner} style={{ position: 'absolute', [corner[0] === 't' ? 'top' : 'bottom']: -2, [corner[1] === 'l' ? 'left' : 'right']: -2, width: 8, height: 8, borderTop: corner[0] === 't' ? `2px solid ${c}` : 'none', borderBottom: corner[0] === 'b' ? `2px solid ${c}` : 'none', borderLeft: corner[1] === 'l' ? `2px solid ${c}` : 'none', borderRight: corner[1] === 'r' ? `2px solid ${c}` : 'none' }} />
                  ))}
                </div>
              );
            })}

            {/* Corner brackets */}
            {corners.map(c => (
              <div key={c} style={{ position: 'absolute', zIndex: 6, [c[0] === 't' ? 'top' : 'bottom']: 14, [c[1] === 'l' ? 'left' : 'right']: 14, width: 22, height: 22, borderTop: c[0] === 't' ? `2px solid ${tokens.violet}` : 'none', borderBottom: c[0] === 'b' ? `2px solid ${tokens.violet}` : 'none', borderLeft: c[1] === 'l' ? `2px solid ${tokens.violet}` : 'none', borderRight: c[1] === 'r' ? `2px solid ${tokens.violet}` : 'none', opacity: 0.7 }} />
            ))}

            {/* Status pill */}
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(7,7,13,0.75)', backdropFilter: 'blur(10px)', border: `1px solid ${tokens.border}`, borderRadius: 20, padding: '5px 14px', zIndex: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: scanState === 'scanning' ? tokens.red : scanState === 'complete' ? tokens.green : tokens.text3, boxShadow: scanState === 'scanning' ? `0 0 8px ${tokens.red}` : 'none', animation: scanState === 'scanning' ? 'blink 1s infinite' : 'none' }} />
              <span style={{ fontFamily: tokens.fontMono, fontSize: 10, color: tokens.text2, letterSpacing: '0.08em' }}>
                {scanState === 'idle' ? 'CAMERA READY' : scanState === 'scanning' ? 'SCANNING' : 'SCAN COMPLETE'}
              </span>
            </div>

            {/* Idle start overlay */}
            {scanState === 'idle' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 8, background: 'rgba(7,7,13,0.45)', backdropFilter: 'blur(2px)' }}>
                <button className="btn-primary" onClick={startScan} style={{ fontSize: 15, padding: '14px 38px', boxShadow: '0 4px 30px rgba(168,85,247,0.5)' }}>
                  ◎ Start Scanning
                </button>
                <div style={{ fontFamily: tokens.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>POINT CAMERA AROUND THE ROOM</div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {scanState === 'scanning' && (
            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: tokens.text2, fontFamily: tokens.fontMono }}>{currentCheck}</span>
                <span style={{ fontSize: 12, fontFamily: tokens.fontMono, color: tokens.violet }}>{Math.floor(progress)}%</span>
              </div>
              <div style={{ height: 4, background: tokens.surface3, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${tokens.purple}, ${tokens.violet})`, borderRadius: 2, transition: 'width 0.1s', boxShadow: `0 0 8px ${tokens.glow}` }} />
              </div>
            </div>
          )}

          {/* Complete banner */}
          {scanState === 'complete' && (
            <div className="card-bright" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.violet, letterSpacing: '0.1em', marginBottom: 4 }}>SCAN COMPLETE — {findings.length} FINDINGS</div>
                <div style={{ fontSize: 14, color: tokens.text2 }}>1 critical threat detected. Immediate action recommended.</div>
              </div>
              <button className="btn-primary" onClick={() => setPage('results')} style={{ flexShrink: 0 }}>View Results →</button>
            </div>
          )}
        </div>

        {/* ── Right panel: Live Detections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 16 }}>LIVE DETECTIONS</div>
            {findings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: tokens.text3, fontSize: 13 }}>
                {scanState === 'idle' ? 'No scan running' : 'Scanning…'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {findings.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setPage('finding')}
                    className="finding-row"
                    style={{ padding: '12px', borderRadius: 8, background: tokens.surface3, border: `1px solid ${severityColor(f.severity)}33`, cursor: 'pointer', transition: 'all 0.15s', animation: 'fadeIn 0.4s ease' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>{f.type}</span>
                      <span className={`badge ${severityBadgeClass(f.severity)}`} style={{ fontSize: 9 }}>{f.severity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: tokens.text3 }}>{f.location}</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 2, background: tokens.surface4, borderRadius: 1 }}>
                        <div style={{ height: '100%', width: `${f.confidence}%`, background: severityColor(f.severity), borderRadius: 1 }} />
                      </div>
                      <span style={{ fontSize: 10, color: tokens.text3, fontFamily: tokens.fontMono }}>{f.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {scanState !== 'idle' && (
            <button className="btn-ghost" onClick={resetScan} style={{ width: '100%' }}>
              {scanState === 'scanning' ? 'Cancel Scan' : 'Run New Scan'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline { from { top: 0 } to { top: 100% } }
        @keyframes blink    { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        @keyframes fadeIn   { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
        .finding-row:hover  { border-color: rgba(168,85,247,0.4) !important; background: #252545 !important; }
      `}</style>
    </div>
  );
};
