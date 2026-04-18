import React, { useState, useEffect } from 'react';
import { Page, Tweaks, NavInner } from './pages/shared';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Results, FindingDetail } from './pages/Results';

// ─── Default tweaks ────────────────────────────────────────────────────────────

const DEFAULT_TWEAKS: Tweaks = {
  accent:     'purple',
  scanMode:   'Standard',
  sensitivity: 80,
  autoReport: false,
  showConf:   true,
  nightMode:  false,
};

// ─── Tweaks Panel ─────────────────────────────────────────────────────────────

interface TweaksPanelProps {
  tweaks:      Tweaks;
  updateTweak: <K extends keyof Tweaks>(key: K, val: Tweaks[K]) => void;
  onClose:     () => void;
}

const TweaksPanel: React.FC<TweaksPanelProps> = ({ tweaks, updateTweak, onClose }) => {
  const accentOptions: { val: Tweaks['accent']; label: string; color: string }[] = [
    { val: 'purple', label: 'Violet', color: '#a855f7' },
    { val: 'cyan',   label: 'Cyan',   color: '#06b6d4' },
    { val: 'green',  label: 'Green',  color: '#22c55e' },
  ];

  const toggles: { key: keyof Tweaks; label: string }[] = [
    { key: 'autoReport', label: 'Auto-advance to report' },
    { key: 'showConf',   label: 'Show confidence scores' },
    { key: 'nightMode',  label: 'Night mode overlay'     },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      width: 260, background: '#161628',
      border: '1px solid rgba(168,85,247,0.40)', borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      overflow: 'hidden', animation: 'slideUp 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(130,80,255,0.18)', background: '#1e1e38' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#eeeeff' }}>Tweaks</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ padding: '18px' }}>
        {/* Accent color */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: '#55556a', letterSpacing: '0.1em', marginBottom: 10 }}>ACCENT COLOR</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {accentOptions.map(a => (
              <button
                key={a.val}
                onClick={() => updateTweak('accent', a.val)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${tweaks.accent === a.val ? a.color : 'rgba(130,80,255,0.18)'}`, background: tweaks.accent === a.val ? `${a.color}22` : '#1e1e38', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: a.color, boxShadow: tweaks.accent === a.val ? `0 0 8px ${a.color}` : 'none' }} />
                <span style={{ fontSize: 10, color: tweaks.accent === a.val ? a.color : '#55556a', fontFamily: "'Space Mono', monospace" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scan depth */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: '#55556a', letterSpacing: '0.1em', marginBottom: 10 }}>SCAN DEPTH</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['Standard', 'Deep', 'Stealth'] as Tweaks['scanMode'][]).map(m => (
              <button
                key={m}
                onClick={() => updateTweak('scanMode', m)}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `1px solid ${tweaks.scanMode === m ? 'rgba(168,85,247,0.4)' : 'rgba(130,80,255,0.18)'}`, background: tweaks.scanMode === m ? 'rgba(168,85,247,0.15)' : '#1e1e38', cursor: 'pointer', fontSize: 10, color: tweaks.scanMode === m ? '#c084fc' : '#55556a', fontFamily: "'Space Mono', monospace", transition: 'all 0.15s' }}
              >{m}</button>
            ))}
          </div>
        </div>

        {/* Sensitivity slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: '#55556a', letterSpacing: '0.1em', marginBottom: 10 }}>SENSITIVITY — {tweaks.sensitivity}%</div>
          <input
            type="range" min={40} max={100} step={5}
            value={tweaks.sensitivity}
            onChange={e => updateTweak('sensitivity', +e.target.value)}
            style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
          />
        </div>

        {/* Toggles */}
        {toggles.map(t => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: '#9999bb' }}>{t.label}</span>
            <div
              onClick={() => updateTweak(t.key, !tweaks[t.key] as Tweaks[typeof t.key])}
              style={{ width: 36, height: 20, borderRadius: 10, background: tweaks[t.key] ? '#7c3aed' : '#252545', border: `1px solid ${tweaks[t.key] ? '#a855f7' : 'rgba(130,80,255,0.18)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 2, left: tweaks[t.key] ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────

const AppShell: React.FC = () => {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [page, setPage] = useState<Page>(() => {
    const saved = localStorage.getItem('eyespy-page');
    return (saved as Page) ?? 'landing';
  });
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksPanelOpen, setTweaksPanelOpen] = useState(false);

  const navigate = (p: Page) => {
    setPage(p);
    localStorage.setItem('eyespy-page', p);
    window.scrollTo(0, 0);
  };

  const updateTweak = <K extends keyof Tweaks>(key: K, val: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [key]: val }));
    // Notify host (for Tweaks toolbar integration)
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  // Tweaks host protocol
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__activate_edit_mode')   setTweaksPanelOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksPanelOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const navW = navCollapsed ? 64 : 220;

  const renderPage = () => {
    switch (page) {
      case 'landing':   return <Landing      setPage={navigate} tweaks={tweaks} />;
      case 'dashboard': return <Dashboard    setPage={navigate} tweaks={tweaks} />;
      case 'results':   return <Results      setPage={navigate} />;
      case 'finding':   return <FindingDetail setPage={navigate} />;
      default:          return <Landing      setPage={navigate} tweaks={tweaks} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070d' }}>
      <NavInner
        collapsed={navCollapsed}
        setCollapsed={setNavCollapsed}
        page={page}
        setPage={navigate}
      />
      <main style={{ marginLeft: navW, flex: 1, minHeight: '100vh', transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
        {renderPage()}
      </main>

      {tweaksPanelOpen && (
        <TweaksPanel
          tweaks={tweaks}
          updateTweak={updateTweak}
          onClose={() => setTweaksPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default AppShell;
