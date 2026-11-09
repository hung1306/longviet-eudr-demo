/** Cấu hình menu của 3 phân hệ: Nhà Máy, Bản Đồ, Quản Trị. */
export type SubsystemId = "factory" | "map" | "admin";

export interface NavHeader {
  header: string;
}

export interface NavLink {
  key: string;
  title: string;
  icon: string;
  url: string;
  /** Mục ứng với một tab (?tab=...) của trang. */
  tab?: string;
  /** Mục được chọn khi URL chưa có ?tab. */
  first?: boolean;
  badge?: string;
}

export type NavItem = NavHeader | NavLink;

export interface Subsystem {
  id: SubsystemId;
  name: string;
  fullName: string;
  icon: string;
  badge: string;
  defaultUrl: string;
  nav: readonly NavItem[];
}

export const SUBSYSTEMS: Record<SubsystemId, Subsystem> = {
  factory: {
    id: "factory",
    name: "Nhà Máy",
    fullName: "Phân Hệ Nhà Máy & Chế Biến Gỗ",
    icon: "fa-industry",
    badge: "Factory",
    defaultUrl: "/nha-may/lenh-mua",
    nav: [
      { header: "NGUYÊN LIỆU & SẢN XUẤT" },
      { key: "lenh-mua", title: "Lệnh mua nguyên liệu", icon: "fa-file-invoice", url: "/nha-may/lenh-mua" },
      { key: "hop-dong", title: "Nhà cung cấp", icon: "fa-handshake", url: "/nha-may/hop-dong-cung-ung" },
      { key: "tiep-nhan", title: "Tiếp nhận nguyên liệu", icon: "fa-truck-ramp-box", url: "/nha-may/tiep-nhan" },
      { key: "kho-nguyen-lieu", title: "Kho nguyên liệu", icon: "fa-warehouse", url: "/nha-may/kho-nguyen-lieu" },
      { key: "lenh-san-xuat", title: "Lệnh sản xuất", icon: "fa-clipboard-list", url: "/nha-may/lenh-san-xuat" },
      { key: "nhat-ky-san-xuat", title: "Nhật ký sản xuất", icon: "fa-industry", url: "/nha-may/nhat-ky-san-xuat" },
      { key: "pallet", title: "Kho thành phẩm", icon: "fa-boxes-stacked", url: "/nha-may/pallet-manage" },
      { header: "NHÂN SỰ" },
      { key: "cham-cong-nhan-su", tab: "attendance", first: true, title: "Chấm công", icon: "fa-calendar-check", url: "/nha-may/cham-cong-nhan-su?tab=attendance" },
      { key: "cham-cong-nhan-su", tab: "workers", title: "Nhân sự", icon: "fa-id-card-clip", url: "/nha-may/cham-cong-nhan-su?tab=workers" },
      { header: "XUẤT BÁN & TUÂN THỦ" },
      { key: "don-hang", title: "Đơn hàng điện tử & DDS", icon: "fa-file-circle-check", url: "/nha-may/don-hang-eudr" },
      { key: "truy-xuat", title: "Truy xuất đơn hàng", icon: "fa-route", url: "/nha-may/truy-xuat" },
      { header: "DANH MỤC" },
      { key: "factory-danh-muc", tab: "bays", first: true, title: "Ô kho", icon: "fa-warehouse", url: "/nha-may/factory-danh-muc?tab=bays" },
      { key: "factory-danh-muc", tab: "machines", title: "Máy móc", icon: "fa-gears", url: "/nha-may/factory-danh-muc?tab=machines" },
      { key: "factory-danh-muc", tab: "specs", title: "Quy cách sản phẩm", icon: "fa-layer-group", url: "/nha-may/factory-danh-muc?tab=specs" },
      { key: "factory-danh-muc", tab: "materials", title: "Vật tư", icon: "fa-boxes-packing", url: "/nha-may/factory-danh-muc?tab=materials" },
      { key: "factory-danh-muc", tab: "ports", title: "Cảng", icon: "fa-ship", url: "/nha-may/factory-danh-muc?tab=ports" },
      { key: "factory-danh-muc", tab: "hs", title: "Mã HS", icon: "fa-barcode", url: "/nha-may/factory-danh-muc?tab=hs" },
      { header: "THỐNG KÊ" },
      { key: "dashboard", title: "Thống kê", icon: "fa-chart-pie", url: "/nha-may" },
    ],
  },
  map: {
    id: "map",
    name: "Bản Đồ",
    fullName: "Phân Hệ Bản Đồ GIS Vùng Trồng",
    icon: "fa-map-location-dot",
    badge: "GIS Map",
    defaultUrl: "/ban-do/map-tong-quan",
    nav: [
      { header: "Bản đồ không gian" },
      { key: "map-tong-quan", title: "Bản đồ vùng trồng GIS", icon: "fa-earth-asia", url: "/ban-do/map-tong-quan" },
      { key: "map-thua-dat", title: "Vườn cây & Thửa đất", icon: "fa-draw-polygon", url: "/ban-do/map-thua-dat" },
      { key: "map-chu-rung", title: "Thương lái & Nông hộ", icon: "fa-people-roof", url: "/ban-do/map-chu-rung" },
      { key: "map-kiem-ke", title: "Đợt kiểm kê vùng trồng", icon: "fa-calendar-check", url: "/ban-do/map-kiem-ke" },
      { key: "map-export-traces", title: "Xuất dữ liệu bản đồ GeoJSON", icon: "fa-code-compare", url: "/ban-do/map-export-traces" },
    ],
  },
  admin: {
    id: "admin",
    name: "Quản Trị",
    fullName: "Phân Hệ Quản Trị & Master Data",
    icon: "fa-sliders",
    badge: "Admin",
    defaultUrl: "/quan-tri/admin-dashboard",
    nav: [
      { header: "Tổng quan hệ thống" },
      { key: "admin-dashboard", title: "Bàn làm việc quản trị", icon: "fa-gauge-high", url: "/quan-tri/admin-dashboard" },
      { header: "Danh mục lâm nghiệp" },
      { key: "admin-loai-cay", title: "Loài cây & Giống gỗ", icon: "fa-tree", url: "/quan-tri/admin-loai-cay" },
      { key: "admin-dia-ban", title: "Địa bàn hành chính", icon: "fa-location-dot", url: "/quan-tri/admin-dia-ban" },
      { key: "admin-phap-ly-dat", title: "Pháp lý đất & Chứng chỉ", icon: "fa-certificate", url: "/quan-tri/admin-phap-ly-dat" },
      { key: "admin-doi-tac", title: "Đối tác & Khách hàng EU", icon: "fa-users-gear", url: "/quan-tri/admin-doi-tac" },
      { header: "Bảo mật & Kiểm toán" },
      { key: "admin-tai-khoan", title: "Tài khoản & Phân quyền", icon: "fa-user-shield", url: "/quan-tri/admin-tai-khoan" },
      { key: "cham-cong-nhan-su", title: "Hồ sơ nhân sự & Chấm công", icon: "fa-user-check", url: "/nha-may/cham-cong-nhan-su" },
      { key: "admin-lich-su", title: "Nhật ký kiểm toán (Audit)", icon: "fa-clock-rotate-left", url: "/quan-tri/admin-lich-su" },
    ],
  },
};

export function getActiveSubsystem(activeKey: string | null | undefined): SubsystemId {
  if (!activeKey) return "factory";
  if (activeKey.startsWith("map-") || activeKey === "map") return "map";
  if (activeKey.startsWith("admin-") || activeKey === "admin") return "admin";
  return "factory";
}
