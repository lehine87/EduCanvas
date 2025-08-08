// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_APP_NAME: string
    SENTRY_DSN?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}