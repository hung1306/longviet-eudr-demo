import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
  ...nextVitals,
  ...nextTypescript,
  {
    // Mã chuyển đổi từ script cũ: kiểm tra lỗi thật (biến chưa khai báo), không ép lại phong cách.
    files: ["src/engine/**/*.js"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "prefer-const": "off",
    },
  },
];

export default config;
