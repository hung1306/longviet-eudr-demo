import {
    attachReceiptToPO,
    bindPoSelect,
    poField,
    poReceiptError,
    receiptPO,
} from '../thu-mua/lenh-mua.js';
import {
    lightBtn,
    newBtn,
    speciesOptions,
    supplierName,
} from './san-xuat.js';
import {
    DB,
    ORDER_STATUS,
    STAGES,
    approveReceipt,
    assessReceipt,
    byId,
    geoJsonText,
    getOrder,
    getPallet,
    getPlot,
    getReceipt,
    getSupplier,
    getWO,
    logAction,
    orderAlerts,
    orderChecklist,
    orderIsEudr,
    orderIsLocked,
    orderKg,
    orderM3,
    orderPackageData,
    orderPallets,
    orderPlots,
    orderReceipts,
    orderWOs,
    palletOrder,
    receiptLockedBy,
    receiptM3,
    receiptNetKg,
    receiptStatus,
    reconcile,
    requiredDocs,
    retentionUntil,
    round,
    setOrderStatus,
    sum,
    syncOrderPallets,
    todayISO,
    uniq,
    validateGeoJsonText,
    PACK,
    SOURCE_LABEL,
    TENANT,
    sourceOf,
    unitName,
    SOURCE_DOCS,
    DECISION_ACTIONS,
    LEVEL_RESULT,
    RESULT_LABEL,
    SUPPLIER_KINDS,
    assessContract,
    contractPlotIds,
    decideReceipt,
    gateCheck,
    getContract,
    initialBay,
    supplierContracts,
    supplierKind,
    supplierStanding,
    usableContracts,
} from '../shared/core.js';
import {
    card,
    downloadFile,
    esc,
    field,
    fmt,
    guarded,
    levelPill,
    riskBox,
    openModal,
    orderPill,
    pill,
    showTag,
    startPage,
    table,
    tag,
    toast,
} from '../shared/navigation.js';

/**
 * Tiếp nhận và Đơn hàng: theo cấu trúc TransportMaterial và Order của hệ thống cao su,
 * tổng quát cho mọi nhóm ngành gỗ và thêm các chốt EUDR.
 */
export const dateFilter = (days) => {
    const from = new Date(todayISO());
    from.setDate(from.getDate() + days);
    return from.toISOString().slice(0, 10);
};
export const quickDays = (fn, list) => list.map(d => `<button type="button" class="chip" onclick="${fn}(${d})">${d === 0 ? 'Hôm nay' : -d + ' ngày'}</button>`).join('');

// ========== TIẾP NHẬN (TransportMaterial) ==========
// Bước 4 cân xe → bước 5 đối soát cổng (chốt chặn) → bước 6 chấm & Tuân thủ ký → bước 7 xếp kho A/B/C → bước 8 xử lý B/C.
const initialRecvFilter = () => ({ status: 'WAIT', source: '', from: dateFilter(-90), to: todayISO(), code: '', scaleDate: '' });
export const recvFilter = initialRecvFilter();
export const RECV_STATUS = [['WAIT', 'Chờ Tuân thủ ký'], ['PASS', 'Đạt: Khu A'], ['PENDING', 'Cần bổ sung: Khu B'], ['FAIL', 'Không đạt: Khu C'], ['ALL', 'Tất cả']];

export function receiptSource(r) { return SOURCE_LABEL[sourceOf(getSupplier(r.supplierId), r)]; }
export function setRecv(key, value) { recvFilter[key] = value; refresh(); }
export function chooseRecvTime(days) { recvFilter.from = dateFilter(days); recvFilter.to = todayISO(); refresh(); }
/** Lô đang chờ Tuân thủ quyết định: chưa ký Đạt, chưa có quyết định xử lý cuối. */
export const receiptWaiting = r => !r.done;
const kindOf = s => (SUPPLIER_KINDS.find(k => k[0] === supplierKind(s)) || [])[1] || '';
const nonLow = a => a.factors.filter(f => f.level !== 'LOW');

export function createReceipt(data, plotIds, docs, ticket) {
    const ym = data.date.slice(2, 7).replace('-', '');
    const no = DB.receipts.reduce((m, r) => Math.max(m, Number((r.id.match(/\d+$/) || [0])[0])), 0) + 1;
    const source = data.sourceCategory || sourceOf(getSupplier(data.supplierId));
    const virginPct = data.virginPct === undefined || data.virginPct === '' ? null : +data.virginPct;
    const m3 = +(+data.pkgCount * +data.pkgM3).toFixed(4);
    if (+data.gross <= +data.tare) throw new Error('Cân tổng phải lớn hơn cân xe');
    const gate = gateCheck({ supplierId: data.supplierId, contractId: data.contractId, plotIds, sourceCategory: source, virginPct: virginPct === null && source !== 'RECYCLED' ? undefined : virginPct, species: data.species, date: data.date, m3, moisture: data.moisture });
    if (!gate.ok) throw new Error('Bị chặn tại cổng: ' + gate.blocks[0]);
    const r = { id: `RC-${ym}-${String(no).padStart(3, '0')}`, plate: data.plate, supplierId: data.supplierId, contractId: data.contractId || '', date: data.date, species: data.species, inputType: data.inputType || PACK.inputs[0], sourceCategory: source, virginPct, pkgCount: +data.pkgCount, m3, gross: +data.gross, tare: +data.tare, moisture: +data.moisture || null, grade: data.grade || '', bay: '', trip: +data.trip || 1, workshop: data.workshop || '', expectedKg: +data.expectedKg || (+data.gross - +data.tare), dataSource: data.dataSource || 'Nhập tay', plotIds, docs, note: data.note || '', kcs: null, done: false, approval: null, decision: null, mitigations: [], gateWarns: gate.warns };
    r.bay = initialBay(r);
    DB.receipts.push(r);
    let pno = DB.packages.reduce((max, p) => Math.max(max, +p.id.slice(-4)), 0);
    for (let i = 0; i < r.pkgCount; i++) DB.packages.push({ id: 'PKG-2026-' + String(++pno).padStart(4, '0'), receiptId: r.id, m3: +data.pkgM3 });
    if (ticket) ticket.receiptId = r.id;
    logAction(r.id, 'Tiếp nhận lô', `${r.dataSource}; HĐ ${(getContract(r.contractId) || {}).no || '–'}; ${r.pkgCount} kiện, ${receiptNetKg(r)} kg; ô ${r.bay}${gate.warns.length ? '; cảnh báo: ' + gate.warns.join('; ') : ''}`);
    return r;
}

/** Form phiếu: chọn NCC → hợp đồng → thửa được phép. Dùng chung cho đối soát xe, nhập tay. */
export function receiptForm(preset = {}) {
    return `<div class="row g-2">
        <div class="col-12"><h3 class="form-section"><span>A</span>Xe & hợp đồng</h3></div>
        ${field('Nhà cung cấp', 'supplierId', preset.supplierId, { type: 'select', col: 6, options: DB.suppliers.map(s => [s.id, `${s.name} · ${kindOf(s)}`]), required: true })}
        ${field('Hợp đồng mua', 'contractId', preset.contractId || '', { type: 'select', col: 6, required: true, options: [['', '–']], attrs: `data-contract-select data-value="${esc(preset.contractId || '')}"` })}
        ${poField(preset.poId)}
        ${field('Biển số / Container', 'plate', preset.plate, { required: true, col: 3 })}
        ${field('Ngày cân', 'date', preset.date || todayISO(), { type: 'date', col: 3, required: true })}
        ${field('Xưởng', 'workshop', preset.workshop || PACK.workshops[0], { type: 'select', col: 3, options: PACK.workshops })}
        ${field('Lần VC', 'trip', preset.trip || 1, { type: 'number', col: 3, attrs: 'min="1"' })}
        ${field('Cân tổng (kg)', 'gross', preset.gross, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Cân xe (kg)', 'tare', preset.tare, { type: 'number', col: 3, required: true, attrs: 'min="0"' })}
        <div class="col-12"><h3 class="form-section"><span>B</span>Nguyên liệu</h3></div>
        ${field('Nguồn', 'sourceCategory', preset.sourceCategory || 'DOMESTIC', { type: 'select', col: 4, options: Object.entries(SOURCE_LABEL) })}
        ${field('Loại nguyên liệu', 'inputType', preset.rawType || PACK.inputs[0], { type: 'select', col: 4, options: uniq([...PACK.inputs, preset.rawType].filter(Boolean)) })}
        ${field('Loài gỗ', 'species', preset.species, { type: 'select', col: 4, options: speciesOptions() })}
        ${field(`Số ${PACK.packUnit}`, 'pkgCount', preset.pkgCount || 10, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field(`m³ / ${PACK.packUnit}`, 'pkgM3', preset.pkgM3 || 1, { type: 'number', col: 3, required: true, attrs: 'min="0.001" step="any"' })}
        ${field('Độ ẩm đo tại cổng (%)', 'moisture', preset.moisture || '', { type: 'number', col: 3, attrs: 'min="0" step="0.1"' })}
        ${field('Tỷ lệ nguyên sinh (%) nếu tái chế', 'virginPct', preset.virginPct ?? '', { type: 'number', col: 3, attrs: 'min="0" max="100"' })}
        <div class="col-12"><h3 class="form-section"><span>C</span>Thửa đất của lô <small>chỉ hiện thửa được phép theo hợp đồng</small></h3><div class="pick-list" data-plot-list></div></div>
        <div class="col-12"><h3 class="form-section"><span>D</span>Chứng từ đi kèm chuyến hàng</h3><div class="pick-list" data-doc-list></div></div>
        ${field('Ghi chú', 'note', preset.note || '', { col: 12 })}</div>`;
}

/** Ghép form với khung kết quả: đổi NCC thì đổi hợp đồng, đổi hợp đồng thì đổi thửa; mọi thay đổi chấm lại ngay. */
export function bindIntake(el, preset = {}, opts = {}) {
    const form = el.querySelector('form');
    const q = n => form.querySelector(`[name=${n}]`);
    const plotBox = form.querySelector('[data-plot-list]'), docBox = form.querySelector('[data-doc-list]'), ctSel = form.querySelector('[data-contract-select]');
    let plotSel = new Set(preset.plotIds || []), docSel = new Set(preset.docs || []);
    const fillContracts = () => {
        const list = supplierContracts(q('supplierId').value);
        const want = ctSel.value || ctSel.dataset.value || (usableContracts(q('supplierId').value)[0] || list[0] || {}).id || '';
        ctSel.innerHTML = '<option value="">Chưa gắn hợp đồng</option>' + list.map(c => { const a = assessContract(c, q('date').value || todayISO()); return `<option value="${esc(c.id)}" ${c.id === want ? 'selected' : ''}>${esc(c.no)} · ${esc(RESULT_LABEL[a.result])}${c.end < (q('date').value || todayISO()) ? ' · hết hạn' : ''}</option>`; }).join('');
        ctSel.dataset.value = '';
    };
    const fillPlots = () => {
        const c = getContract(ctSel.value);
        const allowed = c ? contractPlotIds(c) : [];
        const supplierPlots = DB.plots.filter(p => p.supplierId === q('supplierId').value).map(p => p.id);
        const ids = uniq([...allowed, ...supplierPlots, ...plotSel]);
        plotBox.innerHTML = ids.map(getPlot).filter(Boolean).map(p => { const ok = allowed.includes(p.id); return `<label class="${ok ? '' : 'not-allowed'}"><input class="form-check-input" type="checkbox" name="plotIds" value="${esc(p.id)}" ${plotSel.has(p.id) ? 'checked' : ''}><span>${esc(p.id)} <span class="sub">${esc(p.owner)} · ${fmt(p.areaHa)} ha · ${esc(p.geometry.type)}${ok ? '' : ' · không thuộc hợp đồng'}</span></span>${pill((p.forest && p.forest.result) || 'NONE')}</label>`; }).join('') || '<div class="empty">Bên bán chưa có thửa nào. Nạp tọa độ ở bước 1.</div>';
    };
    const fillDocs = () => {
        const docs = requiredDocs(getSupplier(q('supplierId').value), { sourceCategory: q('sourceCategory').value });
        docBox.innerHTML = docs.map(d => `<label><input class="form-check-input" type="checkbox" name="docs" value="${esc(d)}" ${docSel.has(d) ? 'checked' : ''}><span>${esc(d)}</span></label>`).join('');
    };
    const draft = () => {
        const fd = new FormData(form);
        const d = Object.fromEntries(fd.entries());
        plotSel = new Set(fd.getAll('plotIds')); docSel = new Set(fd.getAll('docs'));
        return { ...d, plotIds: [...plotSel], docs: [...docSel], m3: +d.pkgCount * +d.pkgM3 || 0, virginPct: d.virginPct === '' ? (d.sourceCategory === 'RECYCLED' ? null : undefined) : +d.virginPct, moisture: +d.moisture || null };
    };
    const render = () => {
        const d = draft();
        const gate = gateCheck(d);
        const a = assessReceipt({ id: 'DRAFT', ...d, mitigations: [] });
        const result = !gate.ok ? 'BLOCK' : a.level;
        const head = opts.dossier ? { BLOCK: ["bad", "fa-ban", "Không đạt: không được mua"], HIGH: ["bad", "fa-circle-xmark", "Không đạt: không được mua"], MEDIUM: ["warn", "fa-triangle-exclamation", "Cần bổ sung: chưa xác nhận mua được"], LOW: ["ok", "fa-circle-check", "Đạt: được xác nhận mua"] }[result] : { BLOCK: ['bad', 'fa-ban', 'BỊ CHẶN: xe không được vào kho'], HIGH: ['bad', 'fa-circle-xmark', 'Nhận vào Khu C (cách ly): Không đạt'], MEDIUM: ['warn', 'fa-triangle-exclamation', 'Nhận vào Khu B: Cần bổ sung'], LOW: ['ok', 'fa-circle-check', 'Nhận vào Khu B, chờ Tuân thủ ký Đạt'] }[result];
        el.querySelector('[data-gate]').innerHTML = `<div class="risk-box ${head[0]}"><strong><i class="fa ${head[1]} me-1"></i>${head[2]}</strong>
            <h4>Chốt chặn tại cổng</h4><ul>${gate.blocks.map(b => `<li class="lv-high"><i class="fa fa-ban"></i>${esc(b)}</li>`).join('')}${gate.warns.map(w => `<li class="lv-medium"><i class="fa fa-triangle-exclamation"></i>${esc(w)}</li>`).join('')}${!gate.blocks.length && !gate.warns.length ? '<li class="lv-low"><i class="fa fa-circle-check"></i>Qua mọi chốt chặn</li>' : ''}</ul>
            <h4>Chấm sơ bộ lô</h4><ul>${a.factors.map(f => `<li class="lv-${f.level.toLowerCase()}"><i class="fa ${f.level === 'LOW' ? 'fa-circle-check' : f.level === 'MEDIUM' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}"></i><b>${esc(f.name)}</b>: ${esc(f.msg)}</li>`).join('')}</ul></div>`;
        const btn = el.querySelector('.modal-footer .btn-primary');
        if (btn && !opts.dossier) btn.disabled = !gate.ok;
        const rej = el.querySelector('[data-reject]');
        if (rej) rej.classList.toggle('d-none', gate.ok);
    };
    q('supplierId').addEventListener('change', () => { plotSel.clear(); fillContracts(); fillPlots(); fillDocs(); render(); });
    ctSel.addEventListener('change', () => { fillPlots(); render(); });
    q('sourceCategory').addEventListener('change', () => { draft(); fillDocs(); render(); });
    q('date').addEventListener('change', () => { fillContracts(); render(); });
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    fillContracts(); fillPlots(); fillDocs(); render();
    return draft;
}

const intakeBody = preset => `<div class="ct-layout"><div>${receiptForm(preset)}</div><aside class="ct-side"><div data-gate></div><div class="note-box mt-2 mb-0 small">Bị chặn: lập biên bản trả hàng, báo Tuân thủ. Qua chốt: tạo phiếu, in tem QR từng kiện, lô vào Khu B (hoặc Khu C nếu Không đạt) chờ Tuân thủ ký.</div></aside></div>`;

function submitIntake(data, fd, extra) {
    const poErr = poReceiptError(data.poId, data.supplierId, data.species);
    if (poErr) { toast(poErr, 'err'); return false; }
    return guarded('receipt', () => {
        const r = createReceipt({ ...data, ...extra }, fd.getAll('plotIds'), fd.getAll('docs'), extra.ticket);
        attachReceiptToPO(r, data.poId);
        toast(`Đã tạo phiếu ${r.id}, xếp ô ${r.bay}. Bước tiếp: KCS và Tuân thủ ký.`);
        refresh();
    });
}

/** Bước 5: đối soát tại cổng cho một xe từ trạm cân. */
export function gateModal(ticketId) {
    const t = byId(DB.scaleTickets, ticketId);
    const m = openModal({
        title: `Đối soát cổng: xe ${t.plate} (${t.id})`, size: 'modal-xl', submitText: 'Tiếp nhận vào kho', body: intakeBody({ ...t, docs: [] }),
        footerExtra: `<button type="button" class="btn btn-sm btn-outline-danger d-none" data-reject><i class="fa fa-rotate-left me-1"></i>Lập biên bản trả hàng</button>`,
        onSubmit: (data, fd) => submitIntake(data, fd, { expectedKg: t.expectedKg, dataSource: 'Trạm cân', ticket: t })
    });
    bindPoSelect(m.el);
    const draft = bindIntake(m.el, t);
    m.el.querySelector('[data-reject]').onclick = () => { const g = gateCheck(draft()); m.hide(); setTimeout(() => rejectTicket(ticketId, g.blocks), 300); };
}
export const acceptTicket = gateModal;
export function openCrossCheckModal(ticketId) {
    const t = ticketId ? byId(DB.scaleTickets, ticketId) : DB.scaleTickets.find(x => !x.receiptId && !x.rejected);
    if (!t) { toast('Không có xe nào chờ đối soát', 'err'); return; }
    gateModal(t.id);
}

/** Xe bị chặn: trả hàng, ghi lý do và báo Tuân thủ. */
export function rejectTicket(id, blocks = []) {
    const t = byId(DB.scaleTickets, id);
    openModal({
        title: `Biên bản trả hàng: xe ${t.plate}`, submitText: 'Lập biên bản',
        body: `<div class="note-box bad">${blocks.map(esc).join('<br>') || 'Xe không qua chốt chặn tại cổng'}</div><div class="row g-2">${field('Người lập', 'by', '', { required: true })}${field('Báo Tuân thủ', 'notify', 'Trưởng ban Tuân thủ', { required: true })}${field('Lý do / ghi chú', 'reason', blocks[0] || '', { type: 'textarea', col: 12, required: true })}</div>`,
        onSubmit: data => guarded('receipt', () => {
            t.rejected = { at: todayISO(), by: data.by, reason: data.reason, notify: data.notify };
            logAction(t.id, 'Trả hàng tại cổng', `${t.plate}: ${data.reason}; báo ${data.notify}`);
            toast(`Đã lập biên bản trả hàng xe ${t.plate}`);
            refresh();
        })
    });
}

/** Tiếp nhận container nhập khẩu: hồ sơ hải quan và tọa độ vùng khai thác gốc, đi qua cùng chốt chặn. */
export function importContainerModal() {
    const supplier = DB.suppliers.find(s => s.type === 'IMPORT' && usableContracts(s.id).length) || DB.suppliers.find(s => s.type === 'IMPORT');
    const rnd = (a, b) => Math.floor(a + Math.random() * b);
    const preset = { supplierId: supplier.id, plate: `51D-902.13 / Cont TGHU${rnd(100000, 900000)}`, sourceCategory: 'IMPORT', rawType: PACK.inputs[0], species: (DB.plots.find(p => p.supplierId === supplier.id) || {}).species, pkgCount: 12, pkgM3: 1.6256, gross: 28500, tare: 20700, moisture: 11.5, docs: ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn'] };
    const customs = `<div class="col-12"><h3 class="form-section"><span>E</span>Hải quan</h3></div><div class="row g-2">
        ${field('Số Seal chì', 'sealNo', 'SL2611' + rnd(1000, 9000), { col: 3, required: true })}
        ${field('Cảng dỡ hàng', 'port', 'Cát Lái', { col: 3, type: 'select', options: ['Cát Lái', 'Cái Mép', 'Đình Vũ', 'Hữu Nghị (Lạng Sơn)', 'Móng Cái'] })}
        ${field('Số tờ khai hải quan', 'customsNo', '10' + rnd(10000000, 90000000), { col: 3, required: true })}
        ${field('Số vận đơn B/L', 'billNo', 'BL-' + rnd(100000, 900000), { col: 3, required: true })}
        ${field('Giấy kiểm dịch thực vật', 'phytoNo', 'KDTV-' + rnd(1000, 9000), { col: 6 })}
        ${field('C/O Form E', 'coNo', '', { col: 6, help: 'Để trống nếu chưa có: lô vào Khu B chờ bổ sung' })}</div>`;
    const m = openModal({
        title: 'Tiếp nhận container nhập khẩu', size: 'modal-xl', submitText: 'Tiếp nhận vào kho',
        body: `<div class="note-box warn"><i class="fa fa-ship me-1"></i>Gỗ nhập khẩu phải truy về vùng rừng nơi cây được khai thác, không chấp nhận địa chỉ nhà máy hay cảng xuất.</div>` + intakeBody(preset).replace('</div><aside', customs + '</div><aside'),
        onSubmit: (data, fd) => {
            ['C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật'].forEach((d, i) => { if ([data.coNo, data.customsNo, data.phytoNo][i]) fd.append('docs', d); });
            return submitIntake({ ...data, note: `Seal ${data.sealNo} | TKHQ ${data.customsNo} | B/L ${data.billNo} | KDTV ${data.phytoNo || '–'} | C/O ${data.coNo || 'chưa có'} | Cảng ${data.port}. ${data.note || ''}` }, fd, { dataSource: 'Container nhập khẩu' });
        }
    });
    bindPoSelect(m.el);
    bindIntake(m.el, preset);
}

export function manualReceipt() {
    const m = openModal({
        title: 'Phiếu tiếp nhận nhập tay', size: 'modal-xl', submitText: 'Tiếp nhận vào kho', body: intakeBody({}),
        onSubmit: (data, fd) => submitIntake(data, fd, { dataSource: 'Nhập tay' })
    });
    bindPoSelect(m.el);
    bindIntake(m.el);
}

export const EXCEL_COLUMNS = ['MaNCC', 'MaHopDong', 'BienSo', 'LanVanChuyen', 'Xuong', 'NgayCan', 'CanTong', 'CanXe', 'TenKhoaHoc', 'Nguon', 'LoaiNL', 'SoKien', 'M3MoiKien', 'MaThuaDat', 'MaLenhMua'];

export function downloadReceiptTemplate() {
    const sample = ['NCC-VN-001', 'HD-01', '60C-111.22', 1, PACK.workshops[0], todayISO(), 16000, 8000, 'Hevea brasiliensis', 'DOMESTIC', PACK.inputs[0], 10, 1, 'PLOT-VN-DN-01;PLOT-VN-DN-02', 'LM-2610-001'];
    downloadFile('Mau_tiep_nhan.csv', '﻿' + EXCEL_COLUMNS.join(',') + '\n' + sample.join(',') + '\n', 'text/csv');
}

export async function readReceiptRows(file) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: false });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
}

const rowPlots = row => String(row.MaThuaDat || '').split(';').map(x => x.trim()).filter(Boolean);
export function checkReceiptRow(row) {
    const errors = [];
    if (!getSupplier(row.MaNCC)) errors.push('Mã NCC không tồn tại');
    if (!row.BienSo) errors.push('Thiếu biển số');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.NgayCan)) errors.push('Ngày cân phải dạng YYYY-MM-DD');
    if (!(Number(row.CanTong) > Number(row.CanXe))) errors.push('Cân tổng phải lớn hơn cân xe');
    if (row.Nguon && !SOURCE_LABEL[row.Nguon]) errors.push('Nguồn phải là DOMESTIC, IMPORT hoặc RECYCLED');
    ['SoKien', 'M3MoiKien'].forEach(k => { if (!(Number(row[k]) > 0)) errors.push(`${k} không hợp lệ`); });
    rowPlots(row).forEach(id => { if (!getPlot(id)) errors.push(`Thửa ${id} không tồn tại`); });
    const poErr = poReceiptError(String(row.MaLenhMua || '').trim(), row.MaNCC, row.TenKhoaHoc);
    if (poErr) errors.push(poErr);
    if (!errors.length) errors.push(...gateCheck({ supplierId: row.MaNCC, contractId: String(row.MaHopDong || '').trim(), plotIds: rowPlots(row), sourceCategory: row.Nguon || 'DOMESTIC', species: row.TenKhoaHoc, date: row.NgayCan, m3: row.SoKien * row.M3MoiKien }).blocks.map(b => 'Bị chặn: ' + b));
    return errors;
}

/** Tiếp nhận theo danh sách: mỗi dòng qua chốt chặn tại cổng, chỉ tạo khi mọi dòng hợp lệ. */
export function showBatchReceipt() {
    let rows = [];
    const m = openModal({
        title: 'Tiếp nhận theo danh sách', size: 'modal-xl', submitText: 'Tạo phiếu',
        body: `<div class="d-flex flex-wrap gap-2 align-items-center mb-2"><input type="file" class="form-control form-control-sm" style="max-width:320px" id="batch-file" accept=".xlsx,.xls,.csv" aria-label="Tệp danh sách"><button type="button" class="btn btn-sm btn-light" onclick="downloadReceiptTemplate()"><i class="fa fa-download me-1"></i>Tải mẫu</button><span class="small text-muted">Mỗi dòng đi qua chốt chặn tại cổng như một xe.</span></div><div id="batch-preview" class="empty">Chọn tệp Excel hoặc CSV theo mẫu</div>`,
        onSubmit: () => {
            if (!rows.length) { toast('Chưa có dữ liệu', 'err'); return false; }
            if (rows.some(r => checkReceiptRow(r).length)) { toast('Còn dòng lỗi hoặc bị chặn, sửa tệp rồi tải lại', 'err'); return false; }
            return guarded('receipt', () => {
                rows.forEach(r => attachReceiptToPO(createReceipt({ supplierId: r.MaNCC, contractId: String(r.MaHopDong || '').trim(), plate: r.BienSo, trip: r.LanVanChuyen, workshop: r.Xuong, date: r.NgayCan, gross: r.CanTong, tare: r.CanXe, species: r.TenKhoaHoc, sourceCategory: r.Nguon || undefined, inputType: r.LoaiNL, pkgCount: r.SoKien, pkgM3: r.M3MoiKien, dataSource: 'Excel' }, rowPlots(r), []), String(r.MaLenhMua || '').trim()));
                toast(`Đã tạo ${rows.length} phiếu`);
                refresh();
            });
        }
    });
    m.el.querySelector('#batch-file').onchange = async e => {
        const box = m.el.querySelector('#batch-preview');
        try {
            rows = await readReceiptRows(e.target.files[0]);
            box.className = '';
            box.innerHTML = table([
                { title: 'NCC', render: r => esc(r.MaNCC) }, { title: 'Hợp đồng', render: r => esc(r.MaHopDong) }, { title: 'Biển số', render: r => esc(r.BienSo) },
                { title: 'Loài', render: r => `<span class="sci">${esc(r.TenKhoaHoc)}</span>` }, { title: 'Kiện', num: true, render: r => esc(r.SoKien) }, { title: 'Thửa', render: r => esc(r.MaThuaDat) },
                { title: 'Kiểm tra', render: r => { const er = checkReceiptRow(r); return er.length ? pill('FAIL', er[0]) : pill('PASS', 'Qua chốt chặn'); } }
            ], rows);
        } catch (err) { toast(err.message, 'err'); }
    };
}

/** Bổ sung thửa cho lô đã nhận (bước 8). Thương lái chỉ chọn được thửa của hộ trong hợp đồng. */
export function choosePlots(id) {
    const r = getReceipt(id), locked = receiptLockedBy(id);
    if (locked.length) { toast(`Lô đang khóa bởi đơn ${locked.map(o => o.id).join(', ')}`, 'err'); return; }
    const c = getContract(r.contractId);
    const allowed = c ? contractPlotIds(c) : DB.plots.filter(p => p.supplierId === r.supplierId).map(p => p.id);
    const plots = uniq([...allowed, ...r.plotIds]).map(getPlot).filter(Boolean);
    const m = openModal({
        title: `Gắn thửa đất cho ${id}`, size: 'modal-xl', submitText: 'Lưu và chấm lại',
        body: `${c ? `<div class="note-box">Theo hợp đồng ${esc(c.no)}: ${allowed.length} thửa được phép.</div>` : ''}<div class="d-flex gap-2 align-items-center mb-2"><button type="button" class="btn btn-sm btn-light" data-all="1">Chọn tất cả</button><button type="button" class="btn btn-sm btn-light" data-all="0">Bỏ chọn tất cả</button><span>Đã chọn: <b id="plot-count">0</b> thửa</span></div>` + table([
            { title: '', render: p => `<input class="form-check-input" type="checkbox" name="plotIds" value="${esc(p.id)}" aria-label="${esc(p.id)}" ${r.plotIds.includes(p.id) ? 'checked' : ''}>` },
            { title: 'Mã thửa', render: p => `<span class="code">${esc(p.id)}</span>${allowed.includes(p.id) ? '' : pill('FAIL', 'Ngoài hợp đồng')}` }, { title: 'Chủ đất', render: p => esc(p.owner) }, { title: 'Diện tích', num: true, render: p => `${fmt(p.areaHa)} ha` },
            { title: 'Địa chỉ', render: p => esc(p.place) }, { title: 'Bản đồ rừng', render: p => pill((p.forest && p.forest.result) || 'NONE') }
        ], plots, 'Bên bán chưa có thửa đất'),
        onSubmit: (data, fd) => guarded('receipt', () => {
            r.plotIds = fd.getAll('plotIds');
            r.approval = null;
            logAction(id, 'Gắn thửa đất', r.plotIds.join(', ') || 'Bỏ hết');
            const a = assessReceipt(r);
            toast(`Đã chấm lại ${id}: ${RESULT_LABEL[LEVEL_RESULT[a.level]]}`, a.level === 'HIGH' ? 'err' : 'ok');
            refresh();
        })
    });
    const boxes = () => [...m.el.querySelectorAll('[name=plotIds]')];
    const count = () => { m.el.querySelector('#plot-count').textContent = boxes().filter(b => b.checked).length; };
    boxes().forEach(b => { b.onchange = count; });
    m.el.querySelectorAll('[data-all]').forEach(btn => { btn.onclick = () => { boxes().forEach(b => { b.checked = btn.dataset.all === '1'; }); count(); }; });
    count();
}

/** KCS và bổ sung chứng từ của chuyến hàng. */
export function kcsForm(id) {
    const r = getReceipt(id), c = getContract(r.contractId);
    openModal({
        title: `KCS & chứng từ ${id}`, size: 'modal-lg', submitText: 'Lưu và chấm lại',
        body: `<div class="row g-2">
            ${field(`Độ ẩm MC (%)${c && c.moist ? `, hợp đồng tối đa ${c.moist}%` : ''}`, 'moisture', r.moisture, { type: 'number', col: 4, required: true, attrs: 'step="0.1" min="0"' })}
            ${field('Phẩm cấp', 'grade', r.grade, { col: 4, required: true })}
            ${field('Người KCS', 'by', r.kcs ? r.kcs.by : '', { required: true, col: 4 })}
            ${field('Thể tích (m³)', 'm3', round(receiptM3(r), 3), { col: 4, attrs: 'readonly' })}
            ${field('Khối lượng tịnh (kg)', 'net', receiptNetKg(r), { col: 4, attrs: 'readonly' })}
            ${field('Ô kho hiện tại', 'bayView', r.bay, { col: 4, attrs: 'readonly', help: 'Ô đổi theo quyết định của Tuân thủ' })}
            <div class="col-12"><label class="form-label">Chứng từ đã nhận</label><div class="pick-list">${requiredDocs(getSupplier(r.supplierId), r).map(d => `<label><input class="form-check-input" type="checkbox" name="docs" value="${esc(d)}" ${r.docs.includes(d) ? 'checked' : ''}><span>${esc(d)}</span></label>`).join('')}</div></div></div>`,
        onSubmit: (data, fd) => guarded('receipt', () => {
            Object.assign(r, { moisture: +data.moisture, grade: data.grade, docs: fd.getAll('docs'), kcs: { by: data.by, at: todayISO() } });
            logAction(id, 'Lưu KCS & chứng từ', `MC ${r.moisture}%, hạng ${r.grade}; ${r.docs.length} chứng từ`);
            const a = assessReceipt(r);
            toast(`Đã chấm lại ${id}: ${RESULT_LABEL[LEVEL_RESULT[a.level]]}`, a.level === 'HIGH' ? 'err' : 'ok');
            refresh();
        })
    });
}

/** Các điều kiện bắt buộc của bộ tiêu chuẩn: thiếu một trong bốn thì lô bị giữ lại. */
const MUST = [['Tọa độ lô đất', 'Tọa độ', 'fa-location-dot'], ['Ngày khai thác', 'Ngày khai thác', 'fa-calendar'], ['Bản đồ rừng mốc 31/12/2020', 'Không phá rừng', 'fa-tree'], ['Hồ sơ hợp pháp', 'Hợp pháp', 'fa-scale-balanced']];
const MUST_RECYCLED = [['Chứng nhận tái chế', 'Chứng nhận tái chế', 'fa-recycle'], ['Hồ sơ tái chế', 'Hồ sơ tái chế', 'fa-folder']];
const FIX = { 'Tọa độ lô đất': ['choosePlots', 'Gắn thửa'], 'Độ phức tạp chuỗi': ['choosePlots', 'Đổi thửa'], 'Hồ sơ hợp pháp': ['kcsForm', 'Bổ sung chứng từ'], 'Hồ sơ tái chế': ['kcsForm', 'Bổ sung chứng từ'], 'Chứng nhận tái chế': ['kcsForm', 'Bổ sung chứng từ'], 'Độ ẩm so với hợp đồng': ['kcsForm', 'Đo lại'] };

/** Bước 6 và 8: hồ sơ đánh giá một lô và quyết định của Tuân thủ. */
export function showReceipt(id) {
    const r = getReceipt(id), a = assessReceipt(r), s = receiptStatus(r), sp = getSupplier(r.supplierId), c = getContract(r.contractId);
    const st = sp ? supplierStanding(sp, r.date) : null;
    const byName = Object.fromEntries(a.factors.map(f => [f.name, f]));
    const recycledOnly = !!byName['Chứng nhận tái chế'];
    const tiles = (recycledOnly ? MUST_RECYCLED : MUST).map(([k, label, icon]) => { const f = byName[k] || { level: 'HIGH', msg: 'Chưa có' }; return `<div class="must lv-${f.level.toLowerCase()}"><i class="fa ${icon}"></i><b>${esc(label)}</b><small>${esc(f.msg)}</small></div>`; }).join('');
    const ca = c ? assessContract(c, r.date) : null;
    const decision = r.decision || (r.approval ? { result: 'PASS', action: 'PRODUCE', ...r.approval } : null);
    const canPass = a.level !== 'HIGH' && !!r.kcs && (a.level === 'LOW' || r.mitigations.length > 0);
    const passHint = a.level === 'HIGH' ? 'Còn yếu tố Cao' : !r.kcs ? 'Chưa có KCS' : a.level === 'MEDIUM' && !r.mitigations.length ? 'Cần ghi biện pháp giảm thiểu trước' : '';
    const m = openModal({
        title: `Hồ sơ đánh giá lô ${id}`, size: 'modal-xl',
        body: `<div class="lot-head">${pill(s)} <span class="code">${esc(r.plate)}</span><span>${esc(sp ? sp.name : '')} · ${esc(receiptSource(r))} · ${r.pkgCount} ${PACK.packUnit}, ${fmt(receiptM3(r))} m³, ${fmt(receiptNetKg(r), 0)} kg · ô ${tag(r.bay || '–')}</span></div>
        <div class="ct-layout"><div>
            <h3 class="form-section"><span>1</span>Nguồn & hợp đồng</h3>
            <div class="src-row"><div><small>Nguồn cung</small>${st ? `${pill({ OK: 'PASS', COND: 'MEDIUM', STOP: 'FAIL' }[st.key], st.label)}<span class="sub">${esc(kindOf(sp))}${st.reasons[0] ? ' · ' + esc(st.reasons[0]) : ''}</span>` : '–'}</div>
                <div><small>Hợp đồng mua</small>${c ? `<button type="button" class="btn btn-link p-0" data-contract>${esc(c.no)}</button> ${levelPill(ca.level)}<span class="sub">${esc((ca.issues.find(i => i.level === ca.level) || {}).msg || 'Đủ điều khoản và hồ sơ')}</span>` : pill('FAIL', 'Chưa gắn hợp đồng')}</div></div>
            <h3 class="form-section"><span>2</span>Điều kiện bắt buộc</h3><div class="must-row">${tiles}</div>
            <h3 class="form-section"><span>3</span>Chấm từng yếu tố</h3>
            ${table([{ title: 'Yếu tố', render: f => esc(f.name) }, { title: 'Mức', render: f => pill(f.level) }, { title: 'Chi tiết', render: f => esc(f.msg) },
                { title: '', render: f => f.level !== 'LOW' && FIX[f.name] ? `<button type="button" class="btn btn-sm btn-light" data-fix="${FIX[f.name][0]}">${FIX[f.name][1]}</button>` : '' }], a.factors)}
            ${(r.gateWarns || []).length ? `<div class="note-box warn">Cảnh báo tại cổng: ${r.gateWarns.map(esc).join('; ')}</div>` : ''}
            <h3 class="form-section"><span>4</span>Biện pháp giảm thiểu</h3>
            ${r.mitigations.length ? table([{ title: 'Biện pháp', render: x => esc(x.action) }, { title: 'Kết quả', render: x => esc(x.result) }, { title: 'Người làm', render: x => `${esc(x.by)}<span class="sub">${esc(x.at)}</span>` }, { title: 'Người duyệt', render: x => esc(x.approvedBy || '–') }], r.mitigations) : '<p class="text-muted small">Chưa có. Mức Cần bổ sung phải có biện pháp giảm thiểu trước khi ký Đạt.</p>'}
            <button type="button" class="btn btn-sm btn-light" data-mit><i class="fa fa-plus me-1"></i>Ghi biện pháp giảm thiểu</button>
        </div>
        <aside class="ct-side">
            ${riskBox('Kết quả chấm lô', a.level, nonLow(a).map(f => ({ level: f.level, msg: `${f.name}: ${f.msg}` })), 'Đủ điều kiện. Chờ Tuân thủ ký Đạt.')}
            <div class="decide-box"><h4>Quyết định của Tuân thủ</h4>
                ${decision ? `<div class="note-box ${decision.result === 'PASS' ? 'ok' : decision.result === 'FAIL' ? 'bad' : 'warn'} mb-2"><b>${esc(RESULT_LABEL[decision.result])}</b> · ${esc(DECISION_ACTIONS[decision.action] || '')}<br><small>${esc(decision.by)}, ${esc(decision.at)}: ${esc(decision.reason)}</small></div>` : '<p class="small text-muted">Chưa có quyết định.</p>'}
                <div class="d-grid gap-1">
                    <button type="button" class="btn btn-sm btn-success" data-decide="PASS" ${canPass ? '' : 'disabled'}><i class="fa fa-circle-check me-1"></i>Ký Đạt → Khu A</button>${passHint ? `<small class="text-muted">${esc(passHint)}</small>` : ''}
                    <button type="button" class="btn btn-sm btn-warning" data-decide="PENDING" ${a.level === 'HIGH' ? 'disabled' : ''}><i class="fa fa-triangle-exclamation me-1"></i>Cần bổ sung → Khu B</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-decide="FAIL"><i class="fa fa-ban me-1"></i>Không đạt → Khu C</button>
                </div></div>
        </aside></div>`
    });
    const go = fn => { m.hide(); setTimeout(fn, 300); };
    m.el.querySelectorAll('[data-fix]').forEach(b => { b.onclick = () => go(() => window[b.dataset.fix](id)); });
    m.el.querySelector('[data-mit]').onclick = () => go(() => addMitigation(id));
    m.el.querySelectorAll('[data-decide]').forEach(b => { b.onclick = () => go(() => decideDialog(id, b.dataset.decide)); });
    const ctBtn = m.el.querySelector('[data-contract]');
    if (ctBtn) ctBtn.onclick = () => go(() => window.showContract(c.id));
}

export function addMitigation(id) {
    openModal({
        title: `Giảm thiểu rủi ro ${id}`, submitText: 'Lưu',
        body: `<div class="row g-2">${field('Biện pháp', 'action', '', { type: 'select', col: 12, options: ['Thu thập bổ sung chứng từ, bản đồ, tọa độ', 'Kiểm tra chéo hợp đồng, hóa đơn, chứng từ', 'Kiểm tra nội bộ / kiểm toán độc lập', 'Đổi nhà cung cấp'] })}${field('Người thực hiện', 'by', '', { required: true })}${field('Ngày', 'at', todayISO(), { type: 'date', required: true })}${field('Kết quả', 'result', '', { required: true, col: 12 })}${field('Người phê duyệt', 'approvedBy', '', { required: true, col: 12 })}</div>`,
        onSubmit: data => guarded('approve', () => {
            getReceipt(id).mitigations.push(data);
            logAction(id, 'Giảm thiểu rủi ro', `${data.action}: ${data.result}; duyệt ${data.approvedBy}`);
            refresh();
        })
    });
}

/** Ký quyết định: Đạt (Khu A), Cần bổ sung (Khu B) hoặc Không đạt (Khu C, chọn cách xử lý). */
export function decideDialog(id, result) {
    const r = getReceipt(id);
    if (result === 'PASS' && !r.kcs) { toast('Lô chưa có kết quả KCS', 'err'); return; }
    const title = { PASS: 'Ký Đạt, chuyển Khu A', PENDING: 'Xếp Cần bổ sung, giữ Khu B', FAIL: 'Xếp Không đạt, cách ly Khu C' }[result];
    openModal({
        title: `${title}: ${id}`, submitText: 'Ký quyết định',
        body: `<div class="row g-2">
            ${result === 'FAIL' ? field('Cách xử lý', 'action', 'RETURN', { type: 'select', col: 12, options: [['RETURN', DECISION_ACTIONS.RETURN], ['NON_EU', DECISION_ACTIONS.NON_EU], ['QUARANTINE', DECISION_ACTIONS.QUARANTINE]] }) : ''}
            ${result === 'PENDING' ? '<div class="col-12"><div class="note-box warn mb-0">Thu mua đòi bổ sung hồ sơ trong 7 ngày. Bổ sung xong thì hệ thống chấm lại, Tuân thủ ký Đạt.</div></div>' : ''}
            ${field('Người quyết định (Tuân thủ)', 'by', '', { required: true, col: 12 })}
            ${field('Lý do', 'reason', result === 'PASS' && assessReceipt(r).level === 'LOW' ? 'Đủ hồ sơ theo bộ tiêu chuẩn' : '', { type: 'textarea', col: 12, required: true })}</div>`,
        onSubmit: data => guarded('approve', () => { decideReceipt(r, { result, action: data.action, by: data.by, reason: data.reason }); toast(`${id}: ${RESULT_LABEL[result]}, ô ${r.bay}`); refresh(); })
    });
}
export const approveDialog = id => decideDialog(id, 'PASS');

export function page_receipts() {
    startPage('tiep-nhan', {
        title: 'Tiếp nhận nguyên liệu',
        actions: `<a class="btn btn-sm btn-light" href="/thu-mua/ho-so"><i class="fa fa-file-shield me-1"></i>Hồ sơ thu mua</a>`
    }, root => {
        const f = recvFilter;
        const tickets = DB.scaleTickets.filter(t => t.purchase && !t.receiptId && !t.rejected && (!f.scaleDate || t.date === f.scaleDate));
        const rejected = DB.scaleTickets.filter(t => t.rejected);
        const gateOf = t => gateCheck({ ...t, m3: (t.pkgCount || 0) * (t.pkgM3 || 0), species: undefined });
        const code = f.code.trim().toLowerCase();
        const status = r => receiptStatus(r);
        const rows = DB.receipts.filter(r => (f.status === 'ALL' || (f.status === 'WAIT' ? receiptWaiting(r) : status(r) === f.status)) && (!f.source || receiptSource(r) === f.source) && r.date >= f.from && r.date <= f.to && (!code || r.id.toLowerCase().includes(code) || r.plate.toLowerCase().includes(code))).slice().reverse();
        root.innerHTML = `<section class="panel zone-head-scale"><header class="panel-head"><h2><i class="fa fa-truck me-2"></i>Xe đã xác nhận mua · chờ tiếp nhận</h2><label class="d-flex gap-2 align-items-center m-0">Ngày cân <input type="date" class="form-control form-control-sm" value="${esc(f.scaleDate)}" onchange="setRecv('scaleDate',this.value)"></label></header><div class="panel-body p-0">` + table([
            { title: 'Xe', render: t => `<span class="code">${esc(t.plate)}</span><span class="sub">${esc(t.id)} · ${esc(SOURCE_LABEL[t.sourceCategory] || '')}</span>` },
            { title: 'Nhà cung cấp', render: t => { const s = getSupplier(t.supplierId); return `${esc(supplierName(t.supplierId))}<span class="sub">${esc(kindOf(s))}</span>`; } },
            { title: 'Hợp đồng', render: t => { const c = getContract(t.contractId); return c ? `<span class="code">${esc(c.no)}</span> ${levelPill(assessContract(c, t.date).level)}` : pill('FAIL', 'Chưa có'); } },
            { title: 'KL thực tế', num: true, render: t => `<b>${fmt(t.gross - t.tare, 0)} kg</b><span class="sub">dự kiến ${fmt(t.expectedKg, 0)}</span>` },
            { title: 'Thửa khai', render: t => t.plotIds.map(tag).join('') || pill('FAIL', 'Chưa có') },
            { title: 'Chốt chặn', render: t => { const g = gateOf(t); return g.ok ? pill('PASS', g.warns.length ? `Qua · ${g.warns.length} cảnh báo` : 'Qua') : `${pill('FAIL', 'Bị chặn')}<span class="sub">${esc(g.blocks[0])}</span>`; } },
            { title: '', render: t => `<button class="btn btn-sm btn-primary btn-icon" title="Đối soát, tiếp nhận" aria-label="Đối soát" onclick="gateModal('${t.id}')"><i class="fa fa-qrcode"></i></button>` }
        ], tickets, "Chưa có xe nào được xác nhận mua. Xác nhận ở Thu mua › Hồ sơ thu mua.") + `</div></section>
        <section class="panel zone-head-recv"><header class="panel-head"><h2><i class="fa fa-truck-ramp-box me-2"></i>Phiếu tiếp nhận · KCS, ký, xếp kho</h2></header><div class="panel-body">
            <div class="d-flex flex-wrap gap-1 mb-2">${RECV_STATUS.map(([k, label]) => `<button type="button" class="btn btn-sm ${f.status === k ? 'btn-dark' : 'btn-light'}" onclick="setRecv('status','${k}')">${esc(label)}</button>`).join('')}</div>
            <div class="row g-2 align-items-end">
                ${field('Nguồn', 'fSource', f.source, { type: 'select', col: 3, options: [['', 'Tất cả'], ...Object.values(SOURCE_LABEL)], attrs: `onchange="setRecv('source',this.value)"` })}
                <div class="col-md-5"><label class="form-label">Ngày cân ${quickDays('chooseRecvTime', [0, -7, -30, -60, -90])}</label><div class="input-group input-group-sm"><input type="date" class="form-control" aria-label="Từ ngày" value="${f.from}" onchange="setRecv('from',this.value)"><span class="input-group-text">đến</span><input type="date" class="form-control" aria-label="Đến ngày" value="${f.to}" onchange="setRecv('to',this.value)"></div></div>
                ${field('Tìm theo mã', 'fCode', f.code, { col: 4, attrs: `placeholder="Mã lô, biển số, cont..." onchange="setRecv('code',this.value)"` })}
            </div></div><div class="panel-body p-0">` + table([
            { title: 'Lô', render: r => `<span class="code">${esc(r.id)}</span><span class="sub">${esc(r.date)} · ${esc(r.dataSource)}</span>` },
            { title: 'Xe / Cont', render: r => `<span class="code">${esc(r.plate)}</span>` },
            { title: 'NCC · Hợp đồng', render: r => `${esc(supplierName(r.supplierId))}<span class="sub">${esc((getContract(r.contractId) || {}).no || 'Chưa gắn hợp đồng')}${receiptPO(r.id) ? ' · ' + esc(receiptPO(r.id).id) : ''}</span>` },
            { title: 'Nguyên liệu', render: r => `${esc(r.inputType)}<span class="sub sci">${esc(r.species)}</span><span class="sub">${esc(receiptSource(r))}</span>` },
            { title: 'Khối lượng', num: true, render: r => `${fmt(receiptNetKg(r), 0)} kg<span class="sub">${r.pkgCount} ${PACK.packUnit} · ${fmt(receiptM3(r))} m³</span>` },
            { title: 'Rủi ro', render: r => levelPill(assessReceipt(r).level) },
            { title: 'Còn thiếu', render: r => { const list = nonLow(assessReceipt(r)); return list.length ? list.slice(0, 2).map(x => `<span class="miss lv-${x.level.toLowerCase()}">${esc(x.msg)}</span>`).join('') + (list.length > 2 ? `<span class="sub">+${list.length - 2} mục</span>` : '') : '<span class="text-muted">–</span>'; } },
            { title: 'Kết quả & ô', render: r => `${pill(status(r))}<span class="sub">Ô ${esc(r.bay || '–')} · ${r.done ? esc(DECISION_ACTIONS[(r.decision || {}).action] || 'Đã ký') : r.kcs ? 'Chờ Tuân thủ ký' : 'Chờ KCS'}</span>` },
            { title: '', render: r => `<div class="d-flex gap-1"><button class="btn btn-sm btn-primary btn-icon" title="Hồ sơ lô" aria-label="Hồ sơ lô" onclick="showReceipt('${r.id}')"><i class="fa fa-shield-halved"></i></button><button class="btn btn-sm btn-light btn-icon" title="KCS & chứng từ" aria-label="KCS ${r.id}" onclick="kcsForm('${r.id}')"><i class="fa fa-vial-circle-check"></i></button></div>` }
        ], rows, 'Không có phiếu phù hợp') + `</div></section>` +
        "";
    });
}

// ========== ĐƠN HÀNG (Order) ==========
const initialOrderFilter = () => ({ tab: '', marketFilter: '', customer: '', type: '', transport: '', country: '', from: dateFilter(-90), to: todayISO() });
export const orderFilter = initialOrderFilter();
export const TYPE_LABEL = { IN: 'Trong nước', OUT: 'Ngoài nước' };
export const TRANSPORT_LABEL = { ROAD: 'Đường bộ', RAIL: 'Đường sắt', WATER: 'Đường thủy', AIR: 'Hàng không' };
export const STATUS_TABS = [['', 'Tất cả trạng thái'], ['-3', 'Bị khách từ chối'], ['-2', 'Thu hồi giao dịch'], ['-1', 'Xóa (lưu trữ)'], ['0', 'Đang lên đơn'], ['1', 'Đang lên hàng'], ['2', 'Đang vận chuyển'], ['3', 'Đợi khách xác nhận'], ['4', 'Đã xác nhận']];
export let orderDetailId = null, orderDetailTab = 'info';

export function setOrderFilter(key, value) { orderFilter[key] = value; refresh(); }
export function chooseOrderTime(days) { orderFilter.from = dateFilter(days); orderFilter.to = todayISO(); refresh(); }
export function openOrder(id, tab = 'info') { orderDetailId = id; orderDetailTab = tab; refresh(); }

export function orderForm(o = {}) {
    return `<h3 class="form-title">Thông tin khách hàng</h3><div class="row g-2">
        ${field('Khách hàng', 'customerId', o.customerId, { type: 'select', required: true, options: DB.customers.map(c => [c.id, `${c.name} (${c.country})`]) })}
        ${field('Nước nhập khẩu (ISO 2)', 'countryId', o.countryId, { required: true, attrs: 'maxlength="2" pattern="[A-Za-z]{2}"', help: 'Nước EU: đơn phải qua kiểm tra EUDR' })}
    </div><h3 class="form-title">Thông tin chung</h3><div class="row g-2">
        ${field('Loại hình xuất khẩu', 'type', o.type || 'OUT', { type: 'select', col: 3, options: Object.entries(TYPE_LABEL) })}
        ${field('Loại hình vận chuyển', 'transportType', o.transportType || 'WATER', { type: 'select', col: 3, options: Object.entries(TRANSPORT_LABEL) })}
        ${field('Chứng nhận', 'certificate', o.certificate, { type: 'select', col: 3, options: DB.config.certificates })}
        ${field('Mã HS', 'hsCode', o.hsCode, { type: 'select', col: 3, options: DB.config.hsCodes })}
        ${field('Địa điểm giao hàng', 'deliveryLocation', o.deliveryLocation)}${field('Địa điểm nhận hàng', 'pickUpLocation', o.pickUpLocation || TENANT.site)}
        ${field('Đơn vị vận chuyển', 'shipping', o.shipping)}${field('Tên tàu', 'vesselName', o.vesselName)}
        ${field('Mã vận đơn', 'billOfLading', o.billOfLading)}${field('Số tờ khai hải quan', 'customsNo', o.customsNo)}
        ${field('Số lưu nội bộ', 'numberOrder', o.numberOrder)}${field('Số hóa đơn', 'invoice', o.invoice)}
        ${field('Hình thức thanh toán', 'paymentType', o.paymentType)}${field('Hình thức xuất khẩu', 'exportCategory', o.exportCategory)}
        ${field('Ngày lập đơn', 'created', o.created || todayISO(), { type: 'date', required: true })}${field('Ngày xuất hóa đơn', 'invoiceDate', o.invoiceDate, { type: 'date' })}
        ${field('Số hợp đồng', 'contractNo', o.contractNo)}${field('Ngày hợp đồng', 'contractDate', o.contractDate, { type: 'date' })}
        ${field('Ngày vận chuyển', 'shippingDate', o.shippingDate, { type: 'date' })}${field('Bên nộp DDS', 'filer', o.filer || 'CUSTOMER', { type: 'select', options: [['CUSTOMER', 'Nhà nhập khẩu tại EU'], ['SELF', 'ECOtech2A tự là nhà vận hành']] })}
        ${field('Mật khẩu xem đơn', 'passCode', o.passCode, { type: 'password', attrs: 'autocomplete="new-password"' })}${field('Thời hạn xem đơn', 'viewingPeriod', o.viewingPeriod, { type: 'date' })}
        ${field('Ghi chú', 'remark', o.remark, { col: 12, type: 'textarea' })}</div>`;
}

export function applyOrderForm(o, data) {
    const c = byId(DB.customers, data.customerId);
    Object.assign(o, data, { countryId: data.countryId.toUpperCase(), customer: c.name, customerAddress: c.address, customerEmail: c.email, eori: c.eori });
}

export function addOrder() {
    openModal({
        title: 'Thêm đơn hàng', size: 'modal-lg', submitText: 'Lưu', body: orderForm(),
        onSubmit: data => guarded('order', () => {
            const day = data.created.slice(2).replace(/-/g, '');
            const no = DB.orders.filter(o => o.id.startsWith('DPO' + day)).length + 1;
            const o = { id: `DPO${day}${String(no).padStart(2, '0')}`, items: [], cars: [], palletIds: [], status: 0, dds: null, viewLog: [], failLog: [] };
            applyOrderForm(o, data);
            DB.orders.push(o);
            logAction(o.id, 'Tạo đơn', o.customer);
            openOrder(o.id);
        })
    });
}

export function editOrder(id) {
    const o = getOrder(id);
    if (orderIsLocked(o)) { toast('Đơn đã khóa, trả về Đang lên đơn trước khi sửa', 'err'); return; }
    openModal({
        title: `Sửa đơn ${id}`, size: 'modal-lg', submitText: 'Lưu', body: orderForm(o),
        onSubmit: data => guarded('order', () => { applyOrderForm(o, data); logAction(id, 'Sửa đơn', ''); refresh(); })
    });
}

export function changeOrderStatus(id, status) {
    openModal({
        title: `Chuyển đơn ${id} sang: ${ORDER_STATUS[status]}`, submitText: 'Xác nhận',
        body: `${status >= 1 ? '<div class="note-box warn">Khóa lô và thửa nguồn</div>' : ''}<div class="row g-2">${field('Người thực hiện', 'by', '', { required: true, col: 12 })}</div>`,
        onSubmit: data => guarded('order', () => { setOrderStatus(getOrder(id), Number(status), data.by); refresh(); })
    });
}

export function editItem(orderId, itemId) {
    const o = getOrder(orderId), it = itemId ? byId(o.items, itemId) : { unit: 'm³', currency: 'USD', certificate: o.certificate };
    if (orderIsLocked(o)) { toast('Đơn đã khóa', 'err'); return; }
    const products = uniq(DB.workOrders.map(w => w.product));
    openModal({
        title: itemId ? 'Sửa sản phẩm' : 'Thêm sản phẩm', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Sản phẩm', 'product', it.product, { type: 'select', required: true, options: products })}${field('Chứng nhận', 'certificate', it.certificate, { type: 'select', options: DB.config.certificates })}
            ${field('Đơn giá', 'price', it.price, { type: 'number', attrs: 'min="0" step="any"' })}${field('Tiền tệ', 'currency', it.currency, { type: 'select', options: ['USD', 'EUR', 'VND'] })}
            ${field('Số lượng', 'quantity', it.quantity, { type: 'number', required: true, attrs: 'min="0.001" step="any"' })}${field('Đơn vị', 'unit', it.unit, { type: 'select', options: uniq(['m³', unitName()]) })}
            ${field('Ghi chú', 'remark', it.remark, { col: 12 })}</div>`,
        onSubmit: data => guarded('order', () => {
            if (itemId) Object.assign(it, data); else o.items.push({ id: 'SP-' + (o.items.length + 1), ...data });
            logAction(orderId, itemId ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `${data.product}: ${data.quantity} ${data.unit}`);
            refresh();
        })
    });
}

export function removeItem(orderId, itemId) {
    guarded('order', () => {
        const o = getOrder(orderId);
        if (orderIsLocked(o)) throw new Error('Đơn đã khóa');
        o.items = o.items.filter(i => i.id !== itemId);
        logAction(orderId, 'Xóa sản phẩm', itemId);
        refresh();
    });
}

/** Danh sách xe: mỗi xe/cont mang các pallet thành phẩm, tương ứng TransportOrder và P_AddPallet. */
export function editCar(orderId, carId) {
    const o = getOrder(orderId), c = carId ? byId(o.cars, carId) : { palletIds: [] };
    if (orderIsLocked(o)) { toast('Đơn đã khóa', 'err'); return; }
    const taken = new Set(o.cars.filter(x => x !== c).flatMap(x => x.palletIds));
    const free = DB.pallets.filter(p => !taken.has(p.id) && (!palletOrder(p.id) || palletOrder(p.id).id === orderId) && (!orderIsEudr(o) || getWO(p.workOrderId).market === 'EU'));
    openModal({
        title: carId ? 'Sửa xe' : 'Thêm xe', size: 'modal-lg', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Loại xe', 'typeCar', c.typeCar || 'Container 40HC')}${field('Biển số', 'plate', c.plate, { required: true })}${field('Số seal', 'seal', c.seal)}${field('Số cont', 'cont', c.cont)}
            ${field('Ngày vận chuyển', 'date', c.date || todayISO(), { type: 'date', required: true })}${field('Giờ vào', 'timeIn', c.timeIn, { type: 'time', col: 3 })}${field('Giờ ra', 'timeOut', c.timeOut, { type: 'time', col: 3 })}
            <div class="col-12"><label class="form-label">Pallet trên xe</label><div class="pick-list">${free.map(p => `<label><input class="form-check-input" type="checkbox" name="palletIds" value="${p.id}" ${c.palletIds.includes(p.id) ? 'checked' : ''}><span>${p.id}<span class="sub">${esc(getWO(p.workOrderId).product)}, ${p.qty} ${unitName()}, ${fmt(p.kg, 0)} kg</span></span></label>`).join('') || '<div class="empty">Không còn pallet phù hợp</div>'}</div></div>${field('Ghi chú', 'remark', c.remark, { col: 12 })}</div>`,
        onSubmit: (data, fd) => guarded('order', () => {
            const palletIds = fd.getAll('palletIds');
            const kg = sum(palletIds.map(getPallet), p => p.kg);
            const product = uniq(palletIds.map(id => getWO(getPallet(id).workOrderId).product)).join('; ');
            if (carId) Object.assign(c, data, { palletIds, kg, product }); else o.cars.push({ id: 'XE-' + (o.cars.length + 1), ...data, palletIds, kg, product });
            syncOrderPallets(o);
            logAction(orderId, 'Cập nhật xe', `${data.plate}: ${palletIds.length} pallet`);
            refresh();
        })
    });
}

export function removeCar(orderId, carId) {
    guarded('order', () => {
        const o = getOrder(orderId);
        if (orderIsLocked(o)) throw new Error('Đơn đã khóa');
        o.cars = o.cars.filter(c => c.id !== carId);
        syncOrderPallets(o);
        logAction(orderId, 'Xóa xe', carId);
        refresh();
    });
}

export function showOrderQr(id) {
    const o = getOrder(id);
    showTag('QR đơn hàng', id, [['Khách hàng', o.customer], ['Tra cứu', '/nha-may/truy-xuat, chế độ công khai'], ['Mật khẩu', o.passCode ? 'Có' : 'Không'], ['Hạn xem', o.viewingPeriod || '–']]);
}

export function enterDds(id) {
    const o = getOrder(id), d = o.dds || {};
    openModal({
        title: `Tham chiếu DDS đơn ${id}`, submitText: 'Lưu',
        body: `<div class="row g-2">${field('Số tham chiếu', 'reference', d.reference, { required: true })}${field('Mã xác minh', 'verification', d.verification, { required: true })}${field('Người ký', 'signer', d.signer, { required: true })}${field('Ngày', 'date', d.date || todayISO(), { type: 'date', required: true })}</div>`,
        onSubmit: data => guarded('order', () => {
            o.dds = { ...data, version: (d.version || 0) + 1 };
            logAction(id, 'Ghi tham chiếu DDS', `${data.reference}, phiên bản ${o.dds.version}`);
            refresh();
        })
    });
}

export function exportGeo(id) {
    const text = geoJsonText(getOrder(id));
    const res = validateGeoJsonText(text);
    if (!res.ok) { toast('GeoJSON đầu ra có lỗi, xem danh sách kiểm tra', 'err'); return; }
    downloadFile(`EUDR_${id}_${TENANT.code}.geojson`, text, 'application/geo+json');
    logAction(id, 'Xuất GeoJSON', `${res.items.length} thửa`);
}

export function exportDossier(id) {
    const o = getOrder(id), d = orderPackageData(o), plots = orderPlots(o);
    const rows = (head, list) => `<table border="1" cellpadding="5" cellspacing="0"><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${list.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Hồ sơ ${esc(id)}</title><style>body{font:14px sans-serif;margin:32px}table{border-collapse:collapse;width:100%;margin:8px 0 20px}th{background:#eee;text-align:left}</style></head><body>
        <h1>Hồ sơ dữ liệu đơn ${esc(id)}</h1><p>Xuất ngày ${todayISO()}. Lưu đến ${esc(retentionUntil(o))}. Tài liệu cung cấp dữ liệu để lập DDS, không phải DDS.</p>
        <h2>Hàng hóa và người mua</h2>${rows(['Mục', 'Nội dung'], [['Người mua', `${d.buyer.name}, ${d.buyer.address}, ${d.buyer.email}, EORI ${d.buyer.eori}`], ['Mã HS', d.goods.hsCode], ['Sản phẩm', d.goods.products.join('; ')], ['Khối lượng tịnh', d.goods.netKg + ' kg'], ['Thể tích', d.goods.m3 + ' m³'], ['Tên khoa học', d.species.join(', ')], ['Quốc gia khai thác', d.countries.join(', ')], ['Thời gian khai thác', d.harvest], ['Vận đơn / tờ khai', `${o.billOfLading} / ${o.customsNo}`], ['Số tham chiếu DDS', d.dds ? `${d.dds.reference} / ${d.dds.verification}` : 'Chưa có']])}
        <h2>Xe / container</h2>${rows(['Xe', 'Cont', 'Seal', 'Ngày', 'Pallet', 'kg'], o.cars.map(c => [c.plate, c.cont, c.seal, c.date, c.palletIds.length, c.kg]))}
        <h2>Nhà cung cấp</h2>${rows(['Tên', 'Địa chỉ', 'Email'], d.suppliers.map(s => [s.name, s.address, s.email]))}
        <h2>Thửa đất</h2>${rows(['Mã', 'Chủ đất', 'Địa điểm', 'ha', 'Loài', 'Khai thác', 'Giấy tờ đất', 'Bản đồ rừng'], plots.map(p => [p.id, p.owner, p.place, p.areaHa, p.species, `${p.harvestFrom} → ${p.harvestTo}`, p.landDoc, `${p.forest.result}, ${p.forest.source}, ${p.forest.date}`]))}
        <h2>Lô nguyên liệu</h2>${rows(['Lô', 'Ngày', 'Loài', 'kg', 'Chứng từ', 'Người duyệt'], orderReceipts(o).map(r => [r.id, r.date, r.species, receiptNetKg(r), r.docs.join(', '), r.approval ? r.approval.by : '']))}
        <h2>Lệnh sản xuất</h2>${rows(['Lệnh', 'Lô TP', 'Vào m³', 'Ra m³', 'Thu hồi %'], orderWOs(o).map(w => { const c = reconcile(w); return [w.id, w.lot, c.input, c.output, c.rate]; }))}
        <h2>Nhật ký công đoạn</h2>${rows(['Lệnh', 'Công đoạn', 'Ca', 'Bắt đầu', 'Kết thúc', 'Máy', 'Vận hành', 'Xác nhận', 'Số ra', 'Số lần sửa'], orderWOs(o).flatMap(w => w.stages.map((s, i) => [w.id, STAGES[i], s.shift, s.start, s.end, s.machine, s.by, s.confirmBy, s.out, (s.revisions || []).length])))}
        <h2>GeoJSON</h2><pre>${esc(geoJsonText(o))}</pre></body></html>`;
    downloadFile(`Ho_so_${id}.html`, html, 'text/html');
    logAction(id, 'Xuất hồ sơ', 'Bộ hồ sơ đầy đủ');
}

export function orderDetailHtml(o) {
    const locked = orderIsLocked(o), eudr = orderIsEudr(o);
    const tabs = [
        ['info', 'Thông tin'],
        ['items', 'Sản phẩm'],
        ['cars', 'Danh sách xe'],
        ...(eudr ? [['eudr', 'Hồ sơ EUDR & DDS TRACES']] : [['isolation', 'Cách ly Non-EU']])
    ];
    const info = [['Mã đơn', o.id], ['Khách hàng', o.customer], ['Nước nhập khẩu', o.countryId], ['Loại hình xuất khẩu', TYPE_LABEL[o.type]], ['Loại hình vận chuyển', TRANSPORT_LABEL[o.transportType]], ['Chứng nhận', o.certificate], ['Địa điểm giao hàng', o.deliveryLocation], ['Địa điểm nhận hàng', o.pickUpLocation], ['Đơn vị vận chuyển', o.shipping], ['Tên tàu', o.vesselName], ['Mã vận đơn', o.billOfLading], ['Số tờ khai hải quan', o.customsNo], ['Hình thức thanh toán', o.paymentType], ['Số lưu nội bộ', o.numberOrder], ['Số hóa đơn', o.invoice], ['Ngày lập đơn', o.created], ['Ngày xuất hóa đơn', o.invoiceDate], ['Số hợp đồng', o.contractNo], ['Ngày hợp đồng', o.contractDate], ['Ngày vận chuyển', o.shippingDate], ['Ngày hoàn tất', o.endDate], ['Thời hạn xem đơn', o.viewingPeriod], ['Ghi chú', o.remark]];
    const history = DB.audit.filter(a => a.entity === o.id).slice().reverse().slice(0, 8);
    const logList = list => list.length ? `<ul class="todo">${list.slice().reverse().slice(0, 8).map(x => `<li>${esc(x.at.slice(0, 19).replace('T', ' '))}</li>`).join('')}</ul>` : '<div class="empty">Chưa có</div>';
    let body = '';
    if (orderDetailTab === 'info') {
        body = `<div class="row g-3"><div class="col-lg-6">${card('Thông tin chung', `<table class="table table-sm mb-0"><tbody>${info.map(f => `<tr><td class="text-muted" style="width:170px">${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</tbody></table>`, locked ? '' : `<button class="btn btn-sm btn-light" onclick="editOrder('${o.id}')"><i class="fa fa-pen me-1"></i>Sửa</button>`)}</div>
            <div class="col-lg-6">${card('Lịch sử cập nhật', history.length ? `<ul class="todo">${history.map(a => `<li><div class="grow">${esc(a.action)}<span class="sub">${esc(a.detail)}</span></div><small class="text-muted">${esc(a.at.slice(0, 10))}</small></li>`).join('')}</ul>` : '<div class="empty">Chưa có</div>')}${card(`Lịch sử xem đơn (${o.viewLog.length})`, logList(o.viewLog))}${card(`Nhập sai mật khẩu (${o.failLog.length})`, logList(o.failLog))}</div></div>`;
    } else if (orderDetailTab === 'items') {
        body = card('Sản phẩm', table([{ title: 'Sản phẩm', render: i => esc(i.product) }, { title: 'Chứng nhận', render: i => esc(i.certificate) }, { title: 'Đơn giá', num: true, render: i => `${fmt(i.price || 0)} ${esc(i.currency)}` }, { title: 'Số lượng', num: true, render: i => `${fmt(i.quantity, 3)} ${esc(i.unit)}` }, { title: 'Thành tiền', num: true, render: i => `${fmt((i.price || 0) * i.quantity)} ${esc(i.currency)}` }, { title: '', render: i => locked ? '' : `<button class="btn btn-sm btn-light btn-icon" aria-label="Sửa" onclick="editItem('${o.id}','${i.id}')"><i class="fa fa-pen"></i></button> <button class="btn btn-sm btn-light btn-icon" aria-label="Xóa" onclick="removeItem('${o.id}','${i.id}')"><i class="fa fa-trash"></i></button>` }], o.items), locked ? '' : lightBtn('Thêm sản phẩm', `editItem('${o.id}')`, 'fa-plus'), 'panel-flush');
    } else if (orderDetailTab === 'cars') {
        body = card('Danh sách xe', table([{ title: 'Loại xe', render: c => esc(c.typeCar) }, { title: 'Biển số', render: c => `<span class="code">${esc(c.plate)}</span>` }, { title: 'Số cont / seal', render: c => `${esc(c.cont)}<span class="sub">${esc(c.seal)}</span>` }, { title: 'Ngày', render: c => `${esc(c.date)}<span class="sub">${esc(c.timeIn)} – ${esc(c.timeOut)}</span>` }, { title: 'Pallet', num: true, render: c => c.palletIds.length }, { title: 'Khối lượng', num: true, render: c => fmt(c.kg, 0) + ' kg' }, { title: '', render: c => locked ? '' : `<button class="btn btn-sm btn-light btn-icon" aria-label="Sửa" onclick="editCar('${o.id}','${c.id}')"><i class="fa fa-pen"></i></button> <button class="btn btn-sm btn-light btn-icon" aria-label="Xóa" onclick="removeCar('${o.id}','${c.id}')"><i class="fa fa-trash"></i></button>` }], o.cars), locked ? '' : lightBtn('Thêm xe', `editCar('${o.id}')`, 'fa-plus'), 'panel-flush');
    } else if (orderDetailTab === 'isolation') {
        const pallets = orderPallets(o);
        const wos = orderWOs(o);
        const receipts = orderReceipts(o);
        const isUS = o.countryId === 'US';
        body = `
            <div class="row g-3">
                <div class="col-lg-7">
                    ${card(`Quy định cách ly (${isUS ? 'Hoa Kỳ' : 'Nội địa'})`, `
                        <div class="table-responsive">
                            <table class="table table-sm data-table mb-0">
                                <tbody>
                                    <tr>
                                        <td class="text-danger fw-bold" style="width:180px;"><i class="fa fa-ban me-1"></i>Hệ thống TRACES-NT</td>
                                        <td>Không khai DDS, không xuất sang EU</td>
                                    </tr>
                                    <tr>
                                        <td class="text-primary fw-bold"><i class="fa fa-boxes-stacked me-1"></i>Tem nhãn Pallet</td>
                                        <td>Nhãn vàng/cam: NON-EU</td>
                                    </tr>
                                    <tr>
                                        <td class="text-warning fw-bold"><i class="fa fa-warehouse me-1"></i>Kho & Bốc xếp</td>
                                        <td>Khu C, cách Khu A tối thiểu 3 m</td>
                                    </tr>
                                    <tr>
                                        <td class="text-success fw-bold"><i class="fa fa-certificate me-1"></i>Tiêu chuẩn áp dụng</td>
                                        <td>${isUS ? 'EPA TSCA Title VI, CARB P2, Lacey Act' : 'TCVN 7753, TCVN 11902'}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted fw-bold"><i class="fa fa-broom me-1"></i>Vệ sinh chuyền (Clearance)</td>
                                        <td>Dọn máy trước khi chạy lệnh EUDR</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    `)}
                </div>
                <div class="col-lg-5">
                    ${card(`Pallet (${pallets.length})`, `
                        <div class="mb-2 small text-muted">
                            Tổng khối lượng: <b>${fmt(orderKg(o), 0)} kg</b> &nbsp;|&nbsp; Thể tích: <b>${fmt(orderM3(o), 3)} m³</b>
                        </div>
                        <ul class="todo">
                            ${pallets.map(p => {
                                const wo = getWO(p.workOrderId);
                                return `<li><div class="grow"><b>${esc(p.id)}</b> <span class="tag">${esc(wo.product)}</span><span class="sub">${p.qty} ${unitName()}, ${fmt(p.kg, 0)} kg · Lệnh ${esc(wo.id)} (Thị trường: ${esc(wo.market)})</span></div><span class="badge bg-secondary">Non-EU</span></li>`;
                            }).join('') || '<div class="empty">Chưa có pallet</div>'}
                        </ul>
                        <div class="mt-3 pt-2 border-top">
                            <small class="text-muted d-block mb-1">Lô nguyên liệu</small>
                            <div class="d-flex flex-wrap gap-1">
                                ${receipts.map(r => `<span class="badge bg-light text-dark border">${esc(r.id)} (${esc(r.species)})</span>`).join('') || '<span class="text-muted small">Chưa có</span>'}
                            </div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    } else {
        const list = orderChecklist(o), d = orderPackageData(o), alerts = orderAlerts(o);
        const facts = [['Hàng', `HS ${o.hsCode}; ${d.goods.pallets} pallet; ${fmt(d.goods.m3)} m³; ${fmt(d.goods.netKg, 0)} kg`], ['Tên khoa học', d.species.join(', ') || '–'], ['Quốc gia khai thác', d.countries.join(', ') || '–'], ['Thời gian khai thác', d.harvest || '–'], ['Thửa đất', d.plots], ['Lưu hồ sơ đến', retentionUntil(o) || 'Sau khi lên hàng'], ['DDS', o.dds ? `${o.dds.reference} / ${o.dds.verification} (${o.dds.signer})` : 'Chưa có']];
        body = `${alerts.length ? `<div class="note-box bad"><b>Dữ liệu nguồn đã đổi:</b> ${alerts.map(a => esc(`${a.label}: ${a.detail}`)).join('; ')}</div>` : ''}
            <div class="row g-3"><div class="col-lg-7">${card('Gói dữ liệu cho DDS', `<table class="table table-sm mb-2"><tbody>${facts.map(f => `<tr><td class="text-muted" style="width:150px">${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</tbody></table><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-primary" onclick="enterDds('${o.id}')">${o.dds ? 'Cập nhật' : 'Nhập'} số DDS</button>${lightBtn('Tải GeoJSON', `exportGeo('${o.id}')`, 'fa-download')}${lightBtn('Xuất hồ sơ', `exportDossier('${o.id}')`, 'fa-file-export')}<a class="btn btn-sm btn-light" href="/nha-may/truy-xuat?code=${o.id}"><i class="fa fa-route me-1"></i>Truy xuất</a></div>`)}</div>
            <div class="col-lg-5">${card(`Kiểm tra EUDR: ${list.filter(i => i.ok).length}/${list.length}`, `<ul class="check-list">${list.map(i => `<li><i class="fa ${i.ok ? 'fa-circle-check ok' : 'fa-circle-xmark no'}"></i><div>${esc(i.label)}${i.detail ? `<small>${esc(i.detail)}</small>` : ''}</div></li>`).join('')}</ul>`)}</div></div>`;
    }
    const nextStatus = o.status >= 0 && o.status < 4 ? o.status + 1 : null;
    return `<div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <button class="btn btn-sm btn-light" onclick="openOrder(null)"><i class="fa fa-arrow-left me-1"></i>Danh sách đơn</button>
        <h2 class="h5 m-0">Đơn ${esc(o.id)}</h2>
        ${orderPill(o)}
        ${eudr ? '<span class="badge bg-success"><i class="fa fa-shield-halved me-1"></i>EUDR</span>' : '<span class="badge bg-danger"><i class="fa fa-ban me-1"></i>Non-EU</span>'}
        <div class="ms-auto d-flex flex-wrap gap-2">
            ${nextStatus !== null ? `<button class="btn btn-sm btn-primary" onclick="changeOrderStatus('${o.id}',${nextStatus})">Chuyển: ${ORDER_STATUS[nextStatus]}</button>` : ''}
            ${o.status !== 4 ? `<select class="form-select form-select-sm" style="width:auto" aria-label="Chuyển trạng thái khác" onchange="if(this.value!=='')changeOrderStatus('${o.id}',this.value)"><option value="">Trạng thái khác</option>${[0, -3, -2, -1].filter(s => s !== o.status).map(s => `<option value="${s}">${ORDER_STATUS[s]}</option>`).join('')}</select>` : ''}
            ${lightBtn('QR', `showOrderQr('${o.id}')`, 'fa-qrcode')}
        </div>
    </div>
    <ul class="nav nav-tabs mb-3">${tabs.map(t => `<li class="nav-item"><button type="button" class="nav-link ${orderDetailTab === t[0] ? 'active' : ''}" onclick="openOrder('${o.id}','${t[0]}')">${t[1]}</button></li>`).join('')}</ul>${body}`;
}

export function page_orders() {
    startPage('don-hang', { title: 'Đơn hàng EU & TRACES DDS', actions: newBtn('Tạo đơn hàng', 'addOrder()') }, root => {
        const detail = orderDetailId && getOrder(orderDetailId);
        if (detail) { root.innerHTML = orderDetailHtml(detail); return; }
        const f = orderFilter;
        const rows = DB.orders.filter(o => {
            if (f.marketFilter === 'EU' && !orderIsEudr(o)) return false;
            if (f.marketFilter === 'NON_EU' && orderIsEudr(o)) return false;
            if (f.tab === '' ? o.status === -1 : String(o.status) !== f.tab) return false;
            if (f.customer && o.customerId !== f.customer) return false;
            if (f.type && o.type !== f.type) return false;
            if (f.transport && o.transportType !== f.transport) return false;
            if (f.country && o.countryId !== f.country) return false;
            if (o.created < f.from || o.created > f.to) return false;
            return true;
        });
        const opts = (list, label = 'Tất cả') => [['', label], ...list];

        // Top comparison banner
        const eudrCount = DB.orders.filter(orderIsEudr).length;
        const nonEudrCount = DB.orders.filter(o => !orderIsEudr(o)).length;

        

        const marketFilterBar = `
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 p-2 bg-white rounded border">
                <div class="d-flex flex-wrap align-items-center gap-2">
                    
                    <button type="button" class="btn btn-sm ${f.marketFilter === '' ? 'btn-dark' : 'btn-light'}" onclick="setOrderFilter('marketFilter', '')">
                        Tất cả (${DB.orders.length})
                    </button>
                    <button type="button" class="btn btn-sm ${f.marketFilter === 'EU' ? 'btn-success' : 'btn-light border-success text-success'}" onclick="setOrderFilter('marketFilter', 'EU')">
                        <i class="fa fa-shield-halved me-1"></i>EUDR (${eudrCount})
                    </button>
                    <button type="button" class="btn btn-sm ${f.marketFilter === 'NON_EU' ? 'btn-danger' : 'btn-light border-danger text-danger'}" onclick="setOrderFilter('marketFilter', 'NON_EU')">
                        <i class="fa fa-ban me-1"></i>Non-EU (${nonEudrCount})
                    </button>
                </div>
                <div class="small text-muted">
                    ${rows.length} / ${DB.orders.length} đơn
                </div>
            </div>
        `;

        root.innerHTML = marketFilterBar + `<section class="panel"><div class="panel-body"><div class="row g-2 align-items-end">
            ${field('Khách hàng', 'c', f.customer, { type: 'select', col: 3, options: opts(DB.customers.map(c => [c.id, c.name])), attrs: `onchange="setOrderFilter('customer',this.value)"` })}
            ${field('Loại hình xuất khẩu', 't', f.type, { type: 'select', col: 2, options: opts(Object.entries(TYPE_LABEL)), attrs: `onchange="setOrderFilter('type',this.value)"` })}
            ${field('Vận chuyển', 'r', f.transport, { type: 'select', col: 2, options: opts(Object.entries(TRANSPORT_LABEL)), attrs: `onchange="setOrderFilter('transport',this.value)"` })}
            ${field('Quốc gia', 'n', f.country, { type: 'select', col: 1, options: opts(uniq(DB.orders.map(o => o.countryId)).map(x => [x, x])), attrs: `onchange="setOrderFilter('country',this.value)"` })}
            <div class="col-md-4"><label class="form-label">Thời gian ${quickDays('chooseOrderTime', [-7, -14, -30])}</label><div class="input-group input-group-sm"><input type="date" class="form-control" aria-label="Từ ngày" value="${f.from}" onchange="setOrderFilter('from',this.value)"><span class="input-group-text">đến</span><input type="date" class="form-control" aria-label="Đến ngày" value="${f.to}" onchange="setOrderFilter('to',this.value)"></div></div>
            </div></div></section>
            <ul class="nav nav-tabs mb-0 order-tabs">${STATUS_TABS.map(t => `<li class="nav-item"><button type="button" class="nav-link ${f.tab === t[0] ? 'active' : ''}" onclick="setOrderFilter('tab','${t[0]}')">${t[1]}</button></li>`).join('')}</ul>` +
            card('', table([
                { title: 'Hành động', render: o => `<button class="btn btn-sm btn-light" onclick="openOrder('${o.id}')">Mở</button>` },
                { title: 'Mã đơn', render: o => `<span class="code">${esc(o.id)}</span>` },
                { title: 'Phân loại EUDR', render: o => orderIsEudr(o) ? '<span class="pill pill-pass"><i class="fa fa-shield-halved me-1"></i>EUDR</span>' : '<span class="pill pill-fail"><i class="fa fa-ban me-1"></i>Non-EU</span>' },
                { title: 'Mã QR', render: o => `<button class="btn btn-sm btn-light btn-icon" aria-label="QR ${o.id}" onclick="showOrderQr('${o.id}')"><i class="fa fa-qrcode"></i></button>` },
                { title: 'Mật khẩu', render: o => o.passCode ? '••••••' : '–' },
                { title: 'Khách hàng', render: o => `<b>${esc(o.customer)}</b>` },
                { title: 'Xuất khẩu', render: o => TYPE_LABEL[o.type] },
                { title: 'Vận chuyển', render: o => TRANSPORT_LABEL[o.transportType] },
                { title: 'Quốc gia', render: o => esc(o.countryId) },
                { title: 'Trạng thái', render: o => orderPill(o) + (orderAlerts(o).length ? ' ' + pill('FAIL', 'Cảnh báo nguồn') : '') },
                { title: 'Ghi chú', render: o => esc(o.remark) },
                { title: 'Ngày tạo', render: o => esc(o.created) },
                { title: 'Ngày vận chuyển', render: o => esc(o.shippingDate) },
                { title: 'Ngày hoàn thành', render: o => esc(o.endDate) }
            ], rows, 'Không có đơn phù hợp'), '', 'panel-flush');
    });
}

/** Trả bộ lọc và màn chi tiết về mặc định khi vào lại trang. */
export function resetReceiptOrderViews() {
    Object.assign(recvFilter, initialRecvFilter());
    Object.assign(orderFilter, initialOrderFilter());
    orderDetailId = null;
    orderDetailTab = 'info';
}
