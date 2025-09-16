/**
 * EduCanvas Tailwind CSS 설정
 * 10토큰 시멘틱 컬러 시스템 기반
 * @version 2.0
 * @date 2025-01-11
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // 10토큰 시멘틱 컬러 시스템 (메인)
        // ========================================
        
        // Primary 브랜드 색상 (3단계)
        primary: {
          100: "var(--primary-100)", // 연한 브랜드, 배경/호버
          200: "var(--primary-200)", // 중간 브랜드, 보조 요소
          300: "var(--primary-300)", // 진한 브랜드, 강조/액션
        },
        
        // Accent 강조 색상 (2단계)
        accent: {
          100: "var(--accent-100)", // 보조 강조, 정보/링크
          200: "var(--accent-200)", // 진한 강조, 중요 액션
        },
        
        // Text 텍스트 색상 (2단계)
        text: {
          100: "var(--text-100)", // 메인 텍스트
          200: "var(--text-200)", // 보조 텍스트
        },
        
        // Background 배경 색상 (3단계)
        bg: {
          100: "var(--bg-100)", // 메인 배경
          200: "var(--bg-200)", // 카드/패널 배경
          300: "var(--bg-300)", // 구분선/테두리
        },

        // ========================================
        // shadcn/ui 호환성 매핑 (기존 호환성 유지)
        // ========================================
        
        // 기본 시스템 색상 (10토큰으로 매핑)
        border: "var(--bg-300)",
        input: "var(--bg-300)",
        ring: "var(--accent-100)",
        background: "var(--bg-100)",
        foreground: "var(--text-100)",
        
        // shadcn/ui primary → primary-300 매핑
        "shadcn-primary": {
          DEFAULT: "var(--primary-300)",
          foreground: "var(--text-100)",
        },
        
        // shadcn/ui secondary → bg-200 매핑
        secondary: {
          DEFAULT: "var(--bg-200)",
          foreground: "var(--text-100)",
        },
        
        // 파괴적 작업 → primary-300 매핑
        destructive: {
          DEFAULT: "var(--primary-300)",
          foreground: "var(--text-100)",
        },
        
        // 음소거됨 → bg-200 매핑
        muted: {
          DEFAULT: "var(--bg-200)",
          foreground: "var(--text-200)",
        },
        
        // shadcn/ui accent → accent-100 매핑
        "shadcn-accent": {
          DEFAULT: "var(--accent-100)",
          foreground: "var(--text-100)",
        },
        
        // 팝오버
        popover: {
          DEFAULT: "var(--bg-100)",
          foreground: "var(--text-100)",
        },
        
        // 카드
        card: {
          DEFAULT: "var(--bg-100)",
          foreground: "var(--text-100)",
        },

        // ========================================
        // 의미적 색상 별칭 (선택적 사용)
        // ========================================
        
        // 성공 → accent-200
        success: "var(--accent-200)",
        
        // 정보 → accent-100
        info: "var(--accent-100)",
        
        // 경고 → accent-100
        warning: "var(--accent-100)",
        
        // 오류 → primary-300
        error: "var(--primary-300)",
      },
      
      // ========================================
      // 기타 확장 설정
      // ========================================
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // 애니메이션 지속 시간
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
      },
      
      // 그림자 (10토큰 색상 기반)
      boxShadow: {
        'theme-sm': '0 1px 2px 0 var(--bg-300)',
        'theme-md': '0 4px 6px -1px var(--bg-300)',
        'theme-lg': '0 10px 15px -3px var(--bg-300)',
      },
    },
  },
  
  // ========================================
  // 플러그인 설정
  // ========================================
  
  plugins: [
    // 10토큰 유틸리티 클래스 자동 생성
    function({ addUtilities }) {
      const newUtilities = {
        // 테마 전환 애니메이션
        '.theme-transition': {
          transition: 'background-color 300ms ease, color 300ms ease, border-color 300ms ease',
        },
        
        // 글래스모피즘 효과 (10토큰 기반)
        '.glass-effect': {
          'backdrop-filter': 'blur(8px) saturate(150%)',
          'background-color': 'var(--bg-100)',
          'background-opacity': '0.8',
          'border': '1px solid var(--bg-300)',
        },
        
        // 그라디언트 텍스트 (primary 토큰)
        '.text-gradient-primary': {
          'background': 'linear-gradient(135deg, var(--primary-200), var(--primary-300))',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
        },
        
        // 그라디언트 텍스트 (accent 토큰)
        '.text-gradient-accent': {
          'background': 'linear-gradient(135deg, var(--accent-100), var(--accent-200))',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
}

