/** Nội dung trình bày chung: lõi, nguồn nguyên liệu, kế thừa, phạm vi pháp lý. */

export const EUDR_CONDITIONS = [
  { title: "Không phá rừng", note: "Sau 31/12/2020", icon: "fa-tree" },
  { title: "Hợp pháp", note: "Theo luật nước khai thác", icon: "fa-scale-balanced" },
  { title: "Có DDS", note: "Kèm tọa độ từng lô đất", icon: "fa-file-circle-check" },
];

export const EUDR_DEADLINES = [
  { date: "30/12/2026", who: "Doanh nghiệp vừa và lớn" },
  { date: "30/06/2027", who: "Siêu nhỏ, nhỏ: tùy mã hàng, cần đối chiếu" },
];

export const CHAIN = [
  { name: "Lô đất", icon: "fa-map-location-dot" },
  { name: "Tiếp nhận", icon: "fa-truck-ramp-box" },
  { name: "Lô kho", icon: "fa-warehouse" },
  { name: "Lệnh sản xuất", icon: "fa-industry" },
  { name: "Lô thành phẩm", icon: "fa-boxes-stacked" },
  { name: "Đơn hàng, DDS", icon: "fa-file-circle-check" },
];

export const SOURCES = [
  { name: "Rừng trồng trong nước", docs: "Tọa độ lô, kỳ khai thác, quyền sử dụng đất, bảng kê lâm sản, bằng chứng không phá rừng sau 2020", risk: "Gom nhiều hộ, đất chồng lấn" },
  { name: "Nhập khẩu", docs: "Tên khoa học, tọa độ vùng khai thác gốc, hồ sơ pháp lý nước gốc, tờ khai hải quan, C/O", risk: "Chỉ có chứng từ nhà máy trung gian" },
  { name: "Tái chế, phụ phẩm", docs: "Chứng nhận tái chế, tỷ lệ nguyên sinh, nguồn phần nguyên sinh", risk: "Tuyên bố tái chế thiếu bằng chứng" },
];

export const PILLARS = [
  { title: "Mã kiện tại nguồn", note: "Tem QR: mã kiện, nhà cung cấp, lô khai thác, tọa độ" },
  { title: "Đối soát tại cổng", note: "Kiện thuộc lô nào, đối soát 1–1 hoặc N–1 trước khi nhập" },
  { title: "Dữ liệu địa lý số", note: "Ranh giới lô dạng GeoJSON, sẵn sàng cho khách EU" },
];

export const START_SMALL = "Doanh nghiệp nhỏ có thể bắt đầu bằng phiếu giấy in sẵn mã kiện và bảng tính nối kiện với lô, rồi nâng lên QR và phần mềm.";

export const LAYERS = [
  {
    title: "Lõi dùng chung",
    tag: "Mọi công ty",
    tone: "core",
    note: "Một mã nguồn. Sửa một lần, tất cả cùng có.",
    items: ["Nhà cung cấp, thửa đất, bản đồ", "Kiểm tra GeoJSON", "Chấm rủi ro từng lô", "Kho 3 khu A, B, C", "Phả hệ lô, truy xuất hai chiều", "Đơn hàng, gói dữ liệu DDS", "Nhật ký không sửa được, phân quyền"],
  },
  {
    title: "Gói ngành",
    tag: "Theo nhóm",
    tone: "pack",
    note: "Chỉ cấu hình, không viết lại.",
    items: ["Công đoạn sản xuất", "Đơn vị, quy cách", "Mã HS", "Loại nguyên liệu", "Định mức thu hồi", "Thông số kiểm soát"],
  },
  {
    title: "Riêng công ty",
    tag: "Dev theo yêu cầu",
    tone: "tenant",
    note: "Tách riêng, nâng cấp lõi không ảnh hưởng.",
    items: ["Thương hiệu, mẫu tem, biểu mẫu", "Máy móc, ô kho, danh mục", "Luồng duyệt", "Kết nối cân, ERP, kế toán", "Báo cáo riêng"],
  },
];

/** Đối chiếu nghiệp vụ; bảng tên model nằm ở docs/KIEN-TRUC.md. */
export const INHERITED = [
  { rubber: "Lô vườn, đợt kiểm kê", wood: "Thửa đất, đợt kiểm kê" },
  { rubber: "Chuyến mủ", wood: "Phiếu cân, tiếp nhận" },
  { rubber: "Hồ chứa, lô trong hồ", wood: "Ô kho, lô trong kho" },
  { rubber: "Lô thành phẩm", wood: "Lô thành phẩm" },
  { rubber: "Pallet", wood: "Kiện, pallet" },
  { rubber: "Đơn hàng, mã tra cứu", wood: "Đơn hàng, tra cứu QR" },
];

export const NOT_INHERITED = "Bỏ phần riêng của mủ: DRC, TSC, NH3, bồn mủ, phiên cạo.";

export const FEEDBACK_MODULES = [
  "Nhà cung cấp, thửa đất",
  "Kiểm tra GeoJSON",
  "Trạm cân, tiếp nhận",
  "Tem QR kiện",
  "Kho 3 khu",
  "Nhật ký sản xuất",
  "Gói dữ liệu DDS",
  "Truy xuất QR cho khách",
  "Kết nối ERP, kế toán",
  "Dùng trên điện thoại",
];

export const HERO_STATS = [
  { value: "5", label: "nhóm ngành gỗ" },
  { value: "6", label: "mắt xích truy xuất" },
  { value: "3", label: "nguồn nguyên liệu" },
  { value: "5 năm", label: "lưu hồ sơ" },
];

export const ROLES = [
  { who: "Nhà nhập khẩu EU", duty: "Nộp DDS, chịu trách nhiệm thẩm định", icon: "fa-building-flag" },
  { who: "Doanh nghiệp gỗ Việt Nam", duty: "Thu thập, kiểm soát, chuyển đủ dữ liệu cho khách", icon: "fa-industry" },
  { who: "Nhà cung cấp, hộ trồng", duty: "Ký cam kết, cung cấp tọa độ và giấy tờ đất", icon: "fa-people-group" },
];

export const ARTICLE9 = [
  "Tên thương mại, tên khoa học từng loài",
  "Khối lượng tịnh (kg), thể tích (m³)",
  "Quốc gia và vùng khai thác",
  "Tọa độ mọi lô đất, ngày khai thác",
  "Nhà cung cấp: tên, địa chỉ, email",
  "Người mua: tên, địa chỉ, email",
  "Bằng chứng không phá rừng",
  "Bằng chứng hợp pháp, quyền sử dụng đất",
];

export const GEO_RULES = [
  { title: "WGS84", note: "Thứ tự [kinh độ, vĩ độ]" },
  { title: "6 số thập phân", note: "Tối thiểu cho mọi tọa độ" },
  { title: "≤ 4 ha: Điểm", note: "> 4 ha: Polygon khép kín" },
  { title: "≤ 25 MB", note: "Mỗi tệp GeoJSON cho một DDS" },
];

export const COUNTRY_RISK = [
  { level: "Thấp", where: "Việt Nam, Trung Quốc", check: "~1%", tone: "low" },
  { level: "Tiêu chuẩn", where: "Nước không thuộc 2 danh sách", check: "~3%", tone: "mid" },
  { level: "Cao", where: "Nga, Belarus, Myanmar, Triều Tiên", check: "~9%", tone: "high" },
];

export const PENALTIES = [
  { value: "≥ 4%", note: "Doanh thu năm tại EU" },
  { value: "Tịch thu", note: "Hàng và doanh thu" },
  { value: "12 tháng", note: "Có thể bị cấm vào EU" },
  { value: "Công khai", note: "Danh tính vi phạm" },
];

export const SOFTWARE_FLOW = [
  { title: "Thu thập", note: "Nhà cung cấp, thửa đất, GeoJSON", icon: "fa-file-import" },
  { title: "Kiểm tra", note: "Hình học, bản đồ rừng 2020", icon: "fa-magnifying-glass-location" },
  { title: "Chấm rủi ro", note: "Đạt, Cần bổ sung, Không đạt", icon: "fa-scale-balanced" },
  { title: "Tách kho", note: "Khu A, B, C; ô theo nguồn", icon: "fa-warehouse" },
  { title: "Sản xuất", note: "Chỉ lô Đạt vào lệnh EU", icon: "fa-industry" },
  { title: "Gói DDS", note: "GeoJSON, hồ sơ, tra cứu QR", icon: "fa-file-circle-check" },
];

export const MODULES = [
  { name: "Nhà Máy", icon: "fa-industry", items: ["Lệnh mua, nhà cung cấp", "Trạm cân, tiếp nhận", "Kho nguyên liệu 3 khu", "Lệnh và nhật ký sản xuất", "Kho thành phẩm, đơn hàng DDS", "Truy xuất hai chiều"] },
  { name: "Bản Đồ", icon: "fa-map-location-dot", items: ["Bản đồ vệ tinh vùng trồng", "Thửa đất, nông hộ", "Đợt kiểm kê", "Kiểm tra, xuất GeoJSON"] },
  { name: "Quản Trị", icon: "fa-sliders", items: ["Loài cây, địa bàn", "Pháp lý đất, chứng chỉ", "Đối tác, khách EU", "Tài khoản, nhật ký kiểm toán"] },
];

export const ROADMAP = [
  { phase: "Ngày 1–30", title: "Dữ liệu nền", note: "Thu tọa độ, giấy tờ nhà cung cấp; chốt loài, mã HS; nhập 20 lô thật" },
  { phase: "Ngày 31–60", title: "Cấu hình", note: "Công đoạn, kho, tem QR theo nhà máy; đào tạo kho, sản xuất, kinh doanh" },
  { phase: "Ngày 61–90", title: "Chạy thử", note: "Chạy song song đơn thật; truy ngẫu nhiên đơn về polygon; nghiệm thu" },
];

export const LEGAL_NOTE = "Phạm vi mã HS và hạn áp dụng tham khảo nguồn thứ cấp, tháng 10/2026. Cần đối chiếu EUR-Lex và tư vấn pháp lý EU.";
