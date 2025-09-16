/**
 * 숲 테마
 * 자연스럽고 안정감 있는 그린 톤
 * 환경/생물 교육 기관에 최적화
 * @version 2.0
 * @date 2025-01-11
 */

import type { Theme } from '@/types/theme.types';

export const forestTheme: Theme = {
  name: 'forest',
  displayName: '숲 테마',
  description: '자연스럽고 안정감 있는 숲 그린 테마',
  colors: {
    light: {
      primary: {
        100: '#dcfce7', // 연한 그린
        200: '#86efac', // 중간 그린
        300: '#15803d', // 진한 그린
      },
      accent: {
        100: '#4ade80', // 밝은 그린
        200: '#166534', // 진한 포레스트 그린
      },
      text: {
        100: '#1f2937', // 진한 그레이
        200: '#6b7280', // 중간 그레이
      },
      bg: {
        100: '#f9fafb', // 매우 연한 그레이
        200: '#f3f4f6', // 연한 그레이
        300: '#d1d5db', // 중간 그레이
      },
    },
    dark: {
      primary: {
        100: '#14532d', // 진한 포레스트 그린
        200: '#22c55e', // 중간 그린
        300: '#86efac', // 밝은 그린
      },
      accent: {
        100: '#166534', // 매우 진한 그린
        200: '#bbf7d0', // 매우 밝은 그린
      },
      text: {
        100: '#f9fafb', // 연한 그레이
        200: '#d1d5db', // 중간 그레이
      },
      bg: {
        100: '#111827', // 진한 그레이
        200: '#1f2937', // 중간 진한 그레이
        300: '#374151', // 중간 그레이
      },
    },
  },
  backgrounds: {
    gradients: [
      'linear-gradient(135deg, #22c55e, #4ade80)',
      'linear-gradient(180deg, #dcfce7, #86efac)',
      'radial-gradient(circle at center, #14532d, #111827)',
    ],
    patterns: [
      'leaf-pattern',
      'tree-pattern',
      'organic-pattern',
    ],
  },
};