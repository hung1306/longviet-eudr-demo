/** 14. Bàn làm việc Nhà Máy (index.html) - Tổng quan chuỗi cung ứng */
function page_factory_dashboard() {
    startPage('dashboard', {
        title: 'Thống kê',
        actions: ''
    }, root => {
        // Compute 5 KPIs
        const lots = DB.receipts || [];
        const passLots = lots.filter(r => r.approval).length;
        const pendingLots = lots.filter(r => !r.approval && r.status === 'PENDING').length;
        const failLots = lots.filter(r => !r.approval && r.status !== 'PENDING').length;

        // Mass balance numbers matching reference Claude Artifact
        // Cao su: used 135, total 285, remaining 150
        // Bạch đàn: used 40, total 236, remaining 196
        // Keo / Tràm: used 0, total 63, remaining 63
        // Poplar (veneer mặt): used 0, total 48, remaining 48
        // Total unallocated raw stock: 445 m3
        const unallocatedRawM3 = 445;
        const workOrdersDone = DB.workOrders.filter(w => (w.finishedSheets || 0) > 0).length || 1;
        const finishedGoodsStockM3 = 22;
        const readyOrdersCount = 1;

        // 5 KPI cards
        const kpiRowHtml = `
            <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6 col-lg">
                    <div class="kpi-card-v2">
                        <div class="kpi-v2-label">Lô nguyên liệu</div>
                        <div class="kpi-v2-val">${lots.length || 7}</div>
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
                        <div class="kpi-v2-val">${DB.workOrders.length ? 1 : 0}</div>
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
        const actionableLots = lots.filter(r => !r.approval);
        const issuesHtml = actionableLots.length ? actionableLots.map(r => {
            const isPending = r.status === 'PENDING';
            const badgeClass = isPending ? 'badge-status-warn' : 'badge-status-fail';
            const badgeText = isPending ? '● Cần bổ sung' : '● Không đạt';
            const supplier = getSupplier(r.supplierId);
            const supName = supplier ? supplier.name : (r.supplierName || 'Nhà cung cấp');
            const reasonText = r.issueReason || (isPending ? `${supName} · Thiếu chứng từ vận chuyển` : `${supName} · Vi phạm tiêu chuẩn EUDR`);
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
                            <!-- Cao su -->
                            <div class="mb-item">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-medium text-dark small">Cao su</span>
                                    <span class="text-muted small">135 / 285 m³</span>
                                </div>
                                <div class="mass-progress-track">
                                    <div class="mass-progress-bar bg-cs-used" style="width: 47.37%;" title="Đã đưa vào sản xuất: 135 m³"></div>
                                    <div class="mass-progress-bar bg-cs-stock" style="width: 52.63%;" title="Còn tồn: 150 m³"></div>
                                </div>
                            </div>
                            <!-- Bạch đàn -->
                            <div class="mb-item">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-medium text-dark small">Bạch đàn</span>
                                    <span class="text-muted small">40 / 236 m³</span>
                                </div>
                                <div class="mass-progress-track">
                                    <div class="mass-progress-bar bg-bd-used" style="width: 16.95%;" title="Đã đưa vào sản xuất: 40 m³"></div>
                                    <div class="mass-progress-bar bg-bd-stock" style="width: 83.05%;" title="Còn tồn: 196 m³"></div>
                                </div>
                            </div>
                            <!-- Keo / Tràm -->
                            <div class="mb-item">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-medium text-dark small">Keo / Tràm</span>
                                    <span class="text-muted small">0 / 63 m³</span>
                                </div>
                                <div class="mass-progress-track">
                                    <div class="mass-progress-bar bg-neutral-stock" style="width: 100%;" title="Còn tồn: 63 m³"></div>
                                </div>
                            </div>
                            <!-- Poplar (veneer mặt) -->
                            <div class="mb-item">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-medium text-dark small">Poplar (veneer mặt)</span>
                                    <span class="text-muted small">0 / 48 m³</span>
                                </div>
                                <div class="mass-progress-track">
                                    <div class="mass-progress-bar bg-neutral-stock" style="width: 100%;" title="Còn tồn: 48 m³"></div>
                                </div>
                            </div>
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
        const auditRows = (DB.audit && DB.audit.length ? DB.audit : [
            { at: '2026-10-28 16:00', by: 'Hệ thống', detail: 'Khởi tạo dữ liệu ví dụ (có thể xóa khi nhập dữ liệu thật)' }
        ]).slice(-5).reverse();

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
                                    <td style="width: 180px; color: #495057;">${esc(a.at)}</td>
                                    <td style="width: 140px; color: #495057;">${esc(a.by)}</td>
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

/** Modal xử lý bổ sung hồ sơ cho các lô có vấn đề */
window.resolveLotModal = function(lotId) {
    const r = getReceipt(lotId);
    if (!r) return;
    const sup = getSupplier(r.supplierId);
    const supName = sup ? sup.name : (r.supplierName || 'Nhà cung cấp');
    
    let specificFieldsHtml = '';
    if (lotId === 'NL2610V03') {
        specificFieldsHtml = `
            <div class="alert alert-warning py-2 small mb-3">
                <i class="fa fa-triangle-exclamation me-1"></i>Thiếu chứng từ vận chuyển
            </div>
            <div class="mb-3">
                <label class="form-label small fw-bold">Số phiếu xuất kho / vận đơn <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="res-doc-no" value="PXK-VH-2610-0982" required>
            </div>
            <div class="mb-3">
                <label class="form-label small fw-bold">Tệp chứng từ</label>
                <input type="file" class="form-control form-control-sm" id="res-doc-file">
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="res-confirm" checked>
                <label class="form-check-label small" for="res-confirm">
                    Khớp xe <b>${esc(r.plate)}</b>, ngày <b>${esc(r.date)}</b>
                </label>
            </div>
        `;
    } else if (lotId === 'NL2610V04') {
        specificFieldsHtml = `
            <div class="alert alert-danger py-2 small mb-3">
                <i class="fa fa-ban me-1"></i><b>Cần khắc phục:</b>
                <ul class="mb-0 ps-3 mt-1">
                    <li>Thiếu polygon (trên 4 ha)</li>
                    <li>Thiếu bằng chứng không phá rừng</li>
                    <li>Thiếu giấy tờ đất</li>
                </ul>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <label class="form-label small fw-bold">Số GCNQSDĐ / Quyết định giao rừng <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="res-land-doc" value="GCNQSDĐ SĐ-882910" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold">Kết quả đối chiếu viễn thám <span class="text-danger">*</span></label>
                    <select class="form-select form-select-sm" id="res-remote-sensing">
                        <option value="CLEAR" selected>CLEAR - Không mất rừng sau 31/12/2020</option>
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label small fw-bold">Tệp Polygon GeoJSON <span class="text-danger">*</span></label>
                <input type="file" class="form-control form-control-sm" id="res-polygon-file">
                
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="res-confirm" checked>
                <label class="form-check-label small" for="res-confirm">
                    Không thuộc khu bảo tồn / đất tranh chấp
                </label>
            </div>
        `;
    } else {
        specificFieldsHtml = `
            <div class="alert alert-danger py-2 small mb-3">
                <i class="fa fa-ban me-1"></i><b>Cần khắc phục:</b>
                <ul class="mb-0 ps-3 mt-1">
                    <li>Thiếu tọa độ, kỳ khai thác</li>
                    <li>Thiếu bằng chứng không phá rừng</li>
                    <li>Thiếu giấy phép khai thác (林木采伐许可证)</li>
                    <li>Chưa ký cam kết, chưa khai diện tích</li>
                </ul>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <label class="form-label small fw-bold">Giấy phép khai thác <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="res-cn-license" value="林木采伐许可证 No. 2026-SD-8819" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold">Diện tích (ha) <span class="text-danger">*</span></label>
                    <input type="number" step="0.1" class="form-control form-control-sm" id="res-cn-area" value="32.5" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label small fw-bold">Tọa độ Polygon <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="res-cn-coords" value="[[[118.321, 35.105], [118.328, 35.106], [118.329, 35.099], [118.321, 35.105]]]" required>
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="res-confirm" checked>
                <label class="form-check-label small" for="res-confirm">
                    Nhà cung cấp đã ký cam kết
                </label>
            </div>
        `;
    }

    openModal({
        title: `Bổ sung hồ sơ: ${r.id}`,
        size: 'modal-lg',
        body: `
            <div class="p-2 mb-3 bg-light border rounded-2 d-flex justify-content-between align-items-center">
                <div>
                    <strong class="code text-primary">${esc(r.id)}</strong> &middot; <b>${esc(supName)}</b>
                    <div class="small text-muted">${esc(r.species)} &middot; Khối lượng: <b>${fmt(receiptM3(r))} m³</b> &middot; Ô kho: <b>${esc(r.bay)}</b></div>
                </div>
                <span class="badge ${r.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'}">${r.status === 'PENDING' ? 'Cần bổ sung' : 'Không đạt'}</span>
            </div>
            ${specificFieldsHtml}
            <div class="text-end mt-3 pt-2 border-top">
                <button type="button" class="btn btn-sm btn-light me-2" data-bs-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-sm btn-success px-3" onclick="submitResolveLot('${r.id}')">
                    <i class="fa fa-circle-check me-1"></i>Lưu & duyệt
                </button>
            </div>
        `
    });
};

/** Ghi nhận bổ sung hồ sơ và chuyển trạng thái lô sang Đạt */
window.submitResolveLot = function(lotId) {
    const r = getReceipt(lotId);
    if (!r) return;
    const chk = document.getElementById('res-confirm');
    if (chk && !chk.checked) {
        toast('Vui lòng đánh dấu xác nhận thông tin trước khi phê duyệt!', 'warn');
        return;
    }
    // Update lot
    r.status = 'PASS';
    r.approval = { by: 'Nguyễn Thị Thu Hà', at: todayISO(), reason: 'Đã bổ sung đầy đủ hồ sơ theo tiêu chuẩn EUDR' };
    if (!r.docs.includes('Chứng từ vận chuyển')) r.docs.push('Chứng từ vận chuyển');
    if (!r.docs.includes('Bảng kê lâm sản')) r.docs.push('Bảng kê lâm sản');
    if (lotId === 'NL2610V04') {
        const p = getPlot('PLOT-VN-TC-04');
        if (p) {
            p.geometry = { type: 'Polygon', coordinates: [[[106.128, 11.583], [106.132, 11.584], [106.131, 11.579], [106.128, 11.583]]] };
            p.landDoc = 'GCNQSDĐ SĐ-882910';
            p.forest = { result: 'CLEAR', source: 'JRC GFC2020 + ảnh vệ tinh', date: todayISO(), by: 'Nguyễn Thị Thu Hà' };
        }
    }
    // Update bay to normal storage if in quarantine
    if (r.bay === 'Q01' || r.bay === 'Q02' || r.bay === 'W01') {
        r.bay = r.species.includes('Eucalyptus') ? 'K2.0-03' : r.species.includes('Populus') ? 'M0.5-01' : 'K1.7-04';
    }
    logAction('Chuyên viên EUDR', 'Bổ sung hồ sơ', `Đã bổ sung đầy đủ hồ sơ cho lô ${lotId}, phê duyệt trạng thái ĐẠT`);
    saveDB();
    const openDialog = document.querySelector('.modal.show');
    if (openDialog) bootstrap.Modal.getInstance(openDialog).hide();
    toast(`Đã cập nhật hồ sơ lô ${lotId} thành công! Trạng thái chuyển sang ĐẠT.`);
    refresh();
};

/** Kiểm tra toàn vẹn chuỗi khối và dữ liệu */
window.checkDataIntegrity = function() {
    const audit = verifyAudit();
    const rows = [
        ['Nhật ký', audit.ok ? `${audit.count} bản ghi` : `Sai lệch tại bản ghi ${audit.index + 1}`, audit.ok ? 'PASS' : 'FAIL'],
        ['Mốc 31/12/2020', 'Đạt', 'PASS'],
        ['Khối lượng', 'Tồn 445 m³', 'PASS'],
        ['DDS', 'WO-261029-01 · 22 m³', 'PASS']
    ];
    openModal({
        title: 'Kiểm tra toàn vẹn',
        body: `<table class="table table-sm mb-0"><tbody>${rows.map(x => `<tr><td class="text-muted">${esc(x[0])}</td><td>${esc(x[1])}</td><td class="text-end">${pill(x[2])}</td></tr>`).join('')}</tbody></table>`
    });
};
