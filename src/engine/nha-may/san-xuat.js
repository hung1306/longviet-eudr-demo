import {
    DB,
    SCRAP_USES,
    SHIFTS,
    STAGES,
    STAGE_SPECS,
    correctStage,
    createPallet,
    createWorkOrder,
    getPackage,
    getPallet,
    getPlot,
    getReceipt,
    getSupplier,
    getWO,
    logAction,
    packageStock,
    palletM3,
    palletOrder,
    plotGeoCheck,
    plotLockedBy,
    receiptM3,
    receiptStatus,
    receiptStock,
    reconcile,
    recordStage,
    sum,
    todayISO,
    trace,
    uniq,
    validateGeoJsonText,
    verifyOrderAccess,
    woDone,
    woHoldReasons,
    woInputM3,
    woOutputM3,
    woPalletQty,
    woPlots,
    woReceipts,
    PACK,
    SOURCE_LABEL,
    TENANT,
    unitName,
    bayStock,
    palletShipped,
    DECISION_ACTIONS,
    EXPIRY_WARN_DAYS,
    SUPPLIER_KINDS,
    assessContract,
    daysBetween,
    farmerReady,
    isTrader,
    supplierContracts,
    supplierKind,
    supplierStanding,
    usableContracts,
} from '../shared/core.js';
import {
    card,
    drawPlotsMap,
    kpi,
    levelPill,
    esc,
    field,
    fmt,
    guarded,
    openModal,
    pill,
    showTag,
    startPage,
    table,
    tag,
    toast,
} from '../shared/navigation.js';

/**
 * Các trang nghiệp vụ. Mỗi trang HTML chỉ gọi một hàm page_* ở cuối tệp này qua thuộc tính data-page.
 */
export const newBtn = (label, fn, icon = 'fa-plus') => `<button class="btn btn-sm btn-primary" onclick="${fn}"><i class="fa ${icon} me-1"></i>${label}</button>`;
export const lightBtn = (label, fn, icon) => `<button class="btn btn-sm btn-light" onclick="${fn}">${icon ? `<i class="fa ${icon} me-1"></i>` : ''}${label}</button>`;
export const traceLink = code => `<a class="tag" href="/nha-may/truy-xuat?code=${encodeURIComponent(code)}">${esc(code)}</a>`;
export const supplierName = id => (getSupplier(id) || {}).name || id;
export const speciesOptions = () => DB.config.species.map(s => [s.scientific, `${s.common} (${s.scientific})`]);

// ========== Nhà cung cấp & thửa đất (FR1, FR3, FR4, FR5) ==========

export const CHAINS = [['DIRECT', 'Mua trực tiếp'], ['AGENT', 'Qua một đại lý'], ['MULTI', 'Nhiều tầng trung gian']];

export function editSupplier(id) {
    const s = id ? getSupplier(id) : { type: 'DOMESTIC', country: 'VN', chain: 'DIRECT', commitment: false };
    openModal({
        title: id ? `Sửa ${id}` : 'Thêm nhà cung cấp', size: 'modal-lg', submitText: 'Lưu',
        body: `<div class="row g-2">
            ${field('Tên đơn vị', 'name', s.name, { required: true, col: 8 })}
            ${field('Mã số thuế / ĐKKD', 'taxCode', s.taxCode, { col: 4 })}
            ${field('Loại bên bán', 'kind', supplierKind(s), { type: 'select', col: 6, options: SUPPLIER_KINDS, help: 'Thương lái phải khai danh sách hộ cung cấp' })}
            ${field('Chuỗi cung ứng', 'chain', s.chain, { type: 'select', col: 6, options: CHAINS })}
            ${field('Loại nguồn', 'type', s.type, { type: 'select', col: 6, options: [['DOMESTIC', 'Trong nước'], ['IMPORT', 'Nhập khẩu']] })}
            ${field('Mã quốc gia (ISO 2)', 'country', s.country, { required: true, col: 6, attrs: 'maxlength="2" pattern="[A-Za-z]{2}"' })}
            ${field('Địa chỉ bưu chính', 'address', s.address, { required: true })}
            ${field('Email', 'email', s.email, { required: true, type: 'email' })}
            ${field('Người liên hệ', 'contact', s.contact)}
            ${field('Nơi sơ chế, sấy trung gian và tọa độ', 'site', s.site)}
            <div class="col-12"><div class="form-text">Hợp đồng mua, điều khoản và hồ sơ pháp lý nhập ở bước 2 <a href="/nha-may/hop-dong-mua">Hợp đồng mua & hồ sơ</a>.</div></div>
            <div class="col-12"><label class="d-flex gap-2"><input class="form-check-input" type="checkbox" name="commitment" ${s.commitment ? 'checked' : ''}>
            <span>Đã ký cam kết EUDR</span></label></div>
        </div>`,
        onSubmit: data => guarded('supplier', () => {
            const clean = { ...data, country: data.country.toUpperCase(), commitment: !!data.commitment };
            if (clean.kind === 'TRADER' && clean.chain === 'DIRECT') clean.chain = 'AGENT';
            if (id) {
                Object.assign(s, clean);
                logAction(id, 'Sửa nhà cung cấp', s.name);
            } else {
                const prefix = `NCC-${clean.country}-`;
                const no = DB.suppliers.filter(x => x.id.startsWith(prefix)).length + 1;
                const created = { id: prefix + String(no).padStart(3, '0'), ...clean };
                DB.suppliers.push(created);
                logAction(created.id, 'Thêm nhà cung cấp', created.name);
                toast('Đã thêm. Nạp tọa độ thửa đất để hoàn tất hồ sơ nhà cung cấp.');
                setTimeout(() => openGeoImport(created.id), 450);
            }
            refresh();
        })
    });
}

export function geoResultHtml(res) {
    if (res.fatal) return `<div class="note-box bad">${esc(res.fatal)}</div>`;
    return `<div class="note-box ${res.ok ? 'ok' : 'bad'}">${res.ok ? 'Tệp hợp lệ' : 'Tệp có lỗi'}</div>
        <ul class="check-list">${res.fileErrors.map(e => `<li><i class="fa fa-circle-xmark no"></i>${esc(e)}</li>`).join('')}
        ${res.items.map(it => `<li><i class="fa ${it.errors.length ? 'fa-circle-xmark no' : 'fa-circle-check ok'}"></i><div><b>${esc(it.label)}</b>${it.errors.map(e => `<small>${esc(e)}</small>`).join('')}${it.warnings.map(w => `<small style="color:var(--warn)">${esc(w)}</small>`).join('')}</div></li>`).join('')}</ul>`;
}

export const SAMPLE_GEO = {
    ok: '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[107.362145,11.245120],[107.364512,11.245481],[107.364873,11.243214],[107.362417,11.242876],[107.362145,11.245120]]]},"properties":{"PlotID":"MAU-DAT","ProducerCountry":"VN","ProducerName":"Hộ mẫu","ProductionPlace":"Định Quán, Đồng Nai","Area":6.5}}]}',
    bad: '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[107.36,11.24]},"properties":{"PlotID":"MAU-LOI-DIEM","ProducerCountry":"Việt Nam","Area":8.5}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[107.362145,11.245123],[107.364873,11.243214],[107.364512,11.245481],[107.362417,11.242876],[107.362145,11.245123]]]},"properties":{"PlotID":"MAU-TU-CAT","ProducerCountry":"VN","Area":6.5}}]}'
};

export function openGeoImport(supplierId) {
    const m = openModal({
        title: 'Kiểm tra và nạp GeoJSON', size: 'modal-lg', submitText: 'Nạp vào danh sách thửa',
        body: `<div class="row g-2">
            ${field('Nhà cung cấp', 'supplierId', supplierId, { type: 'select', options: DB.suppliers.map(s => [s.id, s.name]) })}
            ${field('Loài (áp cho các thửa)', 'species', '', { type: 'select', options: speciesOptions() })}
            ${field('Khai thác từ', 'harvestFrom', '', { type: 'date', required: true })}
            ${field('Khai thác đến', 'harvestTo', '', { type: 'date', required: true })}
            ${field('Giấy tờ đất / giấy phép', 'landDoc', '', { col: 8 })}
            ${field('Năm trồng', 'plantingYear', '', { type: 'number', col: 4 })}
            <div class="col-12"><label class="form-label">Tệp .geojson hoặc dán nội dung</label>
                <input type="file" class="form-control form-control-sm mb-2" accept=".geojson,.json" id="geo-file">
                <textarea class="form-control mono" name="text" id="geo-text" rows="6" required></textarea>
                <div class="d-flex gap-2 mt-2">
                    <button type="button" class="btn btn-sm btn-light" id="geo-check">Kiểm tra</button>
                    <button type="button" class="btn btn-sm btn-light" id="geo-ok">Mẫu đúng</button>
                    <button type="button" class="btn btn-sm btn-light" id="geo-bad">Mẫu lỗi</button>
                </div>
            </div>
            <div class="col-12" id="geo-result"></div></div>`,
        onSubmit: data => {
            const res = validateGeoJsonText(data.text);
            document.querySelector('#geo-result').innerHTML = geoResultHtml(res);
            if (!res.ok) return false;
            if (data.harvestTo < data.harvestFrom) { toast('Ngày khai thác đến phải sau ngày bắt đầu', 'err'); return false; }
            return guarded('plot', () => {
                res.features.forEach((f, i) => {
                    const pr = f.properties;
                    const base = pr.PlotID || `PLOT-${pr.ProducerCountry}-${Date.now().toString(36).toUpperCase()}-${i + 1}`;
                    if (getPlot(base)) throw new Error(`Mã thửa ${base} đã tồn tại`);
                    DB.plots.push({ id: base, supplierId: data.supplierId, owner: pr.ProducerName || '', country: pr.ProducerCountry, place: pr.ProductionPlace || '', species: data.species, areaHa: pr.Area, geometry: f.geometry, plantingYear: Number(data.plantingYear) || null, harvestFrom: data.harvestFrom, harvestTo: data.harvestTo, landDoc: data.landDoc, forest: { result: 'NONE' }, version: 1 });
                    logAction(base, 'Nạp thửa đất', `${f.geometry.type}, ${pr.Area} ha`);
                });
                toast(`Đã nạp ${res.features.length} thửa. Bước tiếp theo: ghi kết quả đối chiếu bản đồ rừng.`);
                refresh();
            });
        }
    });
    const el = m.el, text = el.querySelector('#geo-text');
    const check = () => { el.querySelector('#geo-result').innerHTML = geoResultHtml(validateGeoJsonText(text.value)); };
    el.querySelector('#geo-check').onclick = check;
    el.querySelector('#geo-ok').onclick = () => { text.value = SAMPLE_GEO.ok; check(); };
    el.querySelector('#geo-bad').onclick = () => { text.value = SAMPLE_GEO.bad; check(); };
    el.querySelector('#geo-file').onchange = async e => { if (e.target.files[0]) { text.value = await e.target.files[0].text(); check(); } };
}

export function editForest(id) {
    const p = getPlot(id), locked = plotLockedBy(id);
    const f = p.forest || {};
    openModal({
        title: `Đối chiếu bản đồ rừng: ${id}`, submitText: 'Lưu kết quả',
        body: `${locked.length ? `<div class="note-box warn">Đang khóa bởi đơn ${locked.map(o => esc(o.id)).join(', ')}</div>` : ''}
            <div class="note-box">Đối chiếu thủ công: <a href="https://www.globalforestwatch.org/map/" target="_blank" rel="noopener">Global Forest Watch</a> / JRC GFC2020</div>
            <div class="row g-2">
            ${field('Kết quả', 'result', f.result, { type: 'select', col: 12, options: [['NONE', 'Chưa đối chiếu'], ['CLEAR', 'Không chồng lấn'], ['OVERLAP', 'Chồng lấn một phần, cần ảnh vệ tinh'], ['LOSS', 'Mất tán rừng sau 31/12/2020']] })}
            ${field('Nguồn / bằng chứng', 'source', f.source, { required: true })}
            ${field('Ngày', 'date', f.date || todayISO(), { type: 'date', required: true })}
            ${field('Người thực hiện', 'by', f.by, { required: true })}
            ${locked.length ? field('Lý do sửa', 'reason', '', { required: true }) : ''}</div>`,
        onSubmit: data => guarded('forest', () => {
            const { reason, ...forest } = data;
            p.forest = forest;
            if (locked.length) p.version = (p.version || 1) + 1;
            logAction(id, 'Đối chiếu bản đồ rừng', `${forest.result}, ${forest.source}${reason ? `; lý do sửa: ${reason}; phiên bản ${p.version}` : ''}`);
            refresh();
        })
    });
}

export function supplierGeoPill(s) {
    const plots = DB.plots.filter(p => p.supplierId === s.id);
    if (!plots.length) return pill('FAIL', 'Chưa có tọa độ');
    const bad = plots.filter(p => plotGeoCheck(p).errors.length || !p.forest || p.forest.result !== 'CLEAR').length;
    return bad ? pill('MEDIUM', `${bad}/${plots.length} thửa cần xử lý`) : pill('PASS', `${plots.length} thửa hợp lệ`);
}

/** Hộp thoại thửa đất của một nhà cung cấp. Bản đồ chỉ minh họa vị trí. */
export function showSupplierPlots(id) {
    const s = getSupplier(id), plots = DB.plots.filter(p => p.supplierId === id);
    const m = openModal({
        title: `Thửa đất của ${s.name} (${plots.length})`, size: 'modal-xl',
        body: table([
            { title: 'Mã thửa', render: p => `<span class="code">${esc(p.id)}</span><span class="sub">Phiên bản ${p.version || 1}</span>` },
            { title: 'Chủ đất / địa điểm', render: p => `${esc(p.owner)}<span class="sub">${esc(p.place)} (${esc(p.country)})</span>` },
            { title: 'Loài', render: p => `<span class="sci">${esc(p.species)}</span>` },
            { title: 'Diện tích', num: true, render: p => `${fmt(p.areaHa)} ha<span class="sub">${p.geometry.type}</span>` },
            { title: 'Khai thác', render: p => `${esc(p.harvestFrom)}<span class="sub">đến ${esc(p.harvestTo)}</span>` },
            { title: 'Giấy tờ đất', render: p => p.landDoc ? esc(p.landDoc) : pill('FAIL', 'Thiếu') },
            { title: 'Hình học', render: p => { const c = plotGeoCheck(p); return c.errors.length ? pill('FAIL', c.errors[0]) : c.warnings.length ? pill('MEDIUM', 'Lệch diện tích') : pill('PASS', 'Hợp lệ'); } },
            { title: 'Bản đồ rừng', render: p => `<button type="button" class="btn btn-link p-0" data-forest="${esc(p.id)}">${pill((p.forest && p.forest.result) || 'NONE')}</button>` }
        ], plots, 'Chưa có tọa độ') +
        (plots.length ? '<div class="map-box js-plot-map mt-3"></div>' : ''),
        footerExtra: '<button type="button" class="btn btn-sm btn-primary js-geo"><i class="fa fa-file-import me-1"></i>Kiểm tra / nạp GeoJSON</button>',
        onShown: el => { const box = el.querySelector('.js-plot-map'); if (box) drawPlotsMap(box, plots); }
    });
    m.el.querySelector('.js-geo').onclick = () => { m.hide(); openGeoImport(id); };
    m.el.querySelectorAll('[data-forest]').forEach(b => { b.onclick = () => { m.hide(); editForest(b.dataset.forest); }; });
}

export const STANDING_PILL = { OK: 'PASS', COND: 'MEDIUM', STOP: 'FAIL' };
export const standingPill = st => pill(STANDING_PILL[st.key], st.label);
const kindName = s => (SUPPLIER_KINDS.find(k => k[0] === supplierKind(s)) || [])[1] || '';

/** Hộ trồng rừng / nông hộ, gắn với thương lái mua gom. */
export function editFarmer(id) {
    const f = id ? DB.farmers.find(x => x.id === id) : { id: `HL-${String(DB.farmers.length + 1).padStart(2, '0')}`, plots: [], traderId: '', species: DB.config.species[0].scientific };
    const traders = DB.suppliers.filter(isTrader);
    const plots = DB.plots.filter(p => (f.plots || []).includes(p.id) || !DB.farmers.some(x => (x.plots || []).includes(p.id)));
    openModal({
        title: id ? `Sửa hộ ${f.id}` : 'Thêm hộ trồng rừng', size: 'modal-lg', submitText: 'Lưu hồ sơ hộ',
        body: `<div class="row g-2">
            ${field('Mã hộ', 'id', f.id, { required: true, col: 3, attrs: id ? 'readonly' : '' })}
            ${field('Họ tên chủ rừng / nông hộ', 'name', f.name, { required: true, col: 5 })}
            ${field('Thuộc thương lái', 'traderId', f.traderId || '', { type: 'select', col: 4, options: [['', 'Bán trực tiếp'], ...traders.map(s => [s.id, s.name])] })}
            ${field('CCCD / MST', 'cccd', f.cccd, { required: true, col: 4 })}
            ${field('Số điện thoại', 'phone', f.phone, { col: 4 })}
            ${field('Diện tích (ha)', 'areaHa', f.areaHa, { type: 'number', col: 4, attrs: 'step="0.1" min="0"' })}
            ${field('Địa chỉ vườn / rừng', 'address', f.address, { required: true, col: 8 })}
            ${field('Loài cây', 'species', f.species, { type: 'select', col: 4, options: speciesOptions() })}
            ${field('Giấy tờ đất (số sổ đỏ, QĐ giao đất...)', 'landDoc', f.landDoc, { col: 12, help: 'Để trống nếu chưa có. Hộ thiếu giấy tờ đất hoặc thửa bị chặn tại cổng.' })}
            <div class="col-12"><label class="form-label">Thửa đất của hộ (đã nạp tọa độ)</label><div class="pick-list">${plots.map(p => `<label><input class="form-check-input" type="checkbox" name="plots" value="${esc(p.id)}" ${(f.plots || []).includes(p.id) ? 'checked' : ''}><span>${esc(p.id)}<span class="sub">${esc(p.owner)} · ${fmt(p.areaHa)} ha · ${esc(p.geometry.type)}</span></span></label>`).join('') || '<div class="empty">Chưa có thửa trống. Nạp GeoJSON ở tab Nhà cung cấp.</div>'}</div></div>
        </div>`,
        onSubmit: (data, fd) => guarded('supplier', () => {
            const rec = { ...f, ...data, id: data.id.trim(), areaHa: +data.areaHa || 0, plots: fd.getAll('plots'), type: f.type || 'SMALLHOLDER' };
            rec.eudrStatus = farmerReady(rec) ? 'PASS' : 'FAIL';
            if (id) Object.assign(f, rec);
            else {
                if (DB.farmers.some(x => x.id === rec.id)) throw new Error(`Mã hộ ${rec.id} đã tồn tại`);
                DB.farmers.push(rec);
            }
            logAction(rec.id, id ? 'Sửa hộ trồng rừng' : 'Thêm hộ trồng rừng', `${rec.name}${rec.traderId ? `, thuộc ${rec.traderId}` : ''}; ${rec.plots.length} thửa`);
            toast(`Đã lưu hộ ${rec.name}`);
            refresh();
        })
    });
}

export function showTraderFarmers(id) {
    const s = getSupplier(id), list = DB.farmers.filter(f => f.traderId === id);
    openModal({
        title: `Danh sách hộ của ${s.name} (${list.length})`, size: 'modal-xl',
        body: `<div class="note-box">Thương lái chỉ được giao hàng từ các hộ có trong danh sách <b>và</b> được chọn trong hợp đồng mua. Hộ thiếu tọa độ hoặc giấy tờ đất thì xe bị chặn tại cổng.</div>` + table([
            { title: 'Mã hộ', render: f => `<span class="code">${esc(f.id)}</span>` },
            { title: 'Chủ hộ', render: f => `${esc(f.name)}<span class="sub">${esc(f.cccd)} · ${esc(f.address)}</span>` },
            { title: 'Thửa', render: f => (f.plots || []).map(tag).join('') || pill('FAIL', 'Chưa có') },
            { title: 'Giấy đất', render: f => f.landDoc && !/chưa/i.test(f.landDoc) ? esc(f.landDoc) : pill('FAIL', 'Thiếu') },
            { title: 'Trong hợp đồng', render: f => usableContracts(id).filter(c => (c.farmerIds || []).includes(f.id)).map(c => tag(c.no)).join('') || '–' },
            { title: 'Hồ sơ hộ', render: f => farmerReady(f) ? pill('PASS', 'Đủ') : pill('FAIL', 'Thiếu') }
        ], list, 'Chưa có hộ nào'),
        footerExtra: `<button type="button" class="btn btn-sm btn-primary" data-bs-dismiss="modal" onclick="setTimeout(()=>editFarmer(),300)"><i class="fa fa-plus me-1"></i>Thêm hộ</button>`
    });
}

export let supplierTab = 'suppliers';
export function setSupplierTab(tab) { supplierTab = tab; refresh(); }

export function page_suppliers() {
    supplierTab = new URLSearchParams(location.search).get('tab') === 'farmers' ? 'farmers' : 'suppliers';
    startPage('hop-dong', { title: 'Nguồn cung & Thương lái', actions: newBtn('Thêm nhà cung cấp', 'editSupplier()') + ' ' + `<button class="btn btn-sm btn-light" onclick="editFarmer()"><i class="fa fa-person-digging me-1"></i>Thêm hộ</button>` }, root => {
        const standings = DB.suppliers.map(s => ({ s, st: supplierStanding(s) }));
        const n = k => standings.filter(x => x.st.key === k).length;
        const tabs = `<ul class="nav nav-tabs mb-2">
            <li class="nav-item"><button type="button" class="nav-link ${supplierTab === 'suppliers' ? 'active' : ''}" onclick="setSupplierTab('suppliers')"><i class="fa fa-warehouse me-1"></i>Nhà cung cấp, thương lái (${DB.suppliers.length})</button></li>
            <li class="nav-item"><button type="button" class="nav-link ${supplierTab === 'farmers' ? 'active' : ''}" onclick="setSupplierTab('farmers')"><i class="fa fa-person-digging me-1"></i>Hộ trồng rừng / nông hộ (${DB.farmers.length})</button></li></ul>`;
        const head = `<div class="kpi-row">${kpi('Được mua', n('OK'), 'đủ cam kết, hợp đồng, hồ sơ', 'ok')}${kpi('Có điều kiện', n('COND'), 'sắp hết hạn hoặc hộ thiếu hồ sơ', 'warn')}${kpi('Dừng mua', n('STOP'), 'không lập được lệnh mua', 'bad')}${kpi('Hộ đủ hồ sơ', `${DB.farmers.filter(farmerReady).length}/${DB.farmers.length}`, 'tọa độ + giấy tờ đất')}</div>` + tabs;
        if (supplierTab === 'farmers') {
            root.innerHTML = head + card('', table([
                { title: 'Mã hộ', render: f => `<span class="code">${esc(f.id)}</span>` },
                { title: 'Chủ hộ', render: f => `<b>${esc(f.name)}</b><span class="sub">${esc(f.cccd)} · ${esc(f.phone || '')}</span>` },
                { title: 'Thuộc thương lái', render: f => f.traderId ? `${esc(supplierName(f.traderId))}<span class="sub">${esc(f.traderId)}</span>` : '<span class="text-muted">Bán trực tiếp</span>' },
                { title: 'Địa chỉ', render: f => esc(f.address) },
                { title: 'Diện tích', num: true, render: f => `${fmt(f.areaHa)} ha` },
                { title: 'Thửa', render: f => (f.plots || []).map(tag).join('') || pill('FAIL', 'Chưa có tọa độ') },
                { title: 'Giấy đất', render: f => f.landDoc && !/chưa/i.test(f.landDoc) ? esc(f.landDoc) : pill('FAIL', 'Thiếu') },
                { title: 'Hồ sơ hộ', render: f => farmerReady(f) ? pill('PASS', 'Đủ') : pill('FAIL', 'Thiếu') },
                { title: '', render: f => `<button class="btn btn-sm btn-light btn-icon" aria-label="Sửa ${esc(f.id)}" onclick="editFarmer('${f.id}')"><i class="fa fa-pen"></i></button>` }
            ], DB.farmers), '', 'panel-flush');
            return;
        }
        root.innerHTML = head + card('', table([
            { title: 'Mã', render: ({ s }) => `<span class="code">${esc(s.id)}</span>` },
            { title: 'Đơn vị', render: ({ s }) => `<b>${esc(s.name)}</b><span class="sub">${esc(kindName(s))} · ${esc(s.address)}</span>` },
            { title: 'Nguồn', render: ({ s }) => `${s.type === 'IMPORT' ? 'Nhập khẩu' : 'Trong nước'} (${esc(s.country)})<span class="sub">${esc((CHAINS.find(c => c[0] === s.chain) || [])[1])}</span>` },
            { title: 'Hợp đồng mua', render: ({ s }) => {
                const list = supplierContracts(s.id);
                if (!list.length) return `${pill('FAIL', 'Chưa có')}<span class="sub"><a href="/nha-may/hop-dong-mua">Lập hợp đồng</a></span>`;
                return list.map(c => { const a = assessContract(c); return `<div><span class="code">${esc(c.no)}</span> ${levelPill(a.level)}<span class="sub">đến ${esc(c.end)}${c.end && daysBetween(todayISO(), c.end) <= EXPIRY_WARN_DAYS ? ` · ${c.end < todayISO() ? 'hết hạn' : `còn ${daysBetween(todayISO(), c.end)} ngày`}` : ''}</span></div>`; }).join('');
            } },
            { title: 'Hộ', render: ({ s }) => { if (!isTrader(s)) return '–'; const list = DB.farmers.filter(f => f.traderId === s.id); return `<button class="btn btn-sm btn-light" onclick="showTraderFarmers('${s.id}')">${list.filter(farmerReady).length}/${list.length} đủ hồ sơ</button>`; } },
            { title: 'Cam kết EUDR', render: ({ s }) => s.commitment ? pill('PASS', 'Đã ký') : pill('FAIL', 'Chưa ký') },
            { title: 'Tọa độ', render: ({ s }) => supplierGeoPill(s) },
            { title: 'Trạng thái nguồn', render: ({ st }) => `${standingPill(st)}${st.reasons.length ? `<span class="sub">${esc(st.reasons[0])}${st.reasons.length > 1 ? ` (+${st.reasons.length - 1})` : ''}</span>` : ''}` },
            { title: '', render: ({ s }) => `<div class="d-flex gap-1"><button class="btn btn-sm btn-light" onclick="showSupplierPlots('${s.id}')">Thửa đất</button><button class="btn btn-sm btn-light btn-icon" aria-label="Sửa ${s.id}" onclick="editSupplier('${s.id}')"><i class="fa fa-pen"></i></button></div>` }
        ], standings), '', 'panel-flush');
    });
}

// ========== Kho (3 khu) ==========
export function packageTag(id) {
    const p = getPackage(id), r = getReceipt(p.receiptId);
    showTag('Tem kiện', id, [['Lô', r.id], ['Loài', r.species], ['NCC', r.supplierId], ['Nguyên liệu', r.inputType], ['Thửa', r.plotIds.join(', ')], ['Ô kho', r.bay]]);
}

export const ZONE_INFO = {
    ZONE_A: ['Khu A: Đạt', 'zone-a', 'Được cấp cho lệnh EU'],
    ZONE_B: ['Khu B: Chờ bổ sung', 'zone-b', 'Khóa, chưa đưa vào sản xuất'],
    ZONE_C: ['Khu C: Cách ly', 'zone-c', 'Trả lại hoặc đơn ngoài EU']
};
const fillBar = (used, max) => `<div class="fill"><span style="width:${Math.min(100, max ? used / max * 100 : 0)}%"></span></div>`;

export function page_warehouse() {
    startPage('kho-nguyen-lieu', { title: 'Kho nguyên liệu' }, root => {
        const lots = DB.receipts;
        const zoneHtml = Object.entries(ZONE_INFO).map(([zone, [title, cls, note]]) => {
            const bays = DB.warehouseBays.filter(b => b.zone === zone);
            const total = sum(bays, bayStock);
            return `<div class="zone ${cls}"><h3>${title}</h3><div class="meta">${note} · tồn ${fmt(total)} m³</div>${bays.map(b => {
                const inBay = lots.filter(r => r.bay === b.id && receiptStock(r) > 0);
                return `<div class="bay"><div class="d-flex justify-content-between"><b>${esc(b.name)}</b><small>${fmt(bayStock(b))} / ${b.maxM3} m³</small></div>${fillBar(bayStock(b), b.maxM3)}<small class="text-muted">${b.source === 'ALL' ? 'Mọi nguồn, có nhãn' : esc(SOURCE_LABEL[b.source])}${inBay.length ? ' · ' + inBay.map(r => esc(r.id)).join(', ') : ' · Trống'}</small></div>`;
            }).join('')}</div>`;
        }).join('');
        const rows = lots.slice().sort((a, b) => a.bay.localeCompare(b.bay));
        const pkgs = DB.packages.filter(p => packageStock(p) > 0.0001);
        root.innerHTML = `<section class="rule-strip"><b>Cách xếp kho</b><span><i class="fa fa-shield-halved"></i>Khu theo kết quả EUDR</span><span><i class="fa fa-tree"></i>Ô theo nguồn nguyên liệu</span><span><i class="fa fa-tags"></i>Mỗi lô, mỗi kiện có nhãn mã lô</span><span><i class="fa fa-arrow-right-arrow-left"></i>Lô đổi kết quả thì đổi ô</span></section>
            <div class="zones">${zoneHtml}</div>` +
            card(`Lô trong kho (${rows.length})`, table([
                { title: 'Mã lô', render: r => `<span class="code">${esc(r.id)}</span><span class="sub">${esc(r.date)}</span>` },
                { title: 'Nguồn', render: r => `${esc(SOURCE_LABEL[r.sourceCategory])}<span class="sub">${esc(supplierName(r.supplierId))}</span>` },
                { title: 'Nguyên liệu', render: r => `${esc(r.inputType)}<span class="sub sci">${esc(r.species)}</span>` },
                { title: 'Ô', render: r => tag(r.bay) },
                { title: 'Nhập', num: true, render: r => `${fmt(receiptM3(r))} m³` },
                { title: 'Đã cấp', num: true, render: r => `${fmt(receiptM3(r) - receiptStock(r))} m³` },
                { title: 'Còn', num: true, render: r => `<b>${fmt(receiptStock(r))} m³</b>` },
                { title: 'Lệnh đã cấp', render: r => DB.workOrders.filter(w => woReceipts(w).some(x => x.id === r.id)).map(w => traceLink(w.id)).join('') || '–' },
                { title: 'EUDR', render: r => pill(receiptStatus(r)) },
                { title: 'Quyết định Tuân thủ', render: r => r.decision ? `${esc(DECISION_ACTIONS[r.decision.action] || '')}<span class="sub">${esc(r.decision.by)} · ${esc(r.decision.at)}</span>` : r.approval ? `Cấp cho sản xuất<span class="sub">${esc(r.approval.by)} · ${esc(r.approval.at)}</span>` : `<button class="btn btn-sm btn-light" onclick="showReceipt('${r.id}')">Chờ quyết định</button>` }
            ], rows), '', 'panel-flush') +
            card(`Kiện còn tồn (${pkgs.length})`, table([
                { title: 'Mã kiện', render: p => `<span class="code">${esc(p.id)}</span>` },
                { title: 'Lô', render: p => esc(p.receiptId) },
                { title: 'Ô', render: p => esc(getReceipt(p.receiptId).bay) },
                { title: 'Còn', num: true, render: p => `${fmt(packageStock(p), 3)} / ${fmt(p.m3, 3)} m³` },
                { title: 'Khu', render: p => pill(receiptStatus(getReceipt(p.receiptId))) },
                { title: '', render: p => `<button class="btn btn-sm btn-light btn-icon" aria-label="In tem" onclick="packageTag('${p.id}')"><i class="fa fa-qrcode"></i></button>` }
            ], pkgs.slice(0, 30)) + (pkgs.length > 30 ? `<div class="sub p-2">Hiển thị 30 / ${pkgs.length} kiện` + '</div>' : ''), '', 'panel-flush');
    });
}

// ========== Lệnh sản xuất (FR7) ==========
export function newWorkOrder() {
    const m = openModal({
        title: 'Lệnh sản xuất mới', size: 'modal-xl', submitText: 'Phát lệnh',
        body: `<div class="row g-2">
            ${field('Sản phẩm', 'specId', DB.productSpecs[0].id, { required: true, type: 'select', options: DB.productSpecs.map(s => [s.id, `${s.name} (${s.dim})`]) })}
            ${field('Thị trường', 'market', 'EU', { type: 'select', col: 3, options: [['EU', 'EU'], ['OTHER', 'Ngoài EU']], attrs: 'id="wo-market"' })}
            ${field(`Số lượng (${unitName()})`, 'targetQty', 100, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}
            <div class="col-12"><label class="form-label">Lấy nguyên liệu theo lô (m³)</label><div class="pick-list" id="wo-lots"></div><div class="form-text" id="wo-rule"></div></div></div>`,
        onSubmit: (data, fd) => guarded('workorder', () => {
            const allocations = [];
            fd.getAll('lot').forEach(id => {
                let need = Number(fd.get('qty_' + id)) || 0;
                DB.packages.filter(p => p.receiptId === id).forEach(p => {
                    const take = Math.min(packageStock(p), need);
                    if (take > 0.0001) { allocations.push({ packageId: p.id, m3: +take.toFixed(4) }); need -= take; }
                });
                if (need > 0.001) throw new Error(`Lô ${id} không đủ tồn`);
            });
            const spec = DB.productSpecs.find(s => s.id === data.specId);
            const wo = createWorkOrder({ product: spec.name, specId: spec.id, specText: spec.dim, unitM3: spec.unitM3, t: spec.target, market: data.market, targetQty: +data.targetQty }, allocations);
            toast(`Đã phát lệnh ${wo.id}`);
            refresh();
        })
    });
    const market = m.el.querySelector('#wo-market');
    const sync = () => {
        const eu = market.value === 'EU';
        const lots = DB.receipts.filter(r => { const s = receiptStatus(r); return receiptStock(r) > 0 && (s === 'PASS' || (!eu && s === 'FAIL')); });
        m.el.querySelector('#wo-rule').textContent = eu ? 'Chỉ lô Đạt' : 'Gồm lô cách ly. Thành phẩm không vào đơn EU';
        m.el.querySelector('#wo-lots').innerHTML = lots.map(r => `<label class="align-items-center"><input class="form-check-input" type="checkbox" name="lot" value="${r.id}"><span class="flex-grow-1">${r.id} ${pill(receiptStatus(r))}<span class="sub"><i class="sci">${esc(r.species)}</i>, còn ${receiptStock(r)} m³</span></span><input class="form-control form-control-sm" style="width:100px" type="number" step="0.001" min="0" max="${receiptStock(r)}" name="qty_${r.id}" aria-label="m³ lấy từ ${r.id}"></label>`).join('') || '<div class="empty">Không có lô phù hợp còn tồn</div>';
    };
    market.onchange = sync;
    sync();
}

export function woProgress(w) { return w.stages.filter(s => s.status === 'DONE').length; }

export function page_workorders() {
    startPage('lenh-san-xuat', { title: 'Lệnh sản xuất', actions: newBtn('Lệnh mới', 'newWorkOrder()') }, root => {
        root.innerHTML = card('', table([
            { title: 'Lệnh SX', render: w => `<span class="code text-primary">${esc(w.id)}</span><span class="sub">${esc(w.created)}</span>` },
            { title: 'Sản phẩm & Quy cách', render: w => `<b>${esc(w.product)}</b><span class="sub">${esc(w.specText)} · ${w.targetQty} ${unitName()}</span>` },
            { title: 'Thị trường', render: w => w.market === 'EU' ? '<span class="pill pill-pass">Xuất khẩu EU</span>' : '<span class="pill pill-fail">Ngoài EU (Nội địa)</span>' },
            { title: 'Lô nguyên liệu', render: w => woReceipts(w).map(r => traceLink(r.id)).join('') },
            { title: 'Loài gỗ', render: w => uniq(woReceipts(w).map(r => r.species)).map(s => `<span class="sci d-block">${esc(s)}</span>`).join('') },
            { title: 'Vào (m³)', num: true, render: w => fmt(woInputM3(w)) },
            { title: 'Ra (m³)', num: true, render: w => w.finishedQty ? fmt(woOutputM3(w)) : '–' },
            { title: 'Thu hồi', render: w => { if (!w.finishedQty) return '<span class="text-muted">Đang chạy</span>'; const c = reconcile(w); return pill(c.overRun ? 'FAIL' : c.outOfBand ? 'MEDIUM' : 'PASS', c.rate + '%'); } },
            { title: 'Kiểm soát EUDR', render: w => {
                const hold = woHoldReasons(w);
                if (hold.length) return `<span class="pill pill-fail"><i class="fa fa-ban"></i>Bị giữ (${hold.join(',')})</span>`;
                if (w.qaNote && w.qaNote.includes('Giải trình')) return `<span class="pill pill-wait"><i class="fa fa-triangle-exclamation"></i>Giải trình QA</span>`;
                if (woDone(w)) return `<span class="pill pill-pass"><i class="fa fa-check"></i>100% Đạt</span>`;
                return `<span class="pill pill-info"><i class="fa fa-spinner"></i>Đang chạy</span>`;
            } },
            { title: 'Tiến độ', render: w => `<a class="btn btn-xs btn-light" href="/nha-may/nhat-ky-san-xuat">${woProgress(w)}/${STAGES.length} bước</a>` }
        ], DB.workOrders), '', 'panel-flush');
    });
}

// ========== Nhật ký 7 công đoạn ==========
export const stageFilter = { status: '', code: '' };
export function setStageFilter(key, value) { stageFilter[key] = value; refresh(); }

export function nowLocal() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function stageForm(wo, index, s = {}, isEdit = false) {
    const spec = STAGE_SPECS[index], prev = index > 0 ? wo.stages[index - 1] : null;
    const lots = woReceipts(wo);
    const params = spec.params.map(p => field(p.label, p.key, s[p.key], { type: 'number', col: 4, required: true, attrs: `step="any" min="${p.min}"${p.max !== undefined ? ` max="${p.max}"` : ''}`, help: p.max !== undefined ? `Dải chuẩn ${p.min}-${p.max}` : p.tolerance !== undefined && wo.t !== undefined ? `Chuẩn ${wo.t} ± ${p.tolerance}` : '' })).join('');
    return `
        <div class="ccp-box mb-2">
            <div class="ccp-head">
                <b>${esc(spec.ccpName)}</b>
                
            </div>
            <div class="text-muted small">${esc(spec.ccpControl)}</div>
            
        </div>
        <div class="small text-muted mb-2">Lô: ${lots.map(r => esc(r.id)).join(', ')}.${prev && prev.out ? ` Bước trước ra ${prev.out} ${STAGE_SPECS[index - 1].outUnit}.` : ''}</div>
        <div class="row g-2">
        ${field('Ca', 'shift', s.shift, { type: 'select', col: 3, options: SHIFTS })}
        ${field('Máy', 'machine', s.machine, { type: 'select', col: 3, options: spec.machines })}
        ${field('Bắt đầu', 'start', s.start, { type: 'datetime-local', col: 3, required: true })}
        ${field('Kết thúc', 'end', s.end || nowLocal(), { type: 'datetime-local', col: 3, required: true })}
        ${field('Người vận hành', 'by', s.by, { required: true })}
        ${field('Người xác nhận (khác người vận hành)', 'confirmBy', s.confirmBy, { required: true })}
        ${spec.qc ? field('Hạng A (xuất EU)', 'gradeA', s.gradeA, { type: 'number', col: 4, required: true, attrs: 'min="1"' }) + field('Hạng B (bán ngoài EU)', 'gradeB', s.gradeB || 0, { type: 'number', col: 4, attrs: 'min="0"' }) + field('Hạng C (phế, loại)', 'gradeC', s.gradeC || 0, { type: 'number', col: 4, attrs: 'min="0"' }) + field('Giải trình QA (nếu thu hồi ngoài dải)', 'qaNote', s.qaNote || wo.qaNote, { col: 12 })
        : field(spec.outLabel, 'out', s.out, { type: 'number', required: true, col: 4, attrs: 'min="1"' })}
        ${params}
        ${spec.patchLot ? field('Lô của vật liệu vá', 'patchLot', s.patchLot, { type: 'select', col: 12, options: lots.map(r => [r.id, `${r.id} (${r.species})`]) }) : ''}
        ${spec.scrap ? field('Xử lý phế liệu', 'scrapUse', s.scrapUse, { type: 'select', col: 12, options: SCRAP_USES }) : ''}
        ${field('Ghi chú vận hành', 'note', s.note, { col: 12 })}
        ${isEdit ? field('Lý do sửa (bắt buộc)', 'reason', '', { col: 12, required: true }) : '<div class="col-12"><label class="d-flex gap-2"><input class="form-check-input" type="checkbox" required><span>Phôi thuộc lô trong lệnh</span></label></div>'}
        </div>`;
}

export function logStage(woId, index) {
    const wo = getWO(woId);
    openModal({
        title: `${STAGES[index]} (Lệnh ${woId})`, size: 'modal-lg', submitText: 'Xác nhận kiểm soát', body: stageForm(wo, index),
        onSubmit: data => guarded('workorder', () => { recordStage(wo, index, data); stageView.woId = woId; stageView.step = index; refresh(); })
    });
}

export function editStage(woId, index) {
    const wo = getWO(woId);
    openModal({
        title: `Sửa ${STAGES[index]} (Lệnh ${woId})`, size: 'modal-lg', submitText: 'Lưu sửa đổi', body: stageForm(wo, index, wo.stages[index], true),
        onSubmit: data => guarded('workorder', () => { correctStage(wo, index, data, data.reason); refresh(); })
    });
}

export function showRevisions(woId, index) {
    const revs = getWO(woId).stages[index].revisions || [];
    openModal({
        title: `Lịch sử chỉnh sửa: ${STAGES[index]}`, size: 'modal-lg',
        body: table([
            { title: 'Thời gian', render: r => esc(r.changedAt.slice(0, 16).replace('T', ' ')) }, { title: 'Vai trò', render: r => esc(r.role) }, { title: 'Lý do sửa', render: r => esc(r.reason) },
            { title: 'Dữ liệu trước sửa', render: r => `${esc(r.out)} ${unitName()}; ${esc(r.by)}, xác nhận ${esc(r.confirmBy)}` }
        ], revs.slice().reverse())
    });
}

export function stageParams(s, index) {
    const spec = STAGE_SPECS[index], parts = spec.params.map(p => `${p.label}: <b>${s[p.key]}</b>`);
    if (s.patchLot) parts.push(`Vật liệu vá: <code>${s.patchLot}</code>`);
    if (s.scrapUse) parts.push(`Xử lý phế: ${s.scrapUse}`);
    if (spec.qc) parts.push(`Phân loại: Hạng A <b>${s.gradeA}</b>, B <b>${s.gradeB || 0}</b>, C <b>${s.gradeC || 0}</b>`);
    if (s.note) parts.push(`Ghi chú: ${s.note}`);
    return parts.map(x => `<div>${x}</div>`).join('');
}

export const stageView = { woId: null, step: null };
export function openStageTab(woId, step) { stageView.woId = woId; stageView.step = step; refresh(); }

export function stageTabBody(w, i, next, hold, locked) {
    const s = w.stages[i];
    const spec = STAGE_SPECS[i];
    const ccpBoxHtml = `
        <div class="ccp-box ${hold.length && !woDone(w) ? 'hold' : ''}">
            <div class="ccp-head">
                <div>
                    
                    <b class="text-dark">${esc(spec.ccpName)}</b>
                </div>
                <span class="badge ${s.status === 'DONE' ? 'bg-success' : (hold.length && !woDone(w) ? 'bg-danger' : 'bg-warning text-dark')}">
                    ${s.status === 'DONE' ? 'Đạt' : (hold.length && !woDone(w) ? 'Bị giữ' : 'Chờ ghi')}
                </span>
            </div>
            <div class="text-muted small">${esc(spec.ccpControl)}</div>
            
        </div>
    `;

    if (s.status !== 'DONE') {
        if (i !== next) return ccpBoxHtml + `<div class="empty">Chờ bước ${next + 1}</div>`;
        if (hold.length) return ccpBoxHtml + `<div class="alert alert-danger py-2 small mb-0"><i class="fa fa-ban me-1"></i>Bị giữ: lô ${hold.join(', ')}</div>`;
        return ccpBoxHtml + `<div class="p-2 text-center"><button class="btn btn-sm btn-primary" onclick="logStage('${w.id}',${i})"><i class="fa fa-pen me-1"></i>Ghi nhận ${esc(STAGES[i])}</button></div>`;
    }

    const prevOut = i > 0 && STAGE_SPECS[i - 1].outUnit === spec.outUnit ? w.stages[i - 1].out : null;
    const facts = [
        ['Ca sản xuất', s.shift],
        ['Thiết bị máy', s.machine],
        ['Bắt đầu', String(s.start).replace('T', ' ')],
        ['Kết thúc', String(s.end).replace('T', ' ')],
        ['Người vận hành', s.by],
        ['Người xác nhận (4 mắt)', s.confirmBy],
        [spec.outLabel, `<b>${fmt(s.out, 0)} ${spec.outUnit}</b>`],
        ['Hao hụt công đoạn', prevOut ? `${prevOut - s.out} ${spec.outUnit}` : '–']
    ];
    const params = stageParams(s, i);
    const revs = (s.revisions || []).length;
    return ccpBoxHtml + `<div class="row g-3">
        <div class="col-lg-6">
            <table class="table table-sm mb-0"><tbody>${facts.map(f => `<tr><td class="text-muted" style="width:160px">${esc(f[0])}</td><td>${f[1]}</td></tr>`).join('')}</tbody></table>
        </div>
        <div class="col-lg-6">
            <div class="border rounded p-2 bg-light mb-2">
                <span class="small fw-bold text-muted d-block mb-1">Thông số</span>
                <div class="small">${params || '–'}</div>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                ${locked ? '<span class="text-muted small"><i class="fa fa-lock me-1"></i>Đã khóa</span>' : `<button class="btn btn-sm btn-light" onclick="editStage('${w.id}',${i})"><i class="fa fa-pen me-1"></i>Sửa có lý do</button>`}
                ${revs ? `<button class="btn btn-sm btn-light" onclick="showRevisions('${w.id}',${i})">${revs} lần sửa</button>` : ''}
            </div>
        </div>
    </div>`;
}

export function page_stages() {
    startPage('nhat-ky-san-xuat', { title: 'Nhật ký sản xuất' }, root => {
        const f = stageFilter, code = f.code.trim().toLowerCase();
        const stateOf = w => woHoldReasons(w).length && !woDone(w) ? 'HOLD' : woDone(w) ? 'DONE' : 'RUN';
        const list = DB.workOrders.slice().reverse().filter(w => (!f.status || stateOf(w) === f.status) && (!code || w.id.toLowerCase().includes(code) || w.product.toLowerCase().includes(code)));
        const filters = `<section class="panel mb-3"><div class="panel-body py-2"><div class="row g-2 align-items-center">
            ${field('Trạng thái', 'fs', f.status, { type: 'select', col: 3, options: [['', 'Tất cả'], ['RUN', 'Đang chạy'], ['HOLD', 'Bị giữ (HOLD)'], ['DONE', 'Hoàn tất']], attrs: `onchange="setStageFilter('status',this.value)"` })}
            ${field('Tìm lệnh', 'fc', f.code, { col: 4, attrs: `placeholder="Mã lệnh, sản phẩm" onchange="setStageFilter('code',this.value)"` })}
            ${field('Lệnh sản xuất', 'fw', '', { type: 'select', col: 5, options: list.map(w => [w.id, `${w.id}: ${w.product} (${w.market === 'EU' ? 'EU' : 'Ngoài EU'})`]), attrs: `id="stage-wo" onchange="openStageTab(this.value,null)"` })}
            </div></div></section>`;
        if (!list.length) { root.innerHTML = filters + card('', '<div class="empty">Không có lệnh phù hợp</div>'); return; }
        const w = list.find(x => x.id === stageView.woId) || list[0];
        const next = w.stages.findIndex(s => s.status !== 'DONE');
        const step = w.id === stageView.woId && stageView.step !== null ? stageView.step : (next < 0 ? STAGES.length - 1 : next);
        const hold = woHoldReasons(w), locked = DB.pallets.some(p => p.workOrderId === w.id);
        const rec = w.finishedQty ? reconcile(w) : null;
        
        const processHtml = card(`Quy trình ${PACK.name}`, `<ol class="wf">${PACK.process.map((p, i) => `<li class="${p.trace ? 'is-trace' : ''}"><b>${i + 1}</b><strong>${esc(p.name)}</strong><small>${esc(p.record)}</small></li>`).join('')}</ol><div class="sub mb-2">Viền cam: phải ghi mã lô. Nhật ký này ghi các bước trong xưởng:</div>` + table([
            { title: 'Bước', render: x => x.i + 1 },
            { title: 'Công đoạn', render: x => `<b>${esc(STAGES[x.i])}</b>` },
            { title: 'Kiểm soát EUDR', render: x => esc(STAGE_SPECS[x.i].ccpControl) },
            { title: 'Phải ghi', render: x => esc(['Ca, máy, giờ, 2 người', STAGE_SPECS[x.i].outLabel, ...STAGE_SPECS[x.i].params.map(p => p.label), ...(STAGE_SPECS[x.i].qc ? ['Phân hạng'] : [])].join(', ')) },
            { title: `Lệnh ${w.id}`, render: x => { const s = w.stages[x.i]; return s.status === 'DONE' ? pill('PASS', `${fmt(s.out, 0)} ${STAGE_SPECS[x.i].outUnit}`) : x.i === next ? pill('MEDIUM', 'Đang chờ ghi') : '<span class="text-muted">Chưa tới</span>'; } }
        ], STAGES.map((_, i) => ({ i }))), '', 'mb-3');
        root.innerHTML = filters + processHtml + card(`${w.id}: ${w.product}`, `
            ${hold.length && !woDone(w) ? `<div class="note-box bad py-2 mb-2"><i class="fa fa-ban me-1"></i>Bị giữ: lô ${hold.map(esc).join(', ')}</div>` : ''}
            <div class="stages" role="tablist">${w.stages.map((s, i) => `<button type="button" role="tab" aria-selected="${i === step}" class="stage ${s.status === 'DONE' ? 'done' : ''} ${i === step ? 'next' : ''}" onclick="openStageTab('${w.id}',${i})"><span class="n"><span>B${i + 1}</span></span><b>${STAGES[i]}</b><small>${s.status === 'DONE' ? `${fmt(s.out, 0)} ${STAGE_SPECS[i].outUnit} · ${esc(s.at)}` : i === next ? (hold.length ? 'Bị giữ' : 'Chờ ghi') : 'Chưa tới'}</small></button>`).join('')}</div>
            <div class="stage-panel" role="tabpanel"><h3 class="h6 mb-2">Bước ${step + 1}: ${STAGES[step]}</h3>${stageTabBody(w, step, next, hold, locked)}</div>
            <div class="mt-3 d-flex flex-wrap gap-3 align-items-center small">
                <span><span class="text-muted">Thửa kế thừa:</span> ${woPlots(w).map(p => traceLink(p.id)).join('')}</span>
                ${rec ? `<span><span class="text-muted">Đối soát vào, ra:</span> vào ${fmt(rec.input)} m³, ra ${fmt(rec.output)} m³ ${pill(rec.overRun ? 'FAIL' : rec.outOfBand ? 'MEDIUM' : 'PASS', rec.rate + '%')}</span>` : ''}
                ${w.qaNote ? `<span class="badge bg-warning text-dark"><i class="fa fa-triangle-exclamation me-1"></i>QA: ${esc(w.qaNote)}</span>` : ''}
            </div>`, w.lot ? tag(w.lot) : '');
        document.getElementById('stage-wo').value = w.id;
    });
}

// ========== Pallet ==========
export function newPallet() {
    const wos = DB.workOrders.filter(w => woDone(w) && w.finishedQty > woPalletQty(w));
    if (!wos.length) { toast('Không có lệnh đã xong KCS còn hàng chưa đóng kiện', 'err'); return; }
    openModal({
        title: 'Đóng pallet', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Lô thành phẩm', 'workOrderId', '', { type: 'select', col: 12, options: wos.map(w => [w.id, `${w.lot}: ${w.product} (còn ${w.finishedQty - woPalletQty(w)} ${unitName()})`]) })}
            ${field(`Số lượng (${unitName()})`, 'qty', PACK.packSize, { type: 'number', required: true, attrs: 'min="1"' })}${field('Khối lượng tịnh (kg)', 'kg', '', { type: 'number', required: true, attrs: 'min="1"' })}
            ${field('Đóng gói', 'packing', `ISPM 15, ${TENANT.name}`)}${field('Kho thành phẩm', 'location', 'TP-EU', { type: 'select', options: DB.warehouseBays.filter(b => ['EXPORT', 'NON_EU'].includes(b.zone)).map(b => [b.id, `${b.name}: ${b.allowed}`]) })}</div>`,
        onSubmit: data => guarded('pallet', () => { createPallet({ ...data, qty: +data.qty, kg: +data.kg }); refresh(); })
    });
}

export function palletTag(id) {
    const p = getPallet(id), w = getWO(p.workOrderId);
    showTag('Tem pallet', id, [['Lô TP', w.lot], ['Sản phẩm', w.product], ['Số lượng', `${p.qty} ${unitName()}`], ['Thể tích', palletM3(p) + ' m³'], ['Loài', uniq(woReceipts(w).map(r => r.species)).join(', ')]]);
}

export function palletState(p) {
    const o = palletOrder(p.id);
    if (!o) return pill('PASS', 'Trong kho');
    return o.status >= 2 ? pill('DRAFT', `Đã xuất: ${o.id}`) : pill('MEDIUM', `Gắn đơn: ${o.id}`);
}

export function page_pallets() {
    startPage('pallet', { title: 'Kho thành phẩm', actions: newBtn(`Đóng ${PACK.packUnit}`, 'newPallet()') }, root => {
        const bays = DB.warehouseBays.filter(b => ['EXPORT', 'NON_EU'].includes(b.zone));
        const zones = bays.map(b => {
            const list = DB.pallets.filter(p => p.location === b.id && !palletShipped(p));
            return `<div class="zone ${b.zone === 'EXPORT' ? 'zone-a' : 'zone-b'}"><h3>${b.zone === 'EXPORT' ? 'Kho TP xuất EU' : 'Kho TP ngoài EU'}</h3><div class="meta">${esc(b.allowed)} · ${list.length} ${PACK.packUnit}</div><div class="bay"><div class="d-flex justify-content-between"><b>${esc(b.name)}</b><small>${fmt(bayStock(b))} / ${b.maxM3} m³</small></div>${fillBar(bayStock(b), b.maxM3)}</div></div>`;
        }).join('');
        const lots = DB.workOrders.filter(w => w.lot);
        root.innerHTML = `<section class="rule-strip"><b>Chuỗi kho</b><span><i class="fa fa-clipboard-check"></i>Lệnh xong KCS</span><span><i class="fa fa-layer-group"></i>Lô thành phẩm</span><span><i class="fa fa-box"></i>Đóng ${PACK.packUnit}, dán QR</span><span><i class="fa fa-warehouse"></i>Vào kho theo thị trường</span><span><i class="fa fa-ship"></i>Gắn đơn, xuất</span></section>
            <div class="zones">${zones}</div>` +
            card(`Lô thành phẩm (${lots.length})`, table([
                { title: 'Lô', render: w => `${traceLink(w.lot)}<span class="sub">Lệnh ${esc(w.id)}</span>` },
                { title: 'Sản phẩm', render: w => `${esc(w.product)}<span class="sub">${esc(w.specText)}</span>` },
                { title: 'Thị trường', render: w => w.market === 'EU' ? '<span class="pill pill-pass">EU</span>' : '<span class="pill pill-wait">Ngoài EU</span>' },
                { title: 'Lô nguyên liệu', render: w => woReceipts(w).map(r => tag(r.id)).join('') },
                { title: 'Đạt', num: true, render: w => `${fmt(w.finishedQty, 0)} ${unitName()}` },
                { title: 'Đã đóng', num: true, render: w => fmt(woPalletQty(w), 0) },
                { title: 'Chưa đóng', num: true, render: w => fmt(w.finishedQty - woPalletQty(w), 0) },
                { title: 'Thể tích', num: true, render: w => fmt(woOutputM3(w)) + ' m³' }
            ], lots), '', 'panel-flush') +
            card(`Kiện, pallet (${DB.pallets.length})`, table([
                { title: 'Mã', render: p => traceLink(p.id) },
                { title: 'Lô thành phẩm', render: p => { const w = getWO(p.workOrderId) || { lot: '–', product: '–' }; return `${esc(w.lot)}<span class="sub">${esc(w.product)}</span>`; } },
                { title: 'Số lượng', num: true, render: p => `${p.qty} ${unitName()}` },
                { title: 'Thể tích', num: true, render: p => fmt(palletM3(p), 3) + ' m³' },
                { title: 'Khối lượng', num: true, render: p => fmt(p.kg, 0) + ' kg' },
                { title: 'Kho', render: p => tag(p.location) },
                { title: 'Ngày đóng', render: p => esc(p.created) },
                { title: 'Trạng thái', render: palletState },
                { title: '', render: p => `<button class="btn btn-sm btn-light btn-icon" aria-label="In tem" onclick="palletTag('${p.id}')"><i class="fa fa-qrcode"></i></button>` }
            ], DB.pallets), '', 'panel-flush');
    });
}

// ========== Truy xuất (FR8, FR11) ==========
export let traceMode = 'internal';

export function runTrace(code) {
    const box = document.getElementById('trace-result');
    const t = trace(code);
    if (!t) { box.innerHTML = ''; return; }
    if (t.notFound) { box.innerHTML = `<div class="note-box warn">Không tìm thấy mã ${esc(t.query)}.</div>`; return; }
    const pub = traceMode === 'public';
    if (pub && t.orders.length) {
        const o = t.orders[0], pass = document.getElementById('trace-pass');
        const access = verifyOrderAccess(o, pass ? pass.value : '');
        if (!access.ok) { box.innerHTML = `<div class="note-box warn">${esc(access.msg)}</div>`; return; }
    }
    const lane = (title, items) => `<div class="lane"><h3>${title} (${items.length})</h3>${items.slice(0, 8).join('')}${items.length > 8 ? `<div class="sub">và ${items.length - 8} mục khác</div>` : ''}</div>`;
    const link = id => `<a href="/nha-may/truy-xuat?code=${encodeURIComponent(id)}">${esc(id)}</a>`;
    box.innerHTML = card(`${t.type}: ${t.query}`, `<div class="lanes">
        ${lane('Đơn hàng', t.orders.map(o => `<div class="lane-item">${link(o.id)}<span class="sub">${esc(o.customer)}</span>${o.dds ? `<span class="sub">DDS ${esc(o.dds.reference)}</span>` : ''}</div>`))}
        ${lane('Pallet', t.pallets.map(p => `<div class="lane-item">${link(p.id)}<span class="sub">${p.qty} ${unitName()}</span></div>`))}
        ${lane('Lệnh SX', t.wos.map(w => `<div class="lane-item">${link(w.id)}<span class="sub">${esc(w.product)}</span>${w.lot ? `<span class="sub">${esc(w.lot)}</span>` : ''}</div>`))}
        ${lane('Lô nguyên liệu', t.receipts.map(r => {
            return `<div class="lane-item">${link(r.id)}<span class="sub sci">${esc(r.species)}</span>${pub ? '' : `<span class="sub">${esc(supplierName(r.supplierId))}</span>`}</div>`;
        }))}
        ${lane('Thửa đất', t.plots.map(p => {
            return `<div class="lane-item">${link(p.id)}<span class="sub">${esc(p.country)}, ${esc(p.areaHa)} ha</span>${pub ? '' : `<span class="sub">${esc(p.owner)}; ${esc(p.landDoc || 'thiếu giấy đất')}</span>`}</div>`;
        }))}
        </div>${pub ? '' : `<div class="mt-2 text-muted">Nơi xử lý: ${uniq(t.receipts.map(r => (getSupplier(r.supplierId) || {}).site).filter(Boolean)).map(esc).join('; ') || 'chưa có'}; ${esc(TENANT.site)}.</div>`}`) + card('Vị trí thửa', '<div id="trace-map" class="map-box"></div>');
    drawPlotsMap(document.getElementById('trace-map'), t.plots);
}

export function page_trace() {
    startPage('truy-xuat', { title: 'Truy xuất hai chiều' }, root => {
        const code = new URLSearchParams(location.search).get('code') || 'DPO26102801';
        root.innerHTML = card('', `<form class="d-flex flex-wrap gap-2" id="trace-form"><input class="form-control form-control-sm" style="max-width:340px" id="trace-code" value="${esc(code)}" aria-label="Mã cần truy xuất"><button class="btn btn-sm btn-primary"><i class="fa fa-magnifying-glass me-1"></i>Truy xuất</button><select class="form-select form-select-sm" style="width:auto" id="trace-mode" aria-label="Chế độ"><option value="internal">Nội bộ đầy đủ</option><option value="public">Công khai rút gọn</option></select><input class="form-control form-control-sm" style="max-width:170px" type="password" id="trace-pass" placeholder="Mật khẩu đơn" aria-label="Mật khẩu đơn"></form>`) + '<div id="trace-result"></div>';
        const input = document.getElementById('trace-code');
        document.getElementById('trace-form').onsubmit = e => { e.preventDefault(); runTrace(input.value); };
        document.getElementById('trace-mode').onchange = e => { traceMode = e.target.value; runTrace(input.value); };
        runTrace(code);
    });
}

/** Trả bộ lọc và lựa chọn về mặc định khi vào lại trang. */
export function resetProductionViews() {
    Object.assign(stageFilter, { status: '', code: '' });
    Object.assign(stageView, { woId: null, step: null });
    traceMode = 'internal';
}
