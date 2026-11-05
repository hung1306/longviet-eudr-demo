/**
 * Lệnh mua nguyên liệu gỗ (tương ứng Lệnh mua mủ bên Thiện Hưng): mua trong nước và nhập khẩu.
 * Số đã nhận được cộng từ các lô tiếp nhận gắn vào lệnh, không nhập tay.
 */
const PO_INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DAP'];
const poFilter = { source: '', status: '' };
function setPoFilter(key, value) { poFilter[key] = value; refresh(); }

const getPO = id => byId(DB.purchaseOrders, id);
const poIsImport = po => (getSupplier(po.supplierId) || {}).type === 'IMPORT';
const poReceived = po => round(sum(po.receiptIds.map(getReceipt).filter(Boolean), receiptM3));
const poSpeciesName = sci => (DB.config.species.find(s => s.scientific === sci) || {}).common || sci;

function poState(po) {
    if (po.status === 'DRAFT') return ['DRAFT', 'Nháp'];
    if (po.status === 'CANCEL') return ['FAIL', 'Đã hủy'];
    const got = poReceived(po);
    if (got >= po.qtyM3) return ['PASS', 'Đủ hàng'];
    return got > 0 ? ['MEDIUM', 'Đang nhận'] : ['MEDIUM', 'Đã duyệt'];
}

/** Điều kiện EUDR để duyệt lệnh. Mỗi mục sai là một lỗi chặn. */
function poChecks(po) {
    const s = getSupplier(po.supplierId) || {};
    const plots = DB.plots.filter(p => p.supplierId === po.supplierId && p.species === po.species && p.country === po.originCountry);
    const clear = plots.filter(p => p.forest && p.forest.result === 'CLEAR');
    const contractOk = !!s.contractExpiry && s.contractExpiry >= todayISO();
    return [
        { label: 'NCC đã ký cam kết EUDR', ok: !!s.commitment },
        { label: 'Hợp đồng khung còn hạn', ok: contractOk, detail: s.contractNo || 'Chưa có' },
        { label: 'Nước khai thác không rủi ro cao', ok: countryRisk(po.originCountry) !== 'HIGH', detail: po.originCountry },
        { label: 'Có thửa đúng loài, đúng nước khai thác', ok: plots.length > 0, detail: `${plots.length} thửa` },
        { label: 'Thửa không mất rừng sau 31/12/2020', ok: plots.length > 0 && clear.length === plots.length, detail: `${clear.length}/${plots.length} thửa` }
    ];
}

function poForm(po = {}) {
    const first = getSupplier(po.supplierId) || DB.suppliers[0];
    return `<div class="row g-2">
        ${field('Nhà cung cấp', 'supplierId', first.id, { type: 'select', col: 8, required: true, options: DB.suppliers.map(s => [s.id, `${s.name} (${s.country})`]), attrs: 'id="po-supplier"' })}
        ${field('Ngày lập', 'date', po.date || todayISO(), { type: 'date', col: 4, required: true })}
        ${field('Loài gỗ', 'species', po.species, { type: 'select', col: 5, options: speciesOptions() })}
        ${field('Lớp ván', 'layer', po.layer || 'CORE', { type: 'select', col: 3, options: [['CORE', 'Ruột'], ['FACE', 'Mặt']] })}
        ${field('Nước khai thác (ISO 2)', 'originCountry', po.originCountry || first.country, { col: 4, required: true, attrs: 'maxlength="2" pattern="[A-Za-z]{2}" id="po-origin"' })}
        ${field('Dài (mm)', 'l', po.l || 1270, { type: 'number', col: 2, required: true, attrs: 'min="1"' })}
        ${field('Rộng (mm)', 'w', po.w || 640, { type: 'number', col: 2, required: true, attrs: 'min="1"' })}
        ${field('Dày (mm)', 't', po.t || 1.7, { type: 'number', col: 2, required: true, attrs: 'min="0.1" step="0.1"' })}
        ${field('Khối lượng (m³)', 'qtyM3', po.qtyM3, { type: 'number', col: 2, required: true, attrs: 'min="0.1" step="any"' })}
        ${field('Đơn giá / m³', 'price', po.price, { type: 'number', col: 2, attrs: 'min="0" step="any"' })}
        ${field('Tiền tệ', 'currency', po.currency || first.type === 'IMPORT' ? (po.currency || 'USD') : 'VND', { type: 'select', col: 2, options: ['VND', 'USD', 'EUR', 'CNY'], attrs: 'id="po-currency"' })}
        ${field('Ngày giao dự kiến', 'deliveryDate', po.deliveryDate, { type: 'date', col: 4, required: true })}
        ${field('Nơi giao', 'deliveryPlace', po.deliveryPlace || 'Nhà máy ECOtech2A', { col: 8 })}
        <div class="col-12" id="po-import"><div class="row g-2">
            ${field('Incoterm', 'incoterm', po.incoterm || 'CIF', { type: 'select', col: 2, options: PO_INCOTERMS })}
            ${field('Cảng dỡ', 'port', po.port || 'Cát Lái', { type: 'select', col: 3, options: ['Cát Lái', 'Cái Mép', 'Đình Vũ'] })}
            ${field('Số container', 'containers', po.containers || 1, { type: 'number', col: 2, attrs: 'min="1"' })}
            ${field('Số hợp đồng ngoại', 'foreignContract', po.foreignContract, { col: 5 })}
        </div></div>
        ${field('Ghi chú', 'note', po.note, { col: 12 })}
    </div>`;
}

function poFormSync(el) {
    const sel = el.querySelector('#po-supplier');
    const sync = changed => {
        const s = getSupplier(sel.value);
        el.querySelector('#po-import').classList.toggle('d-none', s.type !== 'IMPORT');
        if (changed) {
            el.querySelector('#po-origin').value = s.country;
            el.querySelector('#po-currency').value = s.type === 'IMPORT' ? 'USD' : 'VND';
        }
    };
    sel.onchange = () => sync(true);
    sync(false);
}

function poClean(data) {
    const s = getSupplier(data.supplierId);
    const out = { ...data, originCountry: data.originCountry.toUpperCase(), l: +data.l, w: +data.w, t: +data.t, qtyM3: +data.qtyM3, price: +data.price || 0 };
    if (s.type === 'IMPORT') out.containers = +data.containers || 1;
    else ['incoterm', 'port', 'containers', 'foreignContract'].forEach(k => delete out[k]);
    return out;
}

function addPO() {
    const m = openModal({
        title: 'Thêm lệnh mua', size: 'modal-lg', submitText: 'Lưu nháp', body: poForm(),
        onSubmit: data => guarded('supplier', () => {
            const ym = data.date.slice(2, 7).replace('-', '');
            const no = DB.purchaseOrders.reduce((max, p) => Math.max(max, Number(p.id.slice(-3))), 0) + 1;
            const po = { id: `LM-${ym}-${String(no).padStart(3, '0')}`, ...poClean(data), status: 'DRAFT', receiptIds: [] };
            DB.purchaseOrders.push(po);
            logAction(po.id, 'Tạo lệnh mua', `${po.supplierId}; ${po.qtyM3} m³`);
            refresh();
        })
    });
    poFormSync(m.el);
}

function editPO(id) {
    const po = getPO(id);
    const m = openModal({
        title: `Sửa ${id}`, size: 'modal-lg', submitText: 'Lưu', body: poForm(po),
        onSubmit: data => guarded('supplier', () => {
            ['incoterm', 'port', 'containers', 'foreignContract'].forEach(k => delete po[k]);
            Object.assign(po, poClean(data));
            logAction(id, 'Sửa lệnh mua', `${po.qtyM3} m³`);
            refresh();
        })
    });
    poFormSync(m.el);
}

function approvePO(id) {
    guarded('supplier', () => {
        const po = getPO(id), failed = poChecks(po).filter(c => !c.ok);
        if (failed.length) throw new Error('Chưa duyệt được: ' + failed[0].label);
        po.status = 'OPEN';
        logAction(id, 'Duyệt lệnh mua', po.supplierId);
        refresh();
    });
}

function cancelPO(id) {
    guarded('supplier', () => {
        const po = getPO(id);
        if (po.receiptIds.length) throw new Error('Lệnh đã có lô nhận, không hủy được');
        po.status = 'CANCEL';
        logAction(id, 'Hủy lệnh mua', '');
        refresh();
    });
}

/** Gắn các lô đã tiếp nhận của cùng NCC, cùng loài vào lệnh. */
function linkReceipts(id) {
    const po = getPO(id);
    if (po.status !== 'OPEN') { toast('Chỉ gắn lô cho lệnh đã duyệt', 'err'); return; }
    const taken = new Set(DB.purchaseOrders.filter(p => p !== po).flatMap(p => p.receiptIds));
    const lots = DB.receipts.filter(r => r.supplierId === po.supplierId && r.species === po.species && !taken.has(r.id));
    openModal({
        title: `Gắn lô: ${id}`, submitText: 'Lưu',
        body: `<div class="pick-list">${lots.map(r => `<label><input class="form-check-input" type="checkbox" name="lots" value="${esc(r.id)}" ${po.receiptIds.includes(r.id) ? 'checked' : ''}><span>${esc(r.id)}<span class="sub">${esc(r.date)}, ${fmt(receiptM3(r))} m³</span></span></label>`).join('') || '<div class="empty">Không có lô phù hợp</div>'}</div>`,
        onSubmit: (data, fd) => guarded('supplier', () => {
            po.receiptIds = fd.getAll('lots');
            logAction(id, 'Gắn lô vào lệnh mua', po.receiptIds.join(', ') || 'Bỏ hết');
            refresh();
        })
    });
}

function showPO(id) {
    const po = getPO(id), s = getSupplier(po.supplierId) || {}, imp = poIsImport(po), lots = po.receiptIds.map(getReceipt).filter(Boolean);
    const docs = requiredDocs(s), got = new Set(lots.flatMap(r => r.docs));
    const facts = [
        ['Nhà cung cấp', `${s.name} (${s.country})`], ['Liên hệ', s.contact], ['Nước khai thác', po.originCountry],
        ['Hàng', `${poSpeciesName(po.species)} (${po.species}), ${po.layer === 'FACE' ? 'mặt' : 'ruột'}, ${po.l}x${po.w}x${po.t} mm`],
        ['Khối lượng', `${fmt(poReceived(po))} / ${fmt(po.qtyM3)} m³`], ['Đơn giá', `${fmt(po.price)} ${po.currency}/m³`], ['Thành tiền', `${fmt(po.price * po.qtyM3)} ${po.currency}`],
        ['Giao dự kiến', `${po.deliveryDate}, ${po.deliveryPlace || ''}`],
        ...(imp ? [['Incoterm / cảng', `${po.incoterm}, ${po.port}`], ['Container', po.containers], ['Hợp đồng ngoại', po.foreignContract || '–']] : []),
        ['Ghi chú', po.note || '–']
    ];
    const check = (ok, label, detail) => `<li><i class="fa ${ok ? 'fa-circle-check ok' : 'fa-circle-xmark no'}"></i><div>${esc(label)}${detail ? `<small>${esc(detail)}</small>` : ''}</div></li>`;
    openModal({
        title: `Lệnh mua ${id}`, size: 'modal-xl',
        body: `<div class="row g-3">
            <div class="col-lg-6"><table class="table table-sm mb-0"><tbody>${facts.map(f => `<tr><td class="text-muted" style="width:140px">${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</tbody></table></div>
            <div class="col-lg-3"><h3 class="h6">Điều kiện EUDR</h3><ul class="check-list">${poChecks(po).map(c => check(c.ok, c.label, c.ok ? '' : c.detail)).join('')}</ul></div>
            <div class="col-lg-3"><h3 class="h6">Chứng từ${imp ? ' nhập khẩu' : ''}</h3><ul class="check-list">${docs.map(d => check(got.has(d), d)).join('')}</ul></div>
            <div class="col-12"><h3 class="h6">Lô đã nhận (${lots.length})</h3>${table([
                { title: 'Lô', render: r => traceLink(r.id) }, { title: 'Ngày', render: r => esc(r.date) }, { title: 'Xe / cont', render: r => esc(r.plate) },
                { title: 'Khối lượng', num: true, render: r => fmt(receiptM3(r)) + ' m³' }, { title: 'EUDR', render: r => pill(receiptStatus(r)) }
            ], lots, 'Chưa nhận lô nào')}</div></div>`
    });
}

function page_purchase_orders() {
    startPage('lenh-mua', { title: 'Lệnh mua', actions: newBtn('Thêm lệnh mua', 'addPO()') }, root => {
        const f = poFilter;
        const rows = DB.purchaseOrders.filter(p => (!f.source || (f.source === 'IMPORT') === poIsImport(p)) && (!f.status || poState(p)[1] === f.status)).slice().reverse();
        const srcBtn = (v, label) => `<button type="button" class="btn btn-sm ${f.source === v ? 'btn-dark' : 'btn-light'}" onclick="setPoFilter('source','${v}')">${label}</button>`;
        root.innerHTML = `<div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                ${srcBtn('', `Tất cả (${DB.purchaseOrders.length})`)}${srcBtn('DOMESTIC', `Trong nước (${DB.purchaseOrders.filter(p => !poIsImport(p)).length})`)}${srcBtn('IMPORT', `Nhập khẩu (${DB.purchaseOrders.filter(poIsImport).length})`)}
                <select class="form-select form-select-sm ms-auto" style="width:auto" aria-label="Trạng thái" onchange="setPoFilter('status',this.value)">${['', 'Nháp', 'Đã duyệt', 'Đang nhận', 'Đủ hàng', 'Đã hủy'].map(x => `<option value="${x}" ${f.status === x ? 'selected' : ''}>${x || 'Tất cả trạng thái'}</option>`).join('')}</select>
            </div>` + card('', table([
            { title: 'Số lệnh', render: p => `<span class="code">${esc(p.id)}</span><span class="sub">${esc(p.date)}</span>` },
            { title: 'Nhà cung cấp', render: p => `${esc(supplierName(p.supplierId))}<span class="sub">${poIsImport(p) ? 'Nhập khẩu' : 'Trong nước'} · khai thác tại ${esc(p.originCountry)}</span>` },
            { title: 'Loài gỗ', render: p => `${esc(poSpeciesName(p.species))}<span class="sub">${p.layer === 'FACE' ? 'Mặt' : 'Ruột'} · ${p.l}x${p.w}x${p.t} mm</span>` },
            { title: 'Nhận / Đặt', num: true, render: p => `${fmt(poReceived(p), 1)} / ${fmt(p.qtyM3)} m³` },
            { title: 'Đơn giá', num: true, render: p => `${fmt(p.price)} ${esc(p.currency)}` },
            { title: 'Giao hàng', render: p => `${esc(p.deliveryDate)}<span class="sub">${poIsImport(p) ? `${esc(p.incoterm)} ${esc(p.port)} · ${esc(p.containers)} cont` : esc(p.deliveryPlace)}</span>` },
            { title: 'EUDR', render: p => { const c = poChecks(p), ok = c.filter(x => x.ok).length; return pill(ok === c.length ? 'PASS' : 'FAIL', `${ok}/${c.length}`); } },
            { title: 'Trạng thái', render: p => { const [k, t] = poState(p); return pill(k, t); } },
            { title: '', render: p => `<div class="d-flex gap-1">
                <button class="btn btn-sm btn-light btn-icon" title="Xem" aria-label="Xem ${p.id}" onclick="showPO('${p.id}')"><i class="fa fa-eye"></i></button>
                ${p.status === 'DRAFT' ? `<button class="btn btn-sm btn-light btn-icon" title="Sửa" aria-label="Sửa ${p.id}" onclick="editPO('${p.id}')"><i class="fa fa-pen"></i></button><button class="btn btn-sm btn-primary" onclick="approvePO('${p.id}')">Duyệt</button>` : ''}
                ${p.status === 'OPEN' ? `<button class="btn btn-sm btn-light" onclick="linkReceipts('${p.id}')">Gắn lô</button>` : ''}
                ${p.status !== 'CANCEL' && !p.receiptIds.length ? `<button class="btn btn-sm btn-light btn-icon" title="Hủy" aria-label="Hủy ${p.id}" onclick="cancelPO('${p.id}')"><i class="fa fa-ban"></i></button>` : ''}
            </div>` }
        ], rows, 'Không có lệnh phù hợp'), '', 'panel-flush');
    });
}

// ---------- Nối với Tiếp nhận ----------
const poField = (value, col = 6) => field('Lệnh mua', 'poId', value || '', { type: 'select', col, options: [['', 'Không theo lệnh']], attrs: 'data-po-select' });

/** Đổ danh sách lệnh của NCC đang chọn vào ô Lệnh mua. Lệnh nháp vẫn hiện để biết vì sao chưa nhận được. */
function bindPoSelect(el) {
    const sup = el.querySelector('[name=supplierId]'), sel = el.querySelector('[data-po-select]');
    const sync = () => {
        const list = DB.purchaseOrders.filter(p => p.supplierId === sup.value && (p.status === 'OPEN' || p.status === 'DRAFT'));
        sel.innerHTML = '<option value="">Không theo lệnh</option>' + list.map(p => `<option value="${esc(p.id)}">${esc(p.id)}: ${esc(poSpeciesName(p.species))}, ${fmt(poReceived(p), 1)}/${fmt(p.qtyM3)} m³${p.status === 'DRAFT' ? ' (chưa duyệt)' : ''}</option>`).join('');
    };
    sup.addEventListener('change', sync);
    sync();
}

/** Lỗi chặn khi nhận hàng theo lệnh; trả về null nếu nhận được. */
function poReceiptError(poId, supplierId, species) {
    if (!poId) return null;
    const po = getPO(poId);
    if (!po) return `Lệnh ${poId} không tồn tại`;
    if (po.status !== 'OPEN') return `Lệnh ${poId} chưa được duyệt`;
    if (po.supplierId !== supplierId) return `Lệnh ${poId} thuộc nhà cung cấp khác`;
    if (po.species !== species) return `Lệnh ${poId} mua ${poSpeciesName(po.species)}, khác loài gỗ của lô`;
    return null;
}

/** Gắn lô mới vào lệnh và cảnh báo nếu nhận vượt số đặt. */
function attachReceiptToPO(r, poId) {
    if (!poId) return;
    const po = getPO(poId);
    po.receiptIds.push(r.id);
    logAction(poId, 'Nhận lô theo lệnh mua', `${r.id}: ${fmt(receiptM3(r))} m³`);
    const got = poReceived(po);
    if (got > po.qtyM3) toast(`Lệnh ${poId} nhận ${fmt(got, 1)} m³, vượt số đặt ${fmt(po.qtyM3)} m³`, 'err');
}

const receiptPO = id => DB.purchaseOrders.find(p => p.receiptIds.includes(id));
