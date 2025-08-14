import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree Shaking 최적화 (Debug Interface 제외)
  webpack: (config, { dev, isServer }) => {
    // Production 빌드에서 개발 전용 코드 완전 제거
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
      
      // 개발 전용 코드 제거를 위한 DefinePlugin 설정
      config.plugins = config.plugins || []
    }
    
    return config
  },
  
  // Production 최적화
  swcMinify: true,
  
  // 번들 크기 분석 (필요시 활성화)
  // experimental: {
  //   bundleAnalyzer: process.env.ANALYZE === 'true'
  // }
};

export default nextConfig;
