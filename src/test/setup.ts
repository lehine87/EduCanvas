// Test Setup Configuration for EduCanvas
// Global test setup and mocks

import { beforeAll, afterAll, vi } from 'vitest'

// Mock global performance API for Node.js environment
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    getEntries: vi.fn(() => [])
  } as any
}

// Mock console methods to avoid noise in tests
const originalConsole = global.console

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
})

afterAll(() => {
  global.console = originalConsole
})

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
})
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client for tests
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      upsert: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }
  }
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}))

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useEffect: vi.fn((fn: any) => fn()),
    useLayoutEffect: vi.fn((fn: any) => fn()),
    useCallback: vi.fn((fn: any) => fn),
    useMemo: vi.fn((fn: any) => fn())
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock as any

// Test utilities
export const testUtils = {
  resetMocks: () => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()
    sessionStorageMock.clear.mockClear()
  },
  
  mockConsole: (level: 'log' | 'info' | 'warn' | 'error' | 'debug' = 'log') => {
    return vi.spyOn(console, level).mockImplementation(() => {})
  },
  
  createMockUUID: (suffix = '1234-1234-1234-123456789abc') => {
    return `12345678-${suffix}`
  },
  
  createMockDate: (dateString = '2024-01-01T00:00:00Z') => {
    return new Date(dateString).toISOString()
  }
}

// Export for use in individual test files
export { vi }