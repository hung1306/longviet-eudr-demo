/**
 * Lõi nghiệp vụ EUDR: lưu dữ liệu, nhật ký, kiểm tra GeoJSON, đánh giá rủi ro, phả hệ và gói dữ liệu DDS.
 * Không phụ thuộc giao diện để có thể kiểm thử riêng.
 */
const STORE_KEY = 'ecotech2a-wood-v4';
const STAGES = ['May ghép ván', 'Lăn keo & xếp lớp', 'Ép nguội & vá', 'Ép nóng', 'Bả bột & chà nhám', 'Cắt cạnh', 'KCS đèn soi'];
/** Máy và thông số bắt buộc từng công đoạn. Nhiệt độ ép nóng 110-130°C và dung sai độ dày ±0.3 mm theo khảo sát nhà máy. */
const STAGE_SPECS = [
    {
        ccp: 'CCP-1',
        ccpName: 'Kiểm soát chống trộn phôi lõi',
        ccpRule: 'Chống lẫn nguồn (Anti-mixing Segregation)',
        ccpControl: 'Chỉ nhận phôi từ Ô kho Khu A đã cấp phát trong Lệnh SX',
        mixingRisk: 'Thợ may lấy nhầm lá ván rách hoặc phôi phế thải tồn lưu từ mẻ Non-EU trước đó đan xen vào cuộn ván cho đơn EU.',
        antiMixingRule: 'Quét mã QR từng kiện trước khi đưa lên bàn máy may; vệ sinh sạch phôi vụn bàn máy trước khi chuyển lệnh.',
        consequence: 'Toàn bộ cuộn ván bị nhiễm nguồn không rõ, hủy quyền xuất khẩu EU.',
        machines: ['MC-ZICZAC-01'],
        outLabel: 'Tấm lõi may ra',
        params: []
    },
    {
        ccp: 'CCP-2',
        ccpName: 'Kiểm soát phát thải keo & xếp lớp',
        ccpRule: 'Tiêu chuẩn phát thải thấp CARB P2 / E0',
        ccpControl: 'Định mức tráng keo 280-320 g/m², xếp lớp đối xứng thớ gỗ dọc-ngang',
        mixingRisk: 'Công nhân tự ý chèn thêm lá ván độn ngoài danh mục BoM để bù chiều dày thiếu, hoặc dùng sai loại keo Urea giá rẻ.',
        antiMixingRule: 'Cân kiểm tra tải trọng xếp lớp; đếm đúng số lớp (plies) theo BoM; kiểm tra định mức keo 300-340 g/m² hai mặt.',
        consequence: 'Làm sai lệch tỷ lệ thu hồi phôi (mass balance), ván bị nứt tách tầng khi kiểm định.',
        machines: ['MC-GLUE-02'],
        outLabel: 'Phôi xếp lớp ra',
        params: [{ key: 'glue', label: 'Định mức keo (g/m²)', min: 1 }]
    },
    {
        ccp: 'CCP-3',
        ccpName: 'Kiểm soát phôi vá & định hình (NGUY CƠ CAO)',
        ccpRule: 'Truy xuất nguồn gốc veneer vá (Patch Lineage)',
        ccpControl: 'Áp suất 80-120 kg/cm², veneer vá bắt buộc thuộc lô nguồn trong lệnh',
        mixingRisk: 'NGUY CƠ CAO NHẤT: Khi thấy khuyết tật/mắt chết, thợ vá nhặt bừa mảnh ván vụn ngoài xưởng (Non-EU) dán vào ván xuất EU!',
        antiMixingRule: 'BẮT BUỘC miếng vá (veneer patch) phải lấy từ chính lô ván mặt/ruột cùng mã truy xuất (RC-W...). Khay miếng vá có nhãn mã lô.',
        consequence: 'Vi phạm Điều 9 EUDR (chứa gỗ không rõ tọa độ), lô hàng bị hải quan EU tịch thu.',
        machines: ['MC-COLD-01'],
        outLabel: 'Phôi sau ép nguội',
        params: [
            { key: 'pressure', label: 'Áp suất (kg/cm²)', min: 1 },
            { key: 'minutes', label: 'Thời gian ép (phút)', min: 1 },
            { key: 'patches', label: 'Số mắt vá', min: 0 }
        ],
        patchLot: true
    },
    {
        ccp: 'CCP-4',
        ccpName: 'Kiểm soát nhiệt ép hóa rắn keo vĩnh cửu',
        ccpRule: 'Chốt chặn công nghệ ép nóng (Thermal Cure)',
        ccpControl: 'Nhiệt độ thớt ép 110-130°C, áp suất thủy lực, thời gian mẻ đủ tiêu chuẩn',
        mixingRisk: 'Ép gộp lẫn lộn giữa mẻ ván EU và mẻ ván nội địa trên cùng các tầng ép đa tầng 15 tầng.',
        antiMixingRule: 'Mỗi mẻ ép (Press Batch) chỉ chứa sản phẩm của DUY NHẤT 1 Lệnh SX; cài đặt cảm biến nhiệt độ ≥ 120°C, áp suất ≥ 120 bar.',
        consequence: 'Trộn lẫn mẻ ép làm mất tính phả hệ đơn chiếc của lô thành phẩm.',
        machines: ['MC-HOTPRESS-01'],
        outLabel: 'Tấm sau ép nóng',
        params: [
            { key: 'temp', label: 'Nhiệt độ (°C)', min: 110, max: 130 },
            { key: 'bar', label: 'Áp suất (bar)', min: 1 },
            { key: 'minutes', label: 'Thời gian (phút/mẻ)', min: 1 }
        ]
    },
    {
        ccp: 'CCP-5',
        ccpName: 'Kiểm soát dung sai chiều dày & độ ẩm',
        ccpRule: 'Tiêu chuẩn kích thước & bả trám hữu cơ',
        ccpControl: 'Dung sai độ dày đo 6 điểm ±0.3 mm so với quy cách, độ ẩm tấm ≤ 10%',
        mixingRisk: 'Dùng bột bả trám có hóa chất cấm ngoài danh mục REACH của EU, hoặc mài lẹm làm phơi lớp keo.',
        antiMixingRule: 'Chỉ dùng bột bả trám hữu cơ REACH Compliant; đo độ dày 6 điểm kiểm tra dung sai ±0.3 mm.',
        consequence: 'Không đạt tiêu chuẩn kỹ thuật nhập khẩu EN 314-2.',
        machines: ['MC-SANDER-03'],
        outLabel: 'Tấm sau chà nhám',
        params: [
            { key: 'thickness', label: 'Độ dày đo được (mm)', min: 0.1, thickness: true }
        ]
    },
    {
        ccp: 'CCP-6',
        ccpName: 'Kiểm soát phế liệu & dăm gỗ cắt biên',
        ccpRule: 'Cân đối phế liệu (Scrap Mass Balance)',
        ccpControl: 'Cân số kg phế liệu biên, tái chế làm chân pallet có mã lô gốc hoặc bán dăm ngoài EU',
        mixingRisk: 'Đầu mẩu cắt biên phế phẩm của ván Non-EU bị băm nhỏ rồi tái trộn vào ván ép khối/ván dăm xuất EU.',
        antiMixingRule: 'Đầu mẩu cắt biên phải chuyển thẳng sang silo băm làm củi đốt lò hơi hoặc chân pallet; cấm quay lại dây chuyền ép mặt.',
        consequence: 'Làm sai lệch tỷ lệ thu hồi phôi (mass balance) dẫn đến cảnh báo đỏ trên Cổng TRACES-NT.',
        machines: ['MC-TRIM-02'],
        outLabel: 'Tấm sau cắt cạnh',
        params: [
            { key: 'scrapKg', label: 'Phế liệu (kg)', min: 0 }
        ],
        scrap: true
    },
    {
        ccp: 'CCP-7',
        ccpName: 'KCS phân hạng & Gắn tem QR phả hệ',
        ccpRule: 'Cách ly thành phẩm & Cân bằng khối lượng',
        ccpControl: 'Tách riêng Hạng A xuất EU, Hạng B/C bán nội địa. Tỷ lệ thu hồi 80-92%',
        mixingRisk: 'Dán nhầm tem QR đơn EU vào kiện pallet hàng nội địa, hoặc đóng chung pallet lẫn lộn phẩm cấp.',
        antiMixingRule: 'Soi đèn góc nghiêng 100% tấm; đóng đai chuẩn ISPM 15 có mã hun trùng HT; in tem QR truy xuất phả hệ gắn chặt góc pallet.',
        consequence: 'Khách hàng EU từ chối nhận hàng, bị phạt vi phạm quy chế EUDR lên tới 4% doanh thu hàng năm.',
        machines: ['Đèn soi góc nghiêng'],
        outLabel: 'Hạng A đạt xuất',
        params: [],
        qc: true
    }
];
const SCRAP_USES = ['Băm làm chân pallet, giữ mã lô gốc', 'Dùng lại trong lệnh này, giữ mã lô gốc', 'Không rõ lô: chỉ bán ngoài EU'];
const SHIFTS = ['Ca 1', 'Ca 2', 'Ca 3'];

const ROLES = {
    kinhdoanh: 'Kinh doanh xuất khẩu',
    sanxuat: 'Quản đốc sản xuất',
    kho: 'Thủ kho nguyên liệu',
    tuanthu: 'KCS & Tuân thủ EUDR',
    quantri: 'Quản trị hệ thống'
};
const PERMS = {
    supplier: ['tuanthu', 'kinhdoanh', 'quantri'],
    plot: ['tuanthu', 'kho', 'quantri'],
    forest: ['tuanthu', 'quantri'],
    receipt: ['kho', 'tuanthu', 'quantri'],
    approve: ['tuanthu', 'quantri'],
    workorder: ['sanxuat', 'quantri'],
    pallet: ['sanxuat', 'kho', 'quantri'],
    order: ['kinhdoanh', 'quantri'],
    drill: ['tuanthu', 'quantri'],
    config: ['quantri']
};
const LEVEL_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2 };

let DB = null;

const storage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem() {}, removeItem() {} };

function loadDB() {
    try { DB = JSON.parse(storage.getItem(STORE_KEY)); } catch (e) { DB = null; }
    if (!DB || DB.version !== buildSeed().version) {
        DB = buildSeed();
        saveDB();
        logAction('Hệ thống', 'Nạp dữ liệu mẫu', 'Khởi tạo');
    }
    return DB;
}

function saveDB() { storage.setItem(STORE_KEY, JSON.stringify(DB)); }

function resetDB() {
    storage.removeItem(STORE_KEY);
    return loadDB();
}

/** Bản demo không có đăng nhập: dùng một vai trò đủ quyền. */
function currentRole() { return 'quantri'; }
function setRole(role) { storage.setItem('ecotech2a-role', role); }
function can(perm) {
    const role = currentRole();
    if (role === 'quantri') return true;
    return (PERMS[perm] || []).includes(role);
}
function rolesFor(perm) { return (PERMS[perm] || []).map(r => ROLES[r]).join(' hoặc '); }

function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// ---------- Nhật ký chỉ ghi thêm, mỗi dòng móc nối bằng mã băm của dòng trước ----------
function hashText(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

function auditHash(e) { return hashText([e.prev, e.at, e.role, e.entity, e.action, e.detail].join('|')); }

function logAction(entity, action, detail) {
    const prev = DB.audit.length ? DB.audit[DB.audit.length - 1].hash : '00000000';
    const entry = { at: new Date().toISOString(), role: ROLES[currentRole()], entity, action, detail: detail || '', prev };
    entry.hash = auditHash(entry);
    DB.audit.push(entry);
    saveDB();
}

function verifyAudit() {
    let prev = '00000000';
    for (let i = 0; i < DB.audit.length; i++) {
        const e = DB.audit[i];
        if (e.prev !== prev || auditHash(e) !== e.hash) return { ok: false, index: i };
        prev = e.hash;
    }
    return { ok: true, count: DB.audit.length };
}

// ---------- Tra cứu ----------
const byId = (list, id) => (list || []).find(x => x.id === id);
const getSupplier = id => byId(DB.suppliers, id);
const getPlot = id => byId(DB.plots, id);
const getReceipt = id => byId(DB.receipts, id);
const getPackage = id => byId(DB.packages, id);
const getWO = id => byId(DB.workOrders, id);
const getPallet = id => byId(DB.pallets, id);
const getOrder = id => byId(DB.orders, id);
const getFarmer = id => byId(DB.farmers, id);
const getMachine = id => byId(DB.machines, id);
const getBay = id => byId(DB.warehouseBays, id);
const getProvince = id => byId(DB.provinces, id);
const getDistrict = id => byId(DB.districts, id);
const getWard = id => byId(DB.wards, id);
const uniq = list => [...new Set(list)];
const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
const round = (n, d = 2) => +Number(n).toFixed(d);

const sheetM3 = o => o.l * o.w * o.t / 1e9;
const receiptM3 = r => sum(DB.packages.filter(p => p.receiptId === r.id), p => p.m3);
const receiptNetKg = r => r.gross - r.tare;
const requiredDocs = supplier => supplier && supplier.type === 'IMPORT'
    ? ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật']
    : ['Bảng kê lâm sản', 'Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'];

// ---------- Kiểm tra hình học (FR4) ----------
function ringAreaHa(ring) {
    const R = 6378137, rad = Math.PI / 180;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
        area += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad));
    }
    return Math.abs(area * R * R / 2) / 10000;
}

function ringSelfIntersects(ring) {
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const n = ring.length - 1;
    for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            const [a, b, c, d] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
            if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true;
        }
    }
    return false;
}

function pointsOf(geometry) {
    if (geometry.type === 'Point') return [geometry.coordinates];
    if (geometry.type === 'Polygon') return geometry.coordinates.flat();
    return [];
}

/** Kiểm tra một thửa. minDecimals lấy từ văn bản gốc khi có, vì JSON.parse làm mất số 0 cuối. */
function checkGeometry(geometry, areaHa, country, minDecimals) {
    const errors = [], warnings = [];
    if (!geometry || !['Point', 'Polygon'].includes(geometry.type)) {
        return { errors: ['Chỉ chấp nhận Point hoặc Polygon'], warnings };
    }
    const pts = pointsOf(geometry);
    if (!pts.length || pts.some(p => !Array.isArray(p) || typeof p[0] !== 'number' || typeof p[1] !== 'number')) {
        return { errors: ['Tọa độ không hợp lệ'], warnings };
    }
    if (pts.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90)) errors.push('Tọa độ ngoài phạm vi WGS84');
    if (minDecimals !== undefined && minDecimals < 6) errors.push(`Tọa độ chỉ có ${minDecimals} chữ số thập phân, cần tối thiểu 6`);

    const box = DB.config.countryBox[country];
    if (box && pts.some(([x, y]) => x < box[0] || y < box[1] || x > box[2] || y > box[3])) {
        errors.push(`Tọa độ nằm ngoài khung quốc gia ${country} (kiểm tra thứ tự [kinh độ, vĩ độ])`);
    }
    if (geometry.type === 'Point' && Number(areaHa) > 4) errors.push('Thửa trên 4 ha bắt buộc khai Polygon');
    if (geometry.type === 'Polygon') {
        const ring = geometry.coordinates[0];
        const first = ring[0], last = ring[ring.length - 1];
        if (ring.length < 4) errors.push('Polygon cần tối thiểu 3 đỉnh và điểm đóng');
        else if (first[0] !== last[0] || first[1] !== last[1]) errors.push('Polygon chưa khép kín');
        else {
            if (ringSelfIntersects(ring)) errors.push('Polygon tự cắt');
            const computed = ringAreaHa(ring);
            const declared = Number(areaHa);
            if (declared > 0) {
                const dev = Math.abs(computed - declared) / declared * 100;
                if (dev > DB.config.areaTolerancePct) warnings.push(`Diện tích tính được ${computed.toFixed(2)} ha lệch ${dev.toFixed(0)}% so với khai báo ${declared} ha`);
            }
        }
    }
    return { errors, warnings };
}

function plotGeoCheck(plot) { return checkGeometry(plot.geometry, plot.areaHa, plot.country); }

/** Số chữ số thập phân nhỏ nhất đọc từ văn bản GeoJSON gốc. */
function minDecimalsInText(text) {
    let min = Infinity;
    const blocks = text.match(/"coordinates"\s*:\s*[\[\]\s\d.,eE+-]+/g) || [];
    blocks.forEach(block => {
        (block.split(':')[1].match(/-?\d+(\.\d+)?/g) || []).forEach(num => {
            min = Math.min(min, (num.split('.')[1] || '').length);
        });
    });
    return min === Infinity ? undefined : min;
}

/** Kiểm tra cả tệp GeoJSON (đầu vào từ nhà cung cấp hoặc đầu ra theo đơn). */
function validateGeoJsonText(text) {
    const result = { fatal: null, items: [], fileErrors: [], ok: false, features: [] };
    let data;
    try { data = JSON.parse(text); } catch (e) { result.fatal = 'Không đọc được JSON: ' + e.message; return result; }
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) {
        result.fatal = 'Tệp phải là FeatureCollection có ít nhất một đối tượng';
        return result;
    }
    const sizeMb = new Blob([text]).size / 1048576;
    if (sizeMb > DB.config.maxGeoJsonMb) result.fileErrors.push(`Dung lượng ${sizeMb.toFixed(1)} MB vượt ${DB.config.maxGeoJsonMb} MB`);
    const crs = data.crs && data.crs.properties && data.crs.properties.name;
    if (crs && !/CRS84|4326/.test(crs)) result.fileErrors.push('Hệ tọa độ không phải WGS84');
    const decimals = minDecimalsInText(text);
    const seen = new Set();

    data.features.forEach((f, i) => {
        const props = f.properties || {};
        const country = props.ProducerCountry;
        const label = props.PlotID || props.ProductionPlace || `Đối tượng ${i + 1}`;
        const check = checkGeometry(f.geometry, props.Area, country, decimals);
        if (!/^[A-Z]{2}$/.test(country || '')) check.errors.push('ProducerCountry phải là mã ISO 2 ký tự');
        if (typeof props.Area !== 'number') check.errors.push('Area phải là số (ha)');
        const key = JSON.stringify(f.geometry && f.geometry.coordinates);
        if (seen.has(key)) check.warnings.push('Trùng tọa độ với đối tượng trước');
        seen.add(key);
        result.items.push({ label, errors: check.errors, warnings: check.warnings });
    });
    result.features = data.features;
    result.ok = !result.fileErrors.length && result.items.every(x => !x.errors.length);
    return result;
}

// ---------- Đánh giá rủi ro từng lô (FR6, mục 4 bộ tiêu chuẩn) ----------
function countryRisk(code) { return DB.config.countryRisk[code] || 'STANDARD'; }

function assessReceipt(r) {
    const supplier = getSupplier(r.supplierId);
    const plots = r.plotIds.map(getPlot).filter(Boolean);
    const factors = [];
    const add = (name, level, msg) => factors.push({ name, level, msg });

    if (!plots.length) {
        add('Tọa độ lô đất', 'HIGH', 'Chưa gắn thửa đất nào');
    } else {
        const countries = uniq(plots.map(p => p.country));
        const risks = countries.map(countryRisk);
        add('Quốc gia khai thác', risks.includes('HIGH') ? 'HIGH' : risks.includes('STANDARD') ? 'MEDIUM' : 'LOW', countries.join(', '));

        const checks = plots.map(plotGeoCheck);
        const errors = checks.flatMap(c => c.errors), warnings = checks.flatMap(c => c.warnings);
        add('Tọa độ lô đất', errors.length ? 'HIGH' : warnings.length ? 'MEDIUM' : 'LOW', errors[0] || warnings[0] || `${plots.length} thửa hợp lệ`);

        const forest = plots.map(p => (p.forest && p.forest.result) || 'NONE');
        const level = forest.includes('LOSS') || forest.includes('NONE') ? 'HIGH' : forest.includes('OVERLAP') ? 'MEDIUM' : 'LOW';
        add('Bản đồ rừng mốc 31/12/2020', level, forest.includes('LOSS') ? 'Có mất tán rừng sau mốc' : forest.includes('NONE') ? 'Chưa có kết quả đối chiếu' : forest.includes('OVERLAP') ? 'Chồng lấn một phần, cần ảnh vệ tinh' : 'Không chồng lấn');

        const noHarvest = plots.some(p => !p.harvestFrom);
        add('Ngày khai thác', noHarvest ? 'HIGH' : 'LOW', noHarvest ? 'Thiếu ngày khai thác' : `${harvestRange(plots)}`);

        const noLand = plots.filter(p => !p.landDoc).length;
        const missing = requiredDocs(supplier).filter(d => !r.docs.includes(d));
        add('Hồ sơ hợp pháp', noLand ? 'HIGH' : missing.length ? 'MEDIUM' : 'LOW', noLand ? 'Thiếu giấy quyền sử dụng đất' : missing.length ? 'Thiếu: ' + missing.join(', ') : 'Đủ');
    }

    const chainLevel = { DIRECT: 'LOW', AGENT: 'MEDIUM', MULTI: 'HIGH' }[supplier ? supplier.chain : 'MULTI'];
    if (chainLevel === 'MEDIUM' && plots.length) add('Độ phức tạp chuỗi', 'LOW', 'Qua một đại lý, đã có tọa độ từng hộ');
    else add('Độ phức tạp chuỗi', chainLevel, chainLevel === 'HIGH' ? 'Nhiều tầng trung gian' : chainLevel === 'MEDIUM' ? 'Qua đại lý, chưa có danh sách hộ' : 'Mua trực tiếp');

    add('Cam kết nhà cung cấp', supplier && supplier.commitment ? 'LOW' : 'HIGH', supplier && supplier.commitment ? 'Đã ký' : 'Chưa ký cam kết EUDR');

    const speciesOk = /^[A-Z][a-z]+ [a-z-]+$/.test(r.species) && !/ spp?\.?$/.test(r.species);
    const risky = DB.config.riskSpecies.includes(r.species);
    const inPlots = !plots.length || plots.some(p => p.species === r.species);
    add('Loài gỗ', risky ? 'HIGH' : speciesOk && inPlots ? 'LOW' : 'MEDIUM', risky ? 'Thuộc danh mục loài rủi ro' : !speciesOk ? 'Cần tên khoa học đến cấp loài' : !inPlots ? 'Loài không khớp thửa đất' : r.species);

    const level = factors.reduce((m, f) => LEVEL_RANK[f.level] > LEVEL_RANK[m] ? f.level : m, 'LOW');
    return { factors, level };
}

/** PASS chỉ khi Tuân thủ đã ký và không còn yếu tố cao; mức trung bình còn phải có biện pháp giảm thiểu. */
function receiptStatus(r) {
    const { level } = assessReceipt(r);
    if (level === 'HIGH') return 'FAIL';
    if (!r.approval) return 'PENDING';
    if (level === 'MEDIUM' && !r.mitigations.length) return 'PENDING';
    return 'PASS';
}

function approveReceipt(r, by, reason) {
    const { level } = assessReceipt(r);
    if (level === 'HIGH') throw new Error('Lô có yếu tố rủi ro cao, không thể duyệt Đạt');
    if (level === 'MEDIUM' && !r.mitigations.length) throw new Error('Mức trung bình cần ghi biện pháp giảm thiểu trước khi duyệt');
    if (level === 'MEDIUM' && !reason) throw new Error('Cần ghi lý do duyệt');
    r.approval = { by, at: todayISO(), reason: reason || 'Đủ hồ sơ theo bộ tiêu chuẩn' };
    logAction(r.id, 'Duyệt Đạt', `${by}: ${r.approval.reason}`);
}

function harvestRange(plots) {
    const from = plots.map(p => p.harvestFrom).filter(Boolean).sort()[0];
    const to = plots.map(p => p.harvestTo || p.harvestFrom).filter(Boolean).sort().pop();
    return from ? `${from} → ${to}` : '';
}

// ---------- Tồn kho ----------
function packageAllocated(pkgId) {
    return sum(DB.workOrders, w => sum(w.allocations.filter(a => a.packageId === pkgId), a => a.m3));
}
function packageStock(pkg) { return round(pkg.m3 - packageAllocated(pkg.id), 4); }
function receiptStock(r) { return round(sum(DB.packages.filter(p => p.receiptId === r.id), packageStock), 3); }

// ---------- Lệnh sản xuất (FR7) ----------
function createWorkOrder(data, allocations) {
    if (!allocations.length) throw new Error('Chưa chọn kiện nguyên liệu');
    allocations.forEach(a => {
        const pkg = getPackage(a.packageId);
        const status = receiptStatus(getReceipt(pkg.receiptId));
        if (data.market === 'EU' && status !== 'PASS') throw new Error(`${pkg.id} chưa Đạt, không được cấp vào lệnh EU`);
        if (status === 'PENDING') throw new Error(`${pkg.id} đang chờ bổ sung, chưa được đưa vào sản xuất`);
        if (a.m3 <= 0 || a.m3 > packageStock(pkg) + 0.0001) throw new Error(`${pkg.id} chỉ còn ${packageStock(pkg)} m³`);
    });
    const seq = String(DB.workOrders.length + 1).padStart(2, '0');
    const wo = {
        id: `WO-${todayISO().slice(2).replace(/-/g, '')}-${seq}`, created: todayISO(), ...data, allocations,
        finishedSheets: 0, qaNote: '', lot: '', stages: STAGES.map(() => ({ status: 'TODO' }))
    };
    DB.workOrders.push(wo);
    logAction(wo.id, 'Phát lệnh', `${wo.product}; thị trường ${wo.market}; ${allocations.length} kiện, ${round(sum(allocations, a => a.m3))} m³`);
    return wo;
}

function woInputM3(wo) { return sum(wo.allocations, a => a.m3); }
function woOutputM3(wo, sheets = wo.finishedSheets) { return sheets * sheetM3(wo); }
function woReceipts(wo) { return uniq(wo.allocations.map(a => getPackage(a.packageId).receiptId)).map(getReceipt); }
function woPlots(wo) { return uniq(woReceipts(wo).flatMap(r => r.plotIds)).map(getPlot).filter(Boolean); }
function woDone(wo) { return wo.stages.every(s => s.status === 'DONE'); }

/** Đối soát khối lượng vào/ra của từng lệnh. Đây là kiểm tra chống lẫn nguyên liệu, không phải cân bằng khối lượng (mass balance). */
function reconcile(wo, sheets = wo.finishedSheets) {
    const input = woInputM3(wo), output = woOutputM3(wo, sheets);
    const rate = input ? output / input * 100 : 0;
    const { recoveryMin: min, recoveryMax: max } = DB.config;
    return { input: round(input), output: round(output), rate: round(rate), overRun: output > input, outOfBand: rate < min || rate > max, min, max };
}

/** Lệnh EU bị giữ khi có lô nguồn không còn Đạt: không được ghi tiếp công đoạn. */
function woHoldReasons(wo) {
    if (wo.market !== 'EU') return [];
    return woReceipts(wo).filter(r => receiptStatus(r) !== 'PASS').map(r => r.id);
}

function stageOutput(wo, index) { return index < 0 ? null : wo.stages[index].out; }

/** Kiểm tra một bản ghi công đoạn. Dùng chung cho ghi mới và sửa. */
function validateStage(wo, index, data, now = Date.now()) {
    const spec = STAGE_SPECS[index];
    if (!data.by || !data.confirmBy) throw new Error('Cần người vận hành và người xác nhận');
    if (data.by.trim().toLowerCase() === data.confirmBy.trim().toLowerCase()) throw new Error('Người xác nhận phải khác người vận hành');
    if (!data.shift || !data.machine) throw new Error('Cần chọn ca và máy');
    const start = Date.parse(data.start), end = Date.parse(data.end);
    if (!start || !end || end <= start) throw new Error('Giờ kết thúc phải sau giờ bắt đầu');
    if (end > now) throw new Error('Không được ghi giờ trong tương lai');
    const prev = index > 0 ? wo.stages[index - 1] : null;
    if (prev && prev.end && start < Date.parse(prev.end)) throw new Error('Không được bắt đầu trước khi công đoạn trước kết thúc');
    spec.params.forEach(p => {
        const v = Number(data[p.key]);
        if (data[p.key] === '' || data[p.key] === undefined || Number.isNaN(v) || v < p.min || (p.max !== undefined && v > p.max)) {
            throw new Error(p.max !== undefined ? `${p.label} phải trong ${p.min}-${p.max}` : `Thiếu hoặc sai ${p.label}`);
        }
        if (p.thickness && Math.abs(v - wo.t) > 0.3) throw new Error(`Độ dày lệch quá ±0.3 mm so với ${wo.t} mm`);
    });
    if (spec.patchLot && Number(data.patches) > 0 && !woReceipts(wo).some(r => r.id === data.patchLot)) throw new Error('Veneer vá phải thuộc một lô trong lệnh');
    if (spec.scrap && !SCRAP_USES.includes(data.scrapUse)) throw new Error('Chọn cách xử lý phế liệu');
    const prevOut = index >= 2 ? stageOutput(wo, index - 1) : null;
    if (spec.qc) {
        const [a, b, cc] = ['gradeA', 'gradeB', 'gradeC'].map(k => Number(data[k]) || 0);
        if (!(a > 0)) throw new Error('Nhập số tấm hạng A');
        if (prevOut !== null && a + b + cc !== prevOut) throw new Error(`Hạng A + B + C phải bằng ${prevOut} tấm vào KCS`);
        const rec = reconcile(wo, a);
        if (rec.overRun) throw new Error(`Thành phẩm ${rec.output} m³ lớn hơn nguyên liệu ${rec.input} m³: nghi có nguyên liệu ngoài hồ sơ`);
        if (rec.outOfBand && !data.qaNote) throw new Error(`Tỷ lệ thu hồi ${rec.rate}% ngoài dải ${rec.min}-${rec.max}%: QA phải giải trình`);
        return a;
    }
    const out = Number(data.out);
    if (!(out > 0)) throw new Error(`Nhập ${spec.outLabel}`);
    if (prevOut !== null && out > prevOut) throw new Error(`Số tấm ra ${out} lớn hơn số vào ${prevOut}: nghi lẫn phôi ngoài lệnh`);
    return out;
}

function stageRecord(data, out) {
    const { reason, ...rest } = data;
    return { ...rest, status: 'DONE', out, at: String(data.end).slice(0, 10) };
}

function recordStage(wo, index, data) {
    if (wo.stages[index].status === 'DONE') throw new Error('Công đoạn đã ghi nhận, muốn đổi phải dùng Sửa có lý do');
    if (index > 0 && wo.stages[index - 1].status !== 'DONE') throw new Error('Phải hoàn tất công đoạn trước');
    const hold = woHoldReasons(wo);
    if (hold.length) throw new Error(`Lệnh bị giữ vì lô ${hold.join(', ')} không còn Đạt`);
    const out = validateStage(wo, index, data);
    wo.stages[index] = { ...stageRecord(data, out), revisions: [] };
    if (STAGE_SPECS[index].qc) {
        wo.finishedSheets = out;
        wo.qaNote = data.qaNote || '';
        wo.lot = 'FG-' + wo.id.slice(3);
    }
    logAction(wo.id, 'Ghi công đoạn', `${STAGES[index]}: ra ${out} tấm; ${data.by}, xác nhận ${data.confirmBy}`);
}

/** Sửa bản ghi: bắt buộc lý do, lưu bản cũ. Đã đóng pallet thì không sửa được nữa. */
function correctStage(wo, index, data, reason) {
    if (!reason || !reason.trim()) throw new Error('Sửa nhật ký phải ghi lý do');
    if (DB.pallets.some(p => p.workOrderId === wo.id)) throw new Error('Lệnh đã đóng pallet, không được sửa nhật ký');
    const old = wo.stages[index];
    if (old.status !== 'DONE') throw new Error('Công đoạn chưa ghi');
    const next = wo.stages[index + 1];
    const out = validateStage(wo, index, data);
    if (next && next.status === 'DONE' && index >= 1 && next.out > out) throw new Error(`Công đoạn sau đã ghi ${next.out} tấm, không thể giảm xuống ${out}`);
    const { revisions = [], ...snapshot } = old;
    wo.stages[index] = { ...stageRecord(data, out), revisions: [...revisions, { ...snapshot, changedAt: new Date().toISOString(), reason, role: ROLES[currentRole()] }] };
    if (STAGE_SPECS[index].qc) {
        wo.finishedSheets = out;
        wo.qaNote = data.qaNote || '';
    }
    logAction(wo.id, 'Sửa công đoạn', `${STAGES[index]}: ${reason}`);
}

// ---------- Pallet ----------
function woPalletSheets(wo) { return sum(DB.pallets.filter(p => p.workOrderId === wo.id), p => p.sheets); }
function palletM3(p) { return round(p.sheets * sheetM3(getWO(p.workOrderId)), 3); }

function createPallet(data) {
    const wo = getWO(data.workOrderId);
    if (!woDone(wo)) throw new Error('Lệnh chưa hoàn tất KCS');
    const left = wo.finishedSheets - woPalletSheets(wo);
    if (data.sheets <= 0 || data.sheets > left) throw new Error(`Lệnh chỉ còn ${left} tấm chưa đóng pallet`);
    const no = DB.pallets.reduce((m, p) => Math.max(m, Number(p.id.slice(-4))), 100) + 1;
    const pallet = { id: 'PAL-LV-2026-' + String(no).padStart(4, '0'), created: todayISO(), ...data };
    DB.pallets.push(pallet);
    logAction(pallet.id, 'Đóng pallet', `${pallet.sheets} tấm từ ${wo.lot}`);
    return pallet;
}

function palletOrder(palletId) { return DB.orders.find(o => o.status >= 0 && o.palletIds.includes(palletId)); }

// ---------- Đơn hàng và gói dữ liệu DDS (FR9, FR10, FR13) ----------
function orderWOs(o) { return uniq(o.palletIds.map(id => getPallet(id).workOrderId)).map(getWO); }
function orderReceipts(o) { return uniq(orderWOs(o).flatMap(woReceipts).map(r => r.id)).map(getReceipt); }
function orderPlots(o) { return uniq(orderReceipts(o).flatMap(r => r.plotIds)).map(getPlot).filter(Boolean); }
function orderPallets(o) { return o.palletIds.map(getPallet); }
function orderM3(o) { return round(sum(orderPallets(o), palletM3)); }
function orderKg(o) { return sum(orderPallets(o), p => p.kg); }
function orderSpecies(o) { return uniq(orderReceipts(o).map(r => r.species)); }
function orderCountries(o) { return uniq(orderPlots(o).map(p => p.country)); }
function orderSuppliers(o) { return uniq(orderReceipts(o).map(r => r.supplierId)).map(getSupplier); }

/** Danh sách kiểm tra trước khi xác nhận đơn: mỗi mục thiếu là một lỗi chặn. */
function orderChecklist(o) {
    if (!orderIsEudr(o)) return [];
    const receipts = orderReceipts(o), plots = orderPlots(o), wos = orderWOs(o);
    const bad = receipts.filter(r => receiptStatus(r) !== 'PASS');
    const badGeo = plots.filter(p => plotGeoCheck(p).errors.length);
    const noForest = plots.filter(p => !p.forest || p.forest.result !== 'CLEAR');
    const badWO = wos.filter(w => reconcile(w).overRun);
    const nonEU = wos.filter(w => w.market !== 'EU');
    const noSupplierInfo = orderSuppliers(o).filter(s => !s.name || !s.address || !s.email);
    const size = new Blob([JSON.stringify(buildGeoJson(o))]).size / 1048576;
    const item = (label, ok, detail) => ({ label, ok, detail: ok ? '' : detail });
    return [
        item('Có sản phẩm và pallet gắn vào xe/cont', o.items.length > 0 && o.palletIds.length > 0, 'Chưa có sản phẩm hoặc pallet'),
        item('Số lượng sản phẩm khớp pallet', orderQtyMatches(o), 'Tổng dòng sản phẩm khác tổng pallet'),
        item('Người mua: tên, địa chỉ, email', !!(o.customer && o.customerAddress && o.customerEmail), 'Thiếu thông tin người mua'),
        item('Mã HS và mô tả hàng', !!o.hsCode, 'Thiếu mã HS'),
        item('Lệnh sản xuất dành cho thị trường EU', !nonEU.length, nonEU.map(w => w.id).join(', ')),
        item('Mọi lô nguyên liệu ở mức Đạt', !bad.length, bad.map(r => r.id).join(', ')),
        item('Tọa độ mọi thửa đúng chuẩn', plots.length > 0 && !badGeo.length, badGeo.map(p => p.id).join(', ') || 'Không có thửa nào'),
        item('Mọi thửa đã đối chiếu bản đồ rừng, không chồng lấn', !noForest.length, noForest.map(p => p.id).join(', ')),
        item('Có ngày khai thác của mọi thửa', plots.every(p => p.harvestFrom), 'Thiếu ngày khai thác'),
        item('Tên khoa học đến cấp loài', orderSpecies(o).length > 0 && orderSpecies(o).every(s => /^[A-Z][a-z]+ [a-z-]+$/.test(s)), 'Có loài chưa đến cấp loài'),
        item('Nhà cung cấp: tên, địa chỉ, email', !noSupplierInfo.length, noSupplierInfo.map(s => s.id).join(', ')),
        item('Khối lượng ra không vượt nguyên liệu', !badWO.length, badWO.map(w => w.id).join(', ')),
        item(`GeoJSON không quá ${DB.config.maxGeoJsonMb} MB`, size <= DB.config.maxGeoJsonMb, size.toFixed(1) + ' MB')
    ];
}

function orderReady(o) { return orderChecklist(o).every(i => i.ok); }
function orderIsLocked(o) { return o.status >= 1; }
function orderIsEudr(o) { return o.type === 'OUT' && DB.config.euCountries.includes(o.countryId); }
function orderQtyMatches(o) {
    const m3 = sum(o.items.filter(i => i.unit === 'm³'), i => Number(i.quantity));
    const sheets = sum(o.items.filter(i => i.unit === 'tấm'), i => Number(i.quantity));
    const total = sum(orderPallets(o), p => p.sheets);
    return Math.abs(m3 + sheets * (orderM3(o) / (total || 1)) - orderM3(o)) <= Math.max(0.01, orderM3(o) * 0.005);
}
function plotLockedBy(plotId) { return DB.orders.filter(o => orderIsLocked(o) && orderPlots(o).some(p => p.id === plotId)); }
function receiptLockedBy(id) { return DB.orders.filter(o => orderIsLocked(o) && orderReceipts(o).some(r => r.id === id)); }

/** Đơn đã khóa nhưng lô nguồn về sau đổi trạng thái: phải cảnh báo. */
function orderAlerts(o) {
    if (!orderIsLocked(o)) return [];
    return orderChecklist(o).filter(i => !i.ok);
}

const ORDER_STATUS = { '-3': 'Bị khách từ chối', '-2': 'Thu hồi giao dịch', '-1': 'Xóa (lưu trữ)', 0: 'Đang lên đơn', 1: 'Đang lên hàng', 2: 'Đang vận chuyển', 3: 'Đợi khách xác nhận', 4: 'Đã xác nhận' };

/** Lên hàng cần đủ dữ liệu EUDR và khóa nguồn; giao hàng cần số DDS. Đơn đã xác nhận không đổi được nữa. */
function setOrderStatus(o, status, by) {
    if (o.status === 4) throw new Error('Đơn đã được khách xác nhận, chỉ có thể xem');
    if (status >= 1) {
        const failed = orderChecklist(o).filter(i => !i.ok);
        if (failed.length) throw new Error('Chưa đủ điều kiện EUDR: ' + failed[0].label);
    }
    if (status >= 3 && orderIsEudr(o) && !o.dds) throw new Error('Đơn EU cần số tham chiếu DDS trước khi giao');
    if (status >= 1 && !o.confirmedAt) {
        o.confirmedAt = todayISO();
        o.confirmedBy = by;
    }
    if (status === 4) o.endDate = todayISO();
    o.status = status;
    logAction(o.id, 'Đổi trạng thái đơn', `${ORDER_STATUS[status]} bởi ${by}`);
}

function syncOrderPallets(o) { o.palletIds = uniq(o.cars.flatMap(c => c.palletIds)); }

/** Tra cứu công khai theo mã đơn và mật khẩu, có ghi lịch sử xem và nhập sai. */
function verifyOrderAccess(o, pass) {
    const at = new Date().toISOString();
    if (o.status < 2) return { ok: false, msg: 'Đơn chưa mở tra cứu' };
    if (o.viewingPeriod && todayISO() > o.viewingPeriod) return { ok: false, msg: 'Đã hết thời hạn xem đơn' };
    if (o.passCode && o.passCode !== pass) {
        o.failLog.push({ at });
        saveDB();
        return { ok: false, msg: 'Sai mật khẩu' };
    }
    o.viewLog.push({ at });
    saveDB();
    return { ok: true };
}

function retentionUntil(o) {
    if (!o.confirmedAt) return '';
    const d = new Date(o.confirmedAt);
    d.setFullYear(d.getFullYear() + DB.config.retentionYears);
    return d.toISOString().slice(0, 10);
}

function buildGeoJson(o) {
    return {
        type: 'FeatureCollection',
        features: orderPlots(o).map(p => ({
            type: 'Feature',
            geometry: { type: p.geometry.type, coordinates: p.geometry.coordinates },
            properties: {
                PlotID: p.id,
                ProducerName: p.owner,
                ProducerCountry: p.country,
                ProductionPlace: p.place,
                Area: p.areaHa,
                SpeciesScientific: p.species,
                HarvestFrom: p.harvestFrom,
                HarvestTo: p.harvestTo
            }
        }))
    };
}

/** Giữ đủ 6 chữ số thập phân khi xuất, vì JSON.stringify bỏ số 0 cuối. */
function geoJsonText(o) {
    return JSON.stringify(buildGeoJson(o), (key, value) => {
        if (key === 'coordinates') {
            const fix = v => Array.isArray(v) ? v.map(fix) : `§${v.toFixed(6)}§`;
            return fix(value);
        }
        return value;
    }, 1).replace(/"§(-?[\d.]+)§"/g, '$1');
}

function orderPackageData(o) {
    const plots = orderPlots(o);
    return {
        orderId: o.id,
        buyer: { name: o.customer, address: o.customerAddress, email: o.customerEmail, eori: o.eori },
        goods: { hsCode: o.hsCode, products: uniq(orderWOs(o).map(w => w.product)), netKg: orderKg(o), m3: orderM3(o), pallets: o.palletIds.length },
        species: orderSpecies(o),
        countries: orderCountries(o),
        harvest: harvestRange(plots),
        plots: plots.length,
        suppliers: orderSuppliers(o).map(s => ({ name: s.name, address: s.address, email: s.email })),
        dds: o.dds
    };
}

// ---------- Phả hệ hai chiều (FR8) ----------
function trace(code) {
    const q = (code || '').trim().toUpperCase();
    if (!q) return null;
    const res = { query: q, type: '', orders: [], pallets: [], wos: [], receipts: [], plots: [] };
    const fromWOs = wos => {
        res.wos = wos;
        res.receipts = uniq(wos.flatMap(woReceipts).map(r => r.id)).map(getReceipt);
        res.plots = uniq(res.receipts.flatMap(r => r.plotIds)).map(getPlot).filter(Boolean);
    };
    const forward = wos => {
        res.wos = wos;
        res.pallets = DB.pallets.filter(p => wos.some(w => w.id === p.workOrderId));
        res.orders = DB.orders.filter(o => o.palletIds.some(id => res.pallets.some(p => p.id === id)));
    };
    const match = list => list.find(x => x.id.toUpperCase() === q);

    const order = match(DB.orders);
    const pallet = match(DB.pallets);
    const wo = match(DB.workOrders) || DB.workOrders.find(w => w.lot && w.lot.toUpperCase() === q);
    const pkg = match(DB.packages);
    const receipt = match(DB.receipts);
    const plot = match(DB.plots);

    if (order) {
        res.type = 'Đơn hàng';
        res.orders = [order];
        res.pallets = orderPallets(order);
        fromWOs(orderWOs(order));
    } else if (pallet) {
        res.type = 'Pallet';
        res.pallets = [pallet];
        res.orders = DB.orders.filter(o => o.palletIds.includes(pallet.id));
        fromWOs([getWO(pallet.workOrderId)]);
    } else if (wo) {
        res.type = 'Lệnh / lô thành phẩm';
        forward([wo]);
        fromWOs([wo]);
    } else if (pkg || receipt) {
        const r = receipt || getReceipt(pkg.receiptId);
        res.type = pkg ? 'Kiện nguyên liệu' : 'Lô nguyên liệu';
        res.receipts = [r];
        res.plots = r.plotIds.map(getPlot).filter(Boolean);
        forward(DB.workOrders.filter(w => w.allocations.some(a => {
            const owner = getPackage(a.packageId);
            return pkg ? owner.id === pkg.id : owner.receiptId === r.id;
        })));
    } else if (plot) {
        res.type = 'Thửa đất';
        res.plots = [plot];
        res.receipts = DB.receipts.filter(r => r.plotIds.includes(plot.id));
        forward(DB.workOrders.filter(w => woReceipts(w).some(r => r.plotIds.includes(plot.id))));
    } else {
        return { query: q, type: '', notFound: true };
    }
    return res;
}
