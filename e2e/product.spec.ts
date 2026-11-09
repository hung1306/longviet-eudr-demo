import { expect, test } from "./fixtures";

test.describe("đổi nhóm ngành", () => {
  test("đổi ở thanh bên dựng lại trang, không tải lại", async ({ page }) => {
    await page.goto("/nha-may/nhat-ky-san-xuat");
    await expect(page.locator(".stage")).toHaveCount(7);
    await page.evaluate(() => { (window as unknown as { __mark: boolean }).__mark = true; });

    await page.getByRole("combobox", { name: "Nhóm ngành" }).selectOption("noi-that");
    await expect(page.locator(".stages")).toContainText("Lắp ráp");
    await expect(page.locator(".stage")).toHaveCount(4);
    expect(await page.evaluate(() => (window as unknown as { __mark?: boolean }).__mark)).toBe(true);
  });

  test("chọn ở cổng, giữ khi vào phân hệ và tải lại", async ({ page }) => {
    await page.goto("/portal");
    await page.getByRole("button", { name: "Mỹ nghệ" }).click();
    await expect(page.getByRole("button", { name: "Mỹ nghệ" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("link", { name: "Nhà Máy" }).click();
    await expect(page.getByRole("combobox", { name: "Nhóm ngành" })).toHaveValue("my-nghe");
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Nhóm ngành" })).toHaveValue("my-nghe");
  });

  test("dữ liệu mỗi nhóm tách riêng", async ({ page }) => {
    await page.goto("/quan-tri/admin-loai-cay");
    await page.getByRole("button", { name: "Thêm loài cây" }).click();
    const dialog = page.locator(".modal.show");
    await dialog.locator('[name="common"]').fill("Riêng ván ép");
    await dialog.locator('[name="scientific"]').fill("Testus exemplaris");
    await page.getByRole("button", { name: "Lưu loài cây" }).click();
    await expect(page.locator("#page")).toContainText("Testus exemplaris");

    await page.getByRole("combobox", { name: "Nhóm ngành" }).selectOption("go-xe");
    await expect(page.getByRole("button", { name: "Thêm loài cây" })).toBeVisible();
    await expect(page.locator("#page")).not.toContainText("Testus exemplaris");
    await page.getByRole("combobox", { name: "Nhóm ngành" }).selectOption("van-ep");
    await expect(page.locator("#page")).toContainText("Testus exemplaris");
  });
});

test.describe("luật EUDR trên giao diện", () => {
  test("lô thiếu chứng từ: bổ sung xong mới Đạt", async ({ page }) => {
    await page.goto("/nha-may");
    const card = page.locator(".lot-issue-card", { hasText: "NL2610-03" });
    await card.getByRole("button", { name: "Bổ sung hồ sơ" }).click();
    const dialog = page.locator(".modal.show");
    await dialog.getByLabel("Chứng từ vận chuyển").check();
    await page.getByRole("button", { name: "Lưu và chấm lại" }).click();
    await expect(page.locator(".toast-ok")).toContainText("đã Đạt");
    await expect(page.locator(".lot-issue-card", { hasText: "NL2610-03" })).toHaveCount(0);
  });

  test("lô thiếu tọa độ: bổ sung giấy tờ vẫn bị chặn", async ({ page }) => {
    await page.goto("/nha-may");
    const card = page.locator(".lot-issue-card", { hasText: "NL2610-07" });
    await card.getByRole("button", { name: "Bổ sung hồ sơ" }).click();
    await page.getByRole("button", { name: "Lưu và chấm lại" }).click();
    await expect(page.locator(".toast-err")).toContainText("chưa đạt");
    await expect(page.locator(".lot-issue-card", { hasText: "NL2610-07" })).toHaveCount(1);
  });

  test("lệnh EU chỉ liệt kê lô Đạt", async ({ page }) => {
    await page.goto("/nha-may/lenh-san-xuat");
    await page.getByRole("button", { name: "Lệnh mới" }).click();
    const lots = page.locator("#wo-lots");
    await expect(lots).toContainText("NL2610-06");
    await expect(lots).not.toContainText("NL2610-03");
    await expect(lots).not.toContainText("NL2610-04");
    await expect(lots).not.toContainText("NL2610-07");
  });

  test("nhật ký kiểm toán báo toàn vẹn ngay khi mới nạp", async ({ page }) => {
    await page.goto("/nha-may");
    await page.getByRole("button", { name: "Kiểm tra toàn vẹn" }).click();
    const row = page.locator(".modal.show tr", { hasText: "Nhật ký" });
    await expect(row).toContainText("bản ghi");
    await expect(row.locator(".pill-pass")).toBeVisible();
  });
});

test.describe("trang giới thiệu", () => {
  test("đổi nhóm xem đúng quy trình, sang demo đúng nhóm", async ({ page }) => {
    await page.goto("/gioi-thieu");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("mọi sản phẩm gỗ");

    await page.getByRole("button", { name: "Ván dăm, MDF" }).click();
    await expect(page.locator(".pr-process")).toContainText("Nghiền, sấy, trộn keo");
    await expect(page.locator(".pr-process li.is-trace")).toHaveCount(3);
    await page.getByRole("button", { name: "Mỹ nghệ" }).click();
    await expect(page.locator(".pr-process")).toContainText("Ghép tre, mây, gốm, sắt");
    await expect(page.locator(".pr-hs")).toContainText("4421");

    await page.getByRole("link", { name: "Xem demo nhóm này" }).click();
    await expect(page).toHaveURL(/nhat-ky-san-xuat$/);
    await expect(page.locator(".stages")).toContainText("Ghép vật liệu khác");
  });

  test("không nhắc tên khách hàng khảo sát", async ({ page }) => {
    await page.goto("/gioi-thieu");
    await expect(page.locator("body")).not.toContainText(/long.?vi[eệ]t|tam phước/i);
  });

  test("hiển thị được trên điện thoại, không tràn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/gioi-thieu");
    await expect(page.locator(".pr-process")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("góp ý", () => {
  const fill = async (page: import("@playwright/test").Page, company: string) => {
    await page.getByRole("textbox", { name: "Công ty", exact: true }).fill(company);
    await page.getByRole("checkbox", { name: "Nội, ngoại thất" }).check();
    await page.getByRole("radio", { name: "Vừa" }).check();
    await page.getByRole("radio", { name: "Trên 30%" }).check();
    await page.getByRole("radio", { name: "Excel" }).check();
    await page.getByRole("radio", { name: "Thuê theo tháng" }).check();
    await page.getByRole("radio", { name: "Cân nhắc" }).check();
  };

  test("gửi, giữ khi tải lại, xóa được", async ({ page }) => {
    await page.goto("/gop-y");
    await fill(page, "Công ty Thử A");
    await page.getByRole("button", { name: "Gửi góp ý" }).click();
    await expect(page.locator(".fb-saved")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đã nhận 1 góp ý" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Công ty", exact: true })).toHaveValue("");

    await page.reload();
    await expect(page.locator(".fb-list")).toContainText("Công ty Thử A");
    await page.getByRole("button", { name: "Xóa góp ý Công ty Thử A" }).click();
    await expect(page.getByRole("heading", { name: "Đã nhận 0 góp ý" })).toBeVisible();
  });

  test("giới hạn chọn tối đa 3 chức năng", async ({ page }) => {
    await page.goto("/gop-y");
    await page.getByRole("checkbox", { name: "Kiểm tra GeoJSON" }).check();
    await page.getByRole("checkbox", { name: "Tem QR kiện" }).check();
    await page.getByRole("checkbox", { name: "Kho 3 khu" }).check();
    await expect(page.getByRole("checkbox", { name: "Nhật ký sản xuất" })).toBeDisabled();
  });

  test("tải CSV đúng tiếng Việt, chặn công thức Excel", async ({ page }) => {
    await page.goto("/gop-y");
    await fill(page, "=CMD()");
    await page.getByRole("button", { name: "Gửi góp ý" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Tải CSV" }).click()]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Công ty");
    expect(text).toContain("\"'=CMD()\"");
  });
});

test.describe("kho và danh mục", () => {
  test("danh mục HS và cảng tách riêng", async ({ page }) => {
    await page.goto("/nha-may/factory-danh-muc?tab=hs");
    await expect(page.locator("#page")).toContainText("4421");
    await expect(page.locator("#page")).not.toContainText("UN/LOCODE");
    await page.goto("/nha-may/factory-danh-muc?tab=ports");
    await expect(page.locator("#page")).toContainText("UN/LOCODE");
  });

  test("bản đồ không còn nút lọc khu vực", async ({ page }) => {
    await page.goto("/ban-do/map-tong-quan");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator("#page")).not.toContainText("Toàn cảnh vùng trồng");
  });

  test("tiếp nhận, kho, nhật ký nêu rõ cách phân loại", async ({ page }) => {
    await page.goto("/nha-may/tiep-nhan");
    await expect(page.locator(".classify")).toContainText("Không đạt: Khu C");
    await page.goto("/nha-may/kho-nguyen-lieu");
    await expect(page.locator(".zone")).toHaveCount(3);
    await expect(page.locator(".rule-strip")).toContainText("Ô theo nguồn");
    await page.goto("/nha-may/nhat-ky-san-xuat");
    await expect(page.locator(".wf li")).toHaveCount(6);
    await page.goto("/nha-may/pallet-manage");
    await expect(page.locator("#page")).toContainText("Kho TP ngoài EU");
  });
});
