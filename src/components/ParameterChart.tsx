import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { USGSParameter } from '../types'

interface Props {
  parameter: USGSParameter
  days: number
}

function formatTick(isoTime: string, days: number): string {
  const d = new Date(isoTime)
  return days === 1
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTooltipLabel(isoTime: string): string {
  return new Date(isoTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function ParameterChart({ parameter, days }: Props) {
  const isPrecip = parameter.code === '00045'
  const [showCumulative, setShowCumulative] = useState(true)

  const rawData = parameter.observations.map((o) => ({ time: o.time, value: o.value }))

  const cumulativeData = (() => {
    let running = 0
    return parameter.observations.map((o) => {
      if (o.value !== null) running += o.value
      return { time: o.time, value: running }
    })
  })()

  const data = isPrecip && showCumulative ? cumulativeData : rawData

  const tickInterval = Math.max(1, Math.floor(data.length / 5))
  const gradId = `grad-${parameter.code}${isPrecip && showCumulative ? '-c' : ''}`

  const displayValue = isPrecip && showCumulative
    ? (parameter.cumulativeTotal ?? null)
    : (parameter.latest?.value ?? null)
  const hasValue = displayValue !== null && displayValue !== undefined

  const unitLabel = isPrecip && showCumulative
    ? `${parameter.unit} total`
    : parameter.unit

  return (
    <div
      className="chart-card"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px 10px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isPrecip ? 6 : 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          {parameter.name}
        </span>
        {hasValue && (
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {displayValue!.toFixed(2)}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5, fontWeight: 400 }}>
              {unitLabel}
            </span>
          </span>
        )}
      </div>

      {/* Precipitation view toggle */}
      {isPrecip && (
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {(['Cumulative', 'Recorded'] as const).map((label) => {
            const active = label === 'Cumulative' ? showCumulative : !showCumulative
            return (
              <button
                key={label}
                onClick={() => setShowCumulative(label === 'Cumulative')}
                style={{
                  fontSize: 9,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent-mid)' : 'var(--border)'}`,
                  borderRadius: 5,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => formatTick(t, days)}
            tick={{ fontSize: 9, fill: 'var(--text-muted)', }}
            interval={tickInterval - 1}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--text-muted)', }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(v: number) => v.toFixed(1)}
            domain={isPrecip && showCumulative ? [0, 'auto'] : ['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              fontSize: 11,
              color: 'var(--text-primary)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              padding: '6px 12px',
            }}
            labelStyle={{ color: 'var(--text-secondary)', marginBottom: 2 }}
            itemStyle={{ color: 'var(--accent)' }}
            formatter={(value: number) => [`${value?.toFixed(2)} ${parameter.unit}`, '']}
            labelFormatter={formatTooltipLabel}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
