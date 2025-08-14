import type { NextConfig } from "next";

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

export default nextConfig;
