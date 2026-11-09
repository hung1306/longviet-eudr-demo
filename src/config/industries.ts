/**
 * Gói ngành: mọi khác biệt giữa các nhóm ngành gỗ nằm ở đây, lõi EUDR không rẽ nhánh theo ngành.
 * Thêm nhóm mới = thêm một gói. Định mức thu hồi là giá trị mẫu, mỗi công ty tự chỉnh.
 */
export type IndustryId = "go-xe" | "van-ep" | "van-dam" | "noi-that" | "my-nghe";

export interface StageParam {
  key: string;
  label: string;
  min: number;
  max?: number;
  /** Dung sai so với giá trị `target` của quy cách, ví dụ độ dày ±0.3 mm. */
  tolerance?: number;
  sample: number;
}

export interface StageDef {
  name: string;
  machine: string;
  /** Đơn vị đầu ra; khác đơn vị bước trước thì không so số vào/ra. */
  outUnit: string;
  outLabel: string;
  control: string;
  params?: StageParam[];
  /** Bước phân loại cuối, chốt số thành phẩm. */
  qc?: boolean;
  /** Bước phát sinh phế liệu, phải khai cách xử lý. */
  scrap?: boolean;
  /** Bước dùng vật liệu vá, phải thuộc lô trong lệnh. */
  patchLot?: boolean;
  /** Hệ số số lượng đầu ra so với thành phẩm trong dữ liệu mẫu. */
  sampleFactor?: number;
}

export interface ProcessStep {
  name: string;
  record: string;
  /** Bước phải ghi mã lô và dữ liệu nguồn. */
  trace?: boolean;
}

export interface ProductSpec {
  id: string;
  name: string;
  dim: string;
  structure: string;
  /** Thể tích gỗ của một đơn vị thành phẩm. */
  unitM3: number;
  kgPerUnit: number;
  /** Giá trị chuẩn để so dung sai, nếu có. */
  target?: number;
}

export interface HsLine {
  code: string;
  desc: string;
  unit: string;
}

export interface IndustryPack {
  id: IndustryId;
  group: number;
  name: string;
  short: string;
  icon: string;
  unit: string;
  packUnit: string;
  packSize: number;
  inputs: string[];
  workshops: string[];
  process: ProcessStep[];
  controls: string[];
  risks: string[];
  hs: HsLine[];
  stages: StageDef[];
  recovery: [number, number];
  specs: ProductSpec[];
  materials: { name: string; group: string; unit: string }[];
}

const qc = (name: string, unit: string, control: string): StageDef => ({
  name,
  machine: "Bàn KCS",
  outUnit: unit,
  outLabel: "Đạt xuất EU",
  control,
  qc: true,
});

export const INDUSTRIES: readonly IndustryPack[] = [
  {
    id: "go-xe",
    group: 1,
    name: "Gỗ xẻ, dăm, viên nén",
    short: "Gỗ xẻ & sơ chế",
    icon: "fa-tree",
    unit: "m³",
    packUnit: "kiện",
    packSize: 5,
    inputs: ["Gỗ tròn", "Gỗ rừng trồng đường kính nhỏ", "Bìa, cành, ngọn"],
    workshops: ["Xưởng xẻ", "Xưởng băm dăm"],
    process: [
      { name: "Mua gỗ tại vườn", record: "Lô đất, chủ vườn", trace: true },
      { name: "Bãi gỗ", record: "Mã lô nhập", trace: true },
      { name: "Xẻ, băm", record: "Lô vào mỗi ca", trace: true },
      { name: "Sấy", record: "Mẻ sấy" },
      { name: "Phân loại, đóng kiện", record: "Mã kiện" },
      { name: "Bán hàng", record: "Số đơn, số DDS" },
    ],
    controls: ["Mỗi xe gỗ gắn lô đất", "Tách bãi theo lô, không dồn đống"],
    risks: ["Thương lái gom nhiều vườn", "Dăm, mùn trộn từ nhiều nguồn"],
    hs: [
      { code: "4403", desc: "Gỗ tròn", unit: "m³" },
      { code: "4407", desc: "Gỗ xẻ", unit: "m³" },
      { code: "4401", desc: "Dăm, mùn, viên nén", unit: "tấn" },
    ],
    stages: [
      { name: "Xẻ, băm", machine: "Máy xẻ CD", outUnit: "m³", outLabel: "Gỗ xẻ ra", control: "Chỉ nhận gỗ thuộc lô trong lệnh", scrap: true, params: [{ key: "scrapKg", label: "Phế liệu (kg)", min: 0, sample: 900 }], sampleFactor: 1.05 },
      { name: "Sấy", machine: "Lò sấy", outUnit: "m³", outLabel: "Gỗ sấy ra", control: "Mỗi mẻ sấy ghi rõ lệnh", params: [{ key: "moisture", label: "Độ ẩm (%)", min: 6, max: 18, sample: 12 }], sampleFactor: 1.02 },
      qc("Phân loại", "m³", "Tách hàng EU, gắn mã kiện"),
    ],
    recovery: [45, 65],
    specs: [
      { id: "XE-25", name: "Gỗ keo xẻ sấy 25 mm", dim: "25 x 100 x 1000 mm", structure: "Keo rừng trồng", unitM3: 1, kgPerUnit: 620 },
      { id: "XE-30", name: "Gỗ cao su xẻ sấy 30 mm", dim: "30 x 90 x 900 mm", structure: "Cao su", unitM3: 1, kgPerUnit: 640 },
    ],
    materials: [
      { name: "Dây đai kiện", group: "Đóng gói", unit: "cuộn" },
      { name: "Thanh kê sấy", group: "Sấy", unit: "thanh" },
    ],
  },
  {
    id: "van-ep",
    group: 2,
    name: "Ván bóc, ván ép",
    short: "Ván ép",
    icon: "fa-layer-group",
    unit: "tấm",
    packUnit: "pallet",
    packSize: 50,
    inputs: ["Ván bóc ruột", "Ván lạng mặt"],
    workshops: ["Xưởng ván ruột", "Xưởng ván mặt"],
    process: [
      { name: "Nhận ván bóc", record: "Mã kiện, lô đất", trace: true },
      { name: "Kho ván", record: "Ô kho theo lô", trace: true },
      { name: "May, xếp lớp", record: "Lô từng lớp", trace: true },
      { name: "Ép", record: "Lệnh sản xuất" },
      { name: "Chà nhám, KCS", record: "Mã lô thành phẩm" },
      { name: "Bán hàng", record: "Số đơn, số DDS" },
    ],
    controls: ["Một tấm mang lô đất của mọi lớp", "Miếng vá phải cùng lô trong lệnh"],
    risks: ["Kiện viết tay, không rõ lô", "Mảnh vá, phế liệu ngoài lệnh"],
    hs: [
      { code: "4408", desc: "Ván bóc, ván lạng", unit: "m³" },
      { code: "4412", desc: "Ván ép", unit: "m³" },
    ],
    stages: [
      { name: "May ghép", machine: "Máy may ván", outUnit: "lá", outLabel: "Lá ghép ra", control: "Quét mã kiện trước khi lên máy", sampleFactor: 5.5 },
      { name: "Lăn keo, xếp lớp", machine: "Máy lăn keo", outUnit: "tấm", outLabel: "Phôi ra", control: "Đúng số lớp, không chèn ván ngoài lệnh", params: [{ key: "glue", label: "Keo (g/m²)", min: 1, sample: 320 }], sampleFactor: 1.05 },
      { name: "Ép nguội, vá", machine: "Máy ép nguội", outUnit: "tấm", outLabel: "Phôi ra", control: "Miếng vá phải thuộc lô trong lệnh", patchLot: true, params: [{ key: "patches", label: "Số mắt vá", min: 0, sample: 142 }], sampleFactor: 1.05 },
      { name: "Ép nóng", machine: "Máy ép nóng", outUnit: "tấm", outLabel: "Tấm ra", control: "Mỗi mẻ ép chỉ một lệnh", params: [{ key: "temp", label: "Nhiệt độ (°C)", min: 110, max: 130, sample: 125 }], sampleFactor: 1.045 },
      { name: "Chà nhám", machine: "Máy chà nhám", outUnit: "tấm", outLabel: "Tấm ra", control: "Đo độ dày theo quy cách", params: [{ key: "thickness", label: "Độ dày (mm)", min: 0.1, tolerance: 0.3, sample: 18.1 }], sampleFactor: 1.03 },
      { name: "Cắt cạnh", machine: "Máy cắt biên", outUnit: "tấm", outLabel: "Tấm ra", control: "Phế liệu không quay lại lệnh EU", scrap: true, params: [{ key: "scrapKg", label: "Phế liệu (kg)", min: 0, sample: 410 }], sampleFactor: 1.02 },
      qc("KCS", "tấm", "Tách hàng EU, gắn tem QR"),
    ],
    recovery: [72, 78],
    specs: [
      { id: "VE-18", name: "Ván cốp pha phủ phim 18 mm", dim: "1220 x 2440 x 18 mm", structure: "Mặt dương, ruột cao su, bạch đàn", unitM3: 0.05358, kgPerUnit: 37.5, target: 18 },
      { id: "VE-12", name: "Ván bao bì 12 mm", dim: "1220 x 2440 x 12 mm", structure: "Mặt dương, ruột keo", unitM3: 0.03572, kgPerUnit: 24, target: 12 },
    ],
    materials: [
      { name: "Keo chịu nước", group: "Keo", unit: "kg" },
      { name: "Bột bả", group: "Hoàn thiện", unit: "kg" },
      { name: "Pallet hun trùng ISPM 15", group: "Đóng gói", unit: "cái" },
    ],
  },
  {
    id: "van-dam",
    group: 3,
    name: "Ván dăm, MDF, ván ghép",
    short: "Ván dăm, MDF",
    icon: "fa-border-all",
    unit: "tấm",
    packUnit: "kiện",
    packSize: 50,
    inputs: ["Dăm gỗ", "Mùn cưa", "Gỗ nhỏ", "Phụ phẩm tái chế"],
    workshops: ["Xưởng nghiền", "Xưởng ép"],
    process: [
      { name: "Nguồn dăm, mùn, gỗ nhỏ", record: "Lô, tỷ lệ tái chế", trace: true },
      { name: "Kho dăm", record: "Mã lô nhập", trace: true },
      { name: "Nghiền, sấy, trộn keo", record: "Lô dăm mỗi mẻ", trace: true },
      { name: "Ép tấm", record: "Lệnh sản xuất" },
      { name: "Cắt, chà nhám, phủ", record: "Mã lô thành phẩm" },
      { name: "Bán hàng", record: "Số đơn, số DDS" },
    ],
    controls: ["Ghi lô dăm thật đã dùng cho từng mẻ", "Tách phần nguyên sinh và phần tái chế có chứng nhận"],
    risks: ["Dây chuyền chạy liên tục, nhiều nguồn một mẻ", "Ván mua về không kèm dữ liệu nguồn"],
    hs: [
      { code: "4410", desc: "Ván dăm", unit: "m³" },
      { code: "4411", desc: "Ván sợi, MDF", unit: "m³" },
      { code: "4412", desc: "Ván ghép", unit: "m³" },
    ],
    stages: [
      { name: "Nghiền, sấy, trộn keo", machine: "Dây chuyền nghiền", outUnit: "tấn", outLabel: "Bột gỗ ra", control: "Mỗi mẻ ghi đúng lô dăm đã dùng", sampleFactor: 0.04 },
      { name: "Ép tấm", machine: "Máy ép liên tục", outUnit: "tấm", outLabel: "Tấm ra", control: "Đổi nguồn phải đổi mẻ, có mốc giờ", params: [{ key: "temp", label: "Nhiệt độ (°C)", min: 150, max: 240, sample: 200 }], sampleFactor: 1.03 },
      { name: "Cắt, chà nhám, phủ", machine: "Máy chà nhám", outUnit: "tấm", outLabel: "Tấm ra", control: "Phế liệu không quay lại mẻ EU", scrap: true, params: [{ key: "scrapKg", label: "Phế liệu (kg)", min: 0, sample: 300 }], sampleFactor: 1.015 },
      qc("KCS", "tấm", "Tách hàng EU, gắn mã lô"),
    ],
    recovery: [70, 90],
    specs: [
      { id: "MDF-17", name: "MDF 17 mm", dim: "1220 x 2440 x 17 mm", structure: "Sợi gỗ keo, cao su", unitM3: 0.0506, kgPerUnit: 37 },
      { id: "PB-18", name: "Ván dăm 18 mm", dim: "1220 x 2440 x 18 mm", structure: "Dăm gỗ, phụ phẩm", unitM3: 0.05358, kgPerUnit: 36 },
    ],
    materials: [
      { name: "Keo công nghiệp", group: "Keo", unit: "kg" },
      { name: "Giấy phủ melamine", group: "Phủ mặt", unit: "tờ" },
    ],
  },
  {
    id: "noi-that",
    group: 4,
    name: "Đồ gỗ nội thất, ngoại thất",
    short: "Nội, ngoại thất",
    icon: "fa-couch",
    unit: "chiếc",
    packUnit: "kiện",
    packSize: 20,
    inputs: ["Gỗ xẻ", "Ván ép", "Ván MDF", "Linh kiện gỗ"],
    workshops: ["Xưởng phôi", "Xưởng lắp ráp"],
    process: [
      { name: "Mua nguyên liệu", record: "Loài, nhà cung cấp", trace: true },
      { name: "Nhập kho", record: "Mã lô nguyên liệu", trace: true },
      { name: "Sơ chế, gia công chi tiết", record: "Bảng chi tiết gỗ", trace: true },
      { name: "Lắp ráp, hoàn thiện", record: "Lệnh sản xuất" },
      { name: "Đóng gói, pallet", record: "Mã lô đóng gói" },
      { name: "Đơn hàng EU", record: "Số đơn, số DDS" },
    ],
    controls: ["Bảng chi tiết gỗ cho từng mã hàng", "Gắn lô nguyên liệu vào lệnh sản xuất"],
    risks: ["Gia công ngoài, linh kiện gỗ mua sẵn", "Ngoại thất: gỗ cứng nhập qua đại lý, kho trung gian"],
    hs: [
      { code: "9403", desc: "Nội thất gỗ", unit: "chiếc" },
      { code: "9401", desc: "Ghế khung gỗ", unit: "chiếc" },
      { code: "4418", desc: "Cửa, sàn gỗ", unit: "m²" },
    ],
    stages: [
      { name: "Sơ chế phôi", machine: "Máy cắt phôi", outUnit: "bộ phôi", outLabel: "Bộ phôi ra", control: "Phôi mang mã lô nguyên liệu", scrap: true, params: [{ key: "scrapKg", label: "Phế liệu (kg)", min: 0, sample: 650 }], sampleFactor: 1.04 },
      { name: "Gia công chi tiết", machine: "Máy CNC", outUnit: "bộ phôi", outLabel: "Bộ chi tiết ra", control: "Gia công ngoài phải khai cơ sở và lô", sampleFactor: 1.03 },
      { name: "Lắp ráp, hoàn thiện", machine: "Chuyền lắp ráp", outUnit: "chiếc", outLabel: "Chiếc ra", control: "Linh kiện mua sẵn phải có lô nguồn", sampleFactor: 1.01 },
      qc("KCS, đóng gói", "chiếc", "Liệt kê mọi loài gỗ trong sản phẩm"),
    ],
    recovery: [40, 60],
    specs: [
      { id: "NT-BAN", name: "Bàn ăn gỗ cao su", dim: "1800 x 900 x 750 mm", structure: "Cao su, chân keo", unitM3: 0.09, kgPerUnit: 58 },
      { id: "NT-GHE", name: "Ghế ngoài trời gỗ keo", dim: "600 x 600 x 900 mm", structure: "Keo", unitM3: 0.02, kgPerUnit: 13 },
    ],
    materials: [
      { name: "Sơn gốc nước", group: "Hoàn thiện", unit: "kg" },
      { name: "Phụ kiện kim loại", group: "Lắp ráp", unit: "bộ" },
      { name: "Thùng carton", group: "Đóng gói", unit: "thùng" },
    ],
  },
  {
    id: "my-nghe",
    group: 5,
    name: "Thủ công mỹ nghệ gỗ",
    short: "Mỹ nghệ",
    icon: "fa-hand-sparkles",
    unit: "chiếc",
    packUnit: "thùng",
    packSize: 40,
    inputs: ["Gỗ vườn", "Gỗ thanh lý", "Gỗ tận dụng"],
    workshops: ["Cơ sở làng nghề", "Xưởng hoàn thiện"],
    process: [
      { name: "Nguồn gỗ", record: "Gỗ vườn, thanh lý", trace: true },
      { name: "Thu gom lô nhỏ", record: "Sổ nguồn gỗ", trace: true },
      { name: "Gia công tại cơ sở, làng nghề", record: "Người làm, ngày" },
      { name: "Ghép tre, mây, gốm, sắt", record: "Chỉ ghi phần gỗ" },
      { name: "Hoàn thiện, đóng gói", record: "Mã theo đơn" },
      { name: "Đơn hàng", record: "Một mã cho các lô nhỏ" },
    ],
    controls: ["Sổ nguồn gỗ: người bán, lô đất, ngày", "Gộp lô nhỏ theo đơn hàng, gắn một mã"],
    risks: ["Gỗ vườn, gỗ tận dụng không có tọa độ", "Giấy tờ viết tay, gia công phân tán"],
    hs: [
      { code: "4419", desc: "Đồ gia dụng bằng gỗ", unit: "chiếc" },
      { code: "4420", desc: "Đồ trang trí, hộp gỗ", unit: "chiếc" },
      { code: "4421", desc: "Sản phẩm gỗ khác", unit: "chiếc" },
    ],
    stages: [
      { name: "Gia công tại cơ sở", machine: "Cơ sở làng nghề", outUnit: "chiếc", outLabel: "Chiếc ra", control: "Ghi người làm, ngày, lô gỗ giao", sampleFactor: 1.05 },
      { name: "Ghép vật liệu khác", machine: "Tổ ghép", outUnit: "chiếc", outLabel: "Chiếc ra", control: "Chỉ phần gỗ phải truy xuất", sampleFactor: 1.02 },
      qc("Hoàn thiện, đóng gói", "chiếc", "Một mã theo đơn, gộp các lô nhỏ"),
    ],
    recovery: [30, 60],
    specs: [
      { id: "MN-KHAY", name: "Khay gỗ xoài", dim: "400 x 250 x 40 mm", structure: "Gỗ vườn", unitM3: 0.004, kgPerUnit: 1.2 },
      { id: "MN-HOP", name: "Hộp gỗ trang trí", dim: "200 x 150 x 100 mm", structure: "Keo, phần mây", unitM3: 0.002, kgPerUnit: 0.6 },
    ],
    materials: [
      { name: "Dầu hoàn thiện", group: "Hoàn thiện", unit: "lít" },
      { name: "Thùng carton", group: "Đóng gói", unit: "thùng" },
    ],
  },
];

export const DEFAULT_INDUSTRY: IndustryId = "van-ep";

export function findIndustry(id: string | null | undefined): IndustryPack | undefined {
  return INDUSTRIES.find((pack) => pack.id === id);
}

export function getIndustry(id: string | null | undefined): IndustryPack {
  const pack = findIndustry(id) ?? findIndustry(DEFAULT_INDUSTRY);
  if (!pack) throw new Error("Thiếu gói ngành mặc định");
  return pack;
}
