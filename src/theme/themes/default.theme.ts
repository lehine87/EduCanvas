/**
 * EduCanvas 기본 테마
 * 사용자 지정 색상 기반 - 따뜻한 전문성 + 프리미엄 집중력
 * @version 2.0
 * @date 2025-01-11
 */

import type { Theme } from '@/types/theme.types';

export const defaultTheme: Theme = {
  name: 'default',
  displayName: 'EduCanvas 기본',
  description: '따뜻하고 전문적인 교육 환경을 위한 기본 테마',
  colors: {
    light: {
      primary: {
        100: '#d4eaf7', // 연한 블루, 배경/호버
        200: '#b6ccd8', // 중간 블루, 보조 요소
        300: '#3b3c3d', // 다크 그레이, 강조/액션
      },
      accent: {
        100: '#71c4ef', // 밝은 블루, 정보/링크
        200: '#00668c', // 진한 블루, 중요 액션
      },
      text: {
        100: '#1d1c1c', // 메인 텍스트
        200: '#313d44', // 보조 텍스트
      },
      bg: {
        100: '#fffefb', // 메인 배경 (따뜻한 화이트)
        200: '#f5f4f1', // 카드/패널 배경
        300: '#cccbc8', // 구분선/테두리
      },
    },
    dark: {
      primary: {
        100: '#1F3A5F', // 진한 네이비, 배경/호버
        200: '#4d648d', // 중간 블루그레이, 보조 요소
        300: '#acc2ef', // 밝은 블루, 강조/액션
      },
      accent: {
        100: '#3D5A80', // 진한 블루, 정보/링크
        200: '#cee8ff', // 매우 밝은 블루, 중요 액션
      },
      text: {
        100: '#FFFFFF', // 순백 메인 텍스트
        200: '#e0e0e0', // 밝은 회색 보조 텍스트
      },
      bg: {
        100: '#0F1C2E', // 진한 네이비 메인 배경
        200: '#1f2b3e', // 조금 밝은 네이비 카드/패널
        300: '#374357', // 중간 블루그레이 구분선/테두리
      },
    },
  },
  backgrounds: {
    gradients: [
      'linear-gradient(135deg, var(--bg-100), var(--bg-200))',
      'linear-gradient(135deg, var(--primary-100), var(--accent-100))',
      'radial-gradient(circle at top right, var(--primary-100), var(--bg-100))',
    ],
    patterns: [
      'subtle-grid',
      'dot-pattern',
      'wave-pattern',
    ],
  },
};