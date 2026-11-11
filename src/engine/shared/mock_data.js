/**
 * Dữ liệu mẫu chung cho mọi nhóm ngành. Phần theo ngành lấy từ gói ngành, không rẽ nhánh theo ngành.
 * Toàn bộ tên, mã số là giả lập. Số liệu chuỗi tính từ định mức nên các trang luôn khớp.
 */
import { HS_CATALOG } from '../../config/hsCatalog';
import { TENANT } from '../../config/tenant';

const HEVEA = 'Hevea brasiliensis';
const EUCALYPTUS = 'Eucalyptus camaldulensis';
const ACACIA = 'Acacia mangium';
const POPLAR = 'Populus adenopoda';

/** Thửa hình vuông đúng diện tích khai báo, đủ 6 chữ số thập phân. */
function squarePlot(id, supplierId, owner, place, species, areaHa, lng, lat, forest) {
    const side = Math.sqrt(areaHa * 10000);
    const dLat = +(side / 110574).toFixed(6);
    const dLng = +(side / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6);
    const ring = [[lng, lat], [+(lng + dLng).toFixed(6), lat], [+(lng + dLng).toFixed(6), +(lat + dLat).toFixed(6)], [lng, +(lat + dLat).toFixed(6)], [lng, lat]];
    return { id, supplierId, owner, country: 'VN', place, species, areaHa, geometry: { type: 'Polygon', coordinates: [ring] }, plantingYear: 2016, harvestFrom: '2026-10-10', harvestTo: '2026-10-25', landDoc: 'QĐ giao đất (mẫu)', forest, version: 1 };
}

export function buildSeed(pack) {
    const inputOf = i => pack.inputs[i % pack.inputs.length];
    const spec = pack.specs[0];

    const config = {
        countryRisk: { VN: 'LOW', CN: 'LOW', RU: 'HIGH', BY: 'HIGH', MM: 'HIGH', KP: 'HIGH' },
        countryBox: { VN: [102.1, 8.2, 109.6, 23.4], CN: [73.5, 18.0, 135.1, 53.6] },
        species: [
            { common: 'Cao su', scientific: HEVEA },
            { common: 'Bạch đàn', scientific: EUCALYPTUS },
            { common: 'Keo tai tượng', scientific: ACACIA },
            { common: 'Dương', scientific: POPLAR }
        ],
        riskSpecies: [],
        // Danh sách mẫu nước được nhập gỗ (vùng địa lý tích cực, NĐ 102/2020 sửa bởi NĐ 120/2024). Cần cập nhật theo văn bản gốc.
        allowedOrigins: ['CN', 'LA', 'KH', 'TH', 'MY', 'ID', 'NZ', 'AU', 'US', 'CA', 'CL', 'BR', 'UY', 'ZA', 'DE', 'FR', 'FI', 'SE'],
        hsCodes: pack.hs.map(h => h.code),
        recoveryMin: pack.recovery[0],
        recoveryMax: pack.recovery[1],
        areaTolerancePct: 20,
        maxGeoJsonMb: 25,
        retentionYears: 5,
        euCountries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
        certificates: ['FSC', 'PEFC', 'Không'],
        depts: [...pack.stages.map(s => `Tổ ${s.name}`), 'Trạm cân & Kho bãi', 'Tổ cơ điện & Bảo trì']
    };

    const suppliers = [
        { id: 'NCC-VN-001', kind: 'OWNER', name: 'Công ty Lâm nghiệp A (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000001', address: 'Định Quán, Đồng Nai', email: 'lamnghiepa@example.com', contact: 'Nguyễn Văn A, 0900 000 001', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-2026/01', contractExpiry: '2027-06-30', site: 'Xưởng sơ chế A: 107.351220, 11.241870' },
        { id: 'NCC-VN-002', kind: 'TRADER', name: 'Hợp tác xã Lâm sản B (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000002', address: 'Bù Đăng, Đồng Nai', email: 'htxb@example.com', contact: 'Trần Văn B, 0900 000 002', chain: 'AGENT', commitment: true, contractNo: 'HĐ-2026/02', contractExpiry: '2026-11-30', site: 'Xưởng HTX B: 107.190415, 11.760238' },
        { id: 'NCC-VN-003', kind: 'MILL', name: 'Xưởng gỗ C (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000003', address: 'Đức Trọng, Lâm Đồng', email: 'xuongc@example.com', contact: 'Lê Văn C, 0900 000 003', chain: 'MULTI', commitment: false, contractNo: '', contractExpiry: '', site: '' },
        { id: 'NCC-VN-004', kind: 'OWNER', name: 'Hộ trồng rừng D (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000004', address: 'Định Quán, Đồng Nai', email: 'hod@example.com', contact: 'Phạm Văn D, 0900 000 004', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-2026/04', contractExpiry: '2027-04-30', site: '' },
        { id: 'NCC-VN-005', kind: 'TRADER', name: 'Đại lý gỗ E (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000005', address: 'Tân Châu, Tây Ninh', email: 'dailye@example.com', contact: 'Đỗ Văn E, 0900 000 005', chain: 'AGENT', commitment: false, contractNo: '', contractExpiry: '', site: '' },
        { id: 'NCC-CN-001', kind: 'IMPORTER', name: 'Foreign Timber F Co. (mẫu)', type: 'IMPORT', country: 'CN', taxCode: 'CN0000000006', address: 'Guangxi, China', email: 'export@timberf.example', contact: 'Export Dept, +86 000 000 006', chain: 'DIRECT', commitment: true, contractNo: 'CTR-2026/07', contractExpiry: '2027-03-31', site: 'Nhà máy F: 108.320145, 22.816372' },
        { id: 'NCC-CN-002', kind: 'IMPORTER', name: 'Trading G Co. (mẫu)', type: 'IMPORT', country: 'CN', taxCode: 'CN0000000007', address: 'Shandong, China', email: 'sales@tradingg.example', contact: 'Sales Dept, +86 000 000 007', chain: 'MULTI', commitment: false, contractNo: '', contractExpiry: '', site: '' },
        { id: 'NCC-VN-006', kind: 'OWNER', name: 'Công ty Lâm sản H (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000008', address: 'Pleiku, Gia Lai', email: 'lamsanh@example.com', contact: 'Vũ Văn H, 0900 000 008', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-2026/08', contractExpiry: '2027-09-30', site: 'Xưởng H: 108.002100, 13.983200' },
        { id: 'NCC-VN-007', kind: 'OWNER', name: 'Lâm trường I (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000009', address: 'Đông Hà, Quảng Trị', email: 'lamtruongi@example.com', contact: 'Hoàng Văn I, 0900 000 009', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-2026/09', contractExpiry: '2027-12-31', site: '' },
        { id: 'NCC-VN-008', kind: 'OWNER', name: 'Hộ trồng rừng K (mẫu)', type: 'DOMESTIC', country: 'VN', taxCode: '0000000010', address: 'Vĩnh Cửu, Đồng Nai', email: 'hok@example.com', contact: 'Bùi Văn K, 0900 000 010', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-2026/10', contractExpiry: '2027-02-28', site: '' }
    ];

    const clear = date => ({ result: 'CLEAR', source: 'JRC GFC2020 + ảnh vệ tinh', date, by: 'Chuyên viên GIS' });
    const plots = [
        { id: 'PLOT-VN-DN-01', supplierId: 'NCC-VN-001', owner: 'Hộ mẫu 01', country: 'VN', place: 'Định Quán, Đồng Nai', species: HEVEA, areaHa: 3.8, geometry: { type: 'Polygon', coordinates: [[[107.347512, 11.238814], [107.348421, 11.239105], [107.349145, 11.238912], [107.349603, 11.238401], [107.349312, 11.237815], [107.348604, 11.237410], [107.347915, 11.237305], [107.347318, 11.237612], [107.347105, 11.238210], [107.347512, 11.238814]]] }, plantingYear: 2014, harvestFrom: '2026-10-05', harvestTo: '2026-10-15', landDoc: 'GCNQSDĐ (mẫu 01)', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-DN-02', supplierId: 'NCC-VN-001', owner: 'Hộ mẫu 02', country: 'VN', place: 'Định Quán, Đồng Nai', species: HEVEA, areaHa: 13.7, geometry: { type: 'Polygon', coordinates: [[[107.361820, 11.245510], [107.363150, 11.245820], [107.364420, 11.245610], [107.365110, 11.244920], [107.365340, 11.243810], [107.364950, 11.242910], [107.363820, 11.242450], [107.362610, 11.242310], [107.361720, 11.242850], [107.361250, 11.243710], [107.361340, 11.244820], [107.361820, 11.245510]]] }, plantingYear: 2012, harvestFrom: '2026-10-08', harvestTo: '2026-10-18', landDoc: 'GCNQSDĐ (mẫu 02)', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-DN-03', supplierId: 'NCC-VN-004', owner: 'Hộ trồng rừng D (mẫu)', country: 'VN', place: 'Định Quán, Đồng Nai', species: HEVEA, areaHa: 4.2, geometry: { type: 'Polygon', coordinates: [[[107.352100, 11.239200], [107.354100, 11.240500], [107.355200, 11.237800], [107.352100, 11.239200]]] }, plantingYear: 2015, harvestFrom: '2026-10-10', harvestTo: '2026-10-20', landDoc: 'GCNQSDĐ (mẫu 03)', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-TC-04', supplierId: 'NCC-VN-005', owner: 'Đại lý gỗ E (mẫu)', country: 'VN', place: 'Tân Châu, Tây Ninh', species: EUCALYPTUS, areaHa: 12.5, geometry: { type: 'Point', coordinates: [106.128450, 11.583210] }, plantingYear: 2017, harvestFrom: '2026-10-15', harvestTo: '2026-10-25', landDoc: '', forest: { result: 'NONE', source: 'Chưa có dữ liệu', date: '', by: '' }, version: 1 },
        { id: 'PLOT-VN-BP-03', supplierId: 'NCC-VN-002', owner: 'Lâm trường mẫu, khoảnh 4', country: 'VN', place: 'Bù Đăng, Đồng Nai', species: EUCALYPTUS, areaHa: 21.3, geometry: { type: 'Polygon', coordinates: [[[107.181820, 11.758920], [107.183210, 11.759240], [107.184650, 11.759110], [107.185620, 11.758410], [107.186100, 11.757350], [107.185910, 11.756210], [107.185210, 11.755310], [107.184020, 11.754820], [107.182810, 11.754750], [107.181920, 11.755210], [107.181310, 11.756150], [107.181150, 11.757280], [107.181350, 11.758250], [107.181820, 11.758920]]] }, plantingYear: 2016, harvestFrom: '2026-10-12', harvestTo: '2026-10-22', landDoc: 'QĐ giao đất (mẫu)', forest: clear('2026-10-24'), version: 1 },
        { id: 'PLOT-VN-BP-04', supplierId: 'NCC-VN-002', owner: 'Lâm trường mẫu, khoảnh 6', country: 'VN', place: 'Bù Đăng, Đồng Nai', species: ACACIA, areaHa: 21.4, geometry: { type: 'Polygon', coordinates: [[[107.194810, 11.764820], [107.196320, 11.765210], [107.197950, 11.764950], [107.199120, 11.764110], [107.199450, 11.762820], [107.199020, 11.761650], [107.197810, 11.760920], [107.196250, 11.760810], [107.195120, 11.761350], [107.194450, 11.762410], [107.194350, 11.763720], [107.194810, 11.764820]]] }, plantingYear: 2015, harvestFrom: '2026-10-18', harvestTo: '2026-10-28', landDoc: 'QĐ giao đất (mẫu)', forest: clear('2026-10-30'), version: 1 },
        { id: 'PLOT-CN-GX-01', supplierId: 'NCC-CN-001', owner: 'Forest Base F (mẫu)', country: 'CN', place: 'Guangxi, China', species: POPLAR, areaHa: 37.0, geometry: { type: 'Polygon', coordinates: [[[107.914210, 22.648950], [107.915820, 22.649420], [107.917450, 22.649610], [107.918920, 22.649210], [107.920150, 22.648350], [107.920820, 22.647210], [107.920750, 22.645950], [107.920110, 22.644820], [107.918950, 22.644110], [107.917520, 22.643850], [107.916050, 22.644020], [107.914820, 22.644750], [107.913950, 22.645810], [107.913650, 22.646950], [107.913720, 22.648050], [107.914210, 22.648950]]] }, plantingYear: 2015, harvestFrom: '2026-08-20', harvestTo: '2026-08-28', landDoc: 'Forest License (mẫu)', forest: clear('2026-10-02'), version: 1 },
        squarePlot('PLOT-VN-GL-01', 'NCC-VN-006', 'Lâm trường mẫu H1', 'Pleiku, Gia Lai', ACACIA, 18, 108.0021, 13.9832, clear('2026-10-22')),
        squarePlot('PLOT-VN-GL-02', 'NCC-VN-006', 'Lâm trường mẫu H2', 'Pleiku, Gia Lai', EUCALYPTUS, 24, 108.0321, 13.9532, clear('2026-10-22')),
        squarePlot('PLOT-VN-QT-01', 'NCC-VN-007', 'Lâm trường I, khoảnh 2', 'Đông Hà, Quảng Trị', ACACIA, 30, 107.0512, 16.8123, clear('2026-10-25')),
        squarePlot('PLOT-VN-QT-02', 'NCC-VN-007', 'Lâm trường I, khoảnh 5', 'Đông Hà, Quảng Trị', ACACIA, 15, 107.0812, 16.7823, clear('2026-10-25')),
        squarePlot('PLOT-VN-BD-07', 'NCC-VN-002', 'Hộ mẫu 11 (chưa đăng ký với thương lái)', 'Bù Đăng, Đồng Nai', EUCALYPTUS, 3, 107.2051, 11.7712, clear('2026-10-30')),
        { id: 'PLOT-VN-DN-05', supplierId: 'NCC-VN-008', owner: 'Hộ trồng rừng K (mẫu)', country: 'VN', place: 'Vĩnh Cửu, Đồng Nai', species: HEVEA, areaHa: 2.5, geometry: { type: 'Point', coordinates: [107.012345, 11.123456] }, plantingYear: 2013, harvestFrom: '2026-10-20', harvestTo: '2026-10-25', landDoc: 'GCNQSDĐ (mẫu 05)', forest: clear('2026-10-28'), version: 1 }
    ];

    // Hợp đồng mua: veneer 1270 × 640 × 2 mm, 1000 tấm mỗi kiện (1,6256 m³/kiện).
    const ALL_CLAUSES = ['coord', 'sci', 'harvest', 'defor', 'legal', 'nomix', 'origin3', 'audit', 'retain', 'reject', 'refund'];
    const DOC_KEYS = { DOMESTIC: ['biz', 'land', 'permit', 'labor', 'defor', 'cert'], IMPORT: ['biz', 'legal', 'permit', 'origin', 'defor', 'cert'] };
    const flags = (keys, skip = []) => Object.fromEntries(keys.filter(k => !skip.includes(k)).map(k => [k, true]));
    const contract = (id, no, supplierId, origin, species, bales, date, end, extra = {}) => {
        const docs = flags(DOC_KEYS[origin], extra.skipDocs);
        const scans = Object.fromEntries(Object.keys(docs).filter(k => !(extra.skipScans || []).includes(k)).map(k => [k, `${no.replace(/\W+/g, '_')}_${k}.pdf`]));
        return {
            id, no, supplierId, origin, species, sci: species, form: pack.inputs[0], date, end,
            len: 1270, wid: 640, thk: 2, per: 1000, bales, moist: origin === 'IMPORT' ? 15 : 16, kgm3: 650,
            clauses: flags(ALL_CLAUSES, extra.skipClauses), docs, scans, farmerIds: extra.farmerIds || [], note: extra.note || ''
        };
    };
    const contracts = [
        contract('HD-01', 'HĐ-2026/01', 'NCC-VN-001', 'DOMESTIC', HEVEA, 200, '2026-01-10', '2027-06-30'),
        contract('HD-02', 'HĐ-2026/02', 'NCC-VN-002', 'DOMESTIC', EUCALYPTUS, 150, '2026-01-15', '2026-11-30', { farmerIds: ['HL-03', 'HL-09'], note: 'Thương lái gom từ 2 khoảnh lâm trường' }),
        contract('HD-04', 'HĐ-2026/04', 'NCC-VN-004', 'DOMESTIC', HEVEA, 40, '2026-02-01', '2027-04-30'),
        contract('HD-05', 'HĐ-2026/05', 'NCC-VN-005', 'DOMESTIC', EUCALYPTUS, 100, '2026-09-01', '2027-09-01', { farmerIds: ['HL-05', 'HL-10'], skipClauses: ['defor', 'retain'], skipDocs: ['land'], note: 'Đại lý chưa ký cam kết không phá rừng' }),
        contract('HD-07', 'CTR-2026/07', 'NCC-CN-001', 'IMPORT', POPLAR, 60, '2026-03-01', '2027-03-31'),
        contract('HD-08', 'HĐ-2026/08', 'NCC-VN-006', 'DOMESTIC', ACACIA, 160, '2026-03-15', '2027-09-30'),
        contract('HD-09', 'HĐ-2026/09', 'NCC-VN-007', 'DOMESTIC', ACACIA, 100, '2026-04-01', '2027-12-31'),
        contract('HD-10', 'HĐ-2026/10', 'NCC-VN-008', 'DOMESTIC', HEVEA, 30, '2026-04-10', '2027-02-28'),
        contract('HD-11', 'CTR-2026/11', 'NCC-CN-002', 'IMPORT', POPLAR, 40, '2026-06-01', '2027-06-01', { skipClauses: ['retain'], skipScans: ['permit', 'origin'], note: 'Chờ bản scan giấy phép khai thác' })
    ];
    const CONTRACT_OF = Object.fromEntries(contracts.map(c => [c.supplierId, c.id]));

    const approved = at => ({ by: 'Trưởng ban Tuân thủ', at, reason: 'Đủ hồ sơ' });
    const importDocs = ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật'];
    const domesticDocs = ['Bảng kê lâm sản', 'Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'];

    const lot = (no, r) => ({ id: `NL2610-${no}`, trip: 1, workshop: pack.workshops[0], moisture: 14, grade: 'A', mitigations: [], dataSource: 'Trạm cân', kcs: { by: 'KCS', at: r.date }, done: !!r.approval, expectedKg: r.gross - r.tare, approval: null, contractId: CONTRACT_OF[r.supplierId] || '', ...r });
    const receipts = [
        lot('01', { plate: '60C-000.01', supplierId: 'NCC-VN-001', date: '2026-10-26', species: HEVEA, inputType: inputOf(0), sourceCategory: 'DOMESTIC', pkgCount: 20, m3: 100, gross: 24500, tare: 10250, bay: 'A-01', plotIds: ['PLOT-VN-DN-01', 'PLOT-VN-DN-02'], docs: domesticDocs, approval: approved('2026-10-26'), batchCode: 'KIEN-2610-01' }),
        lot('02', { plate: '60C-000.02', supplierId: 'NCC-VN-001', date: '2026-10-26', species: HEVEA, inputType: inputOf(0), sourceCategory: 'DOMESTIC', pkgCount: 17, m3: 85, gross: 20900, tare: 10150, bay: 'A-02', plotIds: ['PLOT-VN-DN-02'], docs: domesticDocs, approval: approved('2026-10-26'), batchCode: 'KIEN-2610-02' }),
        lot('03', { plate: '60C-000.03', supplierId: 'NCC-VN-004', date: '2026-10-27', species: HEVEA, inputType: inputOf(0), sourceCategory: 'DOMESTIC', pkgCount: 10, m3: 50, gross: 16900, tare: 8000, bay: 'B-01', plotIds: ['PLOT-VN-DN-03'], docs: ['Hợp đồng mua bán', 'Hóa đơn', 'Bảng kê lâm sản'], note: 'Chờ chứng từ vận chuyển', batchCode: 'KIEN-2610-03' }),
        lot('04', { plate: '93C-000.04', supplierId: 'NCC-VN-005', date: '2026-10-27', species: EUCALYPTUS, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 24, m3: 120, gross: 32000, tare: 14000, bay: 'C-01', plotIds: ['PLOT-VN-TC-04'], docs: ['Hóa đơn'], note: 'Thửa trên 4 ha chưa có polygon', batchCode: 'KIEN-2610-04' }),
        lot('05', { plate: '93C-000.05', supplierId: 'NCC-VN-002', date: '2026-10-27', species: ACACIA, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 10, m3: 50, gross: 18500, tare: 9000, bay: 'A-03', plotIds: ['PLOT-VN-BP-04'], docs: domesticDocs, approval: approved('2026-10-27'), batchCode: 'KIEN-2610-05' }),
        lot('06', { plate: '93C-000.06', supplierId: 'NCC-VN-002', date: '2026-10-28', species: EUCALYPTUS, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 29, m3: 116, gross: 38200, tare: 15600, bay: 'A-04', plotIds: ['PLOT-VN-BP-03'], docs: domesticDocs, approval: approved('2026-10-28'), batchCode: 'KIEN-2610-06' }),
        lot('07', { plate: 'Cont TGHU000007', supplierId: 'NCC-CN-002', date: '2026-10-28', species: POPLAR, inputType: inputOf(2), sourceCategory: 'IMPORT', pkgCount: 12, m3: 48, gross: 28500, tare: 20700, bay: 'C-02', plotIds: [], docs: ['Tờ khai hải quan'], note: 'Thiếu tọa độ vùng khai thác gốc', batchCode: 'CONT-2610-07' }),
        lot('08', { plate: '60C-000.08', supplierId: 'NCC-VN-001', date: '2026-10-29', species: ACACIA, inputType: 'Phụ phẩm tái chế', sourceCategory: 'RECYCLED', virginPct: 0, pkgCount: 8, m3: 24, gross: 15500, tare: 8200, bay: 'A-06', plotIds: [], docs: ['Chứng nhận tái chế', 'Tỷ lệ nguyên sinh', 'Nguồn phần nguyên sinh'], approval: approved('2026-10-29'), batchCode: 'KIEN-2610-08' }),
        lot('09', { plate: '81C-000.09', supplierId: 'NCC-VN-006', date: '2026-10-29', species: ACACIA, inputType: inputOf(0), sourceCategory: 'DOMESTIC', pkgCount: 30, m3: 120, gross: 41000, tare: 15000, bay: 'A-07', plotIds: ['PLOT-VN-GL-01'], docs: domesticDocs, approval: approved('2026-10-29'), batchCode: 'KIEN-2610-09' }),
        lot('10', { plate: '74C-000.10', supplierId: 'NCC-VN-007', date: '2026-10-30', species: ACACIA, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 25, m3: 100, gross: 36000, tare: 14500, bay: 'A-02', plotIds: ['PLOT-VN-QT-01', 'PLOT-VN-QT-02'], docs: domesticDocs, approval: approved('2026-10-30'), batchCode: 'KIEN-2610-10' }),
        lot('11', { plate: 'Cont TGHU000011', supplierId: 'NCC-CN-001', date: '2026-10-30', species: POPLAR, inputType: inputOf(2), sourceCategory: 'IMPORT', pkgCount: 15, m3: 60, gross: 34000, tare: 14000, bay: 'A-05', plotIds: ['PLOT-CN-GX-01'], docs: importDocs, approval: approved('2026-10-30'), batchCode: 'CONT-2610-11' }),
        lot('12', { plate: '60C-000.12', supplierId: 'NCC-VN-008', date: '2026-10-31', species: HEVEA, inputType: inputOf(0), sourceCategory: 'DOMESTIC', pkgCount: 10, m3: 30, gross: 19000, tare: 8500, bay: 'B-01', plotIds: ['PLOT-VN-DN-05'], docs: ['Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'], note: 'Chờ bảng kê lâm sản', batchCode: 'KIEN-2610-12' }),
        lot('13', { plate: '49C-000.13', supplierId: 'NCC-VN-003', date: '2026-11-01', species: ACACIA, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 14, m3: 56, gross: 26000, tare: 9000, bay: 'C-02', plotIds: [], docs: ['Hóa đơn'], note: 'Gom nhiều tầng, không có tọa độ', batchCode: 'KIEN-2611-13' }),
        lot('14', { plate: '81C-000.14', supplierId: 'NCC-VN-006', date: '2026-11-02', species: EUCALYPTUS, inputType: inputOf(1), sourceCategory: 'DOMESTIC', pkgCount: 20, m3: 80, gross: 32000, tare: 14000, bay: 'A-04', plotIds: ['PLOT-VN-GL-02'], docs: domesticDocs, approval: approved('2026-11-02'), batchCode: 'KIEN-2611-14' })
    ];

    let pkgNo = 0;
    const packages = [];
    receipts.forEach(r => {
        const pkgM3 = +(r.m3 / r.pkgCount).toFixed(4);
        for (let i = 0; i < r.pkgCount; i++) {
            pkgNo++;
            packages.push({ id: 'PKG-2026-' + String(pkgNo).padStart(4, '0'), receiptId: r.id, m3: pkgM3 });
        }
    });
    const pkgsOf = id => packages.filter(p => p.receiptId === id);
    const allocate = list => list.map(p => ({ packageId: p.id, m3: p.m3 }));

    // Thành phẩm mỗi lệnh lấy theo giữa dải thu hồi của ngành, nên số liệu luôn khớp.
    const rate = (pack.recovery[0] + pack.recovery[1]) / 2 / 100;
    const day = (base, i) => new Date(Date.UTC(2026, 9, base + i)).toISOString().slice(0, 10);
    const stageRecord = (s, i, qty, prevQty, base, patchLot) => {
        const extra = {};
        (s.params || []).forEach(p => { extra[p.key] = p.sample; });
        if (s.patchLot) extra.patchLot = patchLot;
        if (s.scrap) extra.scrapUse = 'Băm làm chân pallet, giữ mã lô gốc';
        // Phần chênh giữa số vào KCS và số đạt là hàng loại, để hạng A + B + C khớp số vào.
        if (s.qc) Object.assign(extra, { gradeA: qty, gradeB: 0, gradeC: Math.max(0, (prevQty || qty) - qty) });
        return { status: 'DONE', by: `Công nhân ${i + 1}`, confirmBy: 'Tổ trưởng', shift: 'Ca 1', start: `${day(base, i)}T07:30`, end: `${day(base, i)}T16:30`, machine: `MC-${String(i + 1).padStart(2, '0')}`, out: qty, at: day(base, i), note: '', revisions: [], ...extra };
    };
    const makeWO = ({ id, spec: sp, market, base, allocations, patchLot, doneStages = pack.stages.length }) => {
        const inputM3 = allocations.reduce((s, a) => s + a.m3, 0);
        const qty = Math.round(inputM3 * rate / sp.unitM3);
        const outs = pack.stages.map(s => Math.round(qty * (s.sampleFactor || 1)));
        const done = doneStages === pack.stages.length;
        return {
            id, product: sp.name, specId: sp.id, specText: sp.dim, unitM3: sp.unitM3, t: sp.target, market, targetQty: qty,
            created: day(base, 0), allocations, finishedQty: done ? qty : 0, qaNote: '', lot: done ? 'FG-' + id.slice(3) : '',
            stages: pack.stages.map((s, i) => i < doneStages ? stageRecord(s, i, outs[i], outs[i - 1], base, patchLot) : { status: 'TODO' })
        };
    };
    const spec2 = pack.specs[1] || spec;
    const workOrders = [
        makeWO({ id: 'WO-261029-01', spec, market: 'EU', base: 29, patchLot: 'NL2610-01', allocations: allocate([...pkgsOf('NL2610-01'), ...pkgsOf('NL2610-02').slice(0, 7), ...pkgsOf('NL2610-06').slice(0, 10)]) }),
        makeWO({ id: 'WO-261103-02', spec, market: 'EU', base: 34, patchLot: 'NL2610-05', allocations: allocate(pkgsOf('NL2610-05').slice(0, 8)), doneStages: 0 }),
        makeWO({ id: 'WO-261030-03', spec: spec2, market: 'EU', base: 30, patchLot: 'NL2610-09', allocations: allocate(pkgsOf('NL2610-09').slice(0, 20)) }),
        makeWO({ id: 'WO-261030-04', spec: spec2, market: 'OTHER', base: 30, patchLot: 'NL2610-04', allocations: allocate(pkgsOf('NL2610-04').slice(0, 12)) }),
        makeWO({ id: 'WO-261104-05', spec, market: 'EU', base: 35, patchLot: 'NL2610-10', allocations: allocate(pkgsOf('NL2610-10').slice(0, 12)), doneStages: Math.ceil(pack.stages.length / 2) })
    ];

    const pallets = [];
    let palletNo = 100;
    const packWO = (wo, location) => {
        const sp = pack.specs.find(s => s.id === wo.specId);
        const ids = [];
        // Quy đổi cỡ kiện để số kiện mẫu vừa đủ xem, không phụ thuộc đơn vị của ngành.
        const size = Math.max(pack.packSize, Math.ceil(wo.finishedQty / 24));
        let left = wo.finishedQty;
        while (left > 0) {
            const qty = Math.min(size, left);
            left -= qty;
            palletNo++;
            const id = 'PAL-2026-' + String(palletNo).padStart(4, '0');
            ids.push(id);
            pallets.push({ id, workOrderId: wo.id, qty, kg: Math.round(qty * sp.kgPerUnit), packing: `ISPM 15, ${TENANT.name}`, location, created: wo.stages[wo.stages.length - 1].at });
        }
        return ids;
    };
    const wo1Pallets = packWO(workOrders[0], 'TP-EU');
    const wo3Pallets = packWO(workOrders[2], 'TP-EU');
    const wo4Pallets = packWO(workOrders[3], 'TP-ND');
    const palletVolume = ids => +ids.reduce((s, id) => {
        const p = pallets.find(x => x.id === id);
        return s + p.qty * workOrders.find(w => w.id === p.workOrderId).unitM3;
    }, 0).toFixed(2);

    const customers = [
        { id: 'KH-DE-01', name: 'EU Importer A GmbH (mẫu)', address: 'Hamburg, Germany', email: 'import@importera.example', eori: 'DE000000001', country: 'DE' },
        { id: 'KH-NL-01', name: 'EU Importer B BV (mẫu)', address: 'Amsterdam, Netherlands', email: 'orders@importerb.example', eori: 'NL000000002', country: 'NL' },
        { id: 'KH-FR-01', name: 'EU Importer C SAS (mẫu)', address: 'Nantes, France', email: 'achat@importerc.example', eori: 'FR000000003', country: 'FR' },
        { id: 'KH-US-01', name: 'US Buyer D LLC (mẫu)', address: 'Long Beach, USA', email: 'buy@buyerd.example', eori: '', country: 'US' },
        { id: 'KH-VN-01', name: 'Khách nội địa E (mẫu)', address: 'Đồng Nai', email: 'khach@example.com', eori: '', country: 'VN' }
    ];

    const scaleTickets = [
        { id: 'SC-261104-01', plate: '60C-000.11', workshop: pack.workshops[0], trip: 1, supplierId: 'NCC-VN-001', phone: '0900 000 001', expectedKg: 9000, gross: 17150, tare: 8200, date: '2026-11-04', plotIds: ['PLOT-VN-DN-02'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(0), batchCode: 'KIEN-2611-11' },
        { id: 'SC-261104-02', plate: '93C-000.12', workshop: pack.workshops[0], trip: 2, supplierId: 'NCC-VN-002', phone: '0900 000 002', expectedKg: 12000, gross: 27400, tare: 15600, date: '2026-11-04', plotIds: ['PLOT-VN-BP-03'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(1), batchCode: 'KIEN-2611-12' },
        { id: 'SC-261104-03', plate: 'Cont TGHU000013', workshop: pack.workshops[1], trip: 1, supplierId: 'NCC-CN-001', phone: '+86 000 000 006', expectedKg: 8500, gross: 22500, tare: 14000, date: '2026-11-04', plotIds: ['PLOT-CN-GX-01'], receiptId: '', sourceCategory: 'IMPORT', rawType: inputOf(2), batchCode: 'CONT-2611-13' },
        { id: 'SC-261104-04', plate: '60C-000.14', workshop: pack.workshops[1], trip: 1, supplierId: 'NCC-VN-002', phone: '0900 000 002', expectedKg: 9000, gross: 17500, tare: 8500, date: '2026-11-04', plotIds: [], receiptId: '', sourceCategory: 'RECYCLED', rawType: 'Phụ phẩm tái chế', batchCode: 'KIEN-2611-14' },
        { id: 'SC-261105-05', plate: '81C-000.15', workshop: pack.workshops[0], trip: 1, supplierId: 'NCC-VN-006', phone: '0900 000 008', expectedKg: 15000, gross: 29800, tare: 14900, date: '2026-11-05', plotIds: ['PLOT-VN-GL-01'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(0), batchCode: 'KIEN-2611-15' },
        { id: 'SC-261105-06', plate: '74C-000.16', workshop: pack.workshops[0], trip: 1, supplierId: 'NCC-VN-007', phone: '0900 000 009', expectedKg: 13000, gross: 27200, tare: 14300, date: '2026-11-05', plotIds: ['PLOT-VN-QT-02'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(1), batchCode: 'KIEN-2611-16' },
        { id: 'SC-261105-07', plate: '61H-000.17', workshop: pack.workshops[0], trip: 3, supplierId: 'NCC-VN-002', phone: '0900 000 002', expectedKg: 7000, gross: 15400, tare: 8300, date: '2026-11-05', plotIds: ['PLOT-VN-BD-07'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(1), batchCode: 'KIEN-2611-17' },
        { id: 'SC-261105-08', plate: '70C-000.18', workshop: pack.workshops[1], trip: 1, supplierId: 'NCC-VN-005', phone: '0900 000 005', expectedKg: 10000, gross: 22100, tare: 11800, date: '2026-11-05', plotIds: ['PLOT-VN-TC-04'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(1), batchCode: 'KIEN-2611-18' },
        { id: 'SC-261106-09', plate: '60C-000.19', workshop: pack.workshops[0], trip: 1, supplierId: 'NCC-VN-008', phone: '0900 000 010', expectedKg: 6000, gross: 14300, tare: 8100, date: '2026-11-06', plotIds: ['PLOT-VN-DN-05'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(0), batchCode: 'KIEN-2611-19' },
        { id: 'SC-261106-10', plate: '60C-000.20', workshop: pack.workshops[0], trip: 2, supplierId: 'NCC-VN-004', phone: '0900 000 004', expectedKg: 6500, gross: 14900, tare: 8200, date: '2026-11-06', plotIds: ['PLOT-VN-DN-03'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: inputOf(0), batchCode: 'KIEN-2611-20', docs: ['Hợp đồng mua bán', 'Hóa đơn'] }
    ].map(t => ({
        contractId: CONTRACT_OF[t.supplierId] || '', pkgCount: 4, pkgM3: 1.6256,
        species: (plots.find(p => p.id === t.plotIds[0]) || {}).species || ACACIA,
        docs: t.sourceCategory === 'IMPORT' ? importDocs : t.sourceCategory === 'DOMESTIC' ? domesticDocs.filter(d => !(t.id === 'SC-261105-06' && d === 'Bảng kê lâm sản')) : [],
        purchase: t.id === 'SC-261104-01' ? { by: 'Trưởng phòng Thu mua', at: '2026-11-04' } : null,
        ...t
    }));

    const car = (no, product, list) => ({ id: `XE-${no}`, product, typeCar: 'Container 40HC', plate: `51D-000.0${no}`, seal: `SEAL0${no}`, cont: `TGHU00000${no}`, date: '2026-11-05', kg: list.reduce((s, id) => s + pallets.find(p => p.id === id).kg, 0), timeIn: '08:00', timeOut: '11:30', remark: '', palletIds: list });
    const makeOrder = (id, c, product, ids, status, extra = {}) => {
        const half = Math.ceil(ids.length / 2);
        return {
            id, customerId: c.id, customer: c.name, customerAddress: c.address, customerEmail: c.email, eori: c.eori, countryId: c.country,
            type: 'OUT', transportType: 'WATER', certificate: 'FSC', deliveryLocation: 'Cảng đích', pickUpLocation: TENANT.site, shipping: 'Vận tải mẫu', vesselName: 'MV Sample', billOfLading: `BL-${id}`, customsNo: '000000000001', numberOrder: `SO-${id}`, invoice: `INV-${id}`, paymentType: 'T/T', exportCategory: 'Xuất kinh doanh', invoiceDate: '2026-11-03', contractNo: `CTR-${id}`, contractDate: '2026-10-28', shippingDate: '2026-11-05', endDate: '', viewingPeriod: '2031-11-03', passCode: 'DEMO2026', hsCode: pack.hs[0].code, filer: 'CUSTOMER', remark: '',
            items: [{ id: 'SP-1', product, certificate: 'FSC', price: 420, currency: 'USD', quantity: palletVolume(ids), unit: 'm³', remark: '' }],
            cars: ids.length ? [car(1, product, ids.slice(0, half)), car(2, product, ids.slice(half))] : [],
            palletIds: ids, status, confirmedAt: status >= 1 ? '2026-11-03' : '', confirmedBy: status >= 1 ? 'Kinh doanh XK' : '', dds: null, created: '2026-11-02', viewLog: [], failLog: [], ...extra
        };
    };
    const orders = [
        makeOrder('DPO26102801', customers[0], spec.name, wo1Pallets, 4, { dds: { reference: 'DDS-MAU-000001', authority: 'Hệ thống thông tin EUDR' } }),
        makeOrder('DPO26110302', customers[1], spec2.name, wo3Pallets.slice(0, Math.ceil(wo3Pallets.length / 2)), 2, { dds: { reference: 'DDS-MAU-000002', authority: 'Hệ thống thông tin EUDR' } }),
        makeOrder('DPO26110403', customers[3], spec2.name, wo4Pallets.slice(0, Math.ceil(wo4Pallets.length / 2)), 1),
        makeOrder('DPO26110504', customers[2], spec2.name, [], 0)
    ];

    const speciesDetails = [
        { id: 'SP-HEVEA', common: 'Cao su', scientific: HEVEA, family: 'Euphorbiaceae', hsCode: pack.hs[0].code, role: 'Nguyên liệu chính', origin: 'Việt Nam', densityKgM3: 650, risk: 'LOW' },
        { id: 'SP-ACACIA', common: 'Keo tai tượng', scientific: ACACIA, family: 'Fabaceae', hsCode: pack.hs[0].code, role: 'Nguyên liệu chính', origin: 'Việt Nam', densityKgM3: 620, risk: 'LOW' },
        { id: 'SP-EUCALYPTUS', common: 'Bạch đàn', scientific: EUCALYPTUS, family: 'Myrtaceae', hsCode: pack.hs[0].code, role: 'Nguyên liệu chính', origin: 'Việt Nam', densityKgM3: 720, risk: 'LOW' },
        { id: 'SP-POPLAR', common: 'Dương', scientific: POPLAR, family: 'Salicaceae', hsCode: pack.hs[0].code, role: 'Nguyên liệu phụ', origin: 'Nhập khẩu', densityKgM3: 480, risk: 'LOW' }
    ];

    const provinces = [
        { id: 'VN-DN', name: 'Đồng Nai', code: '75', country: 'VN', forestAreaHa: 182400 },
        { id: 'VN-LD', name: 'Lâm Đồng', code: '68', country: 'VN', forestAreaHa: 538000 },
        { id: 'VN-TN', name: 'Tây Ninh', code: '72', country: 'VN', forestAreaHa: 70000 },
        { id: 'CN-GX', name: 'Quảng Tây', code: '45', country: 'CN', forestAreaHa: 14800000 }
    ];
    const districts = [
        { id: 'VN-DN-DQ', provinceId: 'VN-DN', name: 'Định Quán', code: '737' },
        { id: 'VN-DN-BD', provinceId: 'VN-DN', name: 'Bù Đăng', code: '693' },
        { id: 'VN-LD-DT', provinceId: 'VN-LD', name: 'Đức Trọng', code: '677' },
        { id: 'CN-GX-CZ', provinceId: 'CN-GX', name: 'Sùng Tả', code: 'CZ01' }
    ];
    const wards = [
        { id: 'W-DN-01', districtId: 'VN-DN-DQ', name: 'Xã mẫu 1', code: '00001' },
        { id: 'W-DN-02', districtId: 'VN-DN-BD', name: 'Xã mẫu 2', code: '00002' },
        { id: 'W-LD-03', districtId: 'VN-LD-DT', name: 'Xã mẫu 3', code: '00003' }
    ];

    const landTypes = [
        { id: 'LT-01', name: 'Đất rừng sản xuất', desc: 'Rừng trồng lấy gỗ', code: 'RSX' },
        { id: 'LT-02', name: 'Đất trồng cây lâu năm', desc: 'Vườn cây thanh lý lấy gỗ', code: 'CLN' },
        { id: 'LT-03', name: 'Đất lâm trường giao khoán', desc: 'Rừng giao khoán', code: 'LTGK' }
    ];
    const landCertTypes = [
        { id: 'LC-01', name: 'Giấy chứng nhận QSDĐ', authority: 'UBND cấp có thẩm quyền', requiredEudr: true },
        { id: 'LC-02', name: 'Quyết định giao đất, giao rừng', authority: 'UBND tỉnh', requiredEudr: true },
        { id: 'LC-03', name: 'Hợp đồng giao khoán', authority: 'Lâm trường', requiredEudr: true },
        { id: 'LC-04', name: 'Bảng kê lâm sản', authority: 'Kiểm lâm', requiredEudr: true },
        { id: 'LC-05', name: 'Giấy phép khai thác nước ngoài', authority: 'Cơ quan lâm nghiệp nước sở tại', requiredEudr: true }
    ];
    const certifications = [
        { id: 'CERT-FSC', name: 'FSC-CoC', code: 'FSC-MAU', issuer: 'Tổ chức chứng nhận', validUntil: '2028-12-31', scope: 'Chuỗi hành trình' },
        { id: 'CERT-VFCS', name: 'PEFC / VFCS', code: 'PEFC-MAU', issuer: 'Tổ chức chứng nhận', validUntil: '2027-08-15', scope: 'Gỗ rừng trồng' },
        { id: 'CERT-EUDR', name: 'Cam kết không phá rừng', code: 'EUDR-MAU', issuer: 'Nhà cung cấp ký', validUntil: '2030-12-31', scope: 'Mốc 31/12/2020' }
    ];

    const machines = pack.stages.map((s, i) => ({ id: `MC-${String(i + 1).padStart(2, '0')}`, name: s.machine, stage: s.name, capacity: '', operator: `Công nhân ${i + 1}`, status: 'ACTIVE', note: s.control }));
    // Khu theo kết quả EUDR, ô theo nguồn. Mỗi ô chỉ chứa một nguồn để không lẫn hồ sơ.
    const bay = (id, zone, source, status, allowed, maxM3 = 200) => ({ id, zone, source, name: `Ô ${id}`, maxM3, status, allowed });
    const OK = 'Cấp cho lệnh EU';
    const warehouseBays = [
        bay('A-01', 'ZONE_A', 'DOMESTIC', 'OPEN', OK), bay('A-02', 'ZONE_A', 'DOMESTIC', 'OPEN', OK), bay('A-03', 'ZONE_A', 'DOMESTIC', 'OPEN', OK),
        bay('A-04', 'ZONE_A', 'DOMESTIC', 'OPEN', OK), bay('A-07', 'ZONE_A', 'DOMESTIC', 'OPEN', OK),
        bay('A-05', 'ZONE_A', 'IMPORT', 'OPEN', OK), bay('A-06', 'ZONE_A', 'RECYCLED', 'OPEN', OK),
        bay('B-01', 'ZONE_B', 'ALL', 'LOCKED', 'Chưa đưa vào sản xuất'),
        bay('C-01', 'ZONE_C', 'ALL', 'QUARANTINE', 'Trả lại hoặc đơn ngoài EU'), bay('C-02', 'ZONE_C', 'ALL', 'QUARANTINE', 'Trả lại hoặc đơn ngoài EU'),
        bay('TP-EU', 'EXPORT', 'ALL', 'OPEN', 'Chỉ hàng lệnh EU', 400), bay('TP-ND', 'NON_EU', 'ALL', 'OPEN', 'Chỉ hàng ngoài EU', 400)
    ];
    const productSpecs = pack.specs.map(s => ({ ...s, grade: 'A' }));

    const surveyBatches = [
        { id: 'BAT-2026-01', name: 'Đợt 1/2026: Định Quán', date: '2026-10-01', inspector: 'Chuyên viên GIS', totalAreaHa: 21.7, plotsChecked: 3, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' },
        { id: 'BAT-2026-02', name: 'Đợt 2/2026: Bù Đăng', date: '2026-10-10', inspector: 'Trưởng ban Tuân thủ', totalAreaHa: 42.7, plotsChecked: 2, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' },
        { id: 'BAT-2026-03', name: 'Đợt 3/2026: Tân Châu', date: '2026-11-01', inspector: 'Chuyên viên GIS', totalAreaHa: 12.5, plotsChecked: 1, deforestationStatus: 'Chưa đối chiếu', riskAssessment: 'HIGH' },
        { id: 'BAT-2026-04', name: 'Đợt 4/2026: Gia Lai', date: '2026-10-20', inspector: 'Chuyên viên GIS', totalAreaHa: 42, plotsChecked: 2, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' },
        { id: 'BAT-2026-05', name: 'Đợt 5/2026: Quảng Trị', date: '2026-10-24', inspector: 'Chuyên viên GIS', totalAreaHa: 45, plotsChecked: 2, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' }
    ];
    const farmers = [
        { id: 'HL-01', name: 'Hộ mẫu 01', type: 'SMALLHOLDER', phone: '0900 000 101', cccd: '000000000101', address: 'Định Quán, Đồng Nai', areaHa: 3.8, species: HEVEA, landDoc: 'GCNQSDĐ (mẫu 01)', plots: ['PLOT-VN-DN-01'], eudrStatus: 'PASS' },
        { id: 'HL-02', name: 'Hộ mẫu 02', type: 'SMALLHOLDER', phone: '0900 000 102', cccd: '000000000102', address: 'Định Quán, Đồng Nai', areaHa: 13.7, species: HEVEA, landDoc: 'GCNQSDĐ (mẫu 02)', plots: ['PLOT-VN-DN-02'], eudrStatus: 'PASS' },
        { id: 'HL-03', name: 'Lâm trường mẫu, khoảnh 4', type: 'FORESTRY_COMPANY', phone: '0900 000 103', cccd: 'MST: 0000000103', address: 'Bù Đăng, Đồng Nai', areaHa: 21.3, species: EUCALYPTUS, landDoc: 'QĐ giao đất (mẫu)', plots: ['PLOT-VN-BP-03'], eudrStatus: 'PASS', traderId: 'NCC-VN-002' },
        { id: 'HL-09', name: 'Lâm trường mẫu, khoảnh 6', type: 'FORESTRY_COMPANY', phone: '0900 000 109', cccd: 'MST: 0000000109', address: 'Bù Đăng, Đồng Nai', areaHa: 21.4, species: ACACIA, landDoc: 'QĐ giao đất (mẫu)', plots: ['PLOT-VN-BP-04'], eudrStatus: 'PASS', traderId: 'NCC-VN-002' },
        { id: 'HL-04', name: 'Forest Base F (mẫu)', type: 'FOREIGN_BASE', phone: '+86 000 000 104', cccd: 'Tax: CN0000000104', address: 'Guangxi, China', areaHa: 37, species: POPLAR, landDoc: 'Forest License (mẫu)', plots: ['PLOT-CN-GX-01'], eudrStatus: 'PASS' },
        { id: 'HL-06', name: 'Lâm trường mẫu H1', type: 'FORESTRY_COMPANY', phone: '0900 000 106', cccd: 'MST: 0000000106', address: 'Pleiku, Gia Lai', areaHa: 18, species: ACACIA, landDoc: 'QĐ giao đất (mẫu)', plots: ['PLOT-VN-GL-01'], eudrStatus: 'PASS' },
        { id: 'HL-07', name: 'Lâm trường I', type: 'FORESTRY_COMPANY', phone: '0900 000 107', cccd: 'MST: 0000000107', address: 'Đông Hà, Quảng Trị', areaHa: 45, species: ACACIA, landDoc: 'QĐ giao đất (mẫu)', plots: ['PLOT-VN-QT-01', 'PLOT-VN-QT-02'], eudrStatus: 'PASS' },
        { id: 'HL-08', name: 'Hộ trồng rừng K (mẫu)', type: 'SMALLHOLDER', phone: '0900 000 108', cccd: '000000000108', address: 'Vĩnh Cửu, Đồng Nai', areaHa: 2.5, species: HEVEA, landDoc: 'GCNQSDĐ (mẫu 05)', plots: ['PLOT-VN-DN-05'], eudrStatus: 'PASS' },
        { id: 'HL-05', name: 'Hộ mẫu 05 (Tân Châu)', type: 'SMALLHOLDER', phone: '0900 000 105', cccd: '000000000105', address: 'Tân Châu, Tây Ninh', areaHa: 12.5, species: EUCALYPTUS, landDoc: 'Chưa có', plots: ['PLOT-VN-TC-04'], eudrStatus: 'FAIL', traderId: 'NCC-VN-005' },
        { id: 'HL-10', name: 'Hộ mẫu 10 (Tân Châu)', type: 'SMALLHOLDER', phone: '0900 000 110', cccd: '000000000110', address: 'Tân Châu, Tây Ninh', areaHa: 2.1, species: EUCALYPTUS, landDoc: 'Chưa có', plots: [], eudrStatus: 'FAIL', traderId: 'NCC-VN-005' }
    ];
    const account = (username, fullName, role, position) => ({ username, fullName, role, position, email: `${username}@congtymau.example`, lastLogin: '2026-11-04 14:30', status: 'ACTIVE' });
    const accounts = [
        account('admin', 'Quản trị viên', 'quantri', 'Quản trị hệ thống'),
        account('tuanthu', 'Trưởng ban Tuân thủ', 'tuanthu', 'Tuân thủ EUDR'),
        account('gis', 'Chuyên viên GIS', 'tuanthu', 'GIS & bản đồ'),
        account('quandoc', 'Quản đốc', 'sanxuat', 'Quản đốc nhà máy'),
        account('kho', 'Thủ kho', 'kho', 'Trạm cân & kho'),
        account('kinhdoanh', 'Kinh doanh XK', 'kinhdoanh', 'Kinh doanh xuất khẩu')
    ];

    const purchaseOrders = [
        { id: 'LM-2610-001', date: '2026-10-05', supplierId: 'NCC-VN-001', originCountry: 'VN', species: HEVEA, inputType: inputOf(0), qtyM3: 185, price: 3200000, currency: 'VND', deliveryDate: '2026-10-30', deliveryPlace: TENANT.site, status: 'OPEN', receiptIds: ['NL2610-01', 'NL2610-02'], note: '' },
        { id: 'LM-2610-002', date: '2026-10-08', supplierId: 'NCC-VN-002', originCountry: 'VN', species: EUCALYPTUS, inputType: inputOf(1), qtyM3: 150, price: 2900000, currency: 'VND', deliveryDate: '2026-11-30', deliveryPlace: TENANT.site, status: 'OPEN', receiptIds: ['NL2610-06'], note: '' },
        { id: 'LM-2610-003', date: '2026-10-15', supplierId: 'NCC-CN-001', originCountry: 'CN', species: POPLAR, inputType: inputOf(2), qtyM3: 40, price: 185, currency: 'USD', deliveryDate: '2026-11-18', deliveryPlace: TENANT.site, incoterm: 'CIF', port: 'Cát Lái', containers: 2, foreignContract: 'CTR-2026/07', status: 'OPEN', receiptIds: [], note: '' },
        { id: 'LM-2610-004', date: '2026-10-22', supplierId: 'NCC-CN-002', originCountry: 'CN', species: POPLAR, inputType: inputOf(2), qtyM3: 25, price: 178, currency: 'USD', deliveryDate: '2026-12-05', deliveryPlace: TENANT.site, incoterm: 'FOB', port: 'Cái Mép', containers: 1, foreignContract: '', status: 'DRAFT', receiptIds: [], note: '' },
        { id: 'LM-2610-005', date: '2026-10-20', supplierId: 'NCC-VN-006', originCountry: 'VN', species: ACACIA, inputType: inputOf(0), qtyM3: 200, price: 2700000, currency: 'VND', deliveryDate: '2026-11-20', deliveryPlace: TENANT.site, status: 'OPEN', receiptIds: ['NL2610-09', 'NL2610-14'], note: '' },
        { id: 'LM-2610-006', date: '2026-10-21', supplierId: 'NCC-VN-007', originCountry: 'VN', species: ACACIA, inputType: inputOf(1), qtyM3: 120, price: 2650000, currency: 'VND', deliveryDate: '2026-11-25', deliveryPlace: TENANT.site, status: 'OPEN', receiptIds: ['NL2610-10'], note: '' }
    ];

    const materials = [
        ...pack.materials.map((m, i) => ({ id: `VT-${String(i + 1).padStart(2, '0')}`, name: m.name, group: m.group, spec: '', standard: '', norm: '', unit: m.unit })),
        { id: 'VT-TEM', name: 'Tem QR truy xuất', group: 'Đóng gói', spec: 'Dán trên kiện', standard: '', norm: '', unit: 'tem' }
    ];

    const ports = [
        { id: 'PORT-VN-CL', name: 'Cát Lái', code: 'VNCLI', type: 'SEAPORT', country: 'VN', role: 'Cảng miền Nam' },
        { id: 'PORT-VN-CM', name: 'Cái Mép - Thị Vải', code: 'VNCMT', type: 'DEEPSEAPORT', country: 'VN', role: 'Đi thẳng Âu, Mỹ' },
        { id: 'PORT-VN-DV', name: 'Đình Vũ', code: 'VNHPH', type: 'SEAPORT', country: 'VN', role: 'Cảng miền Bắc' },
        { id: 'PORT-DE-HAM', name: 'Hamburg', code: 'DEHAM', type: 'SEAPORT', country: 'DE', role: 'Cảng nhập EU' },
        { id: 'PORT-NL-RTM', name: 'Rotterdam', code: 'NLRTM', type: 'SEAPORT', country: 'NL', role: 'Cảng nhập EU' },
        { id: 'PORT-VN-QN', name: 'Quy Nhơn', code: 'VNUIH', type: 'SEAPORT', country: 'VN', role: 'Cảng miền Trung' },
        { id: 'PORT-VN-DN', name: 'Đà Nẵng', code: 'VNDAD', type: 'SEAPORT', country: 'VN', role: 'Cảng miền Trung' },
        { id: 'PORT-BE-ANR', name: 'Antwerp', code: 'BEANR', type: 'SEAPORT', country: 'BE', role: 'Cảng nhập EU' },
        { id: 'PORT-FR-LEH', name: 'Le Havre', code: 'FRLEH', type: 'SEAPORT', country: 'FR', role: 'Cảng nhập EU' },
        { id: 'PORT-IT-GOA', name: 'Genoa', code: 'ITGOA', type: 'SEAPORT', country: 'IT', role: 'Cảng nhập EU' }
    ];

    const hsCodeDetails = HS_CATALOG.map(h => ({ ...h }));

    const workerNames = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hà', 'Hùng', 'Khoa', 'Lan', 'Long', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Tín', 'Trí', 'Tuấn', 'Vinh', 'Xuân', 'Yến'];
    const workers = workerNames.map((n, i) => ({ id: `NV-${String(i + 1).padStart(2, '0')}`, code: `MS:2024${String(i + 1).padStart(2, '0')}`, name: `Nguyễn Văn ${n}`, cccd: `0000000000${String(i + 1).padStart(2, '0')}`, dept: config.depts[i % config.depts.length], position: 'Công nhân', phone: `0900 000 2${String(i + 1).padStart(2, '0')}`, startDate: '2023-01-15', eudrTrained: i % 5 !== 4, trainDate: '2026-09-10', status: 'ACTIVE' }));

    const attendancePatterns = ['X', 'X', 'X', 'X', 'X', 'PN', 'X', 'X', 'X', 'H', 'X', 'X', 'X', 'X', 'Ô', 'X', 'X', 'X', 'X', 'KL', 'X', 'X', 'X', 'X', 'X', 'X', 'H', 'X', 'X', 'X'];
    const attendance = workers.map((w, idx) => {
        const days = {};
        for (let d = 1; d <= 30; d++) {
            days[d] = (d + 6) % 7 === 0 ? 'CN' : attendancePatterns[(d + idx * 2) % attendancePatterns.length];
        }
        return { workerId: w.id, workerCode: w.code, workerName: w.name, dept: w.dept, month: '2026-11', days };
    });

    return {
        version: 19,
        industry: pack.id,
        workers,
        attendance,
        config,
        speciesDetails,
        provinces,
        districts,
        wards,
        landTypes,
        landCertTypes,
        certifications,
        machines,
        warehouseBays,
        productSpecs,
        ports,
        hsCodeDetails,
        surveyBatches,
        farmers,
        accounts,
        suppliers,
        customers,
        scaleTickets,
        purchaseOrders,
        materials,
        contracts,
        plots,
        receipts,
        packages,
        workOrders,
        pallets,
        orders,
        audit: [],
        seedLog: [
            ...receipts.filter(r => r.approval).map(r => [r.id, 'Duyệt Đạt', `${r.approval.by}: ${r.approval.reason}`]),
            ...workOrders.map(w => [w.id, 'Phát lệnh', `${w.product}; thị trường ${w.market}`]),
            ...orders.filter(o => o.status >= 1).map(o => [o.id, 'Xác nhận đơn', o.customer])
        ],
        drills: []
    };
}
