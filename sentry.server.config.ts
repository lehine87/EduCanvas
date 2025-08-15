// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://50a49008792ea74145b9b19c61361780@o4509846881173504.ingest.us.sentry.io/4509846885892096",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // EPIPE 에러 및 개발 환경 노이즈 필터링
  beforeSend(event, hint) {
    // 개발 환경에서 EPIPE 에러 필터링
    if (process.env.NODE_ENV === 'development') {
      const error = hint.originalException;
      
      if (error && typeof error === 'object') {
        // EPIPE 에러 필터링
        if ('code' in error && error.code === 'EPIPE') {
          console.warn('🚫 Sentry: EPIPE 에러 무시됨');
          return null;
        }
        
        // Broken pipe 메시지 필터링
        if ('message' in error && typeof error.message === 'string' && 
            error.message.includes('broken pipe')) {
          console.warn('🚫 Sentry: Broken pipe 에러 무시됨');
          return null;
        }
      }
    }
    
    return event;
  },

  // 에러 태그 추가
  initialScope: {
    tags: {
      environment: process.env.NODE_ENV || 'development',
      runtime: 'nodejs'
    }
  }
});
