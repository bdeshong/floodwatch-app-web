import { useEffect, useState } from 'react'
import { useUSGSData } from '../hooks/useUSGSData'
import { ParameterChart } from './ParameterChart'
import { useToast } from './Toast'
import { USGSRateLimitError } from '../api/usgs'
import type { Gauge } from '../types'

const PERIODS = [
  { value: 1,  label: '24h' },
  { value: 7,  label: '7d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
] as const
type PeriodDays = typeof PERIODS[number]['value']

interface Props {
  gauge: Gauge
  onClose: () => void
}

type StageStatus = 'normal' | 'action' | 'flood' | 'moderate' | 'major' | 'unknown'

const STATUS: Record<StageStatus, { label: string; color: string; bg: string }> = {
  unknown:  { label: 'No Stage Data', color: 'var(--text-muted)',    bg: 'rgba(61,92,118,0.18)' },
  normal:   { label: 'Normal',        color: 'var(--accent)',         bg: 'var(--accent-dim)' },
  action:   { label: 'Action Stage',  color: 'var(--stage-action)',   bg: 'rgba(240,222,32,0.10)' },
  flood:    { label: 'Flood Stage',   color: 'var(--stage-flood)',    bg: 'rgba(232,130,10,0.12)' },
  moderate: { label: 'Moderate Flood',color: 'var(--stage-moderate)', bg: 'rgba(224,48,48,0.12)'  },
  major:    { label: 'Major Flood',   color: 'var(--stage-major)',    bg: 'rgba(184,64,224,0.13)' },
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
      <div style={{ position: 'relative', height: 10, borderRadius: 99, background: 'var(--bg-base)', overflow: 'hidden' }}>
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
                opacity: 0.5,
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
              boxShadow: '0 0 8px var(--accent-glow)',
              zIndex: 2,
              animation: 'fade-up 0.4s 0.1s ease both',
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
  const [period, setPeriod] = useState<PeriodDays>(1)
  const { data: params, isLoading, isError, error } = useUSGSData(gauge.usgs.id, period)
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
          boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.3)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Teal accent top bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, var(--accent) 0%, var(--accent-mid) 60%, transparent 100%)`, flexShrink: 0 }} />

        {/* Loading bar */}
        <div style={{ height: 2, background: 'var(--border)', flexShrink: 0, overflow: 'hidden', opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s' }}>
          <div style={{
            height: '100%',
            width: '40%',
            background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
            animation: 'loading-sweep 1.4s ease-in-out infinite',
          }} />
        </div>

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
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.25,
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
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 18px' }} className="modal-scroll">

          {/* Flood stages */}
          {hasStages && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ width: 2, height: 10, background: 'var(--accent)', borderRadius: 99, opacity: 0.7, flexShrink: 0 }} />
                <p style={{ ...sectionLabel, marginBottom: 0 }}>Flood Stages</p>
              </div>
              <StageBar stages={stages} currentHeight={currentHeight} />
            </div>
          )}

          {/* Charts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 2, height: 10, background: 'var(--accent)', borderRadius: 99, opacity: 0.7, flexShrink: 0 }} />
                <p style={{ ...sectionLabel, marginBottom: 0 }}>
                  {period === 1 ? 'Past 24 Hours' : `Past ${period} Days`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: 10,
                      fontWeight: period === p.value ? 600 : 400,
                      color: period === p.value ? 'var(--accent)' : 'var(--text-muted)',
                      background: period === p.value ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${period === p.value ? 'var(--accent-mid)' : 'var(--border)'}`,
                      borderRadius: 6,
                      padding: '3px 9px',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                      transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (period !== p.value) {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (period !== p.value) {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                      }
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10 }}>
                <div style={{ position: 'relative', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="live-ring" style={{ animationDuration: '1.2s' }} />
                  <span style={{ display: 'block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', position: 'relative', zIndex: 1 }} />
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
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
                {params.map((p) => <ParameterChart key={p.code} parameter={p} days={period} />)}
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
