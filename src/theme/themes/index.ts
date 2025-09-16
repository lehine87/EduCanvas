/**
 * EduCanvas 테마 모음
 * 모든 사용 가능한 테마들을 내보내는 인덱스 파일
 * @version 2.0
 * @date 2025-01-11
 */

import { defaultTheme } from './default.theme';
import { oceanTheme } from './ocean.theme';
import { forestTheme } from './forest.theme';
import type { Theme } from '@/types/theme.types';

// 사용 가능한 모든 테마
export const availableThemes: Theme[] = [
  defaultTheme,
  oceanTheme,
  forestTheme,
];

// 테마 이름으로 테마 객체 찾기
export const getThemeByName = (name: string): Theme | undefined => {
  return availableThemes.find(theme => theme.name === name);
};

// 기본 테마
export const DEFAULT_THEME = defaultTheme;

// 개별 테마 내보내기
export {
  defaultTheme,
  oceanTheme,
  forestTheme,
};

// 테마 이름 목록
export const THEME_NAMES = availableThemes.map(theme => theme.name);

// 테마 표시 이름 목록
export const THEME_DISPLAY_NAMES = availableThemes.map(theme => ({
  name: theme.name,
  displayName: theme.displayName,
  description: theme.description,
}));