import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Quá nhiều trình duyệt song song làm sập tab ("Target crashed") trên máy phổ thông.
  workers: 3,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Dùng trình duyệt có sẵn trên máy; đặt PW_CHANNEL=chrome nếu không có Edge.
    channel: process.env.PW_CHANNEL ?? "msedge",
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/portal`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
