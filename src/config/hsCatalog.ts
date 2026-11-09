/** Danh mục hàng gỗ thuộc EUDR theo Phụ lục I. Tham khảo nguồn thứ cấp 10/2026, cần đối chiếu EUR-Lex. */
export interface HsItem {
  code: string;
  desc: string;
  category: string;
  unit: string;
  /** Nhóm ngành thường dùng, 0 là ngoài 5 nhóm. */
  group: number;
  note?: string;
}

const USED = "Trừ hàng đã qua sử dụng";
const PACKING = "Trừ bao bì chỉ để chứa hàng khác";

export const HS_CATALOG: readonly HsItem[] = [
  { code: "4401", desc: "Củi, dăm, mùn cưa, viên nén", category: "Gỗ sơ chế", unit: "tấn", group: 1, note: "Trừ phế thải" },
  { code: "4402", desc: "Than gỗ", category: "Gỗ sơ chế", unit: "tấn", group: 1 },
  { code: "4403", desc: "Gỗ tròn", category: "Gỗ sơ chế", unit: "m³", group: 1, note: USED },
  { code: "4404", desc: "Gỗ đai, cọc, thanh chẻ", category: "Gỗ sơ chế", unit: "m³", group: 1, note: USED },
  { code: "4405", desc: "Sợi gỗ, bột gỗ", category: "Gỗ sơ chế", unit: "tấn", group: 1 },
  { code: "4406", desc: "Tà vẹt gỗ", category: "Gỗ sơ chế", unit: "m³", group: 1, note: USED },
  { code: "4407", desc: "Gỗ xẻ", category: "Gỗ sơ chế", unit: "m³", group: 1, note: USED },
  { code: "4408", desc: "Ván bóc, ván lạng", category: "Ván", unit: "m³", group: 2 },
  { code: "4409", desc: "Gỗ thanh, gỗ định hình", category: "Gỗ sơ chế", unit: "m³", group: 1, note: USED },
  { code: "4410", desc: "Ván dăm", category: "Ván", unit: "m³", group: 3, note: USED },
  { code: "4411", desc: "Ván sợi, MDF", category: "Ván", unit: "m³", group: 3, note: USED },
  { code: "4412", desc: "Ván ép, ván ghép", category: "Ván", unit: "m³", group: 2, note: USED },
  { code: "4413", desc: "Gỗ đã làm tăng độ rắn", category: "Ván", unit: "m³", group: 3, note: USED },
  { code: "4414", desc: "Khung tranh, khung gương gỗ", category: "Đồ gỗ", unit: "chiếc", group: 5, note: USED },
  { code: "4415", desc: "Thùng, pallet, tang cuốn", category: "Bao bì gỗ", unit: "chiếc", group: 0, note: PACKING },
  { code: "4416", desc: "Thùng tô nô, đồ thợ đóng thùng", category: "Bao bì gỗ", unit: "chiếc", group: 0, note: PACKING },
  { code: "4417", desc: "Dụng cụ, cán dụng cụ bằng gỗ", category: "Đồ gỗ", unit: "chiếc", group: 5, note: USED },
  { code: "4418", desc: "Cửa, cửa sổ, sàn, đồ mộc xây dựng", category: "Đồ gỗ", unit: "m²", group: 4, note: USED },
  { code: "4419", desc: "Đồ gia dụng, nhà bếp bằng gỗ", category: "Đồ gỗ", unit: "chiếc", group: 5, note: USED },
  { code: "4420", desc: "Đồ trang trí, hộp gỗ, khảm", category: "Đồ gỗ", unit: "chiếc", group: 5, note: USED },
  { code: "4421", desc: "Sản phẩm gỗ khác", category: "Đồ gỗ", unit: "chiếc", group: 5, note: USED },
  { code: "9401", desc: "Ghế khung gỗ (trừ ghế ô tô, máy bay)", category: "Nội thất", unit: "chiếc", group: 4, note: USED },
  { code: "9403", desc: "Nội thất gỗ: văn phòng, bếp, phòng ngủ, khác", category: "Nội thất", unit: "chiếc", group: 4, note: USED },
  { code: "9406", desc: "Nhà lắp ghép bằng gỗ", category: "Nội thất", unit: "căn", group: 4, note: USED },
  { code: "47", desc: "Bột giấy từ gỗ", category: "Giấy", unit: "tấn", group: 0, note: "Trừ phế liệu thu hồi" },
  { code: "48", desc: "Giấy, bìa", category: "Giấy", unit: "tấn", group: 0, note: "Trừ phế liệu, bao bì chứa hàng" },
];
