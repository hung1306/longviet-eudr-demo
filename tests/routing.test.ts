import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ROUTES, findRoute } from "@/lib/routes";
import { SUBSYSTEMS, getActiveSubsystem, type NavLink } from "@/lib/subsystems";

const allLinks = Object.values(SUBSYSTEMS).flatMap((subsystem) =>
  subsystem.nav.filter((item): item is NavLink => "url" in item),
);

const engineDir = join(process.cwd(), "src", "engine");
const engineSources = readdirSync(engineDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".js"))
  .map((file) => readFileSync(join(engineDir, file), "utf8"));
const engineCode = engineSources.join("\n");

describe("bảng định tuyến", () => {
  it("đủ 24 trang, không trùng đường dẫn", () => {
    expect(APP_ROUTES).toHaveLength(24);
    expect(new Set(APP_ROUTES.map((route) => route.path)).size).toBe(24);
  });

  it("mỗi trang trỏ tới hàm dựng có thật trong src/engine", () => {
    for (const route of APP_ROUTES) {
      expect(engineCode, route.page).toMatch(new RegExp(`export function ${route.page}\\(`));
    }
  });

  it("khóa menu khớp với khóa trang truyền cho startPage", () => {
    for (const route of APP_ROUTES) {
      const source = engineCode.slice(engineCode.indexOf(`export function ${route.page}(`));
      const key = source.match(/startPage\('([^']+)'/)?.[1];
      expect(key, route.page).toBe(route.navKey);
    }
  });

  it("findRoute bỏ qua dấu / ở hai đầu, không khớp đường dẫn lạ", () => {
    expect(findRoute("/nha-may/lenh-mua/")?.page).toBe("page_purchase_orders");
    expect(findRoute("nha-may")?.page).toBe("page_factory_dashboard");
    expect(findRoute("/nha-may/khong-co")).toBeUndefined();
    expect(findRoute("/")).toBeUndefined();
  });
});

describe("danh mục HS", () => {
  it("đủ các dòng gỗ, không trùng mã", async () => {
    const { HS_CATALOG } = await import("@/config/hsCatalog");
    expect(new Set(HS_CATALOG.map((h) => h.code)).size).toBe(HS_CATALOG.length);
    for (const code of ["4403", "4412", "4421", "9403"]) expect(HS_CATALOG.map((h) => h.code)).toContain(code);
  });
});

describe("menu phân hệ", () => {
  it("mọi liên kết menu và trang mặc định đều tới trang có thật", () => {
    const urls = [...allLinks.map((link) => link.url), ...Object.values(SUBSYSTEMS).map((s) => s.defaultUrl)];
    for (const url of urls) {
      expect(findRoute(url.split("?")[0] ?? ""), url).toBeDefined();
    }
  });

  it("mỗi trang đều có mục menu", () => {
    const keys = new Set(allLinks.map((link) => link.key));
    for (const route of APP_ROUTES) expect(keys, route.path).toContain(route.navKey);
  });

  it("xác định phân hệ theo khóa trang", () => {
    expect(getActiveSubsystem("map-kiem-ke")).toBe("map");
    expect(getActiveSubsystem("admin-lich-su")).toBe("admin");
    expect(getActiveSubsystem("lenh-mua")).toBe("factory");
    expect(getActiveSubsystem(null)).toBe("factory");
  });
});

describe("mã giao diện dạng chuỗi HTML", () => {
  it("không còn liên kết tới tệp .html cũ", () => {
    expect(engineCode).not.toMatch(/href="[^"]*\.html/);
    expect(engineCode).not.toMatch(/\.\.\/(?:nha-may|ban-do|quan-tri)\/[a-z-]+\.html/);
    expect(engineCode).not.toMatch(/\.\.\/portal/);
  });

  it("mọi hàm gọi từ onclick/onchange đều được khai báo", () => {
    const declared = new Set([
      ...[...engineCode.matchAll(/^export (?:async )?(?:function|const|let) +([\w$]+)/gm)].map((m) => m[1]),
      ...[...engineCode.matchAll(/window\.([\w$]+) *=/g)].map((m) => m[1]),
      // Hàm có sẵn của trình duyệt được gọi trực tiếp trong chuỗi HTML.
      "print",
      "alert",
      "confirm",
      "if",
    ]);
    const handlers = [...engineCode.matchAll(/\bon(?:click|change|input|submit|keyup)="\s*(?:window\.)?([A-Za-z_$][\w$]*)\s*\(/g)];
    expect(handlers.length).toBeGreaterThan(50);
    const missing = [...new Set(handlers.map((m) => m[1]))].filter((name) => !declared.has(name));
    expect(missing).toEqual([]);
  });
});
