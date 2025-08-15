import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // EPIPE 에러 전역 처리기 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      process.on('uncaughtException', (error) => {
        // EPIPE 에러는 로그만 남기고 무시 (앱 종료 방지)
        if (error.code === 'EPIPE' || error.message?.includes('broken pipe')) {
          console.warn('⚠️ EPIPE 에러 감지됨 (무시됨):', error.message);
          return; // 앱을 종료하지 않음
        }
        
        // 다른 심각한 에러는 Sentry로 전송
        Sentry.captureException(error);
        console.error('💥 Uncaught Exception:', error);
      });

      process.on('unhandledRejection', (reason, promise) => {
        // Promise rejection에서도 EPIPE 관련 에러 필터링
        if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'EPIPE') {
          console.warn('⚠️ EPIPE Promise rejection 감지됨 (무시됨):', reason);
          return;
        }
        
        Sentry.captureException(reason);
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      });
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
