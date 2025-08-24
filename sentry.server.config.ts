// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// 타입 가드: NodeJS 에러 타입 체크
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}

// EPIPE 에러 전역 처리기 설정 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  process.on('uncaughtException', (error: Error) => {
    // EPIPE 에러는 로그만 남기고 무시
    if (isNodeError(error) && error.code === 'EPIPE') {
      console.warn('⚠️ EPIPE 에러 감지됨 (무시됨):', error.message);
      return;
    }
    
    if (error.message?.includes('broken pipe')) {
      console.warn('⚠️ Broken pipe 에러 감지됨 (무시됨):', error.message);
      return;
    }
    
    // 다른 심각한 에러는 Sentry로 전송하고 프로세스 종료
    Sentry.captureException(error);
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    // Promise rejection에서도 EPIPE 관련 에러 필터링
    if (isNodeError(reason) && reason.code === 'EPIPE') {
      console.warn('⚠️ EPIPE Promise rejection 감지됨 (무시됨):', reason.message);
      return;
    }
    
    if (reason instanceof Error && reason.message?.includes('broken pipe')) {
      console.warn('⚠️ Broken pipe Promise rejection 감지됨 (무시됨):', reason.message);
      return;
    }
    
    Sentry.captureException(reason);
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

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
