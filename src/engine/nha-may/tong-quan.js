import {
    poIsImport,
} from '../thu-mua/lenh-mua.js';
import {
    DB,
    getPlot,
    getReceipt,
    getSupplier,
    logAction,
    receiptM3,
    saveDB,
    todayISO,
    verifyAudit,
    approveReceipt,
    assessReceipt,
    orderPlots,
    orderReady,
    palletM3,
    palletOrder,
    receiptStatus,
    receiptStock,
    reconcile,
    requiredDocs,
    sum,
    uniq,
    woDone,
    orderIsEudr,
} from '../shared/core.js';
import {
    esc,
    fmt,
    openModal,
    pill,
    startPage,
    toast,
    guarded,
} from '../shared/navigation.js';

/** 14. Bàn làm việc Nhà Máy (index.html) - Tổng quan chuỗi cung ứng */
export function page_factory_dashboard() {
    startPage('dashboard', {
        title: 'Thống kê',
        actions: ''
    }, root => {
        // Compute 5 KPIs
        const lots = DB.receipts || [];
        const statusOf = receiptStatus;
        const passLots = lots.filter(r => statusOf(r) === 'PASS').length;
        const pendingLots = lots.filter(r => statusOf(r) === 'PENDING').length;
        const failLots = lots.filter(r => statusOf(r) === 'FAIL').length;
        const round1 = n => Math.round(n * 10) / 10;
        const unallocatedRawM3 = round1(sum(lots, receiptStock));
        const workOrdersDone = DB.workOrders.filter(woDone).length;
        const workOrdersRunning = DB.workOrders.length - workOrdersDone;
        const unsold = DB.pallets.filter(p => !palletOrder(p.id));
        const finishedGoodsStockM3 = round1(sum(unsold, palletM3));
        const readyOrdersCount = DB.orders.length;

        // 5 KPI cards
        const kpiRowHtml = `
            <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Lô nguyên liệu</div>
                        <div class="kpi-v2-val">${lots.length}</div>
                        <div class="kpi-v2-sub">
                            <span class="dot-indicator dot-pass">●</span> <span class="fw-medium">${passLots} đạt</span> &nbsp;
                            <span class="dot-indicator dot-warn">●</span> <span class="fw-medium">${pendingLots}</span> &nbsp;
                            <span class="dot-indicator dot-fail">●</span> <span class="fw-medium">${failLots}</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Lệnh mua</div>
                        <div class="kpi-v2-val">${DB.purchaseOrders.length}</div>
                        <div class="kpi-v2-sub text-muted">${DB.purchaseOrders.filter(poIsImport).length} nhập khẩu</div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Tồn nguyên liệu</div>
                        <div class="kpi-v2-val">${unallocatedRawM3}</div>
                        <div class="kpi-v2-sub text-muted">m³ chưa đưa vào sản xuất</div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Lệnh đang sản xuất</div>
                        <div class="kpi-v2-val">${workOrdersRunning}</div>
                        <div class="kpi-v2-sub text-muted">${workOrdersDone} lệnh đã hoàn thành</div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Tồn thành phẩm</div>
                        <div class="kpi-v2-val">${finishedGoodsStockM3}</div>
                        <div class="kpi-v2-sub text-muted">m³ sẵn sàng xuất · ${readyOrdersCount} đơn hàng</div>
                    </div>
                </div>
            </div>
        `;

        // Actionable lots (lots that have issues)
        const actionableLots = lots.filter(r => statusOf(r) !== 'PASS');
        const issuesHtml = actionableLots.length ? actionableLots.map(r => {
            const isPending = statusOf(r) === 'PENDING';
            const badgeClass = isPending ? 'badge-status-warn' : 'badge-status-fail';
            const badgeText = isPending ? '● Cần bổ sung' : '● Không đạt';
            const supplier = getSupplier(r.supplierId);
            const supName = supplier ? supplier.name : (r.supplierName || 'Nhà cung cấp');
            const firstIssue = assessReceipt(r).factors.find(f => f.level !== 'LOW');
            const reasonText = `${supName} · ${firstIssue ? firstIssue.msg : 'Chờ Tuân thủ ký duyệt'}`;
            return `
                <div class="lot-issue-card p-3 border rounded-2 bg-white">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="code text-dark">${esc(r.id)}</strong>
                        <span class="badge-status-pill ${badgeClass}">${badgeText}</span>
                    </div>
                    <p class="text-muted small mb-2 lh-sm">${esc(reasonText)}</p>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:11.5px; border-radius:4px;" onclick="resolveLotModal('${r.id}')">
                        Bổ sung hồ sơ
                    </button>
                </div>
            `;
        }).join('') : `
            <div class="p-3 text-center text-muted small bg-light rounded-2">
                <i class="fa fa-circle-check text-success me-1"></i>Không có lô cần xử lý
            </div>
        `;

        // Middle row (Mass balance ~65% + Actionable lots ~35%)
        const middleRowHtml = `
            <div class="row g-3 mb-3">
                <div class="col-lg-8">
                    <div class="card h-100 border-0 shadow-sm p-3 rounded-3" style="background:#fff;">
                        <h3 class="h6 mb-3 fw-bold text-dark">Khối lượng theo loài (m³)</h3>
                        <div class="mass-balance-list d-flex flex-column gap-3">
                            ${uniq(lots.map(r => r.species)).map((species, i) => {
                                const total = sum(lots.filter(r => r.species === species), receiptM3);
                                const stock = sum(lots.filter(r => r.species === species), receiptStock);
                                const used = total - stock;
                                const name = (DB.config.species.find(x => x.scientific === species) || {}).common || species;
                                const usedCls = ['bg-cs-used', 'bg-bd-used'][i % 2];
                                const stockCls = ['bg-cs-stock', 'bg-bd-stock'][i % 2];
                                return `<div class="mb-item">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="fw-medium text-dark small">${esc(name)}</span>
                                        <span class="text-muted small">${fmt(used)} / ${fmt(total)} m³</span>
                                    </div>
                                    <div class="mass-progress-track">
                                        <div class="mass-progress-bar ${usedCls}" style="width: ${total ? used / total * 100 : 0}%;" title="Đã dùng: ${fmt(used)} m³"></div>
                                        <div class="mass-progress-bar ${stockCls}" style="width: ${total ? stock / total * 100 : 0}%;" title="Còn tồn: ${fmt(stock)} m³"></div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                        <div class="mt-4 pt-2 text-muted small fst-italic">
                            Đậm: đã dùng · Nhạt: còn tồn
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card h-100 border-0 shadow-sm p-3 rounded-3" style="background:#fff;">
                        <h3 class="h6 mb-3 fw-bold text-dark">Lô cần xử lý</h3>
                        <div class="lot-issue-list d-flex flex-column gap-3">
                            ${issuesHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bottom Card: Nhật ký hoạt động
        const auditRows = DB.audit.slice(-5).reverse();

        const auditHtml = `
            <div class="card border-0 shadow-sm p-3 rounded-3 mb-3" style="background:#fff;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h6 mb-0 fw-bold text-dark">Nhật ký hoạt động</h3>
                    <button class="btn btn-sm btn-outline-secondary py-1 px-3" onclick="checkDataIntegrity()" style="border-radius:4px; font-size:12.5px;">
                        Kiểm tra toàn vẹn
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-borderless table-sm mb-0 align-middle small text-muted">
                        <tbody>
                            ${auditRows.map(a => `
                                <tr class="border-top">
                                    <td style="width: 180px; color: #495057;">${esc(String(a.at).slice(0, 16).replace('T', ' '))}</td>
                                    <td style="width: 140px; color: #495057;">${esc(a.role)}</td>
                                    <td style="color: #495057;">${esc(a.detail || a.action)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        root.innerHTML = kpiRowHtml + middleRowHtml + auditHtml;
    });
}

/** Bổ sung hồ sơ: chỉ thêm chứng từ thật rồi chấm lại, luật EUDR không có đường tắt. */
window.resolveLotModal = function(lotId) {
    const r = getReceipt(lotId);
    if (!r) return;
    const sup = getSupplier(r.supplierId);
    const issues = assessReceipt(r).factors.filter(f => f.level !== 'LOW');
    const missing = requiredDocs(sup, r).filter(d => !r.docs.includes(d));
    openModal({
        title: `Bổ sung hồ sơ: ${r.id}`,
        size: 'modal-lg',
        submitText: 'Lưu và chấm lại',
        body: `<div class="small text-muted mb-2">${esc(sup ? sup.name : '')} · <i>${esc(r.species)}</i> · ${fmt(receiptM3(r))} m³ · Ô ${esc(r.bay)}</div>
            <ul class="check-list mb-3">${issues.map(f => `<li><i class="fa fa-circle-xmark no"></i><div><b>${esc(f.name)}</b><small>${esc(f.msg)}</small></div></li>`).join('') || '<li>Chờ Tuân thủ ký duyệt</li>'}</ul>
            ${missing.length ? `<label class="form-label">Chứng từ đã nhận thêm</label><div class="pick-list">${missing.map(d => `<label><input class="form-check-input" type="checkbox" name="docs" value="${esc(d)}"><span>${esc(d)}</span></label>`).join('')}</div>` : ''}`,
        onSubmit: (data, fd) => guarded('approve', () => {
            r.docs.push(...fd.getAll('docs'));
            const { level, factors } = assessReceipt(r);
            if (level === 'LOW') {
                approveReceipt(r, 'Trưởng ban Tuân thủ', 'Đã bổ sung đủ hồ sơ');
                r.done = true;
                toast(`Lô ${r.id} đã Đạt`);
            } else {
                logAction(r.id, 'Bổ sung hồ sơ', fd.getAll('docs').join(', ') || 'Không có chứng từ mới');
                toast(`Lô ${r.id} chưa đạt: ${factors.find(f => f.level !== 'LOW').msg}`, 'err');
            }
            refresh();
        })
    });
};

/** Kiểm tra toàn vẹn nhật ký và số liệu. */
window.checkDataIntegrity = function() {
    const audit = verifyAudit();
    const badForest = DB.orders.filter(o => o.status >= 1 && orderIsEudr(o)).flatMap(orderPlots).filter(p => !p.forest || p.forest.result !== 'CLEAR');
    const overRun = DB.workOrders.filter(w => w.finishedQty && reconcile(w).overRun);
    const failedOrders = DB.orders.filter(o => o.status >= 1 && !orderReady(o));
    const rows = [
        ['Nhật ký', audit.ok ? `${audit.count} bản ghi` : `Sai lệch tại bản ghi ${audit.index + 1}`, audit.ok ? 'PASS' : 'FAIL'],
        ['Mốc 31/12/2020', badForest.length ? `${badForest.length} thửa cần xử lý` : 'Đạt', badForest.length ? 'FAIL' : 'PASS'],
        ['Khối lượng', overRun.length ? `Vượt: ${overRun.map(w => w.id).join(', ')}` : `Tồn ${fmt(sum(DB.receipts, receiptStock))} m³`, overRun.length ? 'FAIL' : 'PASS'],
        ['DDS', failedOrders.length ? `${failedOrders.length} đơn thiếu dữ liệu` : `${DB.orders.length} đơn đủ dữ liệu`, failedOrders.length ? 'FAIL' : 'PASS']
    ];
    openModal({
        title: 'Kiểm tra toàn vẹn',
        body: `<table class="table table-sm mb-0"><tbody>${rows.map(x => `<tr><td class="text-muted">${esc(x[0])}</td><td>${esc(x[1])}</td><td class="text-end">${pill(x[2])}</td></tr>`).join('')}</tbody></table>`
    });
};
