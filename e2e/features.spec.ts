import { expect, test } from "./fixtures";

test.describe("modal và dữ liệu", () => {
  test("đóng modal bằng nút Đóng, nút X và phím Esc", async ({ page }) => {
    await page.goto("/quan-tri/admin-loai-cay");
    const open = page.getByRole("button", { name: "Thêm loài cây" });
    const dialog = page.locator(".modal");

    await open.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Đóng" }).last().click();
    await expect(dialog).toHaveCount(0);

    await open.click();
    await expect(dialog).toBeVisible();
    await dialog.locator(".btn-close").click();
    await expect(dialog).toHaveCount(0);

    await open.click();
    // Bootstrap bỏ qua Esc khi modal còn đang chạy hiệu ứng mở; modal nhận focus khi đã mở xong.
    await expect(dialog).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".modal-backdrop")).toHaveCount(0);
  });

  test("bỏ trống trường bắt buộc thì báo lỗi và giữ modal", async ({ page }) => {
    await page.goto("/quan-tri/admin-loai-cay");
    await page.getByRole("button", { name: "Thêm loài cây" }).click();
    await page.getByRole("button", { name: "Lưu loài cây" }).click();
    await expect(page.locator(".toast-err")).toContainText("trường bắt buộc");
    await expect(page.locator(".modal.show")).toBeVisible();
  });

  test("thêm mới hiển thị ngay, giữ qua chuyển trang và tải lại", async ({ page }) => {
    await page.goto("/quan-tri/admin-loai-cay");
    await page.getByRole("button", { name: "Thêm loài cây" }).click();
    const dialog = page.locator(".modal.show");
    await dialog.locator('[name="common"]').fill("Cây kiểm thử");
    await dialog.locator('[name="scientific"]').fill("Testus exemplaris");
    await page.getByRole("button", { name: "Lưu loài cây" }).click();
    await expect(page.locator(".modal")).toHaveCount(0);
    await expect(page.locator("#page")).toContainText("Testus exemplaris");

    await page.getByRole("link", { name: "Địa bàn hành chính" }).click();
    await expect(page).toHaveURL(/admin-dia-ban$/);
    await page.getByRole("link", { name: "Loài cây & Giống gỗ" }).click();
    await expect(page.locator("#page")).toContainText("Testus exemplaris");

    await page.reload();
    await expect(page.locator("#page")).toContainText("Testus exemplaris");
  });

  test("dữ liệu mới không rò sang phiên trình duyệt khác", async ({ browser }) => {
    const context = await browser.newContext();
    const fresh = await context.newPage();
    await fresh.goto("/quan-tri/admin-loai-cay");
    await expect(fresh.locator("#page > *").first()).toBeVisible();
    await expect(fresh.locator("#page")).not.toContainText("Testus exemplaris");
    await context.close();
  });
});

test.describe("bản đồ", () => {
  test("dựng đúng một bản đồ mỗi lần vào trang, gỡ sạch khi rời trang", async ({ page }) => {
    await page.goto("/ban-do/map-tong-quan");
    await expect(page.locator(".leaflet-container")).toHaveCount(1);
    await expect(page.locator(".leaflet-interactive").first()).toBeAttached();

    for (let round = 0; round < 3; round++) {
      await page.getByRole("link", { name: "Vườn cây & Thửa đất" }).click();
      await expect(page).toHaveURL(/map-thua-dat$/);
      await expect(page.locator("#page .leaflet-container")).toHaveCount(0);
      await page.getByRole("link", { name: "Bản đồ vùng trồng GIS" }).click();
      await expect(page).toHaveURL(/map-tong-quan$/);
      await expect(page.locator(".leaflet-container")).toHaveCount(1);
      await expect(page.locator(".leaflet-interactive").first()).toBeAttached();
    }
  });

  test("trang truy xuất vẽ bản đồ theo mã trên URL", async ({ page }) => {
    await page.goto("/nha-may/truy-xuat?code=PAL-2026-0101");
    await expect(page.locator("#page")).toContainText("PAL-2026-0101");
    await expect(page.locator("#trace-map.leaflet-container")).toBeVisible();
    await expect(page.locator("#trace-map .leaflet-interactive").first()).toBeAttached();
  });
});

test.describe("thư viện chuyển từ CDN sang npm", () => {
  test("tem QR vẽ được và nội dung đúng cỡ", async ({ page }) => {
    await page.goto("/nha-may/pallet-manage");
    await expect(page.locator("#page > *").first()).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { showTag: (t: string, c: string, l: string[][]) => void }).showTag("Tem", "PAL-2026-0101", [["Loại", "Thử"]]);
    });
    const canvas = page.locator(".modal.show .qr-box canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveJSProperty("width", 120);
    const inked = await canvas.evaluate((el: HTMLCanvasElement) => {
      const { data } = el.getContext("2d")!.getImageData(0, 0, el.width, el.height);
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) if ((data[i] ?? 255) < 128) dark++;
      return dark / (data.length / 4);
    });
    expect(inked).toBeGreaterThan(0.2);
    expect(inked).toBeLessThan(0.8);
  });

  test("đọc tệp danh sách qua thư viện xlsx", async ({ page }) => {
    await page.goto("/nha-may/tiep-nhan");
    await expect(page.locator("#page > *").first()).toBeVisible();
    await page.getByRole("button", { name: "Tải danh sách" }).click();
    const preview = page.locator("#batch-preview");
    await expect(preview).toContainText("Chọn tệp Excel");

    await page.locator("#batch-file").setInputFiles({
      name: "danh-sach.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("MaNCC,BienSo,LanVanChuyen\nNCC-KHONG-CO,51C-12345,1\n"),
    });
    await expect(preview).not.toContainText("Chọn tệp Excel");
    await expect(page.locator(".toast-err", { hasText: "Không tải được" })).toHaveCount(0);
  });

  test("biểu tượng Font Awesome tải được", async ({ page }) => {
    await page.goto("/portal");
    const family = await page.locator(".pxh-logo i").evaluate((el) => getComputedStyle(el, "::before").fontFamily);
    expect(family).toContain("Font Awesome");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('900 16px "Font Awesome 6 Free"'))).toBe(true);
  });
});

test("công cụ kiểm tra GeoJSON chạy được trên mẫu", async ({ page }) => {
  await page.goto("/ban-do/map-export-traces");
  await expect(page.locator("#page > *").first()).toBeVisible();
  const loadSample = (type: string) =>
    page.evaluate((sample) => (window as unknown as { loadCheckerSample: (s: string) => void }).loadCheckerSample(sample), type);
  await loadSample("pass");
  await expect(page.locator("#geojson-input-area")).toHaveValue(/FeatureCollection/);
  const passResult = await page.locator("#page").innerText();
  await loadSample("err_poly");
  await expect(page.locator("#page")).not.toHaveText(passResult);
});
