import { INDUSTRIES } from "../src/config/industries";
import { APP_ROUTES } from "../src/lib/routes";
import { expect, test } from "./fixtures";

/** Từ ngữ riêng của ván ép hoặc tên khách hàng khảo sát không được lọt sang ngành khác. */
const FORBIDDEN = /long.?vi[eệ]t|tam phước|plywood|PAL-LV|\bTQ\b|undefined|NaN/i;
const PLYWOOD_TERMS = /ván ruột|ván mặt|ván lạng|veneer|số tấm/i;

for (const pack of INDUSTRIES) {
  test.describe(`Nhóm ${pack.group}: ${pack.short}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((id) => localStorage.setItem("ecotech2a-industry", id), pack.id);
    });

    for (const route of APP_ROUTES) {
      test(`/${route.path}`, async ({ page }) => {
        await page.goto(`/${route.path}`);
        await expect(page.locator("#page > *").first()).toBeVisible();
        await expect(page.locator(".topbar h1")).not.toBeEmpty();
        await expect(page).toHaveTitle(`${route.title} - ECOtech2A`);
        await expect(page.locator("html")).toHaveAttribute("data-industry", pack.id);

        const text = await page.locator("#page").innerText();
        expect(text).not.toMatch(FORBIDDEN);
        if (pack.id !== "van-ep") expect(text).not.toMatch(PLYWOOD_TERMS);

        const missing = await page.evaluate(() => {
          const attrs = ["onclick", "onchange", "oninput", "onsubmit", "onkeyup"];
          const names = [...document.querySelectorAll("*")].flatMap((el) =>
            attrs.flatMap((attr) => {
              const match = /^\s*([A-Za-z_$][\w$]*)\s*\(/.exec(el.getAttribute(attr) ?? "");
              return match?.[1] && match[1] !== "if" ? [match[1]] : [];
            }),
          );
          const win = window as unknown as Record<string, unknown>;
          return [...new Set(names)].filter((name) => typeof win[name] !== "function");
        });
        expect(missing).toEqual([]);
      });
    }

    test("đúng công đoạn và đơn vị của nhóm", async ({ page }) => {
      await page.goto("/nha-may/nhat-ky-san-xuat");
      await expect(page.locator(".stage")).toHaveCount(pack.stages.length);
      for (const stage of pack.stages) await expect(page.locator(".stages")).toContainText(stage.name);
      await page.goto("/nha-may/lenh-san-xuat");
      await expect(page.locator("#page")).toContainText(pack.specs[0]!.name);
      await expect(page.locator("#page")).toContainText(`/${pack.stages.length} bước`);
    });

    test("thống kê lấy số thật của nhóm", async ({ page }) => {
      await page.goto("/nha-may");
      await expect(page.locator(".kpi-v2-val").first()).toHaveText("14");
      await page.getByRole("button", { name: "Kiểm tra toàn vẹn" }).click();
      const dialog = page.locator(".modal.show");
      await expect(dialog).toContainText("đủ dữ liệu");
      await expect(dialog.locator(".pill-fail")).toHaveCount(0);
    });
  });
}
