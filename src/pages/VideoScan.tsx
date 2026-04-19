import React, { useState, useEffect, useRef } from 'react';
import { Page, ScanResult, tokens } from './shared';

interface VideoScanProps {
  setPage: (p: Page) => void;
  setScanResult: (r: ScanResult) => void;
}

type Phase = 'record' | 'processing' | 'done';

const STEPS = [
  'Extracting frames',
  'IR sweep analysis',
  'RF triangulation',
  'Depth mapping',
  'Threat classification',
];

const TIPS = [
  'Record in landscape orientation for full coverage',
  'Pan slowly — 1 full rotation in 20 seconds',
  'Include ceiling corners and all furniture',
  'Keep camera steady for best IR detection',
];

const corners = ['tl', 'tr', 'bl', 'br'] as const;

export const VideoScan: React.FC<VideoScanProps> = ({ setPage, setScanResult }) => {
  const [phase, setPhase]               = useState<Phase>('record');
  const [progress, setProgress]         = useState(0);
  const [tick, setTick]                 = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const fileRef                         = useRef<HTMLInputElement>(null);

  // Radar sweep animation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setSelectedFile(f); setError(null); }
  };

  const startProcessing = async () => {
    if (!selectedFile) { setError('Please select a video file first.'); return; }
    setError(null);
    setPhase('processing');

    // Fake asymptotic progress (approaches 90% while waiting for API)
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setProgress(90 * (1 - Math.exp(-elapsed / 15)));
    }, 200);

    const form = new FormData();
    form.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8000/scan/video', { method: 'POST', body: form });
      clearInterval(progressInterval);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Video scan failed' }));
        throw new Error(err.detail || 'Video scan failed');
      }
      const result: ScanResult = await res.json();
      setScanResult(result);
      setProgress(100);
      setPhase('done');
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e.message || 'Failed to scan video. Is the backend running?');
      setPhase('record');
      setProgress(0);
    }
  };

  const sweepAngle  = (tick * 4) % 360;
  const currentStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <button
          onClick={() => setPage('landing')}
          style={{ background: 'none', border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.text3, cursor: 'pointer', padding: '7px 14px', fontSize: 13, fontFamily: tokens.fontBody }}
        >← Back</button>
        <div>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.cyan, letterSpacing: '0.12em' }}>VIDEO SCAN</div>
          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 24, fontWeight: 700, color: tokens.text }}>Motion Analysis</h1>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 20, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, color: tokens.red, fontSize: 13, fontFamily: tokens.fontBody }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, flex: 1 }}>

        {/* ── Viewport ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ flex: 1, borderRadius: 14, minHeight: 340, position: 'relative', overflow: 'hidden', border: `1px solid ${tokens.borderBright}`, background: '#000' }}>
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0c0c1e, #111128)', backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            {/* Record state */}
            {phase === 'record' && (
              <div
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 2, cursor: 'pointer' }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid rgba(6,182,212,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.cyan, background: 'rgba(6,182,212,0.08)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' }}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <rect x="2" y="8" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M22 12L29 8.5V21.5L22 18V12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {selectedFile ? (
                    <div style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.green, marginBottom: 6 }}>
                      {selectedFile.name}
                    </div>
                  ) : (
                    <div style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.text, marginBottom: 6 }}>
                      Click to select a video file
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: tokens.text3, marginBottom: 18 }}>MP4, MOV, WebM · Max 100 MB</div>
                  <button
                    onClick={e => { e.stopPropagation(); startProcessing(); }}
                    style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 32px', fontFamily: tokens.fontHead, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(6,182,212,0.35)', transition: 'all 0.2s' }}
                  >
                    {selectedFile ? 'Process Video →' : 'Select & Process →'}
                  </button>
                </div>
              </div>
            )}

            {/* Processing state — radar sweep */}
            {phase === 'processing' && (
              <>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <div style={{ position: 'relative', width: 220, height: 220 }}>
                    {[220, 160, 100].map((s, i) => (
                      <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%', border: `1px solid rgba(6,182,212,${0.08 + i * 0.06})`, transform: 'translate(-50%,-50%)' }} />
                    ))}
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: 2, transformOrigin: 'left center', transform: `rotate(${sweepAngle}deg)`, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.9))', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} />
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from ${sweepAngle}deg, rgba(6,182,212,0.1) 0deg, transparent 80deg)` }} />
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 10, height: 10, borderRadius: '50%', background: tokens.cyan, boxShadow: `0 0 14px ${tokens.cyan}`, transform: 'translate(-50%,-50%)' }} />
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, textAlign: 'center', zIndex: 2, fontFamily: tokens.fontMono, fontSize: 11, color: tokens.cyan, letterSpacing: '0.08em', animation: 'blink 1.2s infinite' }}>
                  {STEPS[currentStep]}…
                </div>
              </>
            )}

            {/* Done state */}
            {phase === 'done' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 2 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: `1.5px solid ${tokens.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: tokens.green }}>✓</div>
                <div style={{ fontFamily: tokens.fontHead, fontSize: 16, fontWeight: 600, color: tokens.text }}>Analysis Complete</div>
                <div style={{ fontSize: 13, color: tokens.text2 }}>Video processed successfully</div>
              </div>
            )}

            {/* Corner brackets */}
            {corners.map(c => (
              <div key={c} style={{ position: 'absolute', [c[0]==='t'?'top':'bottom']: 14, [c[1]==='l'?'left':'right']: 14, width: 18, height: 18, zIndex: 5, borderTop: c[0]==='t' ? '2px solid rgba(6,182,212,0.7)' : 'none', borderBottom: c[0]==='b' ? '2px solid rgba(6,182,212,0.7)' : 'none', borderLeft: c[1]==='l' ? '2px solid rgba(6,182,212,0.7)' : 'none', borderRight: c[1]==='r' ? '2px solid rgba(6,182,212,0.7)' : 'none' }} />
            ))}
          </div>

          {/* Progress bar */}
          {phase === 'processing' && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tokens.text2, fontFamily: tokens.fontMono, marginBottom: 10 }}>
                <span>{STEPS[currentStep]}…</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div style={{ height: 4, background: tokens.surface3, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: 2, transition: 'width 0.3s', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} />
              </div>
            </div>
          )}

          {phase === 'done' && (
            <button className="btn-primary" onClick={() => setPage('results')} style={{ padding: '14px', fontSize: 15, width: '100%' }}>
              View Safety Report →
            </button>
          )}
        </div>

        {/* ── Tips panel ── */}
        <div className="card" style={{ padding: '22px', height: 'fit-content' }}>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 16 }}>VIDEO TIPS</div>
          {TIPS.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: tokens.cyan, flexShrink: 0, fontFamily: tokens.fontMono, marginTop: 1 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, color: tokens.text2, lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
      `}</style>
    </div>
  );
};
