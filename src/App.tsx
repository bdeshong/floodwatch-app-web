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
              <img src="/fw-icon.png" width="28" height="28" style={{ borderRadius: 6 }} alt="FloodWatch" />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  color: 'var(--header-text)',
                  textTransform: 'uppercase',
                }}
              >
                FloodWatch
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(232, 244, 255, 0.55)',
                  letterSpacing: '0.04em',
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
              <div style={{ position: 'relative', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="live-ring" />
                <span
                  style={{
                    display: 'block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 6px var(--accent-glow)',
                    position: 'relative',
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  letterSpacing: '0.08em',
                  animation: 'gauge-ping 3s ease-in-out infinite',
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
