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
}

function formatTick(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
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

export function ParameterChart({ parameter }: Props) {
  const data = parameter.observations.map((o) => ({ time: o.time, value: o.value }))
  const tickInterval = Math.max(1, Math.floor(data.length / 5))
  const gradId = `grad-${parameter.code}`

  const currentValue = parameter.latest?.value
  const hasValue = currentValue !== null && currentValue !== undefined

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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          {parameter.name}
        </span>
        {hasValue && (
          <span
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {currentValue!.toFixed(2)}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5, fontWeight: 400 }}>
              {parameter.unit}
            </span>
          </span>
        )}
      </div>

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
            tickFormatter={formatTick}
            tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
            interval={tickInterval - 1}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'IBM Plex Mono, monospace',
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
