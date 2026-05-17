import { useEffect } from 'react'
import { useUSGSData } from '../hooks/useUSGSData'
import { ParameterChart } from './ParameterChart'
import { useToast } from './Toast'
import { USGSRateLimitError } from '../api/usgs'
import type { Gauge } from '../types'

interface Props {
  gauge: Gauge
  onClose: () => void
}

type StageStatus = 'normal' | 'action' | 'flood' | 'moderate' | 'major' | 'unknown'

const STATUS: Record<StageStatus, { label: string; color: string; bg: string }> = {
  unknown:  { label: 'No Stage Data', color: 'var(--text-muted)',    bg: 'rgba(61,92,118,0.18)' },
  normal:   { label: 'Normal',        color: 'var(--accent)',         bg: 'var(--accent-dim)' },
  action:   { label: 'Action Stage',  color: 'var(--stage-action)',   bg: 'rgba(244,167,75,0.12)' },
  flood:    { label: 'Flood Stage',   color: 'var(--stage-flood)',    bg: 'rgba(224,122,58,0.12)' },
  moderate: { label: 'Moderate Flood',color: 'var(--stage-moderate)', bg: 'rgba(217,79,79,0.12)' },
  major:    { label: 'Major Flood',   color: 'var(--stage-major)',    bg: 'rgba(192,32,32,0.15)' },
}

function getStageStatus(height: number | null, stages: Gauge['nws']['stages']): StageStatus {
  if (height === null) return 'unknown'
  if (stages.major    !== null && height >= stages.major)    return 'major'
  if (stages.moderate !== null && height >= stages.moderate) return 'moderate'
  if (stages.flood    !== null && height >= stages.flood)    return 'flood'
  if (stages.action   !== null && height >= stages.action)   return 'action'
  if (stages.action   !== null || stages.flood !== null)     return 'normal'
  return 'unknown'
}

interface StageBarProps {
  stages: Gauge['nws']['stages']
  currentHeight: number | null
}

function StageBar({ stages, currentHeight }: StageBarProps) {
  const thresholds = [
    { value: stages.action,   label: 'Action',   color: 'var(--stage-action)' },
    { value: stages.flood,    label: 'Flood',    color: 'var(--stage-flood)' },
    { value: stages.moderate, label: 'Moderate', color: 'var(--stage-moderate)' },
    { value: stages.major,    label: 'Major',    color: 'var(--stage-major)' },
  ].filter((t): t is { value: number; label: string; color: string } => t.value !== null)

  if (thresholds.length === 0) return null

  const maxVal = thresholds[thresholds.length - 1].value * 1.28
  const toPct  = (v: number) => Math.min(100, Math.max(0, (v / maxVal) * 100))

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Track */}
      <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'var(--bg-base)', overflow: 'hidden' }}>
        {/* Colored zone segments */}
        {thresholds.map((t, i) => {
          const start = i === 0 ? 0 : toPct(thresholds[i - 1].value)
          const width = toPct(t.value) - start
          return (
            <div
              key={t.label}
              style={{
                position: 'absolute',
                left: `${start}%`,
                width: `${width}%`,
                height: '100%',
                background: t.color,
                opacity: 0.35,
              }}
            />
          )
        })}
        {/* Current height needle */}
        {currentHeight !== null && currentHeight > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${toPct(currentHeight)}%`,
              transform: 'translateX(-50%)',
              width: 2,
              height: '100%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent-glow)',
              zIndex: 2,
            }}
          />
        )}
      </div>

      {/* Threshold tick labels */}
      <div style={{ position: 'relative', height: 18, marginTop: 3 }}>
        {thresholds.map((t) => (
          <div
            key={t.label}
            style={{
              position: 'absolute',
              left: `${toPct(t.value)}%`,
              transform: 'translateX(-50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: t.color, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {t.value} ft
            </span>
          </div>
        ))}
      </div>

      {/* Legend labels */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
        {thresholds.map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: t.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 10,
}

export function GaugeModal({ gauge, onClose }: Props) {
  const { data: params, isLoading, isError, error } = useUSGSData(gauge.usgs.id)
  const { showToast } = useToast()

  useEffect(() => {
    if (isError && error instanceof USGSRateLimitError) {
      showToast('USGS rate limit reached — please wait a moment before trying again.')
    }
  }, [isError, error, showToast])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const stages = gauge.nws.stages
  const hasStages = stages.action !== null || stages.flood !== null || stages.moderate !== null

  const currentHeight = params?.find((p) => p.code === '00065')?.latest?.value ?? null
  const stageStatus   = getStageStatus(currentHeight, stages)
  const statusCfg     = STATUS[stageStatus]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--backdrop)', backdropFilter: 'blur(6px)' }} />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-panel)',
          width: '100%',
          maxWidth: 520,
          borderRadius: 18,
          boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Teal accent top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, var(--accent) 0%, transparent 100%)`, flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 18px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                margin: '0 0 4px',
              }}
            >
              USGS {gauge.usgs.id}
              {gauge.nws.id && (
                <span style={{ marginLeft: 10, color: 'var(--text-muted)' }}>· NWS {gauge.nws.id}</span>
              )}
            </p>
            <h2
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
                letterSpacing: '0.01em',
              }}
            >
              {gauge.name}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 2 }}>
            {/* Status pill */}
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: statusCfg.color,
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.color}30`,
                borderRadius: 99,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />
              {statusCfg.label}
            </span>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 5,
                borderRadius: 7,
                color: 'var(--text-muted)',
                display: 'flex',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 18px' }}>

          {/* Flood stages */}
          {hasStages && (
            <div style={{ marginBottom: 20 }}>
              <p style={sectionLabel}>Flood Stages</p>
              <StageBar stages={stages} currentHeight={currentHeight} />
            </div>
          )}

          {/* Charts */}
          <div>
            <p style={sectionLabel}>Past 24 Hours</p>

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </path>
                </svg>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-secondary)' }}>
                  Fetching USGS data
                </span>
              </div>
            )}

            {isError && !isLoading && (
              <p style={{ fontFamily: 'Syne', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                Failed to load USGS data
              </p>
            )}

            {!isLoading && !isError && params && params.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {params.map((p) => <ParameterChart key={p.code} parameter={p} />)}
              </div>
            )}

            {!isLoading && !isError && params?.length === 0 && (
              <p style={{ fontFamily: 'Syne', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No recent data available
              </p>
            )}
          </div>

          {/* Footer */}
          <p
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textAlign: 'right',
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}
          >
            Updated {new Date(gauge.usgs.capabilities.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
