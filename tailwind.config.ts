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
  // T-V2-002: Tailwind CSS v4에서는 @theme 디렉티브 사용으로 safelist 불필요
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
        // T-V2-002: 커스텀 색상은 @theme 디렉티브에서 정의됨 (globals.css)
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