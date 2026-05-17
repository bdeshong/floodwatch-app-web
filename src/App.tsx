import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FloodMap } from './components/FloodMap'
import { ToastProvider } from './components/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <div className="flex flex-col h-full bg-gray-50">
        <header className="flex-shrink-0 bg-blue-900 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 text-blue-300 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8 2 4 5.5 4 10c0 5.25 8 14 8 14s8-8.75 8-14c0-4.5-4-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            </svg>
            <h1 className="text-base font-bold tracking-tight">FloodWatch</h1>
            <span className="text-xs text-blue-300 hidden sm:inline ml-0.5">
              USGS Water Monitoring
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <FloodMap />
        </main>
      </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}
