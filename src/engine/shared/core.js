import { DEFAULT_INDUSTRY, getIndustry } from '../../config/industries';
import { TENANT } from '../../config/tenant';
import {
    buildSeed,
} from './mock_data.js';

/**
 * Lõi nghiệp vụ EUDR: lưu dữ liệu, nhật ký, kiểm tra GeoJSON, đánh giá rủi ro, phả hệ và gói dữ liệu DDS.
 * Không phụ thuộc giao diện để có thể kiểm thử riêng.
 */
export { TENANT };
export const STORE_PREFIX = 'ecotech2a-wood-v5';
/** Gói ngành đang chạy. Công đoạn, đơn vị, mã HS lấy từ đây; lõi không rẽ nhánh theo ngành. */
export let PACK = null;
export let STAGES = [];
export let STAGE_SPECS = [];
function applyPack(id) {
    PACK = getIndustry(id);
    STAGES = PACK.stages.map(s => s.name);
    STAGE_SPECS = PACK.stages.map((s, i) => ({
        ccpName: s.name,
        ccpControl: s.control,
        machines: [`MC-${String(i + 1).padStart(2, '0')}`],
        outLabel: s.outLabel,
        outUnit: s.outUnit,
        params: s.params || [],
        qc: !!s.qc,
        scrap: !!s.scrap,
        patchLot: !!s.patchLot
    }));
}
applyPack(DEFAULT_INDUSTRY);
export function setIndustry(id) { applyPack(id); }
export const storeKey = () => `${STORE_PREFIX}:${PACK.id}`;
export const unitName = () => PACK.unit;
const sameUnit = (a, b) => !!STAGE_SPECS[a] && !!STAGE_SPECS[b] && STAGE_SPECS[a].outUnit === STAGE_SPECS[b].outUnit;
export const SCRAP_USES = ['Băm làm chân pallet, giữ mã lô gốc', 'Dùng lại trong lệnh này, giữ mã lô gốc', 'Không rõ lô: chỉ bán ngoài EU'];
export const SHIFTS = ['Ca 1', 'Ca 2', 'Ca 3'];

export const ROLES = {
    kinhdoanh: 'Kinh doanh xuất khẩu',
    sanxuat: 'Quản đốc sản xuất',
    kho: 'Thủ kho nguyên liệu',
    tuanthu: 'KCS & Tuân thủ EUDR',
    quantri: 'Quản trị hệ thống'
};
export const PERMS = {
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
export const LEVEL_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export let DB = null;

export const storage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem() {}, removeItem() {} };

export function loadDB() {
    try { DB = JSON.parse(storage.getItem(storeKey())); } catch (e) { DB = null; }
    const seed = buildSeed(PACK);
    if (!DB || DB.version !== seed.version) {
        DB = seed;
        const seedLog = DB.seedLog || [];
        delete DB.seedLog;
        saveDB();
        logAction('Hệ thống', 'Nạp dữ liệu mẫu', 'Khởi tạo');
        seedLog.forEach(([entity, action, detail]) => logAction(entity, action, detail));
    }
    return DB;
}

export function saveDB() { storage.setItem(storeKey(), JSON.stringify(DB)); }

export function resetDB() {
    storage.removeItem(storeKey());
    return loadDB();
}

/** Bản demo không có đăng nhập: dùng một vai trò đủ quyền. */
export function currentRole() { return 'quantri'; }
export function setRole(role) { storage.setItem('ecotech2a-role', role); }
export function can(perm) {
    const role = currentRole();
    if (role === 'quantri') return true;
    return (PERMS[perm] || []).includes(role);
}
export function rolesFor(perm) { return (PERMS[perm] || []).map(r => ROLES[r]).join(' hoặc '); }

export function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// ---------- Nhật ký chỉ ghi thêm, mỗi dòng móc nối bằng mã băm của dòng trước ----------
export function hashText(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

export function auditHash(e) { return hashText([e.prev, e.at, e.role, e.entity, e.action, e.detail].join('|')); }

export function logAction(entity, action, detail) {
    const prev = DB.audit.length ? DB.audit[DB.audit.length - 1].hash : '00000000';
    const entry = { at: new Date().toISOString(), role: ROLES[currentRole()], entity, action, detail: detail || '', prev };
    entry.hash = auditHash(entry);
    DB.audit.push(entry);
    saveDB();
}

export function verifyAudit() {
    let prev = '00000000';
    for (let i = 0; i < DB.audit.length; i++) {
        const e = DB.audit[i];
        if (e.prev !== prev || auditHash(e) !== e.hash) return { ok: false, index: i };
        prev = e.hash;
    }
    return { ok: true, count: DB.audit.length };
}

// ---------- Tra cứu ----------
export const byId = (list, id) => (list || []).find(x => x.id === id);
export const getSupplier = id => byId(DB.suppliers, id);
export const getPlot = id => byId(DB.plots, id);
export const getReceipt = id => byId(DB.receipts, id);
export const getPackage = id => byId(DB.packages, id);
export const getWO = id => byId(DB.workOrders, id);
export const getPallet = id => byId(DB.pallets, id);
export const getOrder = id => byId(DB.orders, id);
export const getFarmer = id => byId(DB.farmers, id);
export const getMachine = id => byId(DB.machines, id);
export const getBay = id => byId(DB.warehouseBays, id);
export const getProvince = id => byId(DB.provinces, id);
export const getDistrict = id => byId(DB.districts, id);
export const getWard = id => byId(DB.wards, id);
export const uniq = list => [...new Set(list)];
export const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
export const round = (n, d = 2) => +Number(n).toFixed(d);

export const unitM3Of = o => o.unitM3 || 0;
export const receiptM3 = r => sum(DB.packages.filter(p => p.receiptId === r.id), p => p.m3);
export const receiptNetKg = r => r.gross - r.tare;
export const SOURCE_DOCS = {
    DOMESTIC: ['Bảng kê lâm sản', 'Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'],
    IMPORT: ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật'],
    RECYCLED: ['Chứng nhận tái chế', 'Tỷ lệ nguyên sinh', 'Nguồn phần nguyên sinh']
};
export const SOURCE_LABEL = { DOMESTIC: 'Rừng trồng trong nước', IMPORT: 'Nhập khẩu', RECYCLED: 'Tái chế, phụ phẩm' };
export const sourceOf = (supplier, receipt) => (receipt && receipt.sourceCategory) || (supplier && supplier.type === 'IMPORT' ? 'IMPORT' : 'DOMESTIC');
/** Mỗi lô gắn đúng một trong ba nguồn; bộ hồ sơ theo nguồn đó. */
export const requiredDocs = (supplier, receipt) => SOURCE_DOCS[sourceOf(supplier, receipt)];

// ---------- Kiểm tra hình học (FR4) ----------
export function ringAreaHa(ring) {
    const R = 6378137, rad = Math.PI / 180;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
        area += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad));
    }
    return Math.abs(area * R * R / 2) / 10000;
}

export function ringSelfIntersects(ring) {
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

export function pointsOf(geometry) {
    if (geometry.type === 'Point') return [geometry.coordinates];
    if (geometry.type === 'Polygon') return geometry.coordinates.flat();
    return [];
}

/** Kiểm tra một thửa. minDecimals lấy từ văn bản gốc khi có, vì JSON.parse làm mất số 0 cuối. */
export function checkGeometry(geometry, areaHa, country, minDecimals) {
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

export function plotGeoCheck(plot) { return checkGeometry(plot.geometry, plot.areaHa, plot.country); }

/** Số chữ số thập phân nhỏ nhất đọc từ văn bản GeoJSON gốc. */
export function minDecimalsInText(text) {
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
export function validateGeoJsonText(text) {
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
export function countryRisk(code) { return DB.config.countryRisk[code] || 'STANDARD'; }

export function assessReceipt(r) {
    const supplier = getSupplier(r.supplierId);
    const plots = r.plotIds.map(getPlot).filter(Boolean);
    const factors = [];
    const add = (name, level, msg) => factors.push({ name, level, msg });

    const recycledOnly = sourceOf(supplier, r) === 'RECYCLED' && !(Number(r.virginPct) > 0);
    if (recycledOnly) {
        const missing = requiredDocs(supplier, r).filter(d => !r.docs.includes(d));
        add('Chứng nhận tái chế', r.docs.includes('Chứng nhận tái chế') ? 'LOW' : 'HIGH', r.docs.includes('Chứng nhận tái chế') ? 'Đã có' : 'Tuyên bố tái chế thiếu bằng chứng');
        add('Hồ sơ tái chế', missing.length ? 'MEDIUM' : 'LOW', missing.length ? 'Thiếu: ' + missing.join(', ') : 'Đủ');
    } else if (!plots.length) {
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
        const missing = requiredDocs(supplier, r).filter(d => !r.docs.includes(d));
        add('Hồ sơ hợp pháp', noLand ? 'HIGH' : missing.length ? 'MEDIUM' : 'LOW', noLand ? 'Thiếu giấy quyền sử dụng đất' : missing.length ? 'Thiếu: ' + missing.join(', ') : 'Đủ');
    }

    const contract = r.contractId ? getContract(r.contractId) : null;
    if (r.contractId) {
        if (!contract) add('Hợp đồng mua', 'HIGH', `Không tìm thấy hợp đồng ${r.contractId}`);
        else {
            const ca = assessContract(contract, r.date);
            const first = ca.issues.find(i => i.level === ca.level);
            add('Hợp đồng mua', ca.level, `${contract.no}: ${first ? first.msg : 'Đủ điều khoản và hồ sơ'}`);
            if (contract.moist && r.moisture && r.moisture > contract.moist) add('Độ ẩm so với hợp đồng', 'MEDIUM', `Đo ${r.moisture}%, hợp đồng tối đa ${contract.moist}%`);
        }
    }

    const chainLevel = { DIRECT: 'LOW', AGENT: 'MEDIUM', MULTI: 'HIGH' }[supplier ? supplier.chain : 'MULTI'];
    const allowed = contract ? contractPlotIds(contract) : null;
    if (chainLevel === 'MEDIUM' && allowed && plots.length) {
        const outside = plots.filter(p => !allowed.includes(p.id));
        add('Độ phức tạp chuỗi', outside.length ? 'HIGH' : 'LOW', outside.length ? `Thửa ${outside.map(p => p.id).join(', ')} không thuộc hộ trong hợp đồng` : 'Thương lái, mọi thửa thuộc hộ trong danh sách');
    } else if (chainLevel === 'MEDIUM' && plots.length) add('Độ phức tạp chuỗi', 'LOW', 'Qua một đại lý, đã có tọa độ từng hộ');
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
export function receiptStatus(r) {
    const { level } = assessReceipt(r);
    if (level === 'HIGH' || (r.decision && r.decision.result === 'FAIL')) return 'FAIL';
    if (!r.approval) return 'PENDING';
    if (level === 'MEDIUM' && !r.mitigations.length) return 'PENDING';
    return 'PASS';
}

export function approveReceipt(r, by, reason) {
    const { level } = assessReceipt(r);
    if (level === 'HIGH') throw new Error('Lô có yếu tố rủi ro cao, không thể duyệt Đạt');
    if (level === 'MEDIUM' && !r.mitigations.length) throw new Error('Mức trung bình cần ghi biện pháp giảm thiểu trước khi duyệt');
    if (level === 'MEDIUM' && !reason) throw new Error('Cần ghi lý do duyệt');
    r.approval = { by, at: todayISO(), reason: reason || 'Đủ hồ sơ theo bộ tiêu chuẩn' };
    r.decision = { result: 'PASS', action: 'PRODUCE', by, at: r.approval.at, reason: r.approval.reason };
    const bay = getBay(r.bay);
    const target = bay && bay.zone !== 'ZONE_A' ? DB.warehouseBays.find(b => b.zone === 'ZONE_A' && b.source === sourceOf(getSupplier(r.supplierId), r)) : null;
    if (target) {
        logAction(r.id, 'Chuyển ô kho', `${r.bay} sang ${target.id}`);
        r.bay = target.id;
    }
    logAction(r.id, 'Duyệt Đạt', `${by}: ${r.approval.reason}`);
}

// ---------- Luồng mua vào: hợp đồng, nguồn cung, chốt chặn tại cổng, quyết định ----------
/** Mức kết quả theo bộ tiêu chuẩn: Thấp = Đạt, Trung bình = Cần bổ sung, Cao = Không đạt. */
export const LEVEL_RESULT = { LOW: 'PASS', MEDIUM: 'PENDING', HIGH: 'FAIL' };
export const RESULT_LABEL = { PASS: 'Đạt', PENDING: 'Cần bổ sung', FAIL: 'Không đạt' };
export const SUPPLIER_KINDS = [['OWNER', 'Chủ rừng / lâm trường'], ['TRADER', 'Thương lái / đại lý'], ['MILL', 'Xưởng sơ chế / nhà máy bóc'], ['IMPORTER', 'Bên bán nước ngoài']];
export const supplierKind = s => (s && s.kind) || (s && s.type === 'IMPORT' ? 'IMPORTER' : s && s.chain === 'AGENT' ? 'TRADER' : 'OWNER');
export const isTrader = s => supplierKind(s) === 'TRADER';

/** Mức yêu cầu: req bắt buộc (thiếu là Không đạt), imp bắt buộc với hàng nhập khẩu, rec nên có (thiếu là Cần bổ sung), opt tùy chọn. */
export const CONTRACT_CLAUSES = [
    ['coord', 'Bên bán cung cấp tọa độ WGS84 (điểm hoặc polygon) của từng lô khai thác cho mỗi chuyến giao', 'req'],
    ['sci', 'Bên bán khai tên khoa học đầy đủ và tên thương mại của loài gỗ', 'req'],
    ['harvest', 'Bên bán khai kỳ khai thác của từng lô hàng', 'req'],
    ['defor', 'Cam kết gỗ không từ đất bị phá rừng hoặc suy thoái rừng sau 31/12/2020', 'req'],
    ['legal', 'Cam kết gỗ được khai thác hợp pháp theo luật nước khai thác', 'req'],
    ['nomix', 'Không trộn nguồn khác vào lô đã khai báo, báo trước khi đổi nguồn', 'req'],
    ['origin3', 'Khai nước khai thác gỗ gốc nếu gỗ tròn được nhập từ nước thứ ba', 'imp'],
    ['audit', 'Bên mua có quyền kiểm tra tại chỗ, truy xuất và yêu cầu hồ sơ gốc', 'rec'],
    ['retain', 'Bên bán lưu hồ sơ tối thiểu 5 năm', 'rec'],
    ['reject', 'Quyền từ chối hoặc trả hàng khi hồ sơ không đạt', 'rec'],
    ['refund', 'Thu hồi, thay thế hoặc hoàn tiền nếu lô bị phát hiện không đạt', 'rec']
];
export const CONTRACT_DOCS = {
    DOMESTIC: [['biz', 'Đăng ký kinh doanh, mã số thuế hoặc CCCD của bên bán', 'req'], ['land', 'Giấy tờ quyền sử dụng đất hoặc rừng của vùng khai thác', 'req'], ['permit', 'Giấy phép hoặc thông báo khai thác', 'req'], ['labor', 'Cam kết tuân thủ pháp luật lao động, môi trường, thuế', 'req'], ['defor', 'Bằng chứng không phá rừng sau 31/12/2020 (ảnh vệ tinh, xác nhận địa phương)', 'req'], ['cert', 'Chứng chỉ FSC / PEFC / VFCS (hỗ trợ, không thay nghĩa vụ DDS)', 'opt']],
    IMPORT: [['biz', 'Đăng ký kinh doanh của bên bán và nhà máy sơ chế', 'req'], ['legal', 'Hồ sơ khai thác hợp pháp tại nước khai thác gỗ gốc', 'req'], ['permit', 'Giấy phép hoặc hợp đồng khai thác của chủ rừng', 'req'], ['origin', 'Kê khai nước và vùng khai thác gỗ gốc', 'req'], ['defor', 'Bằng chứng không phá rừng sau 31/12/2020', 'req'], ['cert', 'Chứng chỉ FSC / PEFC CoC (hỗ trợ, không thay nghĩa vụ DDS)', 'opt']],
    RECYCLED: [['biz', 'Đăng ký kinh doanh của bên bán', 'req'], ['recycle', 'Chứng nhận tái chế hoặc biên bản bàn giao phụ phẩm', 'req'], ['virgin', 'Kê khai tỷ lệ nguyên sinh và nguồn phần nguyên sinh', 'req'], ['cert', 'Chứng chỉ FSC / PEFC Recycled', 'opt']]
};
export const REQ_LABEL = { req: 'bắt buộc', imp: 'bắt buộc với hàng nhập khẩu', rec: 'nên có', opt: 'tùy chọn' };
export const DECISION_ACTIONS = { PRODUCE: 'Cấp cho sản xuất', SUPPLEMENT: 'Chờ bổ sung hồ sơ', RETURN: 'Trả nhà cung cấp', NON_EU: 'Chỉ dùng cho đơn ngoài EU, đã tách riêng', QUARANTINE: 'Tiếp tục cách ly chờ bằng chứng' };
export const EXPIRY_WARN_DAYS = 30;

export const getContract = id => byId(DB.contracts, id);
export const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / 864e5);
export const contractSci = c => c.sci || c.species || '';
/** Khối lượng hợp đồng: số kiện × số tấm × dài × rộng × dày (mm). */
export function contractM3(c) {
    return c.bales && c.per && c.len && c.wid && c.thk ? round(c.bales * c.per * c.len * c.wid * c.thk / 1e9, 3) : null;
}
export const contractReceipts = c => DB.receipts.filter(r => r.contractId === c.id);
export const contractReceivedM3 = c => round(sum(contractReceipts(c), receiptM3), 3);
/** Thửa mà lô theo hợp đồng này được phép gắn: thương lái chỉ lấy thửa của các hộ trong danh sách. */
export function contractPlotIds(c) {
    const s = getSupplier(c.supplierId);
    if (isTrader(s)) return uniq((c.farmerIds || []).flatMap(id => (getFarmer(id) || {}).plots || []));
    return DB.plots.filter(p => p.supplierId === c.supplierId).map(p => p.id);
}
export const farmerReady = f => !!f && (f.plots || []).length > 0 && !!f.landDoc && !/chưa/i.test(f.landDoc);

/** Chấm một hợp đồng tại ngày `at`. Mục 'NOTE' chỉ để nhắc, không đổi mức. */
export function assessContract(c, at = todayISO()) {
    const issues = [];
    const add = (level, msg) => issues.push({ level, msg });
    const s = getSupplier(c.supplierId);
    const origin = c.origin || 'DOMESTIC';
    if (!s) add('HIGH', 'Chưa chọn bên bán');
    if (!c.no) add('HIGH', 'Thiếu số hợp đồng');
    if (!c.date) add('MEDIUM', 'Chưa ghi ngày ký');
    if (c.end && c.date && c.end < c.date) add('MEDIUM', 'Ngày hết hiệu lực sớm hơn ngày ký');
    if (!c.end) add('MEDIUM', 'Chưa ghi ngày hết hiệu lực');
    else if (c.end < at) add('HIGH', 'Hợp đồng đã hết hiệu lực');
    else if (daysBetween(at, c.end) <= EXPIRY_WARN_DAYS) add('NOTE', `Còn ${daysBetween(at, c.end)} ngày hết hiệu lực, cần gia hạn`);
    const sci = contractSci(c).trim();
    if (!(sci.split(/\s+/).length >= 2 && !/\bspp?\.?$/i.test(sci))) add('HIGH', 'Chưa có tên khoa học đến cấp loài, không chấp nhận "spp."');
    if (origin !== 'RECYCLED') {
        if (!(c.len > 0 && c.wid > 0 && c.thk > 0 && c.per > 0 && c.bales > 0)) add('MEDIUM', 'Chưa đủ quy cách nhận hàng (dài, rộng, dày, tấm mỗi kiện, số kiện)');
        if (!(c.moist > 0)) add('MEDIUM', 'Chưa quy định độ ẩm tối đa khi nhận');
        if (!(c.kgm3 > 0)) add('MEDIUM', 'Chưa có hệ số quy đổi kg/m³, cần để ghi khối lượng tịnh vào DDS');
    }
    CONTRACT_CLAUSES.forEach(([k, t, r]) => {
        if (r === 'imp' && origin !== 'IMPORT') return;
        if (r !== 'opt' && !(c.clauses || {})[k]) add(r === 'rec' ? 'MEDIUM' : 'HIGH', 'Hợp đồng thiếu điều khoản: ' + t);
    });
    (CONTRACT_DOCS[origin] || []).forEach(([k, t, r]) => {
        const got = (c.docs || {})[k];
        if (!got && r !== 'opt') add('HIGH', 'Thiếu hồ sơ: ' + t);
        else if (got && !(c.scans || {})[k]) add('MEDIUM', 'Chưa có bản scan: ' + t);
    });
    if (s && isTrader(s)) {
        const farmers = (c.farmerIds || []).map(getFarmer).filter(Boolean);
        if (!farmers.length) add('HIGH', 'Thương lái chưa khai danh sách hộ cung cấp');
        else {
            const notReady = farmers.filter(f => !farmerReady(f));
            if (notReady.length) add('NOTE', `${notReady.length}/${farmers.length} hộ thiếu tọa độ hoặc giấy tờ đất, chỉ nhận hàng từ hộ đủ hồ sơ`);
        }
    }
    const level = issues.reduce((m, i) => LEVEL_RANK[i.level] > LEVEL_RANK[m] ? i.level : m, 'LOW');
    return { level, result: LEVEL_RESULT[level], issues };
}

export const supplierContracts = id => DB.contracts.filter(c => c.supplierId === id);
/** Hợp đồng dùng được tại ngày `at`: còn hiệu lực và không Không đạt. */
export const usableContracts = (supplierId, at = todayISO()) => supplierContracts(supplierId).filter(c => c.date <= at && c.end >= at && assessContract(c, at).level !== 'HIGH');

/** Xếp loại nguồn cung: OK được mua, COND có điều kiện, STOP dừng mua. */
export function supplierStanding(s, at = todayISO()) {
    const reasons = [], notes = [];
    if (!s.commitment) reasons.push('Chưa ký cam kết EUDR');
    if (countryRisk(s.country) === 'HIGH') reasons.push(`Quốc gia ${s.country} thuộc nhóm rủi ro cao`);
    const usable = usableContracts(s.id, at);
    if (!usable.length) reasons.push(supplierContracts(s.id).length ? 'Không còn hợp đồng Đạt hoặc còn hiệu lực' : 'Chưa có hợp đồng mua');
    usable.forEach(c => assessContract(c, at).issues.filter(i => i.level !== 'LOW').forEach(i => notes.push(`${c.no}: ${i.msg}`)));
    if (isTrader(s)) {
        const farmers = DB.farmers.filter(f => f.traderId === s.id);
        const ready = farmers.filter(farmerReady).length;
        if (!farmers.length) reasons.push('Thương lái chưa có danh sách hộ');
        else if (ready < farmers.length) notes.push(`${ready}/${farmers.length} hộ đủ hồ sơ`);
    }
    if (reasons.length) return { key: 'STOP', label: 'Dừng mua', reasons, notes };
    if (notes.length) return { key: 'COND', label: 'Có điều kiện', reasons: notes, notes };
    return { key: 'OK', label: 'Được mua', reasons: [], notes };
}

/**
 * Chốt chặn tại cổng (bước 5). blocks: xe không được vào kho. warns: vẫn nhận, lô vào Khu B nếu chấm ra Cần bổ sung.
 * input: { supplierId, contractId, plotIds, sourceCategory, virginPct, species, date, m3, moisture }
 */
export function gateCheck(input) {
    const blocks = [], warns = [];
    const at = input.date || todayISO();
    const s = getSupplier(input.supplierId);
    const c = input.contractId ? getContract(input.contractId) : null;
    const plots = (input.plotIds || []).map(getPlot).filter(Boolean);
    const recycledOnly = input.sourceCategory === 'RECYCLED' && !(Number(input.virginPct) > 0);
    if (!s) blocks.push('Chưa xác định nhà cung cấp');
    if (!c) blocks.push('Chưa gắn hợp đồng mua');
    else {
        if (c.supplierId !== input.supplierId) blocks.push(`Hợp đồng ${c.no} thuộc bên bán khác`);
        const ca = assessContract(c, at);
        if (c.end && c.end < at) blocks.push(`Hợp đồng ${c.no} đã hết hiệu lực ngày ${c.end}`);
        else if (ca.level === 'HIGH') blocks.push(`Hợp đồng ${c.no} Không đạt: ${(ca.issues.find(i => i.level === 'HIGH') || {}).msg}`);
        else if (ca.level === 'MEDIUM') warns.push(`Hợp đồng ${c.no} còn Cần bổ sung`);
        const left = contractM3(c) === null ? null : round(contractM3(c) - contractReceivedM3(c), 3);
        if (left !== null && input.m3 > left) warns.push(`Vượt khối lượng còn lại của hợp đồng (${left} m³)`);
        if (c.moist && input.moisture && +input.moisture > c.moist) warns.push(`Độ ẩm ${input.moisture}% vượt mức hợp đồng ${c.moist}%`);
        if (input.species && contractSci(c) && input.species !== contractSci(c)) warns.push(`Loài gỗ khác hợp đồng (${contractSci(c)})`);
        if (s && isTrader(s)) {
            const allowed = contractPlotIds(c);
            const outside = plots.filter(p => !allowed.includes(p.id));
            if (outside.length) blocks.push(`Thửa ${outside.map(p => p.id).join(', ')} không thuộc hộ được phép trong hợp đồng thương lái`);
        }
    }
    if (input.sourceCategory === 'RECYCLED' && (input.virginPct === null || input.virginPct === undefined || input.virginPct === '')) blocks.push('Gỗ tái chế chưa khai tỷ lệ nguyên sinh (không rõ nguồn)');
    if (!recycledOnly && !plots.length) blocks.push('Chưa gắn thửa đất nào cho lô');
    const high = uniq(plots.map(p => p.country).filter(code => countryRisk(code) === 'HIGH'));
    if (high.length) blocks.push(`Gốc từ nước rủi ro cao: ${high.join(', ')}. Dừng nhập, báo Tuân thủ`);
    const allowedOrigins = DB.config.allowedOrigins || [];
    const outsideList = uniq(plots.map(p => p.country).filter(code => code !== 'VN' && allowedOrigins.length && !allowedOrigins.includes(code)));
    if (outsideList.length) blocks.push(`Nước ${outsideList.join(', ')} ngoài danh sách vùng địa lý tích cực (NĐ 102/2020)`);
    return { ok: !blocks.length, blocks, warns };
}

/** Ô kho mặc định khi mới nhận: chấm ra Cao thì cách ly Khu C, còn lại giữ ở Khu B chờ Tuân thủ ký. */
export function initialBay(r) {
    const zone = assessReceipt(r).level === 'HIGH' ? 'ZONE_C' : 'ZONE_B';
    return (DB.warehouseBays.find(b => b.zone === zone) || {}).id || '';
}

/** Quyết định của Tuân thủ cho lô Cần bổ sung hoặc Không đạt. Lô đổi ô theo khu. */
export function decideReceipt(r, { result, action, by, reason }) {
    if (!by) throw new Error('Cần ghi người quyết định');
    if (!reason) throw new Error('Cần ghi lý do');
    if (result === 'PASS') { approveReceipt(r, by, reason); r.done = true; return; }
    if (result === 'PENDING' && assessReceipt(r).level === 'HIGH') throw new Error('Lô có yếu tố rủi ro cao, chỉ được xếp Không đạt');
    if (result === 'FAIL' && !['RETURN', 'NON_EU', 'QUARANTINE'].includes(action)) throw new Error('Chọn cách xử lý lô Không đạt');
    r.approval = null;
    r.decision = { result, action: result === 'PENDING' ? 'SUPPLEMENT' : action, by, at: todayISO(), reason };
    r.done = result === 'FAIL' && action !== 'QUARANTINE';
    const zone = result === 'FAIL' ? 'ZONE_C' : 'ZONE_B';
    const bay = getBay(r.bay);
    if (!bay || bay.zone !== zone) {
        const target = DB.warehouseBays.find(b => b.zone === zone);
        if (target) { logAction(r.id, 'Chuyển ô kho', `${r.bay || '–'} sang ${target.id}`); r.bay = target.id; }
    }
    logAction(r.id, `Quyết định ${RESULT_LABEL[result]}`, `${by}: ${DECISION_ACTIONS[r.decision.action]}; ${reason}`);
}

export function harvestRange(plots) {
    const from = plots.map(p => p.harvestFrom).filter(Boolean).sort()[0];
    const to = plots.map(p => p.harvestTo || p.harvestFrom).filter(Boolean).sort().pop();
    return from ? `${from} → ${to}` : '';
}

// ---------- Tồn kho ----------
export function packageAllocated(pkgId) {
    return sum(DB.workOrders, w => sum(w.allocations.filter(a => a.packageId === pkgId), a => a.m3));
}
export function packageStock(pkg) { return round(pkg.m3 - packageAllocated(pkg.id), 4); }
/** Tồn hiện tại của một ô: lô nguyên liệu còn lại và kiện thành phẩm chưa xuất. */
export function bayStock(bay) {
    const raw = sum(DB.receipts.filter(r => r.bay === bay.id), receiptStock);
    const finished = sum(DB.pallets.filter(p => p.location === bay.id && !palletShipped(p)), palletM3);
    return round(raw + finished, 2);
}
export function receiptStock(r) { return round(sum(DB.packages.filter(p => p.receiptId === r.id), packageStock), 3); }

// ---------- Lệnh sản xuất (FR7) ----------
export function createWorkOrder(data, allocations) {
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
        finishedQty: 0, qaNote: '', lot: '', stages: STAGES.map(() => ({ status: 'TODO' }))
    };
    DB.workOrders.push(wo);
    logAction(wo.id, 'Phát lệnh', `${wo.product}; thị trường ${wo.market}; ${allocations.length} kiện, ${round(sum(allocations, a => a.m3))} m³`);
    return wo;
}

export function woInputM3(wo) { return sum(wo.allocations, a => a.m3); }
export function woOutputM3(wo, qty = wo.finishedQty) { return qty * unitM3Of(wo); }
export function woReceipts(wo) { return uniq(wo.allocations.map(a => getPackage(a.packageId).receiptId)).map(getReceipt); }
export function woPlots(wo) { return uniq(woReceipts(wo).flatMap(r => r.plotIds)).map(getPlot).filter(Boolean); }
export function woDone(wo) { return wo.stages.every(s => s.status === 'DONE'); }

/** Đối soát khối lượng vào/ra của từng lệnh. Đây là kiểm tra chống lẫn nguyên liệu, không phải cân bằng khối lượng (mass balance). */
export function reconcile(wo, qty = wo.finishedQty) {
    const input = woInputM3(wo), output = woOutputM3(wo, qty);
    const rate = input ? output / input * 100 : 0;
    const { recoveryMin: min, recoveryMax: max } = DB.config;
    return { input: round(input), output: round(output), rate: round(rate), overRun: output > input, outOfBand: rate < min || rate > max, min, max };
}

/** Lệnh EU bị giữ khi có lô nguồn không còn Đạt: không được ghi tiếp công đoạn. */
export function woHoldReasons(wo) {
    if (wo.market !== 'EU') return [];
    return woReceipts(wo).filter(r => receiptStatus(r) !== 'PASS').map(r => r.id);
}

export function stageOutput(wo, index) { return index < 0 ? null : wo.stages[index].out; }

/** Kiểm tra một bản ghi công đoạn. Dùng chung cho ghi mới và sửa. */
export function validateStage(wo, index, data, now = Date.now()) {
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
        if (p.tolerance !== undefined && wo.t !== undefined && round(Math.abs(v - wo.t), 6) > p.tolerance) throw new Error(`${p.label} lệch quá ±${p.tolerance} so với ${wo.t}`);
    });
    if (spec.patchLot && Number(data.patches) > 0 && !woReceipts(wo).some(r => r.id === data.patchLot)) throw new Error('Vật liệu vá phải thuộc một lô trong lệnh');
    if (spec.scrap && !SCRAP_USES.includes(data.scrapUse)) throw new Error('Chọn cách xử lý phế liệu');
    const prevOut = sameUnit(index - 1, index) ? (stageOutput(wo, index - 1) ?? null) : null;
    if (spec.qc) {
        const [a, b, cc] = ['gradeA', 'gradeB', 'gradeC'].map(k => Number(data[k]) || 0);
        if (!(a > 0)) throw new Error('Nhập số đạt xuất EU');
        if (prevOut !== null && a + b + cc !== prevOut) throw new Error(`Hạng A + B + C phải bằng ${prevOut} ${unitName()} vào KCS`);
        const rec = reconcile(wo, a);
        if (rec.overRun) throw new Error(`Thành phẩm ${rec.output} m³ lớn hơn nguyên liệu ${rec.input} m³: nghi có nguyên liệu ngoài hồ sơ`);
        if (rec.outOfBand && !data.qaNote) throw new Error(`Tỷ lệ thu hồi ${rec.rate}% ngoài dải ${rec.min}-${rec.max}%: QA phải giải trình`);
        return a;
    }
    const out = Number(data.out);
    if (!(out > 0)) throw new Error(`Nhập ${spec.outLabel}`);
    if (prevOut !== null && out > prevOut) throw new Error(`Số ra ${out} lớn hơn số vào ${prevOut}: nghi lẫn nguyên liệu ngoài lệnh`);
    return out;
}

export function stageRecord(data, out) {
    const { reason, ...rest } = data;
    return { ...rest, status: 'DONE', out, at: String(data.end).slice(0, 10) };
}

export function recordStage(wo, index, data) {
    if (wo.stages[index].status === 'DONE') throw new Error('Công đoạn đã ghi nhận, muốn đổi phải dùng Sửa có lý do');
    if (index > 0 && wo.stages[index - 1].status !== 'DONE') throw new Error('Phải hoàn tất công đoạn trước');
    const hold = woHoldReasons(wo);
    if (hold.length) throw new Error(`Lệnh bị giữ vì lô ${hold.join(', ')} không còn Đạt`);
    const out = validateStage(wo, index, data);
    wo.stages[index] = { ...stageRecord(data, out), revisions: [] };
    if (STAGE_SPECS[index].qc) {
        wo.finishedQty = out;
        wo.qaNote = data.qaNote || '';
        wo.lot = 'FG-' + wo.id.slice(3);
    }
    logAction(wo.id, 'Ghi công đoạn', `${STAGES[index]}: ra ${out} ${STAGE_SPECS[index].outUnit}; ${data.by}, xác nhận ${data.confirmBy}`);
}

/** Sửa bản ghi: bắt buộc lý do, lưu bản cũ. Đã đóng pallet thì không sửa được nữa. */
export function correctStage(wo, index, data, reason) {
    if (!reason || !reason.trim()) throw new Error('Sửa nhật ký phải ghi lý do');
    if (DB.pallets.some(p => p.workOrderId === wo.id)) throw new Error('Lệnh đã đóng pallet, không được sửa nhật ký');
    const old = wo.stages[index];
    if (old.status !== 'DONE') throw new Error('Công đoạn chưa ghi');
    const next = wo.stages[index + 1];
    const out = validateStage(wo, index, data);
    if (next && next.status === 'DONE' && sameUnit(index, index + 1) && next.out > out) throw new Error(`Công đoạn sau đã ghi ${next.out} ${unitName()}, không thể giảm xuống ${out}`);
    const { revisions = [], ...snapshot } = old;
    wo.stages[index] = { ...stageRecord(data, out), revisions: [...revisions, { ...snapshot, changedAt: new Date().toISOString(), reason, role: ROLES[currentRole()] }] };
    if (STAGE_SPECS[index].qc) {
        wo.finishedQty = out;
        wo.qaNote = data.qaNote || '';
    }
    logAction(wo.id, 'Sửa công đoạn', `${STAGES[index]}: ${reason}`);
}

// ---------- Pallet ----------
export function woPalletQty(wo) { return sum(DB.pallets.filter(p => p.workOrderId === wo.id), p => p.qty); }
export function palletM3(p) { return round(p.qty * unitM3Of(getWO(p.workOrderId)), 3); }

export function createPallet(data) {
    const wo = getWO(data.workOrderId);
    if (!woDone(wo)) throw new Error('Lệnh chưa hoàn tất KCS');
    const bay = getBay(data.location);
    if (bay && bay.zone === 'EXPORT' && wo.market !== 'EU') throw new Error('Hàng ngoài EU không được vào kho thành phẩm EU');
    if (bay && bay.zone === 'NON_EU' && wo.market === 'EU') throw new Error('Hàng lệnh EU phải vào kho thành phẩm EU');
    const left = wo.finishedQty - woPalletQty(wo);
    if (data.qty <= 0 || data.qty > left) throw new Error(`Lệnh chỉ còn ${left} ${unitName()} chưa đóng pallet`);
    const no = DB.pallets.reduce((m, p) => Math.max(m, Number(p.id.slice(-4))), 100) + 1;
    const pallet = { id: 'PAL-2026-' + String(no).padStart(4, '0'), created: todayISO(), ...data };
    DB.pallets.push(pallet);
    logAction(pallet.id, 'Đóng pallet', `${pallet.qty} ${unitName()} từ ${wo.lot}`);
    return pallet;
}

export function palletShipped(p) { const o = palletOrder(p.id); return !!o && o.status >= 2; }
export function palletOrder(palletId) { return DB.orders.find(o => o.status >= 0 && o.palletIds.includes(palletId)); }

// ---------- Đơn hàng và gói dữ liệu DDS (FR9, FR10, FR13) ----------
export function orderWOs(o) { return uniq(o.palletIds.map(id => getPallet(id).workOrderId)).map(getWO); }
export function orderReceipts(o) { return uniq(orderWOs(o).flatMap(woReceipts).map(r => r.id)).map(getReceipt); }
export function orderPlots(o) { return uniq(orderReceipts(o).flatMap(r => r.plotIds)).map(getPlot).filter(Boolean); }
export function orderPallets(o) { return o.palletIds.map(getPallet); }
export function orderM3(o) { return round(sum(orderPallets(o), palletM3)); }
export function orderKg(o) { return sum(orderPallets(o), p => p.kg); }
export function orderSpecies(o) { return uniq(orderReceipts(o).map(r => r.species)); }
export function orderCountries(o) { return uniq(orderPlots(o).map(p => p.country)); }
export function orderSuppliers(o) { return uniq(orderReceipts(o).map(r => r.supplierId)).map(getSupplier); }

/** Danh sách kiểm tra trước khi xác nhận đơn: mỗi mục thiếu là một lỗi chặn. */
export function orderChecklist(o) {
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
        item('Tọa độ mọi thửa đúng chuẩn', (plots.length > 0 || receipts.every(r => sourceOf(null, r) === 'RECYCLED')) && !badGeo.length, badGeo.map(p => p.id).join(', ') || 'Không có thửa nào'),
        item('Mọi thửa đã đối chiếu bản đồ rừng, không chồng lấn', !noForest.length, noForest.map(p => p.id).join(', ')),
        item('Có ngày khai thác của mọi thửa', plots.every(p => p.harvestFrom), 'Thiếu ngày khai thác'),
        item('Tên khoa học đến cấp loài', orderSpecies(o).length > 0 && orderSpecies(o).every(s => /^[A-Z][a-z]+ [a-z-]+$/.test(s)), 'Có loài chưa đến cấp loài'),
        item('Nhà cung cấp: tên, địa chỉ, email', !noSupplierInfo.length, noSupplierInfo.map(s => s.id).join(', ')),
        item('Khối lượng ra không vượt nguyên liệu', !badWO.length, badWO.map(w => w.id).join(', ')),
        item(`GeoJSON không quá ${DB.config.maxGeoJsonMb} MB`, size <= DB.config.maxGeoJsonMb, size.toFixed(1) + ' MB')
    ];
}

export function orderReady(o) { return orderChecklist(o).every(i => i.ok); }
export function orderIsLocked(o) { return o.status >= 1; }
export function orderIsEudr(o) { return o.type === 'OUT' && DB.config.euCountries.includes(o.countryId); }
export function orderQtyMatches(o) {
    const volume = orderM3(o);
    const m3 = sum(o.items.filter(i => i.unit === 'm³'), i => Number(i.quantity));
    const units = unitName() === 'm³' ? 0 : sum(o.items.filter(i => i.unit === unitName()), i => Number(i.quantity));
    const total = sum(orderPallets(o), p => p.qty);
    return Math.abs(m3 + units * (volume / (total || 1)) - volume) <= Math.max(0.01, volume * 0.005);
}
export function plotLockedBy(plotId) { return DB.orders.filter(o => orderIsLocked(o) && orderPlots(o).some(p => p.id === plotId)); }
export function receiptLockedBy(id) { return DB.orders.filter(o => orderIsLocked(o) && orderReceipts(o).some(r => r.id === id)); }

/** Đơn đã khóa nhưng lô nguồn về sau đổi trạng thái: phải cảnh báo. */
export function orderAlerts(o) {
    if (!orderIsLocked(o)) return [];
    return orderChecklist(o).filter(i => !i.ok);
}

export const ORDER_STATUS = { '-3': 'Bị khách từ chối', '-2': 'Thu hồi giao dịch', '-1': 'Xóa (lưu trữ)', 0: 'Đang lên đơn', 1: 'Đang lên hàng', 2: 'Đang vận chuyển', 3: 'Đợi khách xác nhận', 4: 'Đã xác nhận' };

/** Lên hàng cần đủ dữ liệu EUDR và khóa nguồn; giao hàng cần số DDS. Đơn đã xác nhận không đổi được nữa. */
export function setOrderStatus(o, status, by) {
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

export function syncOrderPallets(o) { o.palletIds = uniq(o.cars.flatMap(c => c.palletIds)); }

/** Tra cứu công khai theo mã đơn và mật khẩu, có ghi lịch sử xem và nhập sai. */
export function verifyOrderAccess(o, pass) {
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

export function retentionUntil(o) {
    if (!o.confirmedAt) return '';
    const d = new Date(o.confirmedAt);
    d.setFullYear(d.getFullYear() + DB.config.retentionYears);
    return d.toISOString().slice(0, 10);
}

export function buildGeoJson(o) {
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
export function geoJsonText(o) {
    return JSON.stringify(buildGeoJson(o), (key, value) => {
        if (key === 'coordinates') {
            const fix = v => Array.isArray(v) ? v.map(fix) : `§${v.toFixed(6)}§`;
            return fix(value);
        }
        return value;
    }, 1).replace(/"§(-?[\d.]+)§"/g, '$1');
}

export function orderPackageData(o) {
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
export function trace(code) {
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
