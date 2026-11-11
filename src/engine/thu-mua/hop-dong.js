import {
    newBtn,
    speciesOptions,
    supplierName,
    traceLink,
} from '../nha-may/san-xuat.js';
import {
    CONTRACT_CLAUSES,
    CONTRACT_DOCS,
    DB,
    EXPIRY_WARN_DAYS,
    PACK,
    REQ_LABEL,
    SOURCE_LABEL,
    SUPPLIER_KINDS,
    assessContract,
    contractM3,
    contractReceipts,
    contractReceivedM3,
    contractSci,
    daysBetween,
    farmerReady,
    getContract,
    getSupplier,
    isTrader,
    logAction,
    receiptM3,
    receiptStatus,
    supplierKind,
    todayISO,
} from '../shared/core.js';
import {
    card,
    esc,
    field,
    fmt,
    guarded,
    kpi,
    levelPill,
    openModal,
    pill,
    riskBox,
    startPage,
    table,
    toast,
} from '../shared/navigation.js';

/**
 * Bước 2 của luồng mua vào: hợp đồng mua là cửa vào. Chấm theo điều khoản EUDR, hồ sơ pháp lý theo nguồn và bản scan.
 * Lô gắn với hợp đồng Không đạt hoặc hết hiệu lực bị chặn tại cổng (xem gateCheck).
 */
export const ctFilter = { origin: '', level: '' };
export function setCtFilter(key, value) { ctFilter[key] = value; refresh(); }
export function resetContractViews() { Object.assign(ctFilter, { origin: '', level: '' }); }

const kindLabel = s => (SUPPLIER_KINDS.find(k => k[0] === supplierKind(s)) || [])[1] || '';

export function contractExpiryPill(c) {
    if (!c.end) return pill('FAIL', 'Chưa có hạn');
    const left = daysBetween(todayISO(), c.end);
    if (left < 0) return pill('FAIL', 'Hết hiệu lực');
    return left <= EXPIRY_WARN_DAYS ? pill('MEDIUM', `Còn ${left} ngày`) : '';
}

function volumeLine(c) {
    const v = contractM3(c);
    if (v === null) return '';
    const got = c.id ? contractReceivedM3(c) : 0;
    return `<div class="risk-foot">Khối lượng hợp đồng: ${fmt(c.bales, 0)} kiện × ${fmt(c.per, 0)} tấm × ${fmt(c.len, 0)} × ${fmt(c.wid, 0)} × ${fmt(c.thk)} mm = <b>${fmt(v, 3)} m³</b>${c.id ? ` · Đã nhận <b>${fmt(got, 3)} m³</b>` : ''}</div>`;
}

export function contractRiskBox(c) {
    const a = assessContract(c);
    return riskBox('Hồ sơ hợp đồng', a.level, a.issues, 'Hợp đồng và hồ sơ đủ điều kiện nhận hàng.', volumeLine(c));
}

// ---------- Form lập / sửa hợp đồng ----------
const checkRow = (name, label, req, checked, extra = '') => `<label class="ct-check"><input class="form-check-input" type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span>${esc(label)} <em>(${esc(REQ_LABEL[req])})</em></span>${extra}</label>`;

function clausesHtml(origin, values) {
    return CONTRACT_CLAUSES.filter(([, , r]) => r !== 'imp' || origin === 'IMPORT').map(([k, t, r]) => checkRow(`clause_${k}`, t, r, values[k])).join('');
}

function docsHtml(origin, docs, scans) {
    return (CONTRACT_DOCS[origin] || []).map(([k, t, r]) => checkRow(`doc_${k}`, t, r, docs[k],
        `<span class="ct-scan"><input type="file" class="form-control form-control-sm" name="scan_${k}" accept=".pdf,image/*" aria-label="Bản scan ${esc(t)}"><input type="hidden" name="scanName_${k}" value="${esc(scans[k] || '')}"><small>${scans[k] ? `<i class="fa fa-paperclip me-1"></i>${esc(scans[k])}` : 'Chưa có bản scan'}</small></span>`)).join('');
}

function farmersHtml(supplierId, selected) {
    const s = getSupplier(supplierId);
    if (!isTrader(s)) return '<p class="text-muted small mb-0">Bên bán không phải thương lái: lô được gắn thửa của chính bên bán.</p>';
    const list = DB.farmers.filter(f => f.traderId === supplierId);
    if (!list.length) return `<div class="note-box bad mb-0">Thương lái chưa có hộ nào. Thêm hộ ở bước 1 <a href="/thu-mua/nguon-cung?tab=farmers">Nguồn cung & Thương lái</a>.</div>`;
    return `<p class="small text-muted mb-1">Chỉ hộ được chọn mới được giao hàng theo hợp đồng này. Hộ thiếu hồ sơ thì bị chặn tại cổng.</p>` + list.map(f => `<label class="ct-check"><input class="form-check-input" type="checkbox" name="farmer" value="${esc(f.id)}" ${selected.includes(f.id) ? 'checked' : ''}><span>${esc(f.name)} <em>${esc(f.id)} · ${(f.plots || []).length} thửa</em></span>${farmerReady(f) ? pill('PASS', 'Đủ hồ sơ') : pill('FAIL', 'Thiếu tọa độ / giấy đất')}</label>`).join('');
}

/** Đọc form thành bản ghi hợp đồng (chưa lưu). */
function readContract(form, base) {
    const fd = new FormData(form);
    const g = k => (fd.get(k) || '').toString().trim();
    const n = k => g(k) === '' ? null : +g(k);
    const origin = g('origin') || 'DOMESTIC';
    const clauses = {}, docs = {}, scans = {};
    CONTRACT_CLAUSES.forEach(([k]) => { if (fd.get(`clause_${k}`)) clauses[k] = true; });
    (CONTRACT_DOCS[origin] || []).forEach(([k]) => {
        if (fd.get(`doc_${k}`)) docs[k] = true;
        const file = form.querySelector(`[name="scan_${k}"]`);
        const name = (file && file.files && file.files[0] && file.files[0].name) || g(`scanName_${k}`);
        if (name) scans[k] = name;
    });
    return {
        ...base, origin, no: g('no'), date: g('date'), end: g('end'), supplierId: g('supplierId'),
        species: g('species'), sci: g('species'), form: g('form'),
        len: n('len'), wid: n('wid'), thk: n('thk'), per: n('per'), bales: n('bales'), moist: n('moist'), kgm3: n('kgm3'),
        clauses, docs, scans, farmerIds: fd.getAll('farmer').map(String), note: g('note')
    };
}

export function contractModal(id) {
    const base = id ? getContract(id) : { origin: 'DOMESTIC', supplierId: DB.suppliers[0].id, date: todayISO(), per: 1000, len: 1270, wid: 640, thk: 2, clauses: {}, docs: {}, scans: {}, farmerIds: [] };
    const c = base;
    const m = openModal({
        title: id ? `Cập nhật hợp đồng ${c.no}` : 'Lập hợp đồng mua mới', size: 'modal-xl', submitText: id ? 'Lưu cập nhật' : 'Lưu hợp đồng',
        body: `<div class="ct-layout">
            <div class="ct-form">
                <fieldset><legend>① Hợp đồng</legend><div class="row g-2">
                    ${field('Nguồn nguyên liệu', 'origin', c.origin, { type: 'select', col: 6, options: Object.entries(SOURCE_LABEL) })}
                    ${field('Bên bán', 'supplierId', c.supplierId, { type: 'select', col: 6, required: true, options: DB.suppliers.map(s => [s.id, `${s.name} · ${kindLabel(s)}`]) })}
                    ${field('Số hợp đồng', 'no', c.no, { col: 4, required: true })}
                    ${field('Ngày ký', 'date', c.date, { type: 'date', col: 4, required: true })}
                    ${field('Hiệu lực đến', 'end', c.end, { type: 'date', col: 4, required: true })}
                </div></fieldset>
                <fieldset><legend>② Hàng hóa & quy cách nhận</legend><div class="row g-2">
                    ${field('Loài gỗ (tên khoa học)', 'species', contractSci(c), { type: 'select', col: 6, options: speciesOptions() })}
                    ${field('Dạng nguyên liệu', 'form', c.form || PACK.inputs[0], { type: 'select', col: 6, options: PACK.inputs })}
                    ${field('Dài (mm)', 'len', c.len, { type: 'number', col: 2, attrs: 'min="0"' })}
                    ${field('Rộng (mm)', 'wid', c.wid, { type: 'number', col: 2, attrs: 'min="0"' })}
                    ${field('Dày (mm)', 'thk', c.thk, { type: 'number', col: 2, attrs: 'min="0" step="0.1"' })}
                    ${field('Tấm / kiện', 'per', c.per, { type: 'number', col: 2, attrs: 'min="1"' })}
                    ${field('Số kiện', 'bales', c.bales, { type: 'number', col: 2, attrs: 'min="0"' })}
                    ${field('Độ ẩm tối đa (%)', 'moist', c.moist, { type: 'number', col: 2, attrs: 'min="0" max="100" step="0.1"' })}
                    ${field('Hệ số quy đổi (kg/m³)', 'kgm3', c.kgm3, { type: 'number', col: 4, attrs: 'min="0"' })}
                </div></fieldset>
                <fieldset><legend>③ Danh sách hộ được giao hàng (thương lái)</legend><div id="ct-farmers"></div></fieldset>
                <fieldset><legend>④ Điều khoản EUDR phải có trong hợp đồng</legend><div id="ct-clauses"></div></fieldset>
                <fieldset><legend>⑤ Hồ sơ pháp lý của bên bán & bản scan</legend><div id="ct-docs"></div>
                    <div class="form-text">Đính kèm PDF hoặc ảnh. Đã tích nhận mà chưa có bản scan thì hồ sơ chỉ ở mức Cần bổ sung. Bản demo chỉ lưu tên tệp.</div></fieldset>
                <div class="row g-2">${field('Ghi chú', 'note', c.note, { col: 12 })}</div>
            </div>
            <aside class="ct-side"><div id="ct-preview"></div>
                <div class="note-box mt-2 mb-0"><b>Quy tắc:</b> lô gắn hợp đồng <b>Không đạt</b> hoặc <b>hết hiệu lực</b> bị chặn tại cổng. Hợp đồng <b>Cần bổ sung</b> vẫn nhận hàng, lô vào Khu B.</div>
            </aside></div>`,
        onSubmit: (data, fd, form) => {
            const rec = readContract(form, id ? getContract(id) : {});
            if (DB.contracts.some(x => x.no === rec.no && x.id !== id)) { toast('Số hợp đồng này đã có trong sổ', 'err'); return false; }
            if (rec.end < rec.date) { toast('Ngày hết hiệu lực phải sau ngày ký', 'err'); return false; }
            return guarded('supplier', () => {
                const level = assessContract(rec).result;
                if (id) {
                    Object.assign(getContract(id), rec);
                    logAction(id, 'Cập nhật hợp đồng mua', `${rec.no}; ${level}`);
                } else {
                    const no = DB.contracts.reduce((mx, x) => Math.max(mx, Number((x.id.match(/\d+$/) || [0])[0])), 0) + 1;
                    rec.id = `HD-${String(no).padStart(2, '0')}`;
                    DB.contracts.push(rec);
                    logAction(rec.id, 'Lập hợp đồng mua', `${rec.no} · ${supplierName(rec.supplierId)}; ${level}`);
                }
                toast(`Đã lưu hợp đồng ${rec.no}`);
                refresh();
            });
        }
    });
    const form = m.el.querySelector('form');
    const keep = () => readContract(form, c);
    const rebuild = () => {
        const cur = keep();
        form.querySelector('#ct-clauses').innerHTML = clausesHtml(cur.origin, cur.clauses);
        form.querySelector('#ct-docs').innerHTML = docsHtml(cur.origin, cur.docs, cur.scans);
        form.querySelector('#ct-farmers').innerHTML = farmersHtml(cur.supplierId, cur.farmerIds);
        preview();
    };
    const preview = () => { form.querySelector('#ct-preview').innerHTML = contractRiskBox(keep()); };
    form.querySelector('#ct-clauses').innerHTML = clausesHtml(c.origin, c.clauses || {});
    form.querySelector('#ct-docs').innerHTML = docsHtml(c.origin, c.docs || {}, c.scans || {});
    form.querySelector('#ct-farmers').innerHTML = farmersHtml(c.supplierId, c.farmerIds || []);
    form.querySelector('[name=origin]').addEventListener('change', rebuild);
    form.querySelector('[name=supplierId]').addEventListener('change', rebuild);
    form.addEventListener('input', preview);
    form.addEventListener('change', e => {
        if (e.target.type === 'file' && e.target.files[0]) e.target.parentElement.querySelector('small').innerHTML = `<i class="fa fa-paperclip me-1"></i>${esc(e.target.files[0].name)}`;
        preview();
    });
    preview();
}

export function showContract(id) {
    const c = getContract(id), s = getSupplier(c.supplierId) || {}, lots = contractReceipts(c);
    const yes = (ok, text, sub) => `<li><i class="fa ${ok ? 'fa-circle-check ok' : 'fa-circle-xmark no'}"></i><div>${esc(text)}${sub ? `<small>${sub}</small>` : ''}</div></li>`;
    const origin = c.origin || 'DOMESTIC';
    const m = openModal({
        title: `Hợp đồng ${c.no}`, size: 'modal-xl',
        body: `<div class="ct-layout">
            <div>
                <table class="table table-sm"><tbody>${[
                    ['Bên bán', `${s.name} · ${kindLabel(s)}`], ['Nguồn', SOURCE_LABEL[origin]], ['Hiệu lực', `${c.date} → ${c.end}`],
                    ['Hàng hóa', `${c.form}, ${contractSci(c)}`], ['Quy cách', c.len ? `${c.len} × ${c.wid} × ${c.thk} mm, ${c.per} tấm/kiện, ${c.bales} kiện` : '–'],
                    ['Độ ẩm tối đa', c.moist ? `${c.moist}%` : '–'], ['Hệ số quy đổi', c.kgm3 ? `${c.kgm3} kg/m³` : '–'], ['Ghi chú', c.note || '–']
                ].map(([k, v]) => `<tr><td class="text-muted" style="width:150px">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
                <div class="row g-3">
                    <div class="col-md-6"><h3 class="h6">Điều khoản EUDR</h3><ul class="check-list">${CONTRACT_CLAUSES.filter(x => x[2] !== 'imp' || origin === 'IMPORT').map(([k, t, r]) => yes(!!(c.clauses || {})[k], t, REQ_LABEL[r])).join('')}</ul></div>
                    <div class="col-md-6"><h3 class="h6">Hồ sơ pháp lý & bản scan</h3><ul class="check-list">${(CONTRACT_DOCS[origin] || []).map(([k, t, r]) => yes(!!(c.docs || {})[k] && !!(c.scans || {})[k], t, `${REQ_LABEL[r]} · ${(c.scans || {})[k] ? esc(c.scans[k]) : (c.docs || {})[k] ? 'đã nhận, chưa có scan' : 'chưa nhận'}`)).join('')}</ul>
                    ${isTrader(s) ? `<h3 class="h6 mt-2">Hộ được giao hàng (${(c.farmerIds || []).length})</h3><ul class="check-list">${(c.farmerIds || []).map(fid => { const f = DB.farmers.find(x => x.id === fid); return f ? yes(farmerReady(f), f.name, `${f.id} · ${(f.plots || []).join(', ') || 'chưa có thửa'}`) : ''; }).join('') || '<li>Chưa khai hộ nào</li>'}</ul>` : ''}</div>
                </div>
                <h3 class="h6 mt-2">Lô đã nhận theo hợp đồng (${lots.length})</h3>${table([
                    { title: 'Lô', render: r => traceLink(r.id) }, { title: 'Ngày', render: r => esc(r.date) }, { title: 'Xe', render: r => esc(r.plate) },
                    { title: 'm³', num: true, render: r => fmt(receiptM3(r)) }, { title: 'EUDR', render: r => pill(receiptStatus(r)) }
                ], lots, 'Chưa nhận lô nào')}
            </div>
            <aside class="ct-side">${contractRiskBox(c)}</aside></div>`,
        footerExtra: `<button type="button" class="btn btn-sm btn-primary" id="ct-edit"><i class="fa fa-pen me-1"></i>Sửa / bổ sung</button>`
    });
    m.el.querySelector('#ct-edit').onclick = () => { m.hide(); setTimeout(() => contractModal(id), 300); };
}

export function page_contracts() {
    startPage('hop-dong-mua', { title: 'Hợp đồng mua & hồ sơ đầu vào', actions: newBtn('Lập hợp đồng mua', 'contractModal()', 'fa-file-signature') }, root => {
        const f = ctFilter;
        const all = DB.contracts.map(c => ({ c, a: assessContract(c) }));
        const count = lv => all.filter(x => x.a.level === lv).length;
        const expiring = all.filter(x => x.c.end && daysBetween(todayISO(), x.c.end) <= EXPIRY_WARN_DAYS).length;
        const rows = all.filter(x => (!f.origin || (x.c.origin || 'DOMESTIC') === f.origin) && (!f.level || x.a.level === f.level)).sort((a, b) => (b.c.date || '').localeCompare(a.c.date || ''));
        const chip = (v, label) => `<button type="button" class="btn btn-sm ${f.level === v ? 'btn-dark' : 'btn-light'}" onclick="setCtFilter('level','${v}')">${label}</button>`;
        root.innerHTML =
            `<div class="note-box"><i class="fa fa-door-closed me-1"></i>Hợp đồng là cửa vào: chỉ lô gắn hợp đồng <b>Đạt</b> hoặc <b>Cần bổ sung</b>, còn hiệu lực mới được tiếp nhận. Thương lái phải khai danh sách hộ được giao hàng.</div>
            <div class="kpi-row">${kpi('Hợp đồng', DB.contracts.length, 'trong sổ')}${kpi('Đạt', count('LOW'), 'nhận hàng bình thường', 'ok')}${kpi('Cần bổ sung', count('MEDIUM'), 'nhận được, lô vào Khu B', 'warn')}${kpi('Không đạt', count('HIGH'), 'chặn tại cổng', 'bad')}${kpi('Sắp / đã hết hạn', expiring, `trong ${EXPIRY_WARN_DAYS} ngày`, expiring ? 'warn' : '')}</div>
            <div class="d-flex flex-wrap gap-2 align-items-center mb-2">${chip('', 'Tất cả')}${chip('LOW', 'Đạt')}${chip('MEDIUM', 'Cần bổ sung')}${chip('HIGH', 'Không đạt')}
                <select class="form-select form-select-sm ms-auto" style="width:auto" aria-label="Nguồn" onchange="setCtFilter('origin',this.value)"><option value="">Mọi nguồn</option>${Object.entries(SOURCE_LABEL).map(([k, v]) => `<option value="${k}" ${f.origin === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>` +
            card('Sổ hợp đồng mua', table([
                { title: 'Số hợp đồng', render: ({ c }) => `<span class="code">${esc(c.no)}</span><span class="sub">${esc(c.date)} → ${esc(c.end)}</span>${contractExpiryPill(c)}` },
                { title: 'Bên bán', render: ({ c }) => { const s = getSupplier(c.supplierId); return `${esc(s ? s.name : c.supplierId)}<span class="sub">${esc(kindLabel(s))} · ${esc(SOURCE_LABEL[c.origin || 'DOMESTIC'])}</span>`; } },
                { title: 'Loài gỗ', render: ({ c }) => `<span class="sci">${esc(contractSci(c))}</span><span class="sub">${esc(c.form || '')}</span>` },
                { title: 'Quy cách', render: ({ c }) => c.len ? `${fmt(c.len, 0)} × ${fmt(c.wid, 0)} × ${fmt(c.thk)} mm<span class="sub">${fmt(c.per, 0)} tấm/kiện</span>` : '–' },
                { title: 'Hợp đồng m³', num: true, render: ({ c }) => contractM3(c) === null ? '–' : `${fmt(contractM3(c), 1)}<span class="sub">${fmt(c.bales, 0)} kiện</span>` },
                { title: 'Đã nhận m³', num: true, render: ({ c }) => { const got = contractReceivedM3(c), v = contractM3(c); return `${fmt(got, 1)}<span class="sub">${contractReceipts(c).length} lô${v ? ` · ${fmt(got / v * 100, 0)}%` : ''}</span>`; } },
                { title: 'Hộ', num: true, render: ({ c }) => isTrader(getSupplier(c.supplierId)) ? `${(c.farmerIds || []).length}` : '–' },
                { title: 'Hồ sơ', render: ({ a }) => { const top = a.issues.find(i => i.level === a.level); return levelPill(a.level) + (top ? `<span class="sub">${esc(top.msg)}</span>` : ''); } },
                { title: '', render: ({ c }) => `<div class="d-flex gap-1"><button class="btn btn-sm btn-light btn-icon" title="Chi tiết" aria-label="Chi tiết" onclick="showContract('${c.id}')"><i class="fa fa-eye"></i></button><button class="btn btn-sm btn-light btn-icon" aria-label="Sửa ${esc(c.no)}" onclick="contractModal('${c.id}')"><i class="fa fa-pen"></i></button></div>` }
            ], rows, 'Chưa có hợp đồng. Lập hợp đồng mua trước khi tiếp nhận lô hàng.'), '', 'panel-flush');
    });
}
