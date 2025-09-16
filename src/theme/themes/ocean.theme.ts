/**
 * 바다 테마
 * 시원하고 신뢰감 있는 해양 블루 톤
 * 해양 교육/연구 기관에 최적화
 * @version 2.0
 * @date 2025-01-11
 */

import type { Theme } from '@/types/theme.types';

export const oceanTheme: Theme = {
  name: 'ocean',
  displayName: '바다 테마',
  description: '시원하고 신뢰감 있는 해양 블루 테마',
  colors: {
    light: {
      primary: {
        100: '#e0f2fe', // 연한 스카이 블루
        200: '#7dd3fc', // 중간 스카이 블루
        300: '#0369a1', // 진한 오션 블루
      },
      accent: {
        100: '#22d3ee', // 밝은 시안
        200: '#0891b2', // 진한 틸
      },
      text: {
        100: '#0f172a', // 진한 슬레이트
        200: '#475569', // 중간 슬레이트
      },
      bg: {
        100: '#f8fafc', // 매우 연한 슬레이트
        200: '#f1f5f9', // 연한 슬레이트
        300: '#cbd5e1', // 중간 슬레이트
      },
    },
    dark: {
      primary: {
        100: '#164e63', // 진한 틸
        200: '#0891b2', // 중간 틸
        300: '#67e8f9', // 밝은 시안
      },
      accent: {
        100: '#155e75', // 매우 진한 틸
        200: '#a5f3fc', // 매우 밝은 시안
      },
      text: {
        100: '#f8fafc', // 연한 슬레이트
        200: '#cbd5e1', // 중간 슬레이트
      },
      bg: {
        100: '#0f172a', // 진한 슬레이트
        200: '#1e293b', // 중간 진한 슬레이트
        300: '#334155', // 중간 슬레이트
      },
    },
  },
  backgrounds: {
    gradients: [
      'linear-gradient(135deg, #0891b2, #22d3ee)',
      'linear-gradient(180deg, #e0f2fe, #7dd3fc)',
      'radial-gradient(circle at center, #164e63, #0f172a)',
    ],
    patterns: [
      'wave-pattern',
      'bubble-pattern',
      'current-pattern',
    ],
  },
};