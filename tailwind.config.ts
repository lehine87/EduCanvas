import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // T-V2-002: EduCanvas 커스텀 색상 토큰 추가
        educanvas: {
          50: "var(--color-educanvas-50)",
          100: "var(--color-educanvas-100)",
          200: "var(--color-educanvas-200)",
          300: "var(--color-educanvas-300)",
          400: "var(--color-educanvas-400)",
          500: "var(--color-educanvas-500)",
          600: "var(--color-educanvas-600)",
          700: "var(--color-educanvas-700)",
          800: "var(--color-educanvas-800)",
          900: "var(--color-educanvas-900)",
          950: "var(--color-educanvas-950)",
        },
        wisdom: {
          50: "var(--color-wisdom-50)",
          100: "var(--color-wisdom-100)",
          200: "var(--color-wisdom-200)",
          300: "var(--color-wisdom-300)",
          400: "var(--color-wisdom-400)",
          500: "var(--color-wisdom-500)",
          600: "var(--color-wisdom-600)",
          700: "var(--color-wisdom-700)",
          800: "var(--color-wisdom-800)",
          900: "var(--color-wisdom-900)",
          950: "var(--color-wisdom-950)",
        },
        growth: {
          50: "var(--color-growth-50)",
          100: "var(--color-growth-100)",
          200: "var(--color-growth-200)",
          300: "var(--color-growth-300)",
          400: "var(--color-growth-400)",
          500: "var(--color-growth-500)",
          600: "var(--color-growth-600)",
          700: "var(--color-growth-700)",
          800: "var(--color-growth-800)",
          900: "var(--color-growth-900)",
          950: "var(--color-growth-950)",
        },
      },
      fontSize: {
        // T-V2-002: 타이포그래피 12레벨 시스템
        'display': 'var(--font-size-display)',
        'heading-1': 'var(--font-size-heading-1)',
        'heading-2': 'var(--font-size-heading-2)',
        'heading-3': 'var(--font-size-heading-3)',
        'heading-4': 'var(--font-size-heading-4)',
        'heading-5': 'var(--font-size-heading-5)',
        'body-large': 'var(--font-size-body-large)',
        'body-small': 'var(--font-size-body-small)',
        'caption': 'var(--font-size-caption)',
        'overline': 'var(--font-size-overline)',
        'tiny': 'var(--font-size-tiny)',
      },
      lineHeight: {
        'display': 'var(--line-height-display)',
        'heading': 'var(--line-height-heading)',
        'body': 'var(--line-height-body)',
        'relaxed': 'var(--line-height-relaxed)',
      },
      letterSpacing: {
        'tight': 'var(--letter-spacing-tight)',
        'normal': 'var(--letter-spacing-normal)',
        'wide': 'var(--letter-spacing-wide)',
      },
      spacing: {
        // T-V2-002: 교육 특화 간격 시스템
        'content': 'var(--spacing-content)',
        'section': 'var(--spacing-section)',
        'lesson': 'var(--spacing-lesson)',
        'exercise': 'var(--spacing-exercise)',
        'question': 'var(--spacing-question)',
        'answer': 'var(--spacing-answer)',
        'card-padding': 'var(--spacing-card-padding)',
        'button-padding': 'var(--spacing-button-padding)',
        'form-gap': 'var(--spacing-form-gap)',
        'list-gap': 'var(--spacing-list-gap)',
        'nav-gap': 'var(--spacing-nav-gap)',
        'mobile-section': 'var(--spacing-mobile-section)',
        'mobile-content': 'var(--spacing-mobile-content)',
        'mobile-padding': 'var(--spacing-mobile-padding)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config