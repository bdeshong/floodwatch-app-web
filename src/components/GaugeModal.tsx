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

const STATUS_CONFIG: Record<StageStatus, { label: string; bg: string; text: string; dot: string }> = {
  normal: { label: 'Normal', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  action: { label: 'Action Stage', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  flood: { label: 'Flood Stage', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  moderate: { label: 'Moderate Flood', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  major: { label: 'Major Flood', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-700' },
  unknown: { label: 'No Stage Data', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
}

function getStageStatus(heightFt: number | null, stages: Gauge['nws']['stages']): StageStatus {
  if (heightFt === null) return 'unknown'
  if (stages.major !== null && heightFt >= stages.major) return 'major'
  if (stages.moderate !== null && heightFt >= stages.moderate) return 'moderate'
  if (stages.flood !== null && heightFt >= stages.flood) return 'flood'
  if (stages.action !== null && heightFt >= stages.action) return 'action'
  if (stages.action !== null || stages.flood !== null) return 'normal'
  return 'unknown'
}

interface StageRowProps {
  label: string
  value: number | null
  dotColor: string
}

function StageRow({ label, value, dotColor }: StageRowProps) {
  if (value === null) return null
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="text-xs text-gray-500 w-20">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value} ft</span>
    </div>
  )
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const stages = gauge.nws.stages
  const hasStages = stages.action !== null || stages.flood !== null || stages.moderate !== null

  const currentHeight = params?.find((p) => p.code === '00065')?.latest?.value ?? null
  const stageStatus = getStageStatus(currentHeight, stages)
  const status = STATUS_CONFIG[stageStatus]

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88vh] sm:max-h-[82vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-gray-400 mb-0.5">USGS {gauge.usgs.id}</p>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug">{gauge.name}</h2>
            {gauge.nws.id && (
              <p className="text-xs text-gray-400 mt-0.5">NWS: {gauge.nws.id}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Flood stages */}
          {hasStages && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                NWS Flood Stages
              </p>
              <div className="grid grid-cols-2 gap-y-2">
                <StageRow label="Action" value={stages.action} dotColor="bg-yellow-400" />
                <StageRow label="Flood" value={stages.flood} dotColor="bg-orange-500" />
                <StageRow label="Moderate" value={stages.moderate} dotColor="bg-red-500" />
                <StageRow label="Major" value={stages.major} dotColor="bg-red-700" />
              </div>
            </div>
          )}

          {/* 24-hour charts */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Past 24 Hours
            </p>
            {isLoading && (
              <div className="flex items-center justify-center h-28">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isError && (
              <p className="text-sm text-gray-400 text-center py-6">Failed to load USGS data</p>
            )}
            {!isLoading && !isError && params && params.length > 0 && (
              <div className="space-y-5">
                {params.map((p) => (
                  <ParameterChart key={p.code} parameter={p} />
                ))}
              </div>
            )}
            {!isLoading && !isError && params && params.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No recent data available</p>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-300 text-right pt-2 border-t border-gray-100">
            Updated {new Date(gauge.usgs.capabilities.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
