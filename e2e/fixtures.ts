import { test as base, expect } from "@playwright/test";

/** Mọi lỗi JavaScript trong lúc chạy đều làm test thất bại. */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      // Ảnh bản đồ và phông chữ đến từ mạng ngoài, không thuộc phạm vi kiểm thử.
      await page.route(/mt1\.google|arcgisonline|fonts\.g/, (route) => route.abort());
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(message.text())) {
          errors.push(message.text());
        }
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
