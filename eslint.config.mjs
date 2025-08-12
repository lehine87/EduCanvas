import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",  // error -> warn으로 완화
      "@typescript-eslint/no-unused-vars": "warn",  // error -> warn으로 완화
      "prefer-const": "warn",  // error -> warn으로 완화
      "@typescript-eslint/no-require-imports": "off",  // require 허용
    },
  },
];

export default eslintConfig;
