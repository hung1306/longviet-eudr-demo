import {
    newBtn,
    supplierName,
} from '../nha-may/san-xuat.js';
import {
    bindIntake,
    receiptForm,
} from '../nha-may/tiep-nhan-don-hang.js';
import {
    DB,
    RESULT_LABEL,
    SOURCE_LABEL,
    SUPPLIER_KINDS,
    assessContract,
    assessDossier,
    byId,
    dossierStage,
    getContract,
    getSupplier,
    logAction,
    supplierKind,
    todayISO,
} from '../shared/core.js';
import {
    card,
    esc,
    iconBtn,
    field,
    fmt,
    guarded,
    levelPill,
    openModal,
    pill,
    riskBox,
    startPage,
    table,
    tag,
    toast,
} from '../shared/navigation.js';

/**
 * Phân hệ Thu mua: đánh giá rủi ro từng hồ sơ chào bán (chuyến hàng) trước khi mua.
 * Chỉ hồ sơ Đạt được xác nhận mua; hồ sơ đã xác nhận mới hiện ở Nhà máy › Tiếp nhận.
 */
export const dossierFilter = { view: 'REVIEW', result: '' };
export function setDossierFilter(key, value) { dossierFilter[key] = value; refresh(); }
export function resetDossierViews() { Object.assign(dossierFilter, { view: 'REVIEW', result: '' }); }

const STAGE_LABEL = { REVIEW: 'Đang đánh giá', CONFIRMED: 'Đã xác nhận mua · chờ nhà máy nhận', RECEIVED: 'Nhà máy đã tiếp nhận', REJECTED: 'Không mua' };
const RESULT_PILL = { PASS: 'PASS', PENDING: 'MEDIUM', FAIL: 'FAIL' };
const kindOf = s => (SUPPLIER_KINDS.find(k => k[0] === supplierKind(s)) || [])[1] || '';
const getDossier = id => byId(DB.scaleTickets, id);

const FIELDS = ['supplierId', 'contractId', 'poId', 'plate', 'date', 'workshop', 'trip', 'gross', 'tare', 'sourceCategory', 'species', 'pkgCount', 'pkgM3', 'moisture', 'virginPct', 'note'];
function readDossier(data, fd) {
    const out = {};
    FIELDS.forEach(k => { out[k] = data[k]; });
    ['trip', 'gross', 'tare', 'pkgCount', 'pkgM3'].forEach(k => { out[k] = +data[k] || 0; });
    out.moisture = data.moisture === '' ? null : +data.moisture;
    out.virginPct = data.virginPct === '' ? undefined : +data.virginPct;
    out.rawType = data.inputType;
    out.plotIds = fd.getAll('plotIds');
    out.docs = fd.getAll('docs');
    return out;
}

const dossierBody = t => `<div class="ct-layout"><div>${receiptForm(t)}</div><aside class="ct-side"><div data-gate></div><div class="note-box mt-2 mb-0 small">Chỉ hồ sơ <b>Đạt</b> mới được xác nhận mua và chuyển sang nhà máy. Hồ sơ Cần bổ sung: bổ sung rồi lưu lại để chấm lại.</div></aside></div>`;

/** Xem, bổ sung một hồ sơ; hoặc lập hồ sơ mới. */
export function dossierModal(id) {
    const t = id ? getDossier(id) : null;
    if (t && dossierStage(t) !== 'REVIEW') { showDossier(id); return; }
    const m = openModal({
        title: t ? `Hồ sơ ${t.id} · xe ${t.plate}` : 'Lập hồ sơ thu mua mới', size: 'modal-xl', submitText: 'Lưu và chấm lại',
        body: dossierBody(t || { date: todayISO(), pkgCount: 4, pkgM3: 1.6256 }),
        onSubmit: (data, fd) => guarded('supplier', () => {
            const rec = readDossier(data, fd);
            if (rec.gross <= rec.tare) throw new Error('Khối lượng tổng phải lớn hơn bì xe');
            let target = t;
            if (!target) {
                const ymd = rec.date.slice(2).replace(/-/g, '');
                const no = DB.scaleTickets.length + 1;
                target = { id: `SC-${ymd}-${String(no).padStart(2, '0')}`, receiptId: '', purchase: null, expectedKg: rec.gross - rec.tare, phone: '', batchCode: '' };
                DB.scaleTickets.push(target);
            }
            Object.assign(target, rec);
            const a = assessDossier(target);
            logAction(target.id, t ? 'Bổ sung hồ sơ thu mua' : 'Lập hồ sơ thu mua', `${supplierName(target.supplierId)}; ${RESULT_LABEL[a.result]}`);
            toast(`Hồ sơ ${target.id}: ${RESULT_LABEL[a.result]}`, a.result === 'FAIL' ? 'err' : 'ok');
            refresh();
        })
    });
    bindIntake(m.el, t || {}, { dossier: true });
}

/** Xem hồ sơ đã xác nhận / đã nhận / không mua (chỉ đọc). */
export function showDossier(id) {
    const t = getDossier(id), a = assessDossier(t), c = getContract(t.contractId);
    openModal({
        title: `Hồ sơ ${t.id} · xe ${t.plate}`, size: 'modal-lg',
        body: `<div class="lot-head">${pill(RESULT_PILL[a.result], RESULT_LABEL[a.result])}<span>${esc(STAGE_LABEL[dossierStage(t)])}</span></div>
            <table class="table table-sm"><tbody>${[
                ['Nhà cung cấp', `${supplierName(t.supplierId)} · ${kindOf(getSupplier(t.supplierId))}`], ['Hợp đồng', c ? c.no : '–'], ['Nguồn', SOURCE_LABEL[t.sourceCategory]],
                ['Nguyên liệu', `${t.rawType || ''}, ${t.species || ''}`], ['Khối lượng', `${fmt(t.gross - t.tare, 0)} kg · ${t.pkgCount} kiện`], ['Thửa', (t.plotIds || []).join(', ') || '–'],
                ['Chứng từ', (t.docs || []).join(', ') || '–'],
                ...(t.purchase ? [['Xác nhận mua', `${t.purchase.by}, ${t.purchase.at}`]] : []), ...(t.rejected ? [['Không mua', `${t.rejected.by}, ${t.rejected.at}: ${t.rejected.reason}`]] : []), ...(t.receiptId ? [['Phiếu nhà máy', t.receiptId]] : [])
            ].map(([k, v]) => `<tr><td class="text-muted" style="width:140px">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
            ${riskBox('Kết quả đánh giá', a.level, a.issues, 'Đủ điều kiện mua.')}`
    });
}

/** Chỉ hồ sơ Đạt: xác nhận mua, chuyển sang Nhà máy › Tiếp nhận. */
export function confirmPurchase(id) {
    const t = getDossier(id), a = assessDossier(t);
    if (a.result !== 'PASS') { toast(`Hồ sơ ${id} ${RESULT_LABEL[a.result]}, chưa xác nhận mua được`, 'err'); return; }
    openModal({
        title: `Xác nhận mua: ${id} · xe ${t.plate}`, submitText: 'Xác nhận mua',
        body: `<div class="note-box ok">${esc(supplierName(t.supplierId))} · ${fmt(t.gross - t.tare, 0)} kg · hợp đồng ${esc((getContract(t.contractId) || {}).no || '')}. Sau khi xác nhận, xe chuyển sang <b>Nhà máy › Tiếp nhận</b>.</div><div class="row g-2">${field('Người xác nhận (Thu mua)', 'by', '', { required: true, col: 12 })}</div>`,
        onSubmit: data => guarded('supplier', () => {
            t.purchase = { by: data.by, at: todayISO() };
            logAction(id, 'Xác nhận mua', `${data.by}; chuyển nhà máy tiếp nhận`);
            toast(`Đã xác nhận mua ${id}, chuyển sang Nhà máy › Tiếp nhận`);
            refresh();
        })
    });
}

export function rejectDossier(id) {
    const t = getDossier(id), a = assessDossier(t);
    openModal({
        title: `Không mua: ${id} · xe ${t.plate}`, submitText: 'Ghi nhận không mua',
        body: `${riskBox('Kết quả đánh giá', a.level, a.issues, '')}<div class="row g-2 mt-1">${field('Người quyết định', 'by', '', { required: true })}${field('Báo bên bán', 'notify', supplierName(t.supplierId), { required: true })}${field('Lý do', 'reason', (a.issues[0] || {}).msg || '', { type: 'textarea', col: 12, required: true })}</div>`,
        onSubmit: data => guarded('supplier', () => {
            t.rejected = { at: todayISO(), by: data.by, reason: data.reason, notify: data.notify };
            logAction(id, 'Không mua', `${data.reason}; báo ${data.notify}`);
            refresh();
        })
    });
}

export function page_procure() {
    startPage('tm-ho-so', { title: 'Đánh giá rủi ro hồ sơ tiếp nhận thu mua', actions: newBtn('Lập hồ sơ', 'dossierModal()') }, root => {
        const f = dossierFilter;
        const all = DB.scaleTickets.map(t => ({ t, a: assessDossier(t), stage: dossierStage(t) }));
        const inView = all.filter(x => f.view === 'ALL' || x.stage === f.view);
        const rows = inView.filter(x => !f.result || x.a.result === f.result).sort((p, q) => (q.t.date || '').localeCompare(p.t.date || ''));
        const n = (list, key, v) => list.filter(x => x[key] === v || (key === 'a' && x.a.result === v)).length;
        const tab = (v, label) => `<button type="button" class="btn btn-sm ${f.view === v ? 'btn-dark' : 'btn-light'}" onclick="setDossierFilter('view','${v}')">${esc(label)} <span class="badge text-bg-light">${v === 'ALL' ? all.length : n(all, 'stage', v)}</span></button>`;
        const chip = (v, label, tone) => `<button type="button" class="chip-filter ${tone} ${f.result === v ? 'active' : ''}" onclick="setDossierFilter('result','${v}')">${esc(label)} <b>${v ? n(inView, 'a', v) : inView.length}</b></button>`;
        root.innerHTML = `<div class="d-flex flex-wrap gap-1 mb-2">${tab('REVIEW', 'Đang đánh giá')}${tab('CONFIRMED', 'Đã xác nhận mua')}${tab('RECEIVED', 'Nhà máy đã nhận')}${tab('REJECTED', 'Không mua')}${tab('ALL', 'Tất cả')}</div>
            <div class="d-flex flex-wrap gap-2 mb-2">${chip('', 'Tất cả', '')}${chip('PASS', 'Đạt', 'ok')}${chip('PENDING', 'Cần bổ sung', 'warn')}${chip('FAIL', 'Không đạt', 'bad')}</div>` +
            card('', table([
                { title: 'Hồ sơ', render: ({ t }) => `<span class="code">${esc(t.id)}</span><span class="sub">${esc(t.date)}</span>` },
                { title: 'Xe', render: ({ t }) => `<span class="code">${esc(t.plate)}</span><span class="sub">${esc(SOURCE_LABEL[t.sourceCategory] || '')}</span>` },
                { title: 'Nhà cung cấp', render: ({ t }) => `${esc(supplierName(t.supplierId))}<span class="sub">${esc(kindOf(getSupplier(t.supplierId)))}</span>` },
                { title: 'Hợp đồng', render: ({ t }) => { const c = getContract(t.contractId); return c ? `<span class="code">${esc(c.no)}</span> ${levelPill(assessContract(c, t.date).level)}` : pill('FAIL', 'Chưa có'); } },
                { title: 'Khối lượng', num: true, render: ({ t }) => `${fmt(t.gross - t.tare, 0)} kg<span class="sub">${t.pkgCount || 0} kiện</span>` },
                { title: 'Thửa', render: ({ t }) => (t.plotIds || []).map(tag).join('') || pill('FAIL', 'Chưa có') },
                { title: 'Kết quả', render: ({ a }) => pill(RESULT_PILL[a.result], RESULT_LABEL[a.result]) },
                { title: 'Lý do', render: ({ a }) => { const list = a.issues.filter(i => i.level !== 'NOTE'); return list.length ? list.slice(0, 2).map(i => `<span class="miss lv-${i.level.toLowerCase()}">${esc(i.msg)}</span>`).join('') + (list.length > 2 ? `<span class="sub">+${list.length - 2} mục</span>` : '') : '<span class="text-muted">Đủ điều kiện</span>'; } },
                { title: '', render: ({ t, a, stage }) => stage !== 'REVIEW'
                    ? `${iconBtn('fa-eye', 'Xem hồ sơ', `showDossier('${t.id}')`)}<span class="sub">${esc(STAGE_LABEL[stage])}</span>`
                    : `<div class="d-flex gap-1">${iconBtn(a.result === 'PASS' ? 'fa-eye' : 'fa-pen', a.result === 'PASS' ? 'Xem hồ sơ' : 'Bổ sung hồ sơ', `dossierModal('${t.id}')`)}${a.result === 'PASS' ? iconBtn('fa-check', 'Xác nhận mua', `confirmPurchase('${t.id}')`, 'btn-success') : iconBtn('fa-ban', 'Không mua', `rejectDossier('${t.id}')`, 'btn-outline-danger')}</div>` }
            ], rows, 'Không có hồ sơ'), '', 'panel-flush');
    });
}
