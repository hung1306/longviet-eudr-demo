import { beforeEach, describe, expect, it } from 'vitest';
import { INDUSTRIES } from '../src/config/industries';
import {
    DB, PACK, STAGES, STAGE_SPECS, approveReceipt, assessReceipt, can, checkGeometry, createPallet, createWorkOrder,
    geoJsonText, getWO, hashText, loadDB, logAction, minDecimalsInText, orderChecklist, orderQtyMatches, orderReady, packageStock,
    recordStage, reconcile, receiptStatus, requiredDocs, resetDB, retentionUntil, ringAreaHa, ringSelfIntersects, saveDB,
    setIndustry, setOrderStatus, storeKey, trace, validateGeoJsonText, validateStage, verifyAudit, verifyOrderAccess, woDone,
} from '../src/engine/shared/core.js';

const square = [[108, 14], [108.01, 14], [108.01, 14.01], [108, 14.01], [108, 14]];
const feature = (coordinates, props = {}) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: { PlotID: 'P1', ProducerCountry: 'VN', Area: 1.5, ...props },
});
const collection = features => JSON.stringify({ type: 'FeatureCollection', features });
const reset = id => { localStorage.clear(); setIndustry(id); resetDB(); };

beforeEach(() => reset('van-ep'));

describe.each(INDUSTRIES.map(pack => [pack.short, pack]))('dữ liệu mẫu nhóm %s', (_name, pack) => {
    beforeEach(() => reset(pack.id));

    it('đủ 3 trạng thái lô và 3 nguồn nguyên liệu', () => {
        const status = Object.fromEntries(DB.receipts.map(r => [r.id, receiptStatus(r)]));
        expect(status).toEqual({
            'NL2610-01': 'PASS', 'NL2610-02': 'PASS', 'NL2610-03': 'PENDING', 'NL2610-04': 'FAIL',
            'NL2610-05': 'PASS', 'NL2610-06': 'PASS', 'NL2610-07': 'FAIL', 'NL2610-08': 'PASS',
            'NL2610-09': 'PASS', 'NL2610-10': 'PASS', 'NL2610-11': 'PASS', 'NL2610-12': 'PENDING', 'NL2610-13': 'FAIL', 'NL2610-14': 'PASS',
        });
        expect(new Set(DB.receipts.map(r => r.sourceCategory))).toEqual(new Set(['DOMESTIC', 'IMPORT', 'RECYCLED']));
    });

    it('nhật ký mới nạp có chuỗi hợp lệ', () => {
        expect(verifyAudit().ok).toBe(true);
    });

    it('lệnh mẫu qua được chính luật ghi công đoạn', () => {
        const wo = DB.workOrders[0];
        expect(woDone(wo)).toBe(true);
        wo.stages.forEach((stage, index) => {
            expect(() => validateStage(wo, index, stage, Date.parse('2026-12-01')), STAGES[index]).not.toThrow();
        });
    });

    it('mọi lệnh xong đều trong dải thu hồi, kiện đóng đủ', () => {
        DB.workOrders.filter(woDone).forEach(w => {
            const check = reconcile(w);
            expect(check.overRun).toBe(false);
            expect(check.outOfBand).toBe(false);
        });
        expect(DB.workOrders.filter(woDone)).toHaveLength(3);
    });

    it('mọi lô nằm đúng khu theo kết quả, đúng ô theo nguồn', () => {
        const zone = { PASS: 'ZONE_A', PENDING: 'ZONE_B', FAIL: 'ZONE_C' };
        DB.receipts.forEach(r => {
            const bay = DB.warehouseBays.find(b => b.id === r.bay);
            expect(bay.zone, r.id).toBe(zone[receiptStatus(r)]);
            if (bay.source !== 'ALL') expect(bay.source, r.id).toBe(r.sourceCategory);
        });
    });

    it('tồn mọi kiện không âm, đơn đã xác nhận đủ điều kiện', () => {
        DB.packages.forEach(p => expect(packageStock(p), p.id).toBeGreaterThanOrEqual(0));
        DB.orders.filter(o => o.status >= 1).forEach(o => expect(orderReady(o), o.id).toBe(true));
    });

    it('hàng ngoài EU không vào kho thành phẩm EU', () => {
        expect(() => createPallet({ workOrderId: 'WO-261030-04', qty: 1, kg: 1, location: 'TP-EU' })).toThrow('ngoài EU');
    });

    it('duyệt lô từ Khu B thì tự chuyển sang ô Khu A đúng nguồn', () => {
        const r = DB.receipts.find(x => x.id === 'NL2610-03');
        r.docs.push('Chứng từ vận chuyển');
        approveReceipt(r, 'QA');
        expect(r.bay).toBe('A-01');
    });

    it('đơn mẫu đủ điều kiện EUDR và khớp số lượng', () => {
        const order = DB.orders[0];
        expect(orderChecklist(order).filter(i => !i.ok)).toEqual([]);
        expect(orderReady(order)).toBe(true);
        expect(orderQtyMatches(order)).toBe(true);
    });

    it('truy từ đơn về đúng lô đất và ngược lại', () => {
        const order = DB.orders[0];
        const back = trace(order.id);
        expect(back.plots.map(p => p.id).sort()).toEqual(['PLOT-VN-BP-03', 'PLOT-VN-DN-01', 'PLOT-VN-DN-02']);
        expect(trace(back.plots[0].id).orders.map(o => o.id)).toContain(order.id);
    });

    it('chạy trọn luồng thật: ghi mọi công đoạn, đóng kiện', () => {
        const wo = DB.workOrders[1];
        const qty = wo.targetQty;
        STAGE_SPECS.forEach((spec, index) => {
            const hour = String(7 + index).padStart(2, '0');
            const data = { by: 'An', confirmBy: 'Bình', shift: 'Ca 1', machine: spec.machines[0], start: `2026-11-03T${hour}:00`, end: `2026-11-03T${hour}:30` };
            spec.params.forEach(p => { data[p.key] = p.sample; });
            if (spec.patchLot) data.patchLot = 'NL2610-05';
            if (spec.scrap) data.scrapUse = 'Băm làm chân pallet, giữ mã lô gốc';
            if (spec.qc) Object.assign(data, { gradeA: qty, gradeB: 0, gradeC: 0 });
            else data.out = spec.outUnit === PACK.unit ? qty : Math.max(1, Math.round(qty * 2));
            if (wo.t !== undefined && spec.params.some(p => p.tolerance !== undefined)) data.thickness = wo.t;
            recordStage(wo, index, data);
        });
        expect(woDone(wo)).toBe(true);
        expect(wo.finishedQty).toBe(qty);
        const pallet = createPallet({ workOrderId: wo.id, qty: 1, kg: 10 });
        expect(pallet.id).toMatch(/^PAL-2026-/);
        expect(trace(pallet.id).plots.map(p => p.id)).toEqual(['PLOT-VN-BP-04']);
    });

    it('lệnh EU không nhận lô chưa Đạt, trong mọi ngành', () => {
        const pkg = DB.packages.find(p => p.receiptId === 'NL2610-04');
        expect(() => createWorkOrder({ market: 'EU', product: 'X', unitM3: 1 }, [{ packageId: pkg.id, m3: 0.1 }])).toThrow('không được cấp vào lệnh EU');
    });

    it('xuất GeoJSON đủ 6 chữ số thập phân', () => {
        const text = geoJsonText(DB.orders[0]);
        expect(minDecimalsInText(text)).toBe(6);
        expect(validateGeoJsonText(text).ok).toBe(true);
    });

    it('không còn dấu vết của khách hàng khảo sát', () => {
        expect(JSON.stringify(DB)).not.toMatch(/long.?vi[eệ]t|tam phước|plywood|PAL-LV/i);
    });
});

describe('gói ngành', () => {
    it('dữ liệu từng ngành tách riêng, đổi ngành không ghi đè', () => {
        reset('van-ep');
        DB.config.maxGeoJsonMb = 123;
        saveDB();
        setIndustry('noi-that');
        loadDB();
        expect(DB.industry).toBe('noi-that');
        expect(DB.config.maxGeoJsonMb).toBe(25);
        setIndustry('van-ep');
        loadDB();
        expect(DB.config.maxGeoJsonMb).toBe(123);
    });

    it('công đoạn và đơn vị lấy từ gói ngành', () => {
        setIndustry('my-nghe');
        expect(STAGES).toEqual(PACK.stages.map(s => s.name));
        expect(PACK.unit).toBe('chiếc');
    });

    it('mỗi gói có đúng một bước phân loại, đặt cuối', () => {
        INDUSTRIES.forEach(pack => {
            expect(pack.stages.filter(s => s.qc), pack.id).toHaveLength(1);
            expect(pack.stages[pack.stages.length - 1].qc, pack.id).toBe(true);
            expect(pack.process, pack.id).toHaveLength(6);
            expect(pack.recovery[0], pack.id).toBeLessThan(pack.recovery[1]);
        });
    });
});

describe('ba nguồn nguyên liệu', () => {
    const supplier = () => DB.suppliers[0];
    const recycled = extra => ({ id: 'R', supplierId: supplier().id, plotIds: [], docs: [], species: 'Acacia mangium', mitigations: [], sourceCategory: 'RECYCLED', ...extra });

    it('bộ hồ sơ theo nguồn của lô, không theo nhà cung cấp', () => {
        expect(requiredDocs(supplier(), { sourceCategory: 'RECYCLED' })).toContain('Chứng nhận tái chế');
        expect(requiredDocs(supplier(), { sourceCategory: 'DOMESTIC' })).toContain('Bảng kê lâm sản');
        expect(requiredDocs({ type: 'IMPORT' })).toContain('C/O');
    });

    it('tuyên bố tái chế không có chứng nhận thì Không đạt', () => {
        expect(receiptStatus(recycled({ virginPct: 0 }))).toBe('FAIL');
    });

    it('thiếu giấy phụ thì chờ bổ sung', () => {
        expect(assessReceipt(recycled({ virginPct: 0, docs: ['Chứng nhận tái chế'] })).level).toBe('MEDIUM');
    });

    it('tái chế 100% đủ hồ sơ không cần tọa độ', () => {
        const docs = ['Chứng nhận tái chế', 'Tỷ lệ nguyên sinh', 'Nguồn phần nguyên sinh'];
        expect(assessReceipt(recycled({ virginPct: 0, docs })).level).toBe('LOW');
    });

    it('còn phần nguyên sinh thì vẫn bắt buộc tọa độ', () => {
        const docs = ['Chứng nhận tái chế', 'Tỷ lệ nguyên sinh', 'Nguồn phần nguyên sinh'];
        const check = assessReceipt(recycled({ virginPct: 30, docs }));
        expect(check.level).toBe('HIGH');
        expect(check.factors.find(f => f.name === 'Tọa độ lô đất').msg).toContain('Chưa gắn thửa');
    });
});

describe('lưu trữ', () => {
    it('giữ thay đổi đã lưu qua lần nạp sau', () => {
        DB.config.maxGeoJsonMb = 123;
        saveDB();
        loadDB();
        expect(DB.config.maxGeoJsonMb).toBe(123);
    });

    it('nạp lại mẫu khi dữ liệu hỏng hoặc khác phiên bản', () => {
        localStorage.setItem(storeKey(), '{hỏng');
        loadDB();
        expect(DB.plots.length).toBeGreaterThan(0);
        DB.version = 'cũ';
        saveDB();
        loadDB();
        expect(DB.version).not.toBe('cũ');
    });

    it('vai trò demo có đủ quyền', () => {
        expect(can('config')).toBe(true);
    });
});

describe('nhật ký móc nối', () => {
    it('hashText là FNV-1a 32 bit', () => {
        expect(hashText('a')).toBe('e40c292c');
        expect(hashText('')).toBe('811c9dc5');
    });

    it('mỗi dòng móc vào mã băm dòng trước', () => {
        logAction('X', 'Thử', '1');
        logAction('Y', 'Thử', '2');
        const [a, b] = DB.audit.slice(-2);
        expect(b.prev).toBe(a.hash);
        expect(verifyAudit().ok).toBe(true);
    });

    it('phát hiện sửa nội dung, chỉ đúng dòng', () => {
        logAction('X', 'Thử', 'gốc');
        const index = DB.audit.length - 1;
        DB.audit[index].detail = 'đã sửa';
        expect(verifyAudit()).toEqual({ ok: false, index });
    });

    it('phát hiện xóa dòng ở giữa', () => {
        logAction('W', 'Thử', '0');
        logAction('X', 'Thử', '1');
        DB.audit.splice(DB.audit.length - 2, 1);
        expect(verifyAudit().ok).toBe(false);
    });
});

describe('hình học thửa đất', () => {
    it('tính diện tích, không phụ thuộc chiều vòng', () => {
        const area = ringAreaHa(square);
        expect(area).toBeGreaterThan(115);
        expect(area).toBeLessThan(125);
        expect(ringAreaHa([...square].reverse())).toBeCloseTo(area, 6);
    });

    it('nhận ra polygon tự cắt', () => {
        expect(ringSelfIntersects(square)).toBe(false);
        expect(ringSelfIntersects([[108, 14], [108.01, 14.01], [108.01, 14], [108, 14.01], [108, 14]])).toBe(true);
    });

    it('từ chối kiểu hình học và tọa độ sai', () => {
        expect(checkGeometry({ type: 'LineString', coordinates: [] }, 1, 'VN').errors).toHaveLength(1);
        expect(checkGeometry(null, 1, 'VN').errors).toHaveLength(1);
        expect(checkGeometry({ type: 'Point', coordinates: ['108', 14] }, 1, 'VN').errors).toEqual(['Tọa độ không hợp lệ']);
    });

    it('bắt ngoài WGS84, ngoài khung quốc gia, đảo kinh vĩ độ', () => {
        expect(checkGeometry({ type: 'Point', coordinates: [200, 14] }, 1, 'VN').errors.join()).toContain('WGS84');
        expect(checkGeometry({ type: 'Point', coordinates: [14.05, 108.27] }, 1, 'VN').errors.join()).toContain('khung quốc gia VN');
    });

    it('trên 4 ha bắt buộc Polygon, đúng 4 ha vẫn được Point', () => {
        expect(checkGeometry({ type: 'Point', coordinates: [108, 14] }, 4.01, 'VN').errors.join()).toContain('Polygon');
        expect(checkGeometry({ type: 'Point', coordinates: [108, 14] }, 4, 'VN').errors).toEqual([]);
    });

    it('bắt polygon hở, thiếu đỉnh, tự cắt', () => {
        const check = ring => checkGeometry({ type: 'Polygon', coordinates: [ring] }, 120, 'VN').errors;
        expect(check(square.slice(0, -1))).toContain('Polygon chưa khép kín');
        expect(check([[108, 14], [108.01, 14], [108, 14]])).toContain('Polygon cần tối thiểu 3 đỉnh và điểm đóng');
        expect(check([[108, 14], [108.01, 14.01], [108.01, 14], [108, 14.01], [108, 14]])).toContain('Polygon tự cắt');
    });

    it('cảnh báo khi diện tích lệch quá dung sai', () => {
        const polygon = { type: 'Polygon', coordinates: [square] };
        const computed = ringAreaHa(square);
        expect(checkGeometry(polygon, computed, 'VN').warnings).toEqual([]);
        expect(checkGeometry(polygon, computed * 3, 'VN').warnings).toHaveLength(1);
    });
});

describe('kiểm tra tệp GeoJSON', () => {
    it('đọc số thập phân từ văn bản gốc, kể cả số 0 cuối', () => {
        expect(minDecimalsInText('{"coordinates":[108.123400,14.123456]}')).toBe(6);
        expect(minDecimalsInText('{"coordinates":[108.12,14.123456]}')).toBe(2);
        expect(minDecimalsInText('{}')).toBeUndefined();
    });

    it('lỗi nghiêm trọng khi không phải JSON hoặc FeatureCollection', () => {
        expect(validateGeoJsonText('không phải json').fatal).toContain('Không đọc được JSON');
        expect(validateGeoJsonText('{"type":"Feature"}').fatal).toContain('FeatureCollection');
    });

    it('chấp nhận tệp đúng chuẩn', () => {
        const result = validateGeoJsonText(collection([feature([108.123456, 14.123456])]));
        expect(result.fatal).toBeNull();
        expect(result.ok).toBe(true);
    });

    it('từ chối thiếu độ chính xác, sai mã nước, Area không phải số', () => {
        const errorsOf = text => validateGeoJsonText(text).items[0].errors.join(' | ');
        expect(errorsOf(collection([feature([108.12, 14.12])]))).toContain('tối thiểu 6');
        expect(errorsOf(collection([feature([108.123456, 14.123456], { ProducerCountry: 'Vietnam' })]))).toContain('ISO');
        expect(errorsOf(collection([feature([108.123456, 14.123456], { Area: '1.5' })]))).toContain('Area');
    });

    it('từ chối hệ tọa độ khác, cảnh báo trùng tọa độ', () => {
        const result = validateGeoJsonText(JSON.stringify({
            type: 'FeatureCollection',
            crs: { properties: { name: 'EPSG:3857' } },
            features: [feature([108.123456, 14.123456]), feature([108.123456, 14.123456], { PlotID: 'P2' })],
        }));
        expect(result.ok).toBe(false);
        expect(result.fileErrors.join()).toContain('WGS84');
        expect(result.items[1].warnings.join()).toContain('Trùng tọa độ');
    });
});

describe('đánh giá rủi ro lô', () => {
    const empty = () => ({ id: 'R', supplierId: DB.suppliers[0].id, plotIds: [], docs: [], species: 'Hevea brasiliensis', mitigations: [] });

    it('lô chưa gắn thửa là rủi ro cao, không duyệt được', () => {
        const receipt = empty();
        expect(receiptStatus(receipt)).toBe('FAIL');
        expect(() => approveReceipt(receipt, 'QA', 'lý do')).toThrow('rủi ro cao');
        expect(receipt.approval).toBeUndefined();
    });

    it('mức của lô là mức cao nhất trong các yếu tố', () => {
        const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
        DB.receipts.forEach(receipt => {
            const { factors, level } = assessReceipt(receipt);
            expect(rank[level]).toBe(Math.max(...factors.map(f => rank[f.level])));
        });
    });

    it('bỏ giấy tờ đất làm lô Đạt rớt xuống FAIL', () => {
        const receipt = DB.receipts.find(r => r.id === 'NL2610-01');
        DB.plots.find(p => p.id === receipt.plotIds[0]).landDoc = '';
        expect(receiptStatus(receipt)).toBe('FAIL');
    });

    it('lô chờ bổ sung thành Đạt khi đủ chứng từ và được ký', () => {
        const receipt = DB.receipts.find(r => r.id === 'NL2610-03');
        receipt.docs.push('Chứng từ vận chuyển');
        expect(assessReceipt(receipt).level).toBe('LOW');
        approveReceipt(receipt, 'QA');
        expect(receiptStatus(receipt)).toBe('PASS');
    });
});

describe('lệnh sản xuất', () => {
    const data = { market: 'EU', product: 'Thử', unitM3: 0.05, t: 18 };

    it('không tạo lệnh khi chưa chọn kiện', () => {
        expect(() => createWorkOrder(data, [])).toThrow('Chưa chọn kiện');
    });

    it('trừ tồn khi cấp phát, chặn cấp vượt tồn', () => {
        const pkg = DB.packages.find(p => p.receiptId === 'NL2610-06' && packageStock(p) > 1);
        const before = packageStock(pkg);
        const wo = createWorkOrder(data, [{ packageId: pkg.id, m3: 0.5 }]);
        expect(wo.id).toMatch(/^WO-\d{6}-\d{2,}$/);
        expect(wo.stages).toHaveLength(STAGES.length);
        expect(packageStock(pkg)).toBeCloseTo(before - 0.5, 4);
        expect(() => createWorkOrder(data, [{ packageId: pkg.id, m3: before + 1 }])).toThrow('chỉ còn');
        expect(() => createWorkOrder(data, [{ packageId: pkg.id, m3: 0 }])).toThrow('chỉ còn');
    });

    it('đối soát phát hiện vượt nguyên liệu và ngoài dải thu hồi', () => {
        const wo = { allocations: [{ m3: 10 }], unitM3: 1, finishedQty: 0 };
        expect(reconcile(wo, 11).overRun).toBe(true);
        expect(reconcile(wo, 1).outOfBand).toBe(true);
        const mid = (DB.config.recoveryMin + DB.config.recoveryMax) / 2 / 10;
        expect(reconcile(wo, mid)).toMatchObject({ overRun: false, outOfBand: false });
    });

    describe('kiểm tra bản ghi công đoạn (ván ép)', () => {
        const wo = () => ({ id: 'W', market: 'OTHER', t: 12, allocations: [], stages: STAGES.map(() => ({ status: 'TODO' })) });
        const now = Date.parse('2026-06-01T12:00:00');
        const base = { by: 'An', confirmBy: 'Bình', shift: 'Ca 1', machine: 'M', start: '2026-06-01T08:00', end: '2026-06-01T09:00', out: 100 };
        const press = STAGES.indexOf('Ép nóng');
        const sander = STAGES.indexOf('Chà nhám');

        it('chấp nhận bản ghi hợp lệ', () => {
            expect(validateStage(wo(), 0, base, now)).toBe(100);
        });

        it('người xác nhận phải khác người vận hành', () => {
            expect(() => validateStage(wo(), 0, { ...base, confirmBy: ' an ' }, now)).toThrow('phải khác');
        });

        it('chặn giờ sai thứ tự và giờ tương lai', () => {
            expect(() => validateStage(wo(), 0, { ...base, end: base.start }, now)).toThrow('sau giờ bắt đầu');
            expect(() => validateStage(wo(), 0, { ...base, end: '2026-06-01T13:00' }, now)).toThrow('tương lai');
        });

        it('nhiệt độ trong dải, gồm cả hai biên', () => {
            expect(validateStage(wo(), press, { ...base, temp: 110 }, now)).toBe(100);
            expect(validateStage(wo(), press, { ...base, temp: 130 }, now)).toBe(100);
            expect(() => validateStage(wo(), press, { ...base, temp: 109 }, now)).toThrow('110-130');
            expect(() => validateStage(wo(), press, { ...base, temp: 131 }, now)).toThrow('110-130');
        });

        it('độ dày trong dung sai ±0.3, gồm cả hai biên', () => {
            expect(validateStage(wo(), sander, { ...base, thickness: 12.3 }, now)).toBe(100);
            expect(validateStage(wo(), sander, { ...base, thickness: 11.7 }, now)).toBe(100);
            expect(() => validateStage(wo(), sander, { ...base, thickness: 12.4 }, now)).toThrow('±0.3');
            expect(() => validateStage(wo(), sander, { ...base, thickness: 11.6 }, now)).toThrow('±0.3');
        });

        it('số ra không lớn hơn số vào khi cùng đơn vị', () => {
            const order = wo();
            order.stages[1] = { status: 'DONE', out: 50, end: '2026-06-01T07:00' };
            expect(() => validateStage(order, 2, { ...base, patches: 0, patchLot: '', out: 51 }, now)).toThrow('nghi lẫn');
        });

        it('khác đơn vị thì không so số vào ra', () => {
            const order = wo();
            order.stages[0] = { status: 'DONE', out: 50, end: '2026-06-01T07:00' };
            expect(validateStage(order, 1, { ...base, glue: 300, out: 80 }, now)).toBe(80);
        });
    });
});

describe('pallet và đơn hàng', () => {
    it('không đóng kiện quá số còn lại', () => {
        const wo = getWO('WO-261029-01');
        expect(() => createPallet({ workOrderId: wo.id, qty: 1, kg: 1 })).toThrow('chỉ còn 0');
    });

    it('không đóng kiện khi lệnh chưa xong KCS', () => {
        expect(() => createPallet({ workOrderId: 'WO-261103-02', qty: 1, kg: 1 })).toThrow('chưa hoàn tất KCS');
    });

    it('đơn đã xác nhận không đổi được trạng thái', () => {
        expect(() => setOrderStatus(DB.orders[0], 2, 'NV')).toThrow('chỉ có thể xem');
    });

    it('thiếu mã HS thì chặn lên hàng', () => {
        const draft = { ...DB.orders[0], status: 0, hsCode: '' };
        expect(orderChecklist(draft).find(i => i.label.startsWith('Mã HS')).ok).toBe(false);
        expect(() => setOrderStatus(draft, 1, 'NV')).toThrow('Chưa đủ điều kiện EUDR');
        expect(draft.status).toBe(0);
    });

    it('lô nguồn mất Đạt thì đơn đã khóa bị cảnh báo', () => {
        const order = DB.orders[0];
        DB.plots.find(p => p.id === 'PLOT-VN-DN-01').forest = { result: 'LOSS' };
        expect(orderChecklist(order).some(i => !i.ok)).toBe(true);
    });

    it('hạn lưu hồ sơ tính từ ngày xác nhận', () => {
        expect(retentionUntil({ confirmedAt: '' })).toBe('');
        expect(retentionUntil({ confirmedAt: '2026-01-15' })).toBe(`${2026 + DB.config.retentionYears}-01-15`);
    });

    it('tra cứu kiểm tra trạng thái, thời hạn, mật khẩu và ghi lịch sử', () => {
        const order = { status: 2, passCode: 'abc', viewLog: [], failLog: [] };
        expect(verifyOrderAccess({ ...order, status: 1 }, 'abc').ok).toBe(false);
        expect(verifyOrderAccess({ ...order, viewingPeriod: '2000-01-01' }, 'abc').msg).toContain('hết thời hạn');
        expect(verifyOrderAccess(order, 'sai').ok).toBe(false);
        expect(order.failLog).toHaveLength(1);
        expect(verifyOrderAccess(order, 'abc').ok).toBe(true);
        expect(order.viewLog).toHaveLength(1);
    });
});

describe('truy xuất hai chiều', () => {
    it('null khi rỗng, notFound khi không có mã', () => {
        expect(trace('  ')).toBeNull();
        expect(trace('KHONG-CO')).toMatchObject({ notFound: true });
    });

    it('không phân biệt hoa thường', () => {
        expect(trace(DB.orders[0].id.toLowerCase()).type).toBe('Đơn hàng');
    });

    it('tra được từ pallet và lô thành phẩm', () => {
        const pallet = DB.pallets[0];
        expect(trace(pallet.id).type).toBe('Pallet');
        const byLot = trace(getWO(pallet.workOrderId).lot);
        expect(byLot.type).toBe('Lệnh / lô thành phẩm');
        expect(byLot.pallets.map(p => p.id)).toContain(pallet.id);
    });
});
