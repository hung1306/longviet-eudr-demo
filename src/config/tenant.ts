/**
 * Cấu hình riêng từng công ty. Triển khai công ty mới: thêm một dòng vào TENANTS,
 * đặt NEXT_PUBLIC_TENANT khi build. Không sửa lõi.
 */
import { DEFAULT_INDUSTRY, type IndustryId } from "./industries";

export interface TenantConfig {
  slug: string;
  name: string;
  code: string;
  site: string;
  /** Bản demo cho đổi nhóm ngành; bản công ty khóa một ngành. */
  industries: "all" | IndustryId[];
  defaultIndustry: IndustryId;
}

const TENANTS: Record<string, TenantConfig> = {
  demo: {
    slug: "demo",
    name: "Công ty Gỗ Mẫu",
    code: "GM",
    site: "Nhà máy mẫu, Đồng Nai",
    industries: "all",
    defaultIndustry: DEFAULT_INDUSTRY,
  },
};

export const TENANT: TenantConfig = TENANTS[process.env.NEXT_PUBLIC_TENANT ?? "demo"] ?? (TENANTS.demo as TenantConfig);
