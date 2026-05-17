import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  const d = new Date(isoTime)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function formatTooltipLabel(isoTime: string): string {
  const d = new Date(isoTime)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function ParameterChart({ parameter }: Props) {
  const data = parameter.observations.map((o) => ({
    time: o.time,
    value: o.value,
  }))

  const tickInterval = Math.max(1, Math.floor(data.length / 6))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-sm font-medium text-gray-700">{parameter.name}</h4>
        {parameter.latest?.value !== null && parameter.latest?.value !== undefined && (
          <span className="text-sm font-semibold text-blue-700">
            {parameter.latest.value.toFixed(2)}{' '}
            <span className="text-xs font-normal text-gray-500">{parameter.unit}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTick}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval={tickInterval - 1}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={38}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [`${value?.toFixed(2)} ${parameter.unit}`, parameter.name]}
            labelFormatter={formatTooltipLabel}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
