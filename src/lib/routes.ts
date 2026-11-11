/** Bảng định tuyến duy nhất: mỗi dòng là một trang của hệ thống. */
export type PageId =
  | "page_purchase_orders"
  | "page_suppliers"
  | "page_contracts"
  | "page_receipts"
  | "page_warehouse"
  | "page_workorders"
  | "page_stages"
  | "page_pallets"
  | "page_attendance"
  | "page_orders"
  | "page_trace"
  | "page_factory_danh_muc"
  | "page_factory_dashboard"
  | "page_map_tong_quan"
  | "page_map_thua_dat"
  | "page_map_chu_rung"
  | "page_map_kiem_ke"
  | "page_map_export_traces"
  | "page_admin_dashboard"
  | "page_admin_loai_cay"
  | "page_admin_dia_ban"
  | "page_admin_phap_ly_dat"
  | "page_admin_doi_tac"
  | "page_admin_tai_khoan"
  | "page_admin_lich_su";

export interface AppRoute {
  /** Đường dẫn không có dấu "/" đầu. */
  path: string;
  /** Hàm dựng nội dung trang trong src/engine. */
  page: PageId;
  /** Khóa mục menu đang chọn. */
  navKey: string;
  /** Tiêu đề thẻ trình duyệt. */
  title: string;
}

export const APP_ROUTES: readonly AppRoute[] = [
  { path: "nha-may", page: "page_factory_dashboard", navKey: "dashboard", title: "Thống kê" },
  { path: "nha-may/lenh-mua", page: "page_purchase_orders", navKey: "lenh-mua", title: "Lệnh mua nguyên liệu" },
  { path: "nha-may/hop-dong-cung-ung", page: "page_suppliers", navKey: "hop-dong", title: "Nguồn cung & Thương lái" },
  { path: "nha-may/hop-dong-mua", page: "page_contracts", navKey: "hop-dong-mua", title: "Hợp đồng mua & hồ sơ" },
  { path: "nha-may/tiep-nhan", page: "page_receipts", navKey: "tiep-nhan", title: "Tiếp nhận nguyên liệu" },
  { path: "nha-may/kho-nguyen-lieu", page: "page_warehouse", navKey: "kho-nguyen-lieu", title: "Kho nguyên liệu" },
  { path: "nha-may/lenh-san-xuat", page: "page_workorders", navKey: "lenh-san-xuat", title: "Lệnh sản xuất" },
  { path: "nha-may/nhat-ky-san-xuat", page: "page_stages", navKey: "nhat-ky-san-xuat", title: "Nhật ký sản xuất" },
  { path: "nha-may/pallet-manage", page: "page_pallets", navKey: "pallet", title: "Pallet thành phẩm" },
  { path: "nha-may/cham-cong-nhan-su", page: "page_attendance", navKey: "cham-cong-nhan-su", title: "Chấm công & Nhân sự" },
  { path: "nha-may/don-hang-eudr", page: "page_orders", navKey: "don-hang", title: "Đơn EU & DDS" },
  { path: "nha-may/truy-xuat", page: "page_trace", navKey: "truy-xuat", title: "Truy xuất" },
  { path: "nha-may/factory-danh-muc", page: "page_factory_danh_muc", navKey: "factory-danh-muc", title: "Danh mục Nhà máy & Dây chuyền" },
  { path: "ban-do/map-tong-quan", page: "page_map_tong_quan", navKey: "map-tong-quan", title: "Bản đồ tổng thể GIS" },
  { path: "ban-do/map-thua-dat", page: "page_map_thua_dat", navKey: "map-thua-dat", title: "Thửa đất rừng (PlaceMark)" },
  { path: "ban-do/map-chu-rung", page: "page_map_chu_rung", navKey: "map-chu-rung", title: "Xưởng bóc & Chủ rừng" },
  { path: "ban-do/map-kiem-ke", page: "page_map_kiem_ke", navKey: "map-kiem-ke", title: "Đợt kiểm kê & Thẩm tra rừng" },
  { path: "ban-do/map-export-traces", page: "page_map_export_traces", navKey: "map-export-traces", title: "Quét GeoJSON & TRACES-NT DDS" },
  { path: "quan-tri/admin-dashboard", page: "page_admin_dashboard", navKey: "admin-dashboard", title: "Bàn làm việc Quản trị" },
  { path: "quan-tri/admin-loai-cay", page: "page_admin_loai_cay", navKey: "admin-loai-cay", title: "Loài cây & Giống gỗ" },
  { path: "quan-tri/admin-dia-ban", page: "page_admin_dia_ban", navKey: "admin-dia-ban", title: "Địa bàn hành chính" },
  { path: "quan-tri/admin-phap-ly-dat", page: "page_admin_phap_ly_dat", navKey: "admin-phap-ly-dat", title: "Pháp lý đất & Chứng chỉ" },
  { path: "quan-tri/admin-doi-tac", page: "page_admin_doi_tac", navKey: "admin-doi-tac", title: "Đối tác & Khách hàng EU" },
  { path: "quan-tri/admin-tai-khoan", page: "page_admin_tai_khoan", navKey: "admin-tai-khoan", title: "Tài khoản & Phân quyền" },
  { path: "quan-tri/admin-lich-su", page: "page_admin_lich_su", navKey: "admin-lich-su", title: "Nhật ký kiểm toán (Audit)" },
];

export function findRoute(pathname: string): AppRoute | undefined {
  const path = pathname.replace(/^\/+|\/+$/g, "");
  return APP_ROUTES.find((route) => route.path === path);
}
