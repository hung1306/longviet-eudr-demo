/**
 * Tiếp nhận và Đơn hàng: theo cấu trúc TransportMaterial và Order của hệ thống cao su,
 * đổi dữ liệu sang ván lạng và thêm các chốt EUDR.
 */
const dateFilter = (days) => {
    const from = new Date(todayISO());
    from.setDate(from.getDate() + days);
    return from.toISOString().slice(0, 10);
};
const quickDays = (fn, list) => list.map(d => `<button type="button" class="chip" onclick="${fn}(${d})">${d === 0 ? 'Hôm nay' : -d + ' ngày'}</button>`).join('');

// ========== TIẾP NHẬN (TransportMaterial) ==========
const recvFilter = { status: 'WAIT', source: '', from: dateFilter(-90), to: todayISO(), code: '', scaleDate: '' };

function receiptSource(r) {
    if (r.sourceCategory === 'RECYCLED') return 'Tái chế, phụ phẩm';
    if (r.sourceCategory === 'IMPORT') return 'Nhập khẩu';
    if (r.sourceCategory === 'DOMESTIC') return 'Rừng trồng trong nước';
    const s = getSupplier(r.supplierId);
    return s && s.type === 'IMPORT' ? 'Nhập khẩu' : 'Rừng trồng trong nước';
}
function setRecv(key, value) { recvFilter[key] = value; refresh(); }
function chooseRecvTime(days) { recvFilter.from = dateFilter(days); recvFilter.to = todayISO(); refresh(); }

function createReceipt(data, plotIds, docs, ticket) {
    const ym = data.date.slice(2, 7).replace('-', '');
    const no = DB.receipts.reduce((m, r) => Math.max(m, Number((r.id.match(/\d+$/) || [0])[0])), 0) + 1;
    const r = { id: `RC-W${ym}-${String(no).padStart(3, '0')}`, plate: data.plate, supplierId: data.supplierId, date: data.date, species: data.species, layer: data.layer || 'CORE', pkgCount: +data.pkgCount, sheetsPerPkg: +data.sheetsPerPkg, l: +data.l, w: +data.w, t: +data.t, gross: +data.gross, tare: +data.tare, moisture: +data.moisture || null, grade: data.grade || '', bay: data.bay || '', trip: +data.trip || 1, workshop: data.workshop || '', expectedKg: +data.expectedKg || (+data.gross - +data.tare), dataSource: data.dataSource || 'Nhập tay', plotIds, docs, note: data.note || '', kcs: null, done: false, approval: null, mitigations: [] };
    if (r.gross <= r.tare) throw new Error('Cân tổng phải lớn hơn cân xe');
    DB.receipts.push(r);
    const m3 = +(r.l * r.w * r.t * r.sheetsPerPkg / 1e9).toFixed(4);
    let pno = DB.packages.reduce((max, p) => Math.max(max, +p.id.slice(-4)), 0);
    for (let i = 0; i < r.pkgCount; i++) DB.packages.push({ id: 'PKG-LV-2026-' + String(++pno).padStart(4, '0'), receiptId: r.id, sheets: r.sheetsPerPkg, m3 });
    if (ticket) ticket.receiptId = r.id;
    logAction(r.id, 'Tiếp nhận lô', `${r.dataSource}; ${r.pkgCount} kiện, ${receiptNetKg(r)} kg`);
    return r;
}

function receiptForm(preset = {}) {
    const isCN = preset.supplierId && (getSupplier(preset.supplierId) || {}).country === 'CN';
    const defaultLayer = preset.layer || (isCN ? 'FACE' : 'CORE');
    const defaultSpecies = preset.species || (isCN ? 'Populus adenopoda' : '');
    const defaultW = preset.w || (isCN ? 2500 : 640);
    const defaultT = preset.t || (isCN ? 0.5 : 1.7);
    const defaultWorkshop = preset.workshop || (isCN ? 'Xưởng ván mặt' : 'Xưởng ván ruột');
    return `<div class="row g-2">
        ${field('Nhà cung cấp', 'supplierId', preset.supplierId, { type: 'select', options: DB.suppliers.map(s => [s.id, `${s.name} (${s.country === 'CN' ? 'TQ' : 'VN'})`]), required: true })}
        ${field('Biển số / Container', 'plate', preset.plate, { required: true, col: 3 })}
        ${field('Ngày cân', 'date', preset.date || todayISO(), { type: 'date', col: 3, required: true })}
        ${field('Xưởng', 'workshop', defaultWorkshop, { type: 'select', col: 3, options: ['Xưởng ván ruột', 'Xưởng ván mặt'] })}
        ${field('Lần vận chuyển', 'trip', preset.trip || 1, { type: 'number', col: 3, attrs: 'min="1"' })}
        ${field('Cân tổng (kg)', 'gross', preset.gross, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Cân xe (kg)', 'tare', preset.tare, { type: 'number', col: 3, required: true, attrs: 'min="0"' })}
        ${field('Loài gỗ', 'species', defaultSpecies, { type: 'select', options: speciesOptions() })}
        ${field('Lớp ván', 'layer', defaultLayer, { type: 'select', col: 3, options: [['CORE', 'Ruột (Core)'], ['FACE', 'Mặt (Face/Back)']] })}
        ${field('Số kiện', 'pkgCount', preset.pkgCount || 10, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Lá / kiện', 'sheetsPerPkg', preset.sheetsPerPkg || 1000, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Dài (mm)', 'l', preset.l || 1270, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Rộng (mm)', 'w', defaultW, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
        ${field('Dày (mm)', 't', defaultT, { type: 'number', col: 3, required: true, attrs: 'min="0.1" step="0.1"' })}
        ${poField(preset.poId)}
        ${field('Ghi chú / Số Cont / Hải quan', 'note', preset.note || '', { col: 6 })}</div>`;
}

/** Tiếp nhận trực tiếp Container Ván lạng Nhập khẩu từ Trung Quốc (Poplar, Birch) */
function importChinaReceiptModal() {
    const cnSuppliers = DB.suppliers.filter(s => s.country === 'CN');
    const cnPlots = DB.plots.filter(p => p.country === 'CN' || p.id.startsWith('PLOT-CN'));
    const defaultCont = 'TGHU' + Math.floor(100000 + Math.random() * 900000);
    const defaultSeal = 'SL2611' + Math.floor(1000 + Math.random() * 9000);
    const defaultCustoms = '10' + Math.floor(10000000 + Math.random() * 90000000);
    const defaultBL = 'COSCO-SGN-' + Math.floor(100000 + Math.random() * 900000);
    const defaultPhyto = 'KDTV-V2-2026/' + Math.floor(1000 + Math.random() * 9000);
    const defaultCO = 'E264501' + Math.floor(10000 + Math.random() * 90000);

    const m = openModal({
        title: 'Tiếp nhận container TQ',
        size: 'modal-xl',
        submitText: 'Tạo phiếu & Nhập kho',
        body: `
        <div class="row g-2">
            <div class="col-md-6 border-end pe-md-3">
                <h4 class="h6 text-primary border-bottom pb-1 mb-2"><i class="fa fa-ship me-1"></i>Hải quan</h4>
                <div class="row g-2">
                    ${field('Nhà cung cấp TQ', 'supplierId', (cnSuppliers[0] || {}).id, { type: 'select', col: 12, options: cnSuppliers.map(s => [s.id, `${s.name} (${s.address})`]), required: true })}
                    ${poField('', 12)}
                    ${field('Số Container', 'containerNo', defaultCont, { col: 6, required: true })}
                    ${field('Số Seal chì Hải quan', 'sealNo', defaultSeal, { col: 6, required: true })}
                    ${field('Biển số xe kéo container', 'plate', '51D-902.13', { col: 6, required: true })}
                    ${field('Cảng dỡ hàng', 'port', 'Cảng Cát Lái (TP.HCM)', { col: 6, type: 'select', options: ['Cảng Cát Lái (TP.HCM)', 'Cảng Đình Vũ (Hải Phòng)', 'Cảng Cái Mép (BR-VT)'] })}
                    ${field('Số tờ khai Hải quan', 'customsNo', defaultCustoms, { col: 6, required: true })}
                    ${field('Số Vận đơn B/L', 'billNo', defaultBL, { col: 6, required: true })}
                    ${field('Giấy CN Kiểm dịch thực vật', 'phytoNo', defaultPhyto, { col: 6, required: true })}
                    ${field('Giấy CN Xuất xứ (C/O Form E)', 'coNo', defaultCO, { col: 6, required: true })}
                </div>
            </div>
            <div class="col-md-6 ps-md-3">
                <h4 class="h6 text-success border-bottom pb-1 mb-2"><i class="fa fa-tree me-1"></i>Ván & nguồn gốc</h4>
                <div class="row g-2">
                    ${field('Loài gỗ ván mặt', 'species', 'Populus adenopoda', { type: 'select', col: 7, options: [['Populus adenopoda', 'Gỗ Dương (Poplar - Populus adenopoda)'], ['Betula alnoides', 'Bạch dương (Birch - Betula alnoides)']] })}
                    ${field('Lớp ván', 'layer', 'FACE', { type: 'select', col: 5, options: [['FACE', 'Ván mặt (Face/Back)']] })}
                    ${field('Lô rừng WGS84 tại Trung Quốc', 'plotId', (cnPlots[0] || {}).id, { type: 'select', col: 12, options: cnPlots.map(p => [p.id, `${p.id} - ${p.owner} (${p.place}, ${p.areaHa} ha - ${p.landDoc})`]), required: true })}
                    ${field('Số kiện', 'pkgCount', 12, { type: 'number', col: 4, required: true, attrs: 'min="1"' })}
                    ${field('Lá / kiện', 'sheetsPerPkg', 1000, { type: 'number', col: 4, required: true, attrs: 'min="1"' })}
                    ${field('Dày (mm)', 't', 0.5, { type: 'number', col: 4, required: true, attrs: 'step="0.1" min="0.1"' })}
                    ${field('Dài (mm)', 'l', 1270, { type: 'number', col: 6, required: true })}
                    ${field('Rộng (mm)', 'w', 2500, { type: 'number', col: 6, required: true })}
                    ${field('Cân tổng xe (kg)', 'gross', 28500, { type: 'number', col: 6, required: true })}
                    ${field('Cân xe rỗng (kg)', 'tare', 20700, { type: 'number', col: 6, required: true })}
                    ${field('Độ ẩm MC (%)', 'moisture', 11.5, { type: 'number', col: 4, attrs: 'step="0.1"' })}
                    ${field('Phẩm cấp', 'grade', 'A', { type: 'select', col: 4, options: ['A', 'A+', 'B'] })}
                    ${field('Chỉ định ô kho ván mặt', 'bay', 'M0.5-01', { type: 'select', col: 4, options: ['M0.5-01', 'M0.5-02'] })}
                </div>
            </div>
            <div class="col-12 mt-2">
                ${field('Ghi chú', 'note', '', { col: 12 })}
            </div>
        </div>`,
        onSubmit: data => guarded('receipt', () => {
            const poErr = poReceiptError(data.poId, data.supplierId, data.species);
            if (poErr) throw new Error(poErr);
            const fullPlate = `${data.plate} / Cont ${data.containerNo}`;
            const r = createReceipt({
                supplierId: data.supplierId,
                plate: fullPlate,
                trip: 1,
                workshop: 'Xưởng ván mặt',
                date: todayISO(),
                gross: +data.gross,
                tare: +data.tare,
                species: data.species,
                layer: 'FACE',
                pkgCount: +data.pkgCount,
                sheetsPerPkg: +data.sheetsPerPkg,
                l: +data.l,
                w: +data.w,
                t: +data.t,
                moisture: +data.moisture,
                grade: data.grade,
                bay: data.bay,
                dataSource: 'Container Nhập khẩu (TQ)',
                note: `Cont: ${data.containerNo} | Seal: ${data.sealNo} | TKHQ: ${data.customsNo} | B/L: ${data.billNo} | KDTV: ${data.phytoNo} | C/O: ${data.coNo} | Cảng: ${data.port}. ${data.note || ''}`
            }, [data.plotId], [
                'Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật', 'Forest Harvesting License'
            ]);
            r.kcs = { by: 'KCS Cảng & Kho', at: todayISO() };
            approveReceipt(r, 'Trưởng phòng XNK', `Hồ sơ HQ ${data.customsNo}, KDTV đạt chuẩn, Lô WGS84 ${data.plotId} hợp lệ EUDR`);
            r.done = true;
            attachReceiptToPO(r, data.poId);
            toast(`Đã tiếp nhận thành công Container ván lạng TQ ${data.containerNo}!`);
            refresh();
        })
    });
    bindPoSelect(m.el);
}

/** Xe từ khu vực Trạm cân chuyển sang khu vực Tiếp nhận. */
function acceptTicket(id) {
    const t = byId(DB.scaleTickets, id);
    const m = openModal({
        title: `Tiếp nhận xe ${t.plate}`, size: 'modal-lg', submitText: 'Tiếp nhận', body: receiptForm(t),
        onSubmit: data => guarded('receipt', () => {
            const poErr = poReceiptError(data.poId, data.supplierId, data.species);
            if (poErr) throw new Error(poErr);
            attachReceiptToPO(createReceipt({ ...data, expectedKg: t.expectedKg, dataSource: 'Trạm cân' }, t.plotIds.slice(), [], t), data.poId);
            refresh();
        })
    });
    bindPoSelect(m.el);
}

const EXCEL_COLUMNS = ['MaNCC', 'BienSo', 'LanVanChuyen', 'Xuong', 'NgayCan', 'CanTong', 'CanXe', 'TenKhoaHoc', 'LopVan', 'SoKien', 'LaMoiKien', 'Dai', 'Rong', 'Day', 'MaThuaDat', 'MaLenhMua'];

function downloadReceiptTemplate() {
    const sample = ['NCC-VN-001', '60C-111.22', 1, 'Xưởng ván ruột', todayISO(), 16000, 8000, 'Hevea brasiliensis', 'CORE', 10, 1000, 1270, 640, 1.7, 'PLOT-VN-DN-01;PLOT-VN-DN-02', 'LM-2610-001'];
    downloadFile('Mau_tiep_nhan_van_lang.csv', '﻿' + EXCEL_COLUMNS.join(',') + '\n' + sample.join(',') + '\n', 'text/csv');
}

async function readReceiptRows(file) {
    if (typeof XLSX === 'undefined') throw new Error('Không tải được thư viện đọc Excel');
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: false });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
}

function checkReceiptRow(row) {
    const errors = [];
    if (!getSupplier(row.MaNCC)) errors.push('Mã NCC không tồn tại');
    if (!row.BienSo) errors.push('Thiếu biển số');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.NgayCan)) errors.push('Ngày cân phải dạng YYYY-MM-DD');
    if (!(Number(row.CanTong) > Number(row.CanXe))) errors.push('Cân tổng phải lớn hơn cân xe');
    ['SoKien', 'LaMoiKien', 'Dai', 'Rong', 'Day'].forEach(k => { if (!(Number(row[k]) > 0)) errors.push(`${k} không hợp lệ`); });
    String(row.MaThuaDat || '').split(';').filter(Boolean).forEach(id => { if (!getPlot(id.trim())) errors.push(`Thửa ${id.trim()} không tồn tại`); });
    const poErr = poReceiptError(String(row.MaLenhMua || '').trim(), row.MaNCC, row.TenKhoaHoc);
    if (poErr) errors.push(poErr);
    return errors;
}

/** Tiếp nhận ván thu mua: tải danh sách, xem trước, chỉ tạo khi mọi dòng hợp lệ. */
function showBatchReceipt() {
    let rows = [];
    const m = openModal({
        title: 'Tiếp nhận ván thu mua', size: 'modal-xl', submitText: 'Tạo phiếu',
        body: `<div class="d-flex flex-wrap gap-2 align-items-center mb-2"><input type="file" class="form-control form-control-sm" style="max-width:320px" id="batch-file" accept=".xlsx,.xls,.csv" aria-label="Tệp danh sách"><button type="button" class="btn btn-sm btn-light" onclick="downloadReceiptTemplate()"><i class="fa fa-download me-1"></i>Tải mẫu</button></div><div id="batch-preview" class="empty">Chọn tệp Excel hoặc CSV theo mẫu</div>`,
        onSubmit: () => {
            if (!rows.length) { toast('Chưa có dữ liệu', 'err'); return false; }
            if (rows.some(r => checkReceiptRow(r).length)) { toast('Còn dòng lỗi, sửa tệp rồi tải lại', 'err'); return false; }
            return guarded('receipt', () => {
                rows.forEach(r => attachReceiptToPO(createReceipt({ supplierId: r.MaNCC, plate: r.BienSo, trip: r.LanVanChuyen, workshop: r.Xuong, date: r.NgayCan, gross: r.CanTong, tare: r.CanXe, species: r.TenKhoaHoc, layer: r.LopVan || 'CORE', pkgCount: r.SoKien, sheetsPerPkg: r.LaMoiKien, l: r.Dai, w: r.Rong, t: r.Day, dataSource: 'Excel' }, String(r.MaThuaDat || '').split(';').map(x => x.trim()).filter(Boolean), []), String(r.MaLenhMua || '').trim()));
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
                { title: 'NCC', render: r => esc(r.MaNCC) }, { title: 'Biển số', render: r => esc(r.BienSo) }, { title: 'Lần', render: r => esc(r.LanVanChuyen) },
                { title: 'Ván', render: r => `<span class="sci">${esc(r.TenKhoaHoc)}</span>` }, { title: 'Kiện', num: true, render: r => esc(r.SoKien) }, { title: 'Thửa', render: r => esc(r.MaThuaDat) },
                { title: 'Kiểm tra', render: r => { const er = checkReceiptRow(r); return er.length ? pill('FAIL', er[0]) : pill('PASS', 'Hợp lệ'); } }
            ], rows);
        } catch (err) { toast(err.message, 'err'); }
    };
}

/** Chọn lô: gắn thửa đất cho phiếu, tương ứng modal chọn lô của cao su. */
function choosePlots(id) {
    const r = getReceipt(id), locked = receiptLockedBy(id);
    if (locked.length) { toast(`Lô đang khóa bởi đơn ${locked.map(o => o.id).join(', ')}`, 'err'); return; }
    const plots = DB.plots.filter(p => p.supplierId === r.supplierId);
    const m = openModal({
        title: `Chọn thửa đất cho ${id}`, size: 'modal-xl', submitText: 'Lưu',
        body: `<div class="d-flex gap-2 align-items-center mb-2"><button type="button" class="btn btn-sm btn-light" data-all="1">Chọn tất cả</button><button type="button" class="btn btn-sm btn-light" data-all="0">Bỏ chọn tất cả</button><span>Đã chọn: <b id="plot-count">0</b> thửa</span></div>` + table([
            { title: '', render: p => `<input class="form-check-input" type="checkbox" name="plotIds" value="${esc(p.id)}" aria-label="${esc(p.id)}" ${r.plotIds.includes(p.id) ? 'checked' : ''}>` },
            { title: 'Mã thửa', render: p => `<span class="code">${esc(p.id)}</span>` }, { title: 'Chủ đất', render: p => esc(p.owner) }, { title: 'Diện tích', num: true, render: p => `${fmt(p.areaHa)} ha` },
            { title: 'Địa chỉ', render: p => esc(p.place) }, { title: 'EUDR', render: p => pill((p.forest && p.forest.result) || 'NONE') }
        ], plots, 'Nhà cung cấp chưa có thửa đất'),
        onSubmit: (data, fd) => guarded('receipt', () => {
            r.plotIds = fd.getAll('plotIds');
            r.approval = null;
            logAction(id, 'Chọn thửa đất', r.plotIds.join(', ') || 'Bỏ hết');
            refresh();
        })
    });
    const boxes = () => [...m.el.querySelectorAll('[name=plotIds]')];
    const count = () => { m.el.querySelector('#plot-count').textContent = boxes().filter(b => b.checked).length; };
    boxes().forEach(b => { b.onchange = count; });
    m.el.querySelectorAll('[data-all]').forEach(btn => { btn.onclick = () => { boxes().forEach(b => { b.checked = btn.dataset.all === '1'; }); count(); }; });
    count();
}

/** Form KCS: độ ẩm, phẩm cấp, kiểm đếm, ô kho, chứng từ. Thay cho TSC, DRC, quy khô, pH của mủ. */
function kcsForm(id) {
    const r = getReceipt(id);
    openModal({
        title: `KCS ${id}`, size: 'modal-lg', submitText: 'Lưu KCS',
        body: `<div class="row g-2">
            ${field('Độ ẩm MC (%)', 'moisture', r.moisture, { type: 'number', col: 3, required: true, attrs: 'step="0.1" min="0"' })}
            ${field('Phẩm cấp', 'grade', r.grade, { col: 3, required: true })}
            ${field('Lá đếm thực tế / kiện', 'sheetsPerPkg', r.sheetsPerPkg, { type: 'number', col: 3, attrs: 'readonly' })}
            ${field('Ô kho', 'bay', r.bay, { col: 3, required: true })}
            ${field('Thể tích quy đổi (m³)', 'm3', round(receiptM3(r), 3), { col: 3, attrs: 'readonly' })}
            ${field('Khối lượng tịnh (kg)', 'net', receiptNetKg(r), { col: 3, attrs: 'readonly' })}
            ${field('Người KCS', 'by', r.kcs ? r.kcs.by : '', { required: true })}
            <div class="col-12"><label class="form-label">Chứng từ đã nhận</label><div class="pick-list">${requiredDocs(getSupplier(r.supplierId)).map(d => `<label><input class="form-check-input" type="checkbox" name="docs" value="${esc(d)}" ${r.docs.includes(d) ? 'checked' : ''}><span>${esc(d)}</span></label>`).join('')}</div></div></div>`,
        onSubmit: (data, fd) => guarded('receipt', () => {
            Object.assign(r, { moisture: +data.moisture, grade: data.grade, bay: data.bay, docs: fd.getAll('docs'), kcs: { by: data.by, at: todayISO() } });
            logAction(id, 'Lưu KCS', `MC ${r.moisture}%, hạng ${r.grade}, ô ${r.bay}`);
            refresh();
        })
    });
}

function showReceipt(id) {
    const r = getReceipt(id), a = assessReceipt(r), s = receiptStatus(r), sp = getSupplier(r.supplierId);
    const isImport = sp && (sp.type === 'IMPORT' || sp.country === 'CN');
    const importBox = isImport ? '<div class="note-box ok mb-3"><i class="fa fa-ship me-1"></i>Nhập khẩu TQ: Cont/Seal, tờ khai HQ, KDTV, C/O Form E, giấy phép khai thác, WGS84</div>' : '';

    const m = openModal({
        title: `Đánh giá rủi ro ${id}`, size: 'modal-lg',
        body: `<div class="d-flex flex-wrap gap-2 align-items-center mb-2">${pill(s)}<span class="text-muted">${esc(sp ? sp.name : '')}, ${r.pkgCount} kiện, ${fmt(receiptM3(r))} m³, ${fmt(receiptNetKg(r), 0)} kg</span></div>
            ${importBox}
            ${r.approval ? `<div class="note-box ok">Đã duyệt bởi ${esc(r.approval.by)} ngày ${esc(r.approval.at)}: ${esc(r.approval.reason)}</div>` : ''}
            ${table([{ title: 'Yếu tố', render: f => esc(f.name) }, { title: 'Mức', render: f => pill(f.level) }, { title: 'Chi tiết', render: f => esc(f.msg) }], a.factors)}
            <h3 class="h6 mt-3">Biện pháp giảm thiểu</h3>
            ${r.mitigations.length ? `<ul class="mb-2">${r.mitigations.map(x => `<li>${esc(x.action)}: ${esc(x.result)} (${esc(x.by)}, ${esc(x.at)})</li>`).join('')}</ul>` : '<p class="text-muted">Chưa có.</p>'}`,
        footerExtra: `${a.level === 'MEDIUM' ? '<button type="button" class="btn btn-sm btn-light" id="rc-mit">Ghi giảm thiểu</button>' : ''}${a.level !== 'HIGH' && s !== 'PASS' ? '<button type="button" class="btn btn-sm btn-primary" id="rc-ok">Ký duyệt Đạt</button>' : ''}`
    });
    const mit = m.el.querySelector('#rc-mit'), ok = m.el.querySelector('#rc-ok');
    if (mit) mit.onclick = () => { m.hide(); addMitigation(id); };
    if (ok) ok.onclick = () => { m.hide(); approveDialog(id, a.level); };
}

function addMitigation(id) {
    openModal({
        title: `Giảm thiểu rủi ro ${id}`, submitText: 'Lưu',
        body: `<div class="row g-2">${field('Biện pháp', 'action', '', { type: 'select', col: 12, options: ['Thu thập bổ sung chứng từ, bản đồ, tọa độ', 'Kiểm tra chéo hợp đồng, hóa đơn, chứng từ', 'Kiểm tra nội bộ / kiểm toán độc lập', 'Đổi nhà cung cấp'] })}${field('Người thực hiện', 'by', '', { required: true })}${field('Ngày', 'at', todayISO(), { type: 'date', required: true })}${field('Kết quả', 'result', '', { required: true, col: 12 })}</div>`,
        onSubmit: data => guarded('approve', () => {
            getReceipt(id).mitigations.push(data);
            logAction(id, 'Giảm thiểu rủi ro', `${data.action}: ${data.result}`);
            refresh();
        })
    });
}

function approveDialog(id, level) {
    const r = getReceipt(id);
    if (!r.kcs) { toast('Lô chưa có kết quả KCS', 'err'); return; }
    openModal({
        title: `Duyệt hoàn thành ${id}`, submitText: 'Ký duyệt',
        body: `<div class="row g-2">${field('Người duyệt', 'by', '', { required: true, col: 12 })}${field('Lý do', 'reason', '', { col: 12, required: level === 'MEDIUM', type: 'textarea' })}</div>`,
        onSubmit: data => guarded('approve', () => { approveReceipt(r, data.by, data.reason); r.done = true; refresh(); })
    });
}


/** Đối soát tại cổng nhận (1-1 hoặc N-1) - Trụ cột 2 Thiện Hưng & CCP-1 */
function openCrossCheckModal(ticketId = null) {
    const tickets = DB.scaleTickets.filter(t => !t.receiptId);
    if (!tickets.length) {
        toast('Hiện không có chuyến xe nào đang chờ đối soát tại trạm cân', 'info');
        return;
    }
    const curT = ticketId ? tickets.find(t => t.id === ticketId) : tickets[0];
    const ticketOptions = tickets.map(t => `<option value="${t.id}" ${curT && curT.id === t.id ? 'selected' : ''}>${t.id} - ${t.plate} (${t.rawType || 'Ván bóc'})</option>`).join('');

    function renderModalBody(t) {
        const s = getSupplier(t.supplierId) || { name: 'Chưa xác định', contractNo: '–', type: 'DOMESTIC' };
        const src = t.sourceCategory === 'IMPORT' ? 'Nhập khẩu' : (t.sourceCategory === 'RECYCLED' ? 'Tái chế, phụ phẩm' : 'Rừng trồng trong nước');
        const plots = (t.plotIds || []).map(id => DB.plots.find(p => p.id === id)).filter(Boolean);
        const batchCode = t.batchCode || ('KIEN-' + t.supplierId.slice(-3) + '-' + t.id.slice(-4));
        
        // Checklist theo 3 nguồn nguyên liệu (Ảnh 5)
        let checkListHtml = '';
        if (src === 'Rừng trồng trong nước') {
            checkListHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Tọa độ WGS84 & Ranh giới lô</span>
                    <span class="badge bg-success-subtle text-success">${plots.length} thửa liên kết</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Kỳ khai thác lâm sản</span>
                    <span class="badge bg-success-subtle text-success">Tháng 10-11/2026</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Quyền sử dụng đất / Rừng</span>
                    <span class="badge bg-success-subtle text-success">Đã đối chiếu Sổ đỏ</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Bảng kê lâm sản xác nhận xã</span>
                    <span class="badge bg-success-subtle text-success">Đầy đủ</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Bằng chứng không phá rừng sau 31/12/2020</span>
                    <span class="badge bg-success-subtle text-success">Vệ tinh Sentinel đạt</span>
                </li>
            `;
        } else if (src === 'Nhập khẩu') {
            checkListHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Tên khoa học Latin loài gỗ</span>
                    <span class="badge bg-success-subtle text-success">Populus adenopoda</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Tọa độ vùng khai thác gốc</span>
                    <span class="badge bg-success-subtle text-success">Nam Ninh, Quảng Tây</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Tờ khai Hải quan thông quan</span>
                    <span class="badge bg-success-subtle text-success">Tờ khai điện tử đạt</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Kiểm dịch thực vật (Phytosanitary)</span>
                    <span class="badge bg-success-subtle text-success">Đạt chuẩn kiểm dịch</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Chứng nhận xuất xứ C/O</span>
                    <span class="badge bg-success-subtle text-success">Form E hợp lệ</span>
                </li>
            `;
        } else {
            checkListHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Chứng nhận tái chế FSC/PEFC Recycled</span>
                    <span class="badge bg-success-subtle text-success">Chứng chỉ CoC hợp lệ</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Tỷ lệ nguyên sinh & tái chế</span>
                    <span class="badge bg-success-subtle text-success">100% Post-consumer</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center py-1.5">
                    <span><i class="fa fa-check-circle text-success me-2"></i>Xác nhận nguồn dăm / phôi phụ phẩm</span>
                    <span class="badge bg-success-subtle text-success">Biên bản bàn giao xưởng</span>
                </li>
            `;
        }

        return `
            <div class="mb-3">
                <label class="form-label fw-bold small text-muted">Chuyến xe</label>
                <select class="form-select form-select-sm" id="cross-check-select" onchange="onSwitchTicket(this.value)">
                    ${ticketOptions}
                </select>
            </div>
            
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <div class="p-2.5 rounded bg-light border">
                        <small class="text-muted d-block">Mã kiện</small>
                        <strong class="text-primary font-monospace fs-6"><i class="fa fa-qrcode me-1"></i>${batchCode}</strong>
                        <div class="mt-1 small">Biển số: <b class="code">${t.plate}</b> · Chuyến: <b>${t.trip}</b></div>
                        <div class="small">Khối lượng tịnh: <b class="text-success">${fmt(t.gross - t.tare, 0)} kg</b></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-2.5 rounded bg-light border">
                        <small class="text-muted d-block">Hợp đồng</small>
                        <strong class="text-dark"><i class="fa fa-file-contract me-1"></i>${s.contractNo || 'HĐ-TP-2026/01'}</strong>
                        <div class="mt-1 small">NCC: <b>${esc(s.name)}</b></div>
                        <div class="small">Nguồn: <span class="badge bg-primary bg-opacity-10 text-primary">${src}</span></div>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="small text-muted"><i class="fa fa-folder-check me-1"></i>Hồ sơ: ${src}</strong>
                    <span class="badge bg-success"><i class="fa fa-check me-1"></i>Khớp 100%</span>
                </div>
                <ul class="list-group list-group-flush border rounded small">
                    ${checkListHtml}
                </ul>
            </div>

            <div class="p-2.5 rounded bg-success bg-opacity-10 border border-success-subtle mb-2">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <strong class="text-success d-block"><i class="fa fa-circle-check me-1"></i>Đạt 1-1</strong>
                        
                    </div>
                    <button class="btn btn-sm btn-success text-nowrap" onclick="confirmGateAccept('${t.id}')">
                        <i class="fa fa-arrow-down-to-bracket me-1"></i>Nhập Khu A
                    </button>
                </div>
            </div>
        `;
    }

    const { modal, el } = openModal({
        title: 'Đối soát cổng nhận 1-1',
        size: 'modal-lg',
        body: `<div id="cross-check-container">${renderModalBody(curT)}</div>`
    });

    window.onSwitchTicket = function(newTId) {
        const found = tickets.find(t => t.id === newTId);
        if (found) {
            el.querySelector('#cross-check-container').innerHTML = renderModalBody(found);
        }
    };

    window.confirmGateAccept = function(tId) {
        modal.hide();
        acceptTicket(tId);
    };
}

function page_receipts() {
    startPage('tiep-nhan', {
        title: 'Trạm cân & Tiếp nhận',
        actions: `<button class="btn btn-sm btn-outline-success me-1" onclick="openCrossCheckModal()"><i class="fa fa-qrcode me-1"></i>Đối soát 1-1</button><button class="btn btn-sm btn-info text-white" onclick="importChinaReceiptModal()"><i class="fa fa-ship me-1"></i>Container TQ</button>` + newBtn('Tiếp nhận ván', 'showBatchReceipt()') + lightBtn('Nhập tay', 'manualReceipt()', 'fa-pen')
    }, root => {
        const f = recvFilter;
        const tickets = DB.scaleTickets.filter(t => !t.receiptId && (!f.scaleDate || t.date === f.scaleDate));
        const code = f.code.trim().toLowerCase();
        const rows = DB.receipts.filter(r => (f.status === 'WAIT' ? !r.done : r.done) && (!f.source || receiptSource(r) === f.source) && r.date >= f.from && r.date <= f.to && (!code || r.id.toLowerCase().includes(code) || r.plate.toLowerCase().includes(code))).slice().reverse();
        
        

        root.innerHTML = `<section class="panel zone-head-scale"><header class="panel-head"><h2><i class="fa fa-scale-balanced me-2"></i>Khu vực trạm cân</h2><label class="d-flex gap-2 align-items-center m-0">Ngày cân <input type="date" class="form-control form-control-sm" value="${esc(f.scaleDate)}" onchange="setRecv('scaleDate',this.value)"></label></header><div class="panel-body p-0">` + table([
            { title: 'Biển số', render: t => `<span class="code">${esc(t.plate)}</span>${t.supplierId === 'NCC-CN-001' ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger small ms-1">🇨🇳 Cont TQ</span>' : ''}` },
            { title: 'Xưởng', render: t => esc(t.workshop) }, { title: 'Lần VC', num: true, render: t => t.trip },
            { title: 'Mã NCC', render: t => esc(t.supplierId) }, { title: 'Tên', render: t => esc(supplierName(t.supplierId)) }, { title: 'MST', render: t => esc((getSupplier(t.supplierId) || {}).taxCode) }, { title: 'Điện thoại', render: t => esc(t.phone) },
            { title: 'KL dự kiến', num: true, render: t => fmt(t.expectedKg, 0) + ' kg' }, { title: 'KL thực tế', num: true, render: t => `<b>${fmt(t.gross - t.tare, 0)} kg</b>` }, { title: 'Ngày cân', render: t => esc(t.date) },
            { title: 'Thửa đã liên kết', render: t => t.plotIds.map(tag).join('') || pill('FAIL', 'Chưa có') },
            { title: 'Thao tác', render: t => `<button class="btn btn-sm btn-primary" onclick="acceptTicket('${t.id}')">Tiếp nhận</button>` }
        ], tickets, 'Không có xe chờ tiếp nhận') + `</div></section>
        <section class="panel zone-head-recv"><header class="panel-head"><h2><i class="fa fa-truck-ramp-box me-2"></i>Khu vực tiếp nhận</h2></header><div class="panel-body">
            <div class="row g-2 align-items-end mb-2">
                ${field('Trạng thái', 'fStatus', f.status, { type: 'select', col: 2, options: [['WAIT', 'Chờ duyệt'], ['DONE', 'Hoàn thành']], attrs: `onchange="setRecv('status',this.value)"` })}
                ${field('Nguồn ván', 'fSource', f.source, { type: 'select', col: 2, options: [['', 'Tất cả'], ['Trong nước', 'Trong nước (Cao su, Keo)'], ['Nhập khẩu', 'Nhập khẩu (TQ Poplar, Birch)']], attrs: `onchange="setRecv('source',this.value)"` })}
                <div class="col-md-5"><label class="form-label">Ngày cân ${quickDays('chooseRecvTime', [0, -7, -30, -60, -90])}</label><div class="input-group input-group-sm"><input type="date" class="form-control" aria-label="Từ ngày" value="${f.from}" onchange="setRecv('from',this.value)"><span class="input-group-text">đến</span><input type="date" class="form-control" aria-label="Đến ngày" value="${f.to}" onchange="setRecv('to',this.value)"></div></div>
                ${field('Tìm theo mã', 'fCode', f.code, { col: 3, attrs: `placeholder="Mã chuyến, biển số, cont..." onchange="setRecv('code',this.value)"` })}
            </div></div><div class="panel-body p-0">` + table([
            { title: 'Thao tác', render: r => `<div class="d-flex gap-1"><button class="btn btn-sm btn-light btn-icon" title="KCS" aria-label="KCS ${r.id}" onclick="kcsForm('${r.id}')"><i class="fa fa-vial-circle-check"></i></button><button class="btn btn-sm btn-light btn-icon" title="Đánh giá, duyệt" aria-label="Đánh giá ${r.id}" onclick="showReceipt('${r.id}')"><i class="fa fa-shield-halved"></i></button></div>` },
            { title: 'Mã chuyến', render: r => `<span class="code">${esc(r.id)}</span>` },
            { title: 'Biển số / Cont', render: r => `<span class="code">${esc(r.plate)}</span>${r.plate.includes('Cont') || r.plate.includes('TGHU') ? '<span class="sub text-primary"><i class="fa fa-ship me-1"></i>Container dỡ Cát Lái</span>' : ''}` },
            { title: 'Lần VC', num: true, render: r => r.trip },
            { title: 'Nhà cung cấp', render: r => receiptSource(r) === 'Nhập khẩu' ? `${esc(supplierName(r.supplierId))}<span class="sub"><span class="badge bg-danger bg-opacity-10 text-danger border border-danger me-1">🇨🇳 Nhập khẩu TQ</span>Ô ${esc(r.bay || '–')}</span>` : `${esc(supplierName(r.supplierId))}<span class="sub">${receiptSource(r)} · Ô ${esc(r.bay || '–')}</span>` },
            { title: 'EUDR', render: r => pill(receiptStatus(r)) },
            { title: 'Lệnh mua', render: r => { const p = receiptPO(r.id); return p ? `<span class="code">${esc(p.id)}</span>` : '–'; } },
            { title: 'Chọn thửa', render: r => `<button class="btn btn-sm btn-light" onclick="choosePlots('${r.id}')">${r.plotIds.length} thửa</button>` },
            { title: 'Xưởng', render: r => `${esc(r.workshop)}<span class="sub">Ô ${esc(r.bay || '–')}</span>` },
            { title: 'KL thực tế', num: true, render: r => fmt(receiptNetKg(r), 0) + ' kg' }, { title: 'Nguồn dữ liệu', render: r => esc(r.dataSource) },
            { title: 'Ván lạng', render: r => `<span class="sci">${esc(r.species)}</span><span class="sub"><b class="${r.layer === 'FACE' ? 'text-primary' : ''}">${r.layer === 'FACE' ? 'Mặt' : 'Ruột'} (${r.t}mm)</b>, ${r.pkgCount} kiện</span>` },
            { title: 'Độ ẩm', num: true, render: r => r.moisture ? r.moisture + '%' : '–' }, { title: 'Hạng', render: r => esc(r.grade || '–') }, { title: 'Quy đổi', num: true, render: r => fmt(receiptM3(r)) + ' m³' },
            { title: 'Trạng thái', render: r => r.done ? pill('PASS', 'Hoàn thành') : pill('MEDIUM', r.kcs ? 'Chờ duyệt' : 'Chờ KCS') }, { title: 'Ngày cân', render: r => esc(r.date) }
        ], rows, 'Không có phiếu phù hợp') + `</div></section>`;
    });
}

function manualReceipt() {
    const m = openModal({
        title: 'Phiếu tiếp nhận nhập tay', size: 'modal-lg', submitText: 'Tạo phiếu', body: receiptForm(),
        onSubmit: data => guarded('receipt', () => {
            const poErr = poReceiptError(data.poId, data.supplierId, data.species);
            if (poErr) throw new Error(poErr);
            attachReceiptToPO(createReceipt(data, [], []), data.poId);
            refresh();
        })
    });
    bindPoSelect(m.el);
}

// ========== ĐƠN HÀNG (Order) ==========
const orderFilter = { tab: '', marketFilter: '', customer: '', type: '', transport: '', country: '', from: dateFilter(-90), to: todayISO() };
const TYPE_LABEL = { IN: 'Trong nước', OUT: 'Ngoài nước' };
const TRANSPORT_LABEL = { ROAD: 'Đường bộ', RAIL: 'Đường sắt', WATER: 'Đường thủy', AIR: 'Hàng không' };
const STATUS_TABS = [['', 'Tất cả trạng thái'], ['-3', 'Bị khách từ chối'], ['-2', 'Thu hồi giao dịch'], ['-1', 'Xóa (lưu trữ)'], ['0', 'Đang lên đơn'], ['1', 'Đang lên hàng'], ['2', 'Đang vận chuyển'], ['3', 'Đợi khách xác nhận'], ['4', 'Đã xác nhận']];
let orderDetailId = null, orderDetailTab = 'info';

function setOrderFilter(key, value) { orderFilter[key] = value; refresh(); }
function chooseOrderTime(days) { orderFilter.from = dateFilter(days); orderFilter.to = todayISO(); refresh(); }
function openOrder(id, tab = 'info') { orderDetailId = id; orderDetailTab = tab; refresh(); }

function orderForm(o = {}) {
    return `<h3 class="form-title">Thông tin khách hàng</h3><div class="row g-2">
        ${field('Khách hàng', 'customerId', o.customerId, { type: 'select', required: true, options: DB.customers.map(c => [c.id, `${c.name} (${c.country})`]) })}
        ${field('Nước nhập khẩu (ISO 2)', 'countryId', o.countryId, { required: true, attrs: 'maxlength="2" pattern="[A-Za-z]{2}"', help: 'Nước EU: đơn phải qua kiểm tra EUDR' })}
    </div><h3 class="form-title">Thông tin chung</h3><div class="row g-2">
        ${field('Loại hình xuất khẩu', 'type', o.type || 'OUT', { type: 'select', col: 3, options: Object.entries(TYPE_LABEL) })}
        ${field('Loại hình vận chuyển', 'transportType', o.transportType || 'WATER', { type: 'select', col: 3, options: Object.entries(TRANSPORT_LABEL) })}
        ${field('Chứng nhận', 'certificate', o.certificate, { type: 'select', col: 3, options: DB.config.certificates })}
        ${field('Mã HS', 'hsCode', o.hsCode, { type: 'select', col: 3, options: DB.config.hsCodes })}
        ${field('Địa điểm giao hàng', 'deliveryLocation', o.deliveryLocation)}${field('Địa điểm nhận hàng', 'pickUpLocation', o.pickUpLocation || 'Nhà máy ECOtech2A, KCN Tam Phước')}
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

function applyOrderForm(o, data) {
    const c = byId(DB.customers, data.customerId);
    Object.assign(o, data, { countryId: data.countryId.toUpperCase(), customer: c.name, customerAddress: c.address, customerEmail: c.email, eori: c.eori });
}

function addOrder() {
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

function editOrder(id) {
    const o = getOrder(id);
    if (orderIsLocked(o)) { toast('Đơn đã khóa, trả về Đang lên đơn trước khi sửa', 'err'); return; }
    openModal({
        title: `Sửa đơn ${id}`, size: 'modal-lg', submitText: 'Lưu', body: orderForm(o),
        onSubmit: data => guarded('order', () => { applyOrderForm(o, data); logAction(id, 'Sửa đơn', ''); refresh(); })
    });
}

function changeOrderStatus(id, status) {
    openModal({
        title: `Chuyển đơn ${id} sang: ${ORDER_STATUS[status]}`, submitText: 'Xác nhận',
        body: `${status >= 1 ? '<div class="note-box warn">Khóa lô và thửa nguồn</div>' : ''}<div class="row g-2">${field('Người thực hiện', 'by', '', { required: true, col: 12 })}</div>`,
        onSubmit: data => guarded('order', () => { setOrderStatus(getOrder(id), Number(status), data.by); refresh(); })
    });
}

function editItem(orderId, itemId) {
    const o = getOrder(orderId), it = itemId ? byId(o.items, itemId) : { unit: 'm³', currency: 'USD', certificate: o.certificate };
    if (orderIsLocked(o)) { toast('Đơn đã khóa', 'err'); return; }
    const products = uniq(DB.workOrders.map(w => w.product));
    openModal({
        title: itemId ? 'Sửa sản phẩm' : 'Thêm sản phẩm', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Sản phẩm', 'product', it.product, { type: 'select', required: true, options: products })}${field('Chứng nhận', 'certificate', it.certificate, { type: 'select', options: DB.config.certificates })}
            ${field('Đơn giá', 'price', it.price, { type: 'number', attrs: 'min="0" step="any"' })}${field('Tiền tệ', 'currency', it.currency, { type: 'select', options: ['USD', 'EUR', 'VND'] })}
            ${field('Số lượng', 'quantity', it.quantity, { type: 'number', required: true, attrs: 'min="0.001" step="any"' })}${field('Đơn vị', 'unit', it.unit, { type: 'select', options: ['m³', 'tấm'] })}
            ${field('Ghi chú', 'remark', it.remark, { col: 12 })}</div>`,
        onSubmit: data => guarded('order', () => {
            if (itemId) Object.assign(it, data); else o.items.push({ id: 'SP-' + (o.items.length + 1), ...data });
            logAction(orderId, itemId ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `${data.product}: ${data.quantity} ${data.unit}`);
            refresh();
        })
    });
}

function removeItem(orderId, itemId) {
    guarded('order', () => {
        const o = getOrder(orderId);
        if (orderIsLocked(o)) throw new Error('Đơn đã khóa');
        o.items = o.items.filter(i => i.id !== itemId);
        logAction(orderId, 'Xóa sản phẩm', itemId);
        refresh();
    });
}

/** Danh sách xe: mỗi xe/cont mang các pallet thành phẩm, tương ứng TransportOrder và P_AddPallet. */
function editCar(orderId, carId) {
    const o = getOrder(orderId), c = carId ? byId(o.cars, carId) : { palletIds: [] };
    if (orderIsLocked(o)) { toast('Đơn đã khóa', 'err'); return; }
    const taken = new Set(o.cars.filter(x => x !== c).flatMap(x => x.palletIds));
    const free = DB.pallets.filter(p => !taken.has(p.id) && (!palletOrder(p.id) || palletOrder(p.id).id === orderId) && (!orderIsEudr(o) || getWO(p.workOrderId).market === 'EU'));
    openModal({
        title: carId ? 'Sửa xe' : 'Thêm xe', size: 'modal-lg', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Loại xe', 'typeCar', c.typeCar || 'Container 40HC')}${field('Biển số', 'plate', c.plate, { required: true })}${field('Số seal', 'seal', c.seal)}${field('Số cont', 'cont', c.cont)}
            ${field('Ngày vận chuyển', 'date', c.date || todayISO(), { type: 'date', required: true })}${field('Giờ vào', 'timeIn', c.timeIn, { type: 'time', col: 3 })}${field('Giờ ra', 'timeOut', c.timeOut, { type: 'time', col: 3 })}
            <div class="col-12"><label class="form-label">Pallet trên xe</label><div class="pick-list">${free.map(p => `<label><input class="form-check-input" type="checkbox" name="palletIds" value="${p.id}" ${c.palletIds.includes(p.id) ? 'checked' : ''}><span>${p.id}<span class="sub">${esc(getWO(p.workOrderId).product)}, ${p.sheets} tấm, ${fmt(p.kg, 0)} kg</span></span></label>`).join('') || '<div class="empty">Không còn pallet phù hợp</div>'}</div></div>${field('Ghi chú', 'remark', c.remark, { col: 12 })}</div>`,
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

function removeCar(orderId, carId) {
    guarded('order', () => {
        const o = getOrder(orderId);
        if (orderIsLocked(o)) throw new Error('Đơn đã khóa');
        o.cars = o.cars.filter(c => c.id !== carId);
        syncOrderPallets(o);
        logAction(orderId, 'Xóa xe', carId);
        refresh();
    });
}

function showOrderQr(id) {
    const o = getOrder(id);
    showTag('QR đơn hàng', id, [['Khách hàng', o.customer], ['Tra cứu', 'truy-xuat.html, chế độ công khai'], ['Mật khẩu', o.passCode ? 'Có' : 'Không'], ['Hạn xem', o.viewingPeriod || '–']]);
}

function enterDds(id) {
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

function exportGeo(id) {
    const text = geoJsonText(getOrder(id));
    const res = validateGeoJsonText(text);
    if (!res.ok) { toast('GeoJSON đầu ra có lỗi, xem danh sách kiểm tra', 'err'); return; }
    downloadFile(`EUDR_${id}_ECOTECH2A.geojson`, text, 'application/geo+json');
    logAction(id, 'Xuất GeoJSON', `${res.items.length} thửa`);
}

function exportDossier(id) {
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
        <h2>Nhật ký công đoạn</h2>${rows(['Lệnh', 'Công đoạn', 'Ca', 'Bắt đầu', 'Kết thúc', 'Máy', 'Vận hành', 'Xác nhận', 'Tấm ra', 'Số lần sửa'], orderWOs(o).flatMap(w => w.stages.map((s, i) => [w.id, STAGES[i], s.shift, s.start, s.end, s.machine, s.by, s.confirmBy, s.out, (s.revisions || []).length])))}
        <h2>GeoJSON</h2><pre>${esc(geoJsonText(o))}</pre></body></html>`;
    downloadFile(`Ho_so_${id}.html`, html, 'text/html');
    logAction(id, 'Xuất hồ sơ', 'Bộ hồ sơ đầy đủ');
}

function orderDetailHtml(o) {
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
                                return `<li><div class="grow"><b>${esc(p.id)}</b> <span class="tag">${esc(wo.product)}</span><span class="sub">${p.sheets} tấm, ${fmt(p.kg, 0)} kg · Lệnh ${esc(wo.id)} (Thị trường: ${esc(wo.market)})</span></div><span class="badge bg-secondary">Non-EU</span></li>`;
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
            <div class="row g-3"><div class="col-lg-7">${card('Gói dữ liệu cho DDS', `<table class="table table-sm mb-2"><tbody>${facts.map(f => `<tr><td class="text-muted" style="width:150px">${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</tbody></table><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-primary" onclick="enterDds('${o.id}')">${o.dds ? 'Cập nhật' : 'Nhập'} số DDS</button>${lightBtn('Tải GeoJSON', `exportGeo('${o.id}')`, 'fa-download')}${lightBtn('Xuất hồ sơ', `exportDossier('${o.id}')`, 'fa-file-export')}<a class="btn btn-sm btn-light" href="../nha-may/truy-xuat.html?code=${o.id}"><i class="fa fa-route me-1"></i>Truy xuất</a></div>`)}</div>
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

function page_orders() {
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
