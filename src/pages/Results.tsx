import React, { useState } from 'react';
import { Severity, Finding, ScanResult, severityColor, tokens } from './shared';

interface ResultsProps {
  scanResult: ScanResult | null;
}

type FilterLevel = 'ALL' | Severity;

// ─── Mock data (shown when no real scan result is available) ──────────────────

const ALL_FINDINGS: Finding[] = [
  { id: 1, type: 'Hidden Camera',      category: 'surveillance', severity: 'CRITICAL', location: 'Clock radio — nightstand (left)',    confidence: 97, desc: 'Pinhole camera lens detected via IR reflection analysis. Orientation suggests coverage of bed area.',                                            action: 'Cover immediately. Contact hotel management and local authorities.' },
  { id: 2, type: 'Unknown Device',     category: 'network',      severity: 'HIGH',     location: 'Air purifier — northeast corner',     confidence: 84, desc: 'Unrecognized RF transmitter detected inside air purifier chassis. Emitting on 2.4GHz band.',                                                action: 'Do not use device. Move to hallway or unplug.' },
  { id: 3, type: 'Lock Vulnerability', category: 'access',       severity: 'HIGH',     location: 'Connecting room door',                confidence: 91, desc: 'Secondary deadbolt is non-functional. Connecting door presents unauthorized entry risk.',                                                action: 'Block with furniture. Request room change or additional security.' },
  { id: 4, type: 'Smoke Detector',     category: 'fire',         severity: 'MEDIUM',   location: 'Bathroom — none detected',            confidence: 99, desc: 'No smoke detector found in bathroom area. Fire code violation in most jurisdictions.',                                                    action: 'Notify hotel management. Locate nearest fire exit manually.' },
  { id: 5, type: 'Exposed Wiring',     category: 'electrical',   severity: 'MEDIUM',   location: 'Behind TV console',                   confidence: 78, desc: 'Frayed lamp cable with exposed copper detected near flammable surface.',                                                                  action: 'Do not use lamp. Report to hotel maintenance immediately.' },
  { id: 6, type: 'RF Signal Anomaly',  category: 'network',      severity: 'LOW',      location: 'Minibar area',                        confidence: 61, desc: 'Low-power Bluetooth signal detected from within minibar. Could be inventory sensor.',                                                    action: 'Likely benign. Monitor for sustained high-power transmission.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFindings(result: ScanResult): Finding[] {
  return result.threats.map((t, i) => ({
    id: i + 1,
    type: t.type,
    category: t.type.toLowerCase().replace(/\s+/g, '-'),
    severity: t.severity as Severity,
    location: t.location,
    confidence: 0,
    desc: t.description,
    action: result.recommendation,
  }));
}

// ─── Results ──────────────────────────────────────────────────────────────────

export const Results: React.FC<ResultsProps> = ({ scanResult }) => {
  const [filter, setFilter] = useState<FilterLevel>('ALL');

  const findings = scanResult ? toFindings(scanResult) : ALL_FINDINGS;
  const score    = scanResult ? 100 - scanResult.risk_score : 38;
  const scoreColor = score < 40 ? tokens.red : score < 70 ? tokens.amber : tokens.green;
  const scoreLabel = score < 40 ? 'UNSAFE' : score < 70 ? 'CAUTION' : 'SAFE';

  const severityBadgeClass = (s: Severity) =>
    s === 'CRITICAL' ? 'badge-red' : s === 'HIGH' ? 'badge-amber' : s === 'MEDIUM' ? 'badge-purple' : 'badge-green';

  const filtered = findings.filter(f => filter === 'ALL' || f.severity === filter);

  const statCards: { label: string; val: number; color: string; sev: Severity }[] = [
    { label: 'Critical', val: findings.filter(f => f.severity === 'CRITICAL').length, color: tokens.red,    sev: 'CRITICAL' },
    { label: 'High',     val: findings.filter(f => f.severity === 'HIGH').length,     color: tokens.amber,  sev: 'HIGH'     },
    { label: 'Medium',   val: findings.filter(f => f.severity === 'MEDIUM').length,   color: tokens.violet, sev: 'MEDIUM'   },
    { label: 'Low',      val: findings.filter(f => f.severity === 'LOW').length,      color: tokens.green,  sev: 'LOW'      },
  ];

  const filters: FilterLevel[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.violet, letterSpacing: '0.12em', marginBottom: 8 }}>SCAN RESULTS</div>
          <h1 style={{ fontFamily: tokens.fontHead, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: tokens.text }}>Threat Analysis</h1>
        </div>
      </div>

      {/* Summary card (real scans only) */}
      {scanResult && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, borderLeft: `3px solid ${scoreColor}` }}>
          <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, marginBottom: 8, letterSpacing: '0.1em' }}>SUMMARY</div>
          <p style={{ fontSize: 13, color: tokens.text2, lineHeight: 1.6, marginBottom: 10 }}>{scanResult.summary}</p>
          <div style={{ fontSize: 12, color: scoreColor, background: `${scoreColor}11`, padding: '8px 12px', borderRadius: 6, border: `1px solid ${scoreColor}22` }}>
            → {scanResult.recommendation}
          </div>
        </div>
      )}

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
          <div style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{scoreLabel}</div>
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
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: tokens.text3, fontFamily: tokens.fontMono, fontSize: 13 }}>
                No findings for this severity level.
              </div>
            ) : filtered.map(f => (
              <div
                key={f.id}
                className="card"
                style={{ padding: '18px 20px', borderLeft: `3px solid ${severityColor(f.severity)}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(f.severity), boxShadow: `0 0 6px ${severityColor(f.severity)}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: tokens.fontHead, fontSize: 15, fontWeight: 600, color: tokens.text }}>{f.type}</span>
                    <span className={`badge ${severityBadgeClass(f.severity)}`}>{f.severity}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: tokens.text3, fontFamily: tokens.fontMono }}>{f.confidence}% confidence</span>
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

        {/* Sidebar */}
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

          {/* Safe items (real scans only) */}
          {scanResult && scanResult.safe_items.length > 0 && (
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: tokens.text3, letterSpacing: '0.1em', marginBottom: 12 }}>SAFE ITEMS</div>
              {scanResult.safe_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.green, boxShadow: `0 0 5px ${tokens.green}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: tokens.text2 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
