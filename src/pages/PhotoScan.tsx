import React, { useState, useRef, useEffect } from 'react';
import { Page, ScanResult, tokens } from './shared';

interface PhotoScanProps {
  setPage: (p: Page) => void;
  setScanResult: (r: ScanResult) => void;
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

export const PhotoScan: React.FC<PhotoScanProps> = ({ setPage, setScanResult }) => {
  const [phase, setPhase]             = useState<Phase>('capture');
  const [progress, setProgress]       = useState(0);
  const [checks, setChecks]           = useState<Check[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<ScanResult | null>(null);
  const [imageBounds, setImageBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);
  const imgRef                        = useRef<HTMLImageElement>(null);
  const viewportRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      setError(null);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(URL.createObjectURL(f));
      setImageBounds(null);
      setLocalResult(null);
    }
  };

  const computeImageBounds = () => {
    const img = imgRef.current;
    const vp  = viewportRef.current;
    if (!img || !vp) return;
    const cw = vp.clientWidth;
    const ch = vp.clientHeight;
    const nr = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    if (nr > cr) {
      const ih = cw / nr;
      setImageBounds({ x: 0, y: (ch - ih) / 2, w: cw, h: ih });
    } else {
      const iw = ch * nr;
      setImageBounds({ x: (cw - iw) / 2, y: 0, w: iw, h: ch });
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) { setError('Please select an image first.'); return; }
    setError(null);
    setPhase('analyzing');
    setChecks(CHECK_LIST.map(c => ({ ...c, status: 'pending' })));

    // Animate checks concurrently with the real API call
    const animationPromise = new Promise<void>(resolve => {
      let i = 0;
      const next = () => {
        if (i >= CHECK_LIST.length) { resolve(); return; }
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'running' } : c));
        setTimeout(() => {
          setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'done' } : c));
          setProgress(Math.round(((i + 1) / CHECK_LIST.length) * 100));
          i++;
          setTimeout(next, 400);
        }, 900);
      };
      setTimeout(next, 300);
    });

    const apiPromise = (async (): Promise<ScanResult> => {
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch('http://localhost:8000/scan', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Scan failed' }));
        throw new Error(err.detail || 'Scan failed');
      }
      return res.json();
    })();

    try {
      const [, result] = await Promise.all([animationPromise, apiPromise]);
      setScanResult(result);
      setLocalResult(result);
      setPhase('done');
    } catch (e: any) {
      setError(e.message || 'Failed to scan image. Is the backend running?');
      setPhase('capture');
      setChecks([]);
      setProgress(0);
    }
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

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 20, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, color: tokens.red, fontSize: 13, fontFamily: tokens.fontBody }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, flex: 1 }}>

        {/* ── Viewport ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            ref={viewportRef}
            style={{
              flex: 1, borderRadius: 14, minHeight: 340, position: 'relative', overflow: 'hidden',
              cursor: phase === 'capture' ? 'pointer' : 'default',
              border: `2px dashed ${phase === 'capture' ? tokens.borderBright : tokens.border}`,
              background: tokens.surface1, transition: 'all 0.3s',
            }}
            onClick={() => phase === 'capture' && fileRef.current?.click()}
          >
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Background grid (shown when no image) */}
            {!imageUrl && (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0e0e1c, #13132a)', backgroundImage: `linear-gradient(rgba(130,80,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(130,80,255,0.03) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
            )}

            {/* Uploaded image */}
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                onLoad={computeImageBounds}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
                alt="scan target"
              />
            )}

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
                  {selectedFile ? (
                    <div style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.green, marginBottom: 4 }}>
                      {selectedFile.name}
                    </div>
                  ) : (
                    <div style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.text, marginBottom: 6 }}>
                      Click to select a photo
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: tokens.text3 }}>JPG, PNG, WebP · Max 10 MB</div>
                </div>
                <button
                  className="btn-primary"
                  onClick={e => { e.stopPropagation(); startAnalysis(); }}
                  style={{ fontSize: 14 }}
                >
                  {selectedFile ? 'Analyze Photo →' : 'Select & Analyze →'}
                </button>
              </div>
            )}

            {/* Analyzing overlay */}
            {phase === 'analyzing' && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${tokens.violet}, transparent)`, animation: 'scanline 1.4s linear infinite', boxShadow: `0 0 10px ${tokens.violet}`, zIndex: 3 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, background: 'rgba(7,7,13,0.45)' }}>
                  <div style={{ fontFamily: tokens.fontMono, fontSize: 12, color: tokens.violet, animation: 'blink 1s infinite' }}>ANALYZING IMAGE…</div>
                </div>
              </>
            )}

            {/* Done state — real bounding boxes from Gemini */}
            {phase === 'done' && imageBounds && localResult?.threats.map((threat, i) => {
              if (!threat.bbox) return null;
              // Gemini native format: [ymin, xmin, ymax, xmax] in 0-1000 scale
              const [ymin, xmin, ymax, xmax] = threat.bbox;
              const top    = ymin / 10;
              const left   = xmin / 10;
              const width  = (xmax - xmin) / 10;
              const height = (ymax - ymin) / 10;
              const color = threat.severity === 'HIGH' || threat.severity === 'CRITICAL' ? tokens.red : tokens.amber;
              const boxStyle: React.CSSProperties = {
                position: 'absolute',
                top:    imageBounds.y + (top    / 100) * imageBounds.h,
                left:   imageBounds.x + (left   / 100) * imageBounds.w,
                width:                  (width  / 100) * imageBounds.w,
                height:                 (height / 100) * imageBounds.h,
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 12px ${color}66`,
                borderRadius: 2,
                zIndex: 2,
              };
              return (
                <div key={i} style={boxStyle}>
                  <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 9, color, fontFamily: tokens.fontMono, background: `${color}22`, padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>
                    {threat.type.toUpperCase()}
                  </div>
                </div>
              );
            })}

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
