import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Đặt dấu trên window: dấu còn nghĩa là chưa tải lại trang. */
const markDocument = (page: Page) => page.evaluate(() => { (window as unknown as { __mark: boolean }).__mark = true; });
const isSameDocument = (page: Page) => page.evaluate(() => (window as unknown as { __mark?: boolean }).__mark === true);
const activeNav = (page: Page) => page.locator(".nav-link-item.active");

test.describe("cổng và chuyển hướng", () => {
  test("/ chuyển về cổng, cổng mở được 3 phân hệ", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole("heading", { name: "Chọn phân hệ làm việc" })).toBeVisible();
    await expect(page.locator(".pxh")).toHaveCSS("background-image", /portal-bg\.png/);

    await page.getByRole("link", { name: "Bản Đồ" }).click();
    await expect(page).toHaveURL(/\/ban-do\/map-tong-quan$/);
    await expect(page.locator(".leaflet-container")).toBeVisible();

    await page.locator("a.brand").click();
    await expect(page).toHaveURL(/\/portal$/);
    await page.getByRole("link", { name: "Quản Trị" }).click();
    await expect(page).toHaveURL(/\/quan-tri\/admin-dashboard$/);
    await expect(page.locator("#page > *").first()).toBeVisible();
  });

  test("liên kết .html cũ vẫn hoạt động", async ({ page }) => {
    for (const [from, to] of [
      ["/portal.html", /\/portal$/],
      ["/index.html", /\/portal$/],
      ["/nha-may/index.html", /\/nha-may$/],
      ["/nha-may/lenh-mua.html", /\/nha-may\/lenh-mua$/],
      ["/nha-may/truy-xuat.html?code=PAL-2026-0101", /\/nha-may\/truy-xuat\?code=PAL-2026-0101$/],
    ] as const) {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    }
  });

  test("đường dẫn lạ trả về 404", async ({ page }) => {
    const response = await page.goto("/nha-may/khong-co-trang-nay");
    expect(response?.status()).toBe(404);
    await expect(page.locator(".sidebar")).toHaveCount(0);
  });
});

test.describe("chuyển trang phía client", () => {
  test("menu bên chuyển trang không tải lại, cập nhật tiêu đề và mục đang chọn", async ({ page }) => {
    await page.goto("/nha-may/lenh-mua");
    await expect(page.locator(".topbar h1")).toHaveText("Lệnh mua");
    await markDocument(page);

    await page.getByRole("link", { name: "Nhà cung cấp" }).click();
    await expect(page).toHaveURL(/hop-dong-cung-ung$/);
    await expect(page.locator(".topbar h1")).toHaveText("Nhà cung cấp");
    await expect(activeNav(page)).toHaveText("Nhà cung cấp");
    await expect(page).toHaveTitle("Nhà cung cấp - ECOtech2A");
    expect(await isSameDocument(page)).toBe(true);

    await page.goBack();
    await expect(page.locator(".topbar h1")).toHaveText("Lệnh mua");
    expect(await isSameDocument(page)).toBe(true);
  });

  test("liên kết trong nội dung trang cũng đi qua router", async ({ page }) => {
    await page.goto("/quan-tri/admin-dashboard");
    await expect(page.locator('#page a[href="/quan-tri/admin-loai-cay"]')).toBeVisible();
    await markDocument(page);
    await page.locator('#page a[href="/quan-tri/admin-loai-cay"]').click();
    await expect(page).toHaveURL(/admin-loai-cay$/);
    await expect(page.getByRole("button", { name: "Thêm loài cây" })).toBeVisible();
    expect(await isSameDocument(page)).toBe(true);
  });

  test("đổi ?tab dựng lại trang đúng tab", async ({ page }) => {
    await page.goto("/nha-may/cham-cong-nhan-su");
    await expect(activeNav(page)).toHaveText("Chấm công");
    await expect(page.locator(".topbar h1")).toHaveText("Chấm công");

    // Tên truy cập của liên kết có cả ký tự biểu tượng nên chọn theo href thay vì tên chính xác.
    await page.locator('.nav-list a[href$="tab=workers"]').click();
    await expect(page.locator(".topbar h1")).toHaveText("Nhân sự");
    await expect(activeNav(page)).toHaveText("Nhân sự");

    await page.getByRole("link", { name: "Máy móc" }).click();
    await expect(page.locator(".topbar h1")).toHaveText("Máy móc");
    await page.getByRole("link", { name: "Vật tư" }).click();
    await expect(page.locator(".topbar h1")).toHaveText("Vật tư");
  });

  test("bộ lọc về mặc định khi quay lại trang, như khi tải lại", async ({ page }) => {
    await page.goto("/nha-may/lenh-mua");
    const filter = page.locator('select[aria-label="Trạng thái"]');
    await filter.selectOption({ index: 1 });
    await expect(page.locator('select[aria-label="Trạng thái"]')).not.toHaveValue("");

    await page.getByRole("link", { name: "Nhà cung cấp" }).click();
    await expect(page.locator(".topbar h1")).toHaveText("Nhà cung cấp");
    await page.getByRole("link", { name: "Lệnh mua nguyên liệu" }).click();
    await expect(page.locator(".topbar h1")).toHaveText("Lệnh mua");
    await expect(page.locator('select[aria-label="Trạng thái"]')).toHaveValue("");
  });

  test("menu di động mở bằng nút và đóng sau khi chọn trang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/nha-may/lenh-mua");
    await expect(page.locator("#sidebar")).not.toHaveClass(/\bopen\b/);
    await page.getByRole("button", { name: "Mở menu" }).click();
    await expect(page.locator("#sidebar")).toHaveClass(/\bopen\b/);
    await page.getByRole("link", { name: "Nhà cung cấp" }).click();
    await expect(page).toHaveURL(/hop-dong-cung-ung$/);
    await expect(page.locator("#sidebar")).not.toHaveClass(/\bopen\b/);
  });
});

test.describe("đổi phân hệ", () => {
  test("rời trang từ modal không để lại modal hay backdrop", async ({ page }) => {
    await page.goto("/nha-may/lenh-mua");
    await expect(page.locator(".topbar h1")).toHaveText("Lệnh mua");
    await page.locator(".sidebar-subsystem-tag").click();
    const dialog = page.locator(".modal.show");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("a.btn")).toHaveCount(4);

    await dialog.locator('a[href="/ban-do/map-tong-quan"]').click();
    await expect(page).toHaveURL(/map-tong-quan$/);
    await expect(page.locator(".sidebar-subsystem-tag")).toContainText("Bản Đồ GIS");
    await expect(page.locator(".modal")).toHaveCount(0);
    await expect(page.locator(".modal-backdrop")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/modal-open/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("mở được bằng bàn phím", async ({ page }) => {
    await page.goto("/quan-tri/admin-dashboard");
    await expect(page.locator(".topbar h1")).not.toBeEmpty();
    await page.locator(".sidebar-subsystem-tag").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".modal.show")).toBeVisible();
  });
});
