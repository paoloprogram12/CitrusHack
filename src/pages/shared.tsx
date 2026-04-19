import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Page =
  | 'landing'
  | 'photo'
  | 'video'
  | 'dashboard'
  | 'results'
  | 'finding'
  | 'report'
  | 'history';

export interface Tweaks {
  accent: 'purple' | 'cyan' | 'green';
  scanMode: 'Standard' | 'Deep' | 'Stealth';
  sensitivity: number;
  autoReport: boolean;
  showConf: boolean;
  nightMode: boolean;
}

export interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const tokens = {
  bg:           '#07070d',
  surface1:     '#0f0f1a',
  surface2:     '#161628',
  surface3:     '#1e1e38',
  surface4:     '#252545',
  border:       'rgba(130, 80, 255, 0.18)',
  borderBright: 'rgba(168, 85, 247, 0.40)',
  purple:       '#7c3aed',
  violet:       '#a855f7',
  lavender:     '#c084fc',
  glow:         'rgba(168, 85, 247, 0.35)',
  glowSoft:     'rgba(124, 58, 237, 0.15)',
  text:         '#eeeeff',
  text2:        '#9999bb',
  text3:        '#55556a',
  red:          '#ef4444',
  amber:        '#f59e0b',
  green:        '#22c55e',
  cyan:         '#06b6d4',
  fontHead:     "'Space Grotesk', sans-serif",
  fontBody:     "'Inter', sans-serif",
  fontMono:     "'Space Mono', monospace",
} as const;

// ─── Accent palette (driven by Tweaks) ────────────────────────────────────────

export const accentMap = {
  purple: { primary: '#7c3aed', secondary: '#a855f7', light: '#c084fc', glow: 'rgba(168,85,247,0.35)' },
  cyan:   { primary: '#0891b2', secondary: '#06b6d4', light: '#67e8f9', glow: 'rgba(6,182,212,0.35)'   },
  green:  { primary: '#15803d', secondary: '#22c55e', light: '#86efac', glow: 'rgba(34,197,94,0.35)'   },
} as const;

// ─── Severity helpers ─────────────────────────────────────────────────────────

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const severityColor = (s: Severity): string => {
  if (s === 'CRITICAL') return tokens.red;
  if (s === 'HIGH')     return tokens.amber;
  if (s === 'MEDIUM')   return tokens.violet;
  return tokens.green;
};

// ─── Backend API types ────────────────────────────────────────────────────────

export interface BackendThreat {
  type: string;
  description: string;
  location: string;
  severity: string;
  bbox?: [number, number, number, number] | null; // [ymin, xmin, ymax, xmax] 0-1000 (Gemini native)
}

export interface ScanResult {
  risk_level: string;
  risk_score: number;
  threats: BackendThreat[];
  safe_items: string[];
  recommendation: string;
  summary: string;
}

// ─── Finding type ─────────────────────────────────────────────────────────────

export interface Finding {
  id: number;
  type: string;
  category: string;
  severity: Severity;
  location: string;
  confidence: number;
  desc: string;
  action: string;
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

interface NavInnerProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  page: Page;
  setPage: (p: Page) => void;
}

export const NavInner: React.FC<NavInnerProps> = ({ collapsed, setCollapsed, page, setPage }) => {
  const pages: { id: Page; label: string; svg: React.ReactNode }[] = [
    {
      id: 'landing', label: 'Home',
      svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 6V14H10V10H6V14H2V6L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    },
    {
      id: 'dashboard', label: 'Live Scan',
      svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    },
    {
      id: 'results', label: 'Results',
      svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 12L6 8L9 10L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
    },
  ];

  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: collapsed ? 64 : 220,
      background: 'linear-gradient(180deg, #0a0a16 0%, #0d0d1e 100%)',
      borderRight: `1px solid ${tokens.border}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 100, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div
        onClick={() => setPage('landing')}
        style={{ padding: collapsed ? '22px 0' : '24px 18px 18px', borderBottom: `1px solid ${tokens.border}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32, minWidth: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(168,85,247,0.55)',
          marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="4" stroke="white" strokeWidth="1.5"/>
            <circle cx="9" cy="9" r="1.5" fill="white"/>
            <path d="M9 2V5M9 13V16M2 9H5M13 9H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: tokens.fontHead, fontWeight: 700, fontSize: 17, letterSpacing: '0.06em', color: tokens.text }}>
              EYE<span style={{ color: tokens.violet }}>SPY</span>
            </div>
            <div style={{ fontSize: 9, color: tokens.text3, letterSpacing: '0.12em', fontFamily: tokens.fontMono, marginTop: 1 }}>
              COVERT SAFETY AI
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {pages.map(p => {
          const active = page === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPage(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: collapsed ? '11px 0' : '10px 13px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: active ? 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(168,85,247,0.1))' : 'transparent',
                color: active ? tokens.lavender : tokens.text2,
                boxShadow: active ? 'inset 0 0 0 1px rgba(168,85,247,0.28)' : 'none',
                fontFamily: tokens.fontBody, fontSize: 13, fontWeight: active ? 600 : 400,
              }}
            >
              <span style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }}>{p.svg}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{p.label}</span>}
              {active && !collapsed && (
                <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: tokens.violet, boxShadow: `0 0 6px ${tokens.violet}` }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse button */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${tokens.border}` }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: 8, borderRadius: 8,
            border: `1px solid ${tokens.border}`, background: 'transparent',
            color: tokens.text3, cursor: 'pointer', transition: 'all 0.15s',
            fontSize: 13, fontFamily: tokens.fontMono,
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </nav>
  );
};
