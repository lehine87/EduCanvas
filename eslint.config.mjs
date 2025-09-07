import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 개발 전용 파일들을 먼저 무시
  {
    ignores: [
      "src/dev-tools/**/*",
      "**/*.dev.ts",
      "**/*.dev.tsx",
      "**/*.dev.js", 
      "**/*.dev.jsx"
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",  // any 사용 금지 (보안 중요)
      "@typescript-eslint/no-unused-vars": "warn",     // 개발 중이므로 경고만
      "@typescript-eslint/no-empty-object-type": "warn", // 경고만
      "@typescript-eslint/no-unsafe-declaration-merging": "warn", // Supabase 자동생성 파일 경고만
      "prefer-const": "warn",                          // 경고만
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
