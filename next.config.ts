import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint 설정 (개발 전용 파일 제외)
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
  
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },

  // Webpack 설정 - Production에서 개발 전용 파일 완전 제거
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production에서 .dev.ts 파일들을 완전히 제외
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/permissions/debug': false,
        '@/lib/permissions/debug.dev': false, 
        '@/lib/dev-init': false,
        '@/lib/dev-init.dev': false,
      }

      // .dev.ts 파일들을 빌드에서 완전히 제외
      config.module.rules.push({
        test: /\.dev\.(ts|tsx|js|jsx)$/,
        use: 'null-loader'
      })
    }
    
    return config
  },
};

export default nextConfig;
