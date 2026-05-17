import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FloodMap } from './components/FloodMap'
import { ToastProvider } from './components/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
          <header
            style={{
              flexShrink: 0,
              background: 'var(--header-bg)',
              borderBottom: '1px solid var(--border)',
              padding: '0 20px',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
              color: 'var(--header-text)',
            }}
          >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C7.5 2 3 6 3 11c0 6 9 13 9 13s9-7 9-13c0-5-4.5-9-9-9z"
                  fill="var(--accent)"
                  opacity="0.9"
                />
                <circle cx="12" cy="11" r="3" fill="var(--bg-surface)" />
              </svg>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: '0.12em',
                  color: 'var(--header-text)',
                  textTransform: 'uppercase',
                }}
              >
                FloodWatch
              </span>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10,
                  color: 'rgba(232, 244, 255, 0.55)',
                  letterSpacing: '0.05em',
                  display: 'none',
                  paddingLeft: 4,
                }}
                className="sm-inline"
              >
                USGS Water Monitoring
              </span>
            </div>

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent-glow)',
                  animation: 'gauge-ping 2.8s cubic-bezier(0,0,0.2,1) infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'var(--accent)',
                  letterSpacing: '0.1em',
                }}
              >
                LIVE
              </span>
            </div>
          </header>

          <main style={{ flex: 1, overflow: 'hidden' }}>
            <FloodMap />
          </main>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}
