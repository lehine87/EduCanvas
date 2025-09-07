import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // ESLint 설정
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
  
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },

  // Turbopack 설정 (안정화된 버전)
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      // Turbopack 최적화 설정
      resolveAlias: {
        '@': './src',
      },
    },
  }),


  // Webpack 설정 - Production에서 dev-tools 디렉터리 완전 제외
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production 빌드에서 dev-tools를 완전히 제외하는 확실한 방법
      const webpack = require('webpack')
      
      // 1. IgnorePlugin으로 경로 패턴 무시
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /dev-tools/,
          contextRegExp: /src/,
        })
      )
      
      // 2. DefinePlugin으로 dev-tools import를 빈 객체로 대체
      config.plugins.push(
        new webpack.DefinePlugin({
          '__DEV_TOOLS_ENABLED__': 'false'
        })
      )
      
      // 3. resolve.alias로 dev-tools를 null로 대체
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/dev-tools/init': 'data:text/javascript,export default {}',
        '@/dev-tools/debug': 'data:text/javascript,export default {}'
      }
    }
    
    return config
  },
};

// Sentry 설정 옵션 통합
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // Sentry 조직 및 프로젝트 설정
  org: process.env.SENTRY_ORG || "educanvas",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 소스맵 업로드 설정
  silent: !process.env.CI, // CI에서만 로그 출력
  hideSourceMaps: true, // 프로덕션에서 소스맵 숨기기

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // 빌드 옵션
  widenClientFileUpload: true, // 클라이언트 파일 업로드 범위 확대

  // 터널링 설정 (광고 차단기 우회)
  tunnelRoute: "/monitoring",

  // 자동 계측 설정
  disableLogger: true, // Sentry 로거 비활성화
  automaticVercelMonitors: true // Vercel 모니터링 자동 설정
};

// Sentry 임시 비활성화 (무한 컴파일 문제 해결 위해)
// export default process.env.NEXT_PUBLIC_SENTRY_DSN 
//   ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
//   : nextConfig;
export default nextConfig;