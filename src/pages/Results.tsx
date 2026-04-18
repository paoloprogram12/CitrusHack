import React, { useState } from 'react';
import { Page, Severity, Finding, severityColor, tokens } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsProps {
  setPage: (p: Page) => void;
}

type FilterLevel = 'ALL' | Severity;

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_FINDINGS: Finding[] = [
  { id: 1, type: 'Hidden Camera',      category: 'surveillance', severity: 'CRITICAL', location: 'Clock radio — nightstand (left)',    confidence: 97, desc: 'Pinhole camera lens detected via IR reflection analysis. Orientation suggests coverage of bed area.',                                            action: 'Cover immediately. Contact hotel management and local authorities.',     time: '09:14:22' },
  { id: 2, type: 'Unknown Device',     category: 'network',      severity: 'HIGH',     location: 'Air purifier — northeast corner',     confidence: 84, desc: 'Unrecognized RF transmitter detected inside air purifier chassis. Emitting on 2.4GHz band.',                                                action: 'Do not use device. Move to hallway or unplug.',                         time: '09:14:38' },
  { id: 3, type: 'Lock Vulnerability', category: 'access',       severity: 'HIGH',     location: 'Connecting room door',                confidence: 91, desc: 'Secondary deadbolt is non-functional. Connecting door presents unauthorized entry risk.',                                                action: 'Block with furniture. Request room change or additional security.',      time: '09:14:55' },
  { id: 4, type: 'Smoke Detector',     category: 'fire',         severity: 'MEDIUM',   location: 'Bathroom — none detected',            confidence: 99, desc: 'No smoke detector found in bathroom area. Fire code violation in most jurisdictions.',                                                    action: 'Notify hotel management. Locate nearest fire exit manually.',            time: '09:15:08' },
  { id: 5, type: 'Exposed Wiring',     category: 'electrical',   severity: 'MEDIUM',   location: 'Behind TV console',                   confidence: 78, desc: 'Frayed lamp cable with exposed copper detected near flammable surface.',                                                                  action: 'Do not use lamp. Report to hotel maintenance immediately.',              time: '09:15:22' },
  { id: 6, type: 'RF Signal Anomaly',  category: 'network',      severity: 'LOW',      location: 'Minibar area',                        confidence: 61, desc: 'Low-power Bluetooth signal detected from within minibar. Could be inventory sensor.',                                                    action: 'Likely benign. Monitor for sustained high-power transmission.',         time: '09:15:40' },
];

// ─── Results ──────────────────────────────────────────────────────────────────

export const Results: React.FC<ResultsProps> = ({ setPage }) => {
  const [filter, setFilter] = useState<FilterLevel>('ALL');

  const score = 38;
  const scoreColor = score < 40 ? tokens.red : score < 70 ? tokens.amber : tokens.green;

  const severityBadgeClass = (s: Severity) =>
    s === 'CRITICAL' ? 'badge-red' : s === 'HIGH' ? 'badge-amber' : s === 'MEDIUM' ? 'badge-purple' : 'badge-green';

  const filtered = ALL_FINDINGS.filter(f => filter === 'ALL' || f.severity === filter);

  const statCards: { label: string; val: number; color: string; sev: Severity | 'CRITICAL' }[] = [
    { label: 'Critical', val: 1, color: tokens.red,    sev: 'CRITICAL' },
    { label: 'High',     val: 2, color: tokens.amber,  sev: 'HIGH'     },
    { label: 'Medium',   val: 2, color: tokens.violet, sev: 'MEDIUM'   },
    { label: 'Low',      val: 1, color: tokens.green,  sev: 'LOW'      },
  ];

  const filters: FilterLevel[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.violet, letterSpacing: '0.12em', marginBottom: 8 }}>SCAN RESULTS</div>
          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: tokens.text }}>Threat Analysis</h1>
        </div>
      </div>

      {/* Score row */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Safety score donut */}
        <div className="card-bright" style={{ padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 9, color: tokens.text3, letterSpacing: '0.12em', marginBottom: 10 }}>SAFETY SCORE</div>
          <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 10 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke={tokens.surface3} strokeWidth="7"/>
              <circle
                cx="45" cy="45" r="38" fill="none"
                stroke={scoreColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38 * score / 100} ${2 * Math.PI * 38 * (1 - score / 100)}`}
                strokeDashoffset={2 * Math.PI * 38 * 0.25}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: tokens.fontHead, fontSize: 22, fontWeight: 700, color: scoreColor }}>{score}</span>
              <span style={{ fontSize: 9, color: tokens.text3, fontFamily: tokens.fontMono }}>/100</span>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>UNSAFE</div>
        </div>

        {/* Stat cards */}
        {statCards.map((s, i) => (
          <div
            key={i}
            className="card"
            onClick={() => setFilter(s.label.toUpperCase() as FilterLevel)}
            style={{ padding: '20px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${s.color}55`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = tokens.border)}
          >
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}88, ${s.color}22)` }} />
            <div style={{ fontSize: 10, color: tokens.text3, fontFamily: tokens.fontMono, letterSpacing: '0.1em', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily: tokens.fontHead, fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: tokens.text3, marginTop: 4 }}>finding{s.val !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      {/* Filter bar + findings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${filter === f ? tokens.borderBright : tokens.border}`,
                  background: filter === f ? 'rgba(168,85,247,0.15)' : 'transparent',
                  color: filter === f ? tokens.lavender : tokens.text2,
                  fontSize: 11, fontFamily: tokens.fontMono, letterSpacing: '0.05em',
                }}
              >{f}</button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: tokens.text3, display: 'flex', alignItems: 'center' }}>{filtered.length} findings</div>
          </div>

          {/* Findings list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(f => (
              <div
                key={f.id}
                onClick={() => setPage('finding')}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', transition: 'all 0.18s', borderLeft: `3px solid ${severityColor(f.severity)}` }}
                onMouseEnter={e => { e.currentTarget.style.background = tokens.surface3; }}
                onMouseLeave={e => { e.currentTarget.style.background = tokens.surface2; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(f.severity), boxShadow: `0 0 6px ${severityColor(f.severity)}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.text }}>{f.type}</span>
                    <span className={`badge ${severityBadgeClass(f.severity)}`}>{f.severity}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: tokens.text3, fontFamily: tokens.fontMono }}>{f.confidence}% confidence</span>
                    <span style={{ fontSize: 11, color: tokens.text3, fontFamily: tokens.fontMono }}>{f.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: tokens.text3, marginBottom: 8 }}>📍 {f.location}</div>
                <div style={{ fontSize: 13, color: tokens.text2, lineHeight: 1.5, marginBottom: 10 }}>{f.desc}</div>
                <div style={{ fontSize: 12, color: severityColor(f.severity), background: `${severityColor(f.severity)}11`, padding: '7px 12px', borderRadius: 6, border: `1px solid ${severityColor(f.severity)}22` }}>
                  → {f.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 12 }}>SEVERITY LEGEND</div>
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(s), boxShadow: `0 0 5px ${severityColor(s)}` }} />
                <span style={{ fontSize: 11, color: tokens.text2, fontFamily: tokens.fontMono }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Finding Detail ───────────────────────────────────────────────────────────

type DetailTab = 'overview' | 'evidence' | 'action' | 'related';

interface FindingDetailProps {
  setPage: (p: Page) => void;
}

export const FindingDetail: React.FC<FindingDetailProps> = ({ setPage }) => {
  const [tab, setTab] = useState<DetailTab>('overview');

  const finding = ALL_FINDINGS[0]!;
  const evidence = [
    'IR lens reflection at 940nm',
    'Aperture size: ~2mm consistent with spy cam',
    'Orientation: 14° downward, 22° toward bed',
    'No corresponding camera in hotel room inventory',
  ];
  const action = 'Cover the device immediately using opaque tape or a cloth. Do not touch or move. Contact hotel management and request an immediate room change. If management is unresponsive, contact local law enforcement. Preserve evidence for investigation.';
  const techDetails: Record<string, string> = {
    model: 'EyeSpy-V3 CV Module',
    method: 'IR-spectral lens analysis',
    frequency: '940nm IR sweep',
    falsePositiveRate: '0.3%',
    detectRange: '0.1–15m',
  };
  const related = [ALL_FINDINGS[1]!, ALL_FINDINGS[5]!];
  const confidenceBreakdown = [
    { label: 'Lens reflection', val: 99 },
    { label: 'Aperture size',   val: 95 },
    { label: 'Orientation match', val: 91 },
    { label: 'Context analysis', val: 97 },
  ];

  const tabs: DetailTab[] = ['overview', 'evidence', 'action', 'related'];
  const corners = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 13, color: tokens.text3 }}>
        <span onClick={() => setPage('results')} style={{ cursor: 'pointer', color: tokens.violet }}>Results</span>
        <span>›</span>
        <span>Finding #001</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: tokens.red, boxShadow: `0 0 10px ${tokens.red}` }} />
            <h1 style={{ fontFamily: tokens.fontHead, fontSize: 26, fontWeight: 700, color: tokens.text }}>{finding.type}</h1>
            <span className="badge badge-red">{finding.severity}</span>
          </div>
          <p style={{ color: tokens.text2, fontSize: 14 }}>📍 {finding.location} · Detected at {finding.time} · {finding.confidence}% confidence</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => setPage('results')} style={{ fontSize: 13 }}>← Back</button>
          <button className="btn-primary" onClick={() => setPage('report')} style={{ fontSize: 13 }}>Add to Report</button>
        </div>
      </div>

      {/* Evidence + Tech details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
        <div className="card-bright" style={{ padding: '24px', position: 'relative', overflow: 'hidden', minHeight: 260 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0e0e1c, #161625)', backgroundImage: 'linear-gradient(rgba(130,80,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(130,80,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontFamily: tokens.fontMono, color: tokens.red, background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)' }}>IR ANALYSIS</span>
              <span style={{ fontSize: 10, fontFamily: tokens.fontMono, color: tokens.text3 }}>Frame 047/240</span>
            </div>
            {/* Simulated detection view */}
            <div style={{ position: 'relative', background: '#0a0a14', borderRadius: 8, height: 180, border: `1px solid ${tokens.border}`, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 55% 45%, rgba(239,68,68,0.08) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: 60, height: 45, border: `2px solid ${tokens.red}`, boxShadow: `0 0 20px rgba(239,68,68,0.4)` }}>
                {corners.map(c => (
                  <div key={c} style={{ position: 'absolute', [c[0]==='t'?'top':'bottom']: -2, [c[1]==='l'?'left':'right']: -2, width: 8, height: 8, borderTop: c[0]==='t' ? `2px solid ${tokens.red}` : 'none', borderBottom: c[0]==='b' ? `2px solid ${tokens.red}` : 'none', borderLeft: c[1]==='l' ? `2px solid ${tokens.red}` : 'none', borderRight: c[1]==='r' ? `2px solid ${tokens.red}` : 'none' }} />
                ))}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: tokens.red, boxShadow: `0 0 10px ${tokens.red}` }} />
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, fontFamily: tokens.fontMono, fontSize: 9, color: tokens.red, opacity: 0.8 }}>LENS DETECTED · IR-940nm · Δ=97% MATCH</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 16 }}>CONFIDENCE BREAKDOWN</div>
            {confidenceBreakdown.map((c, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tokens.text2, marginBottom: 5 }}>
                  <span>{c.label}</span>
                  <span style={{ fontFamily: tokens.fontMono }}>{c.val}%</span>
                </div>
                <div style={{ height: 3, background: tokens.surface3, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${c.val}%`, background: `linear-gradient(90deg, ${tokens.red}, ${tokens.amber})`, borderRadius: 2, boxShadow: '0 0 4px rgba(239,68,68,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 12 }}>DETECTION METHOD</div>
            {Object.entries(techDetails).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${tokens.border}`, fontSize: 11 }}>
                <span style={{ color: tokens.text3 }}>{k}</span>
                <span style={{ color: tokens.text, fontFamily: tokens.fontMono, fontSize: 10 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${tokens.border}` }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t ? tokens.lavender : tokens.text3,
              fontFamily: tokens.fontBody, fontSize: 13, fontWeight: tab === t ? 600 : 400,
              borderBottom: `2px solid ${tab === t ? tokens.violet : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize',
            }}
          >{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: 15, color: tokens.text2, lineHeight: 1.8 }}>{finding.desc}</p>
        </div>
      )}
      {tab === 'evidence' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evidence.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px', background: tokens.surface3, borderRadius: 8, border: `1px solid ${tokens.border}` }}>
                <span style={{ color: tokens.red, fontFamily: tokens.fontMono, fontSize: 12, marginTop: 1 }}>0{i + 1}</span>
                <span style={{ fontSize: 14, color: tokens.text2, lineHeight: 1.6 }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'action' && (
        <div className="card" style={{ padding: '24px', borderLeft: `3px solid ${tokens.red}` }}>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.red, marginBottom: 14, letterSpacing: '0.1em' }}>RECOMMENDED ACTION</div>
          <p style={{ fontSize: 15, color: tokens.text2, lineHeight: 1.8 }}>{action}</p>
        </div>
      )}
      {tab === 'related' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {related.map((r, i) => (
            <div
              key={i}
              className="card"
              onClick={() => setPage('finding')}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = tokens.borderBright)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = tokens.border)}
            >
              <div>
                <span style={{ fontFamily: tokens.fontHead, fontWeight: 600, fontSize: 14, color: tokens.text }}>{r.type}</span>
                <div style={{ fontSize: 12, color: tokens.text3, marginTop: 3 }}>📍 {r.location}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${r.severity === 'HIGH' ? 'amber' : 'green'}`}>{r.severity}</span>
                <span style={{ color: tokens.text3, fontSize: 16 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
