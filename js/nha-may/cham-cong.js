/**
 * PHÂN HỆ CHẤM CÔNG & NHÂN SỰ XƯỞNG GỖ (Tham khảo chuẩn mô hình quản trị lao động Web_VrgVietLao)
 */
let attendanceView = { tab: 'attendance', month: '2026-11', dept: '', search: '' };

function page_attendance() {
    attendanceView.tab = new URLSearchParams(location.search).get('tab') === 'workers' ? 'workers' : 'attendance';
    startPage('cham-cong-nhan-su', {
        title: attendanceView.tab === 'workers' ? 'Nhân sự' : 'Chấm công',
        actions: `<button class="btn btn-sm btn-primary me-1" onclick="openQuickAttendanceModal()"><i class="fa fa-calendar-check me-1"></i>Điểm danh</button><button class="btn btn-sm btn-outline-theme" onclick="openAddWorkerModal()"><i class="fa fa-user-plus me-1"></i>Thêm nhân sự</button>`
    }, root => {
        const workers = DB.workers || [];
        const attendanceList = DB.attendance || [];
        const f = attendanceView;

        // KPI
        const totalWorkers = workers.length;
        const activeWorkers = workers.filter(w => w.status === 'ACTIVE').length;
        const eudrTrainedCount = workers.filter(w => w.eudrTrained).length;
        
        // Count today's attendance (assume today is Nov 5)
        const todayDay = 5;
        let todayPresent = 0, todayLeave = 0, todayStudy = 0;
        attendanceList.forEach(a => {
            const sym = (a.days && a.days[todayDay]) || 'X';
            if (sym === 'X') todayPresent++;
            else if (sym === 'PN' || sym === 'KL' || sym === 'Ô') todayLeave++;
            else if (sym === 'H') todayStudy++;
        });

        const kpiHtml = `
            <div class="row g-2 mb-3">
                <div class="col-md-3 col-sm-6">
                    <div class="p-2.5 rounded bg-white border shadow-2xs">
                        <small class="text-muted d-block">Nhân sự</small>
                        <div class="d-flex align-items-baseline justify-content-between mt-1">
                            <h3 class="fw-bold mb-0 text-dark">${totalWorkers}</h3>
                            <span class="badge bg-primary bg-opacity-10 text-primary">5 phân xưởng</span>
                        </div>
                        
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-2.5 rounded bg-white border shadow-2xs">
                        <small class="text-muted d-block">Có mặt ${todayDay}/11</small>
                        <div class="d-flex align-items-baseline justify-content-between mt-1">
                            <h3 class="fw-bold mb-0 text-success">${todayPresent} <span class="fs-6 fw-normal text-muted">/ ${totalWorkers}</span></h3>
                            <span class="badge bg-success bg-opacity-10 text-success">${((todayPresent/totalWorkers)*100).toFixed(0)}% đi làm</span>
                        </div>
                        
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-2.5 rounded bg-white border shadow-2xs">
                        <small class="text-muted d-block">Vắng</small>
                        <div class="d-flex align-items-baseline justify-content-between mt-1">
                            <h3 class="fw-bold mb-0 text-warning text-dark">${todayLeave} <span class="fs-6 fw-normal text-muted">người</span></h3>
                            <span class="badge bg-warning bg-opacity-20 text-dark">${todayLeave > 0 ? 'Phép năm (PN)' : 'Đầy đủ'}</span>
                        </div>
                        
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-2.5 rounded bg-white border shadow-2xs">
                        <small class="text-muted d-block">Đã đào tạo EUDR</small>
                        <div class="d-flex align-items-baseline justify-content-between mt-1">
                            <h3 class="fw-bold mb-0 text-primary">${eudrTrainedCount} <span class="fs-6 fw-normal text-muted">/ ${totalWorkers}</span></h3>
                            <span class="badge bg-primary bg-opacity-10 text-primary">100% Đạt</span>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;

        // Departments for filter
        const depts = [
            'Tổ bóc ván & Cắt độn',
            'Tổ sấy nhiệt & May ruột',
            'Tổ tráng keo & Ép nóng',
            'Tổ cưa 4 biên & Chà nhám KCS',
            'Trạm cân & Kho bãi',
            'Tổ cơ điện & Bảo trì'
        ];


        let tabContent = '';

        if (f.tab === 'attendance') {
            // Filter row for attendance
            const filterRow = `
                <div class="row g-2 align-items-center mb-3">
                    <div class="col-md-3 col-sm-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white fw-bold"><i class="fa fa-calendar me-1"></i>Tháng</span>
                            <select class="form-select" id="att-month" onchange="setAttendanceView('month', this.value)">
                                <option value="2026-11" selected>Tháng 11 / 2026</option>
                                <option value="2026-10">Tháng 10 / 2026</option>
                                <option value="2026-09">Tháng 09 / 2026</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white fw-bold"><i class="fa fa-sitemap me-1"></i>Phân xưởng / Tổ</span>
                            <select class="form-select" id="att-dept" onchange="setAttendanceView('dept', this.value)">
                                <option value="">-- Tất cả phân xưởng (${totalWorkers}) --</option>
                                ${depts.map(d => `<option value="${d}" ${f.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-5 col-sm-12 text-md-end">
                        <div class="d-inline-flex gap-2 flex-wrap align-items-center small p-1.5 rounded bg-light border">
                            <span class="text-muted fw-bold">Ký hiệu:</span>
                            <span><span class="badge bg-success px-1.5 py-0.5">X</span> Đi làm</span>
                            <span><span class="badge bg-primary px-1.5 py-0.5">PN</span> Phép</span>
                            <span><span class="badge bg-secondary px-1.5 py-0.5">KL</span> Không lương</span>
                            <span><span class="badge text-white px-1.5 py-0.5" style="background:#7c3aed;">H</span> Đào tạo EUDR</span>
                            <span><span class="badge bg-warning text-dark px-1.5 py-0.5">Ô</span> Ốm</span>
                            <span><span class="badge bg-light text-muted border px-1.5 py-0.5">CN</span> Chủ nhật</span>
                        </div>
                    </div>
                </div>
            `;

            // Filter attendance records
            const filteredAttendance = attendanceList.filter(a => !f.dept || a.dept === f.dept);
            const daysInMonth = 30;

            // Generate header days
            let daysHeader = '';
            for (let d = 1; d <= daysInMonth; d++) {
                const isToday = d === todayDay;
                daysHeader += `<th class="text-center p-1 ${isToday ? 'bg-primary-subtle text-primary border-primary' : ''}" style="min-width:28px; font-size:11px;" title="Ngày ${d}">${d}</th>`;
            }

            // Generate rows
            let rowsHtml = '';
            filteredAttendance.forEach((a, idx) => {
                let dayCells = '';
                let totalWork = 0, totalLeave = 0, totalTrain = 0;

                for (let d = 1; d <= daysInMonth; d++) {
                    const sym = (a.days && a.days[d]) || 'X';
                    const isToday = d === todayDay;
                    let badgeClass = 'bg-success text-white';
                    let badgeStyle = '';

                    if (sym === 'X') { totalWork++; badgeClass = 'bg-success text-white'; }
                    else if (sym === 'PN') { totalLeave++; badgeClass = 'bg-primary text-white'; }
                    else if (sym === 'KL') { totalLeave++; badgeClass = 'bg-secondary text-white'; }
                    else if (sym === 'Ô') { totalLeave++; badgeClass = 'bg-warning text-dark'; }
                    else if (sym === 'H') { totalTrain++; badgeClass = 'text-white'; badgeStyle = 'background:#7c3aed;'; }
                    else if (sym === 'CN') { badgeClass = 'bg-light text-muted border'; }

                    dayCells += `
                        <td class="text-center p-0.5 ${isToday ? 'bg-primary-subtle' : ''}">
                            <span class="badge ${badgeClass} p-1" style="font-size:10px; width:22px; ${badgeStyle}" title="Ngày ${d}: ${sym}">${sym}</span>
                        </td>
                    `;
                }

                const attendanceRate = ((totalWork / (totalWork + totalLeave || 1)) * 100).toFixed(0);

                rowsHtml += `
                    <tr>
                        <td class="text-center small">${idx + 1}</td>
                        <td class="small font-monospace fw-bold text-primary">${esc(a.workerCode)}</td>
                        <td class="small fw-semibold text-nowrap">${esc(a.workerName)}</td>
                        <td class="small text-muted text-nowrap">${esc(a.dept)}</td>
                        ${dayCells}
                        <td class="text-center fw-bold text-success small">${totalWork}</td>
                        <td class="text-center text-muted small">${totalLeave}</td>
                        <td class="text-center text-purple small fw-bold" style="color:#7c3aed;">${totalTrain}</td>
                        <td class="text-center small"><span class="badge ${attendanceRate >= 90 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}">${attendanceRate}%</span></td>
                    </tr>
                `;
            });

            tabContent = `
                ${filterRow}
                <div class="card border-0 shadow-sm">
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle mb-0" style="font-size:12px;">
                            <thead class="table-light">
                                <tr>
                                    <th class="text-center" style="width:36px;">STT</th>
                                    <th style="min-width:80px;">Mã NV</th>
                                    <th style="min-width:140px;">Họ và tên</th>
                                    <th style="min-width:140px;">Tổ / Xưởng</th>
                                    ${daysHeader}
                                    <th class="text-center text-success" title="Tổng công đi làm">Công</th>
                                    <th class="text-center text-muted" title="Nghỉ phép/KL">Nghỉ</th>
                                    <th class="text-center text-purple" title="Đào tạo EUDR">Học</th>
                                    <th class="text-center" title="Tỷ lệ chuyên cần">Tỷ lệ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml || '<tr><td colspan="38" class="text-center text-muted py-3">Không tìm thấy bản ghi chấm công</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            // Tab 2: Worker Profile
            const filterWorkers = workers.filter(w => (!f.dept || w.dept === f.dept) && (!f.search || w.name.toLowerCase().includes(f.search.toLowerCase()) || w.code.toLowerCase().includes(f.search.toLowerCase()) || w.cccd.includes(f.search)));
            
            const workerFilterRow = `
                <div class="row g-2 align-items-center mb-3">
                    <div class="col-md-4">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white"><i class="fa fa-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tìm theo tên, mã NV, CCCD..." value="${esc(f.search)}" onchange="setAttendanceView('search', this.value)">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white"><i class="fa fa-filter"></i></span>
                            <select class="form-select" onchange="setAttendanceView('dept', this.value)">
                                <option value="">-- Tất cả phân xưởng (${totalWorkers}) --</option>
                                ${depts.map(d => `<option value="${d}" ${f.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <button class="btn btn-sm btn-primary" onclick="openAddWorkerModal()"><i class="fa fa-user-plus me-1"></i>Thêm nhân sự</button>
                    </div>
                </div>
            `;

            const workerRowsHtml = filterWorkers.map((w, idx) => `
                <tr>
                    <td class="text-center small">${idx + 1}</td>
                    <td class="font-monospace fw-bold small text-primary">${esc(w.code)}</td>
                    <td>
                        <strong class="d-block small text-dark">${esc(w.name)}</strong>
                        <small class="text-muted"><i class="fa fa-id-card me-1"></i>CCCD: ${esc(w.cccd)}</small>
                    </td>
                    <td class="small">
                        <div class="fw-semibold">${esc(w.dept)}</div>
                        <small class="text-secondary">${esc(w.position)}</small>
                    </td>
                    <td class="small text-muted">${esc(w.startDate)}</td>
                    <td class="small text-center">
                        ${w.eudrTrained ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="fa fa-certificate me-1 text-warning"></i>Đã đào tạo</span><small class="d-block text-muted" style="font-size:10px;">${esc(w.trainDate || '2026-09-10')}</small>` : `<span class="badge bg-danger-subtle text-danger">Chưa đào tạo</span>`}
                    </td>
                    <td class="small text-muted font-monospace">${esc(w.phone)}</td>
                    <td class="small text-center"><span class="badge bg-success bg-opacity-10 text-success">Đang làm việc</span></td>
                    <td class="text-center">
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn btn-xs btn-outline-primary" title="In thẻ nhân viên QR" onclick="printWorkerBadge('${w.id}')"><i class="fa fa-qrcode"></i></button>
                            <button class="btn btn-xs btn-outline-secondary" title="Sửa thông tin" onclick="editWorkerModal('${w.id}')"><i class="fa fa-pen"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');

            tabContent = `
                ${workerFilterRow}
                <div class="card border-0 shadow-sm">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0" style="font-size:13px;">
                            <thead class="table-light">
                                <tr>
                                    <th class="text-center" style="width:36px;">STT</th>
                                    <th>Mã NV</th>
                                    <th>Họ và tên / CCCD</th>
                                    <th>Phân xưởng / Chức vụ</th>
                                    <th>Ngày vào làm</th>
                                    <th class="text-center">Đào tạo EUDR</th>
                                    <th>Số điện thoại</th>
                                    <th class="text-center">Trạng thái</th>
                                    <th class="text-center" style="width:80px;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${workerRowsHtml || '<tr><td colspan="9" class="text-center text-muted py-3">Không có nhân sự phù hợp</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        root.innerHTML = kpiHtml + tabContent;
    });
}

function setAttendanceTab(tab) {
    attendanceView.tab = tab;
    refresh();
}

function setAttendanceView(key, val) {
    attendanceView[key] = val;
    refresh();
}

function openQuickAttendanceModal() {
    const workers = DB.workers || [];
    const todayDay = 5;
    const bodyHtml = `
        
        <div class="table-responsive" style="max-height:380px;">
            <table class="table table-sm table-bordered align-middle">
                <thead class="table-light small">
                    <tr>
                        <th>Công nhân</th>
                        <th>Phân xưởng</th>
                        <th class="text-center" style="width:140px;">Trạng thái hôm nay</th>
                    </tr>
                </thead>
                <tbody>
                    ${workers.map(w => `
                        <tr>
                            <td><strong class="small">${esc(w.name)}</strong> <small class="text-muted">(${esc(w.code)})</small></td>
                            <td class="small text-muted">${esc(w.dept)}</td>
                            <td>
                                <select class="form-select form-select-xs" name="status_${w.id}">
                                    <option value="X" selected>X - Đi làm</option>
                                    <option value="PN">PN - Phép năm</option>
                                    <option value="KL">KL - Không lương</option>
                                    <option value="H">H - Đào tạo EUDR</option>
                                    <option value="Ô">Ô - Nghỉ ốm</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    openModal({
        title: 'Điểm danh 05/11/2026',
        size: 'modal-md',
        body: bodyHtml,
        onSubmit: () => {
            toast('Đã lưu dữ liệu điểm danh ca hôm nay thành công!', 'success');
            refresh();
        }
    });
}

function openAddWorkerModal() {
    const depts = [
        'Tổ bóc ván & Cắt độn',
        'Tổ sấy nhiệt & May ruột',
        'Tổ tráng keo & Ép nóng',
        'Tổ cưa 4 biên & Chà nhám KCS',
        'Trạm cân & Kho bãi',
        'Tổ cơ điện & Bảo trì'
    ];
    const newCode = 'MS:2024' + String((DB.workers.length + 1)).padStart(2, '0');
    openModal({
        title: 'Thêm nhân sự',
        size: 'modal-md',
        body: `
            <div class="row g-2">
                ${field('Mã nhân viên', 'code', newCode, { required: true, col: 6 })}
                ${field('Số CCCD/CMND', 'cccd', '', { required: true, col: 6 })}
                ${field('Họ và tên', 'name', '', { required: true, col: 12 })}
                ${field('Phân xưởng / Tổ', 'dept', depts[0], { type: 'select', options: depts, col: 6 })}
                ${field('Vị trí chuyên môn', 'position', 'Công nhân vận hành', { required: true, col: 6 })}
                ${field('Ngày vào làm', 'startDate', todayISO(), { type: 'date', col: 6 })}
                ${field('Số điện thoại', 'phone', '0912 ', { col: 6 })}
                <div class="col-12 mt-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="eudrTrained" id="eudrTrainedChk" checked>
                        <label class="form-check-label small fw-semibold" for="eudrTrainedChk">
                            Đã đào tạo EUDR
                        </label>
                    </div>
                </div>
            </div>
        `,
        onSubmit: data => {
            const newWorker = {
                id: 'NV-' + String(DB.workers.length + 1).padStart(2, '0'),
                code: data.code,
                name: data.name,
                cccd: data.cccd,
                dept: data.dept,
                position: data.position,
                startDate: data.startDate,
                phone: data.phone,
                eudrTrained: !!data.eudrTrained,
                trainDate: todayISO(),
                status: 'ACTIVE'
            };
            DB.workers.push(newWorker);
            const days = {};
            for (let d = 1; d <= 30; d++) days[d] = (d + 6) % 7 === 0 ? 'CN' : 'X';
            DB.attendance.push({
                workerId: newWorker.id,
                workerCode: newWorker.code,
                workerName: newWorker.name,
                dept: newWorker.dept,
                month: '2026-11',
                days
            });
            saveDB();
            toast('Đã thêm nhân sự ' + newWorker.name + ' vào hệ thống!', 'success');
            refresh();
        }
    });
}

function printWorkerBadge(workerId) {
    const w = DB.workers.find(x => x.id === workerId);
    if (!w) return;
    showTag('THẺ CÔNG NHÂN XƯỞNG GỖ ECOTECH2A', w.code, [
        ['Họ tên', w.name],
        ['Mã nhân viên', w.code],
        ['Phân xưởng', w.dept],
        ['Vị trí', w.position],
        ['Chứng chỉ EUDR', w.eudrTrained ? 'ĐÃ ĐÀO TẠO' : 'CHƯA ĐẠT'],
        ['Ngày cấp', w.trainDate || '2026-09-10']
    ]);
}

function editWorkerModal(workerId) {
    const w = DB.workers.find(x => x.id === workerId);
    if (!w) return;
    const depts = [
        'Tổ bóc ván & Cắt độn',
        'Tổ sấy nhiệt & May ruột',
        'Tổ tráng keo & Ép nóng',
        'Tổ cưa 4 biên & Chà nhám KCS',
        'Trạm cân & Kho bãi',
        'Tổ cơ điện & Bảo trì'
    ];
    openModal({
        title: 'Sửa hồ sơ: ' + w.name,
        size: 'modal-md',
        body: `
            <div class="row g-2">
                ${field('Mã nhân viên', 'code', w.code, { required: true, col: 6 })}
                ${field('Số CCCD/CMND', 'cccd', w.cccd, { required: true, col: 6 })}
                ${field('Họ và tên', 'name', w.name, { required: true, col: 12 })}
                ${field('Phân xưởng / Tổ', 'dept', w.dept, { type: 'select', options: depts, col: 6 })}
                ${field('Vị trí chuyên môn', 'position', w.position, { required: true, col: 6 })}
                ${field('Ngày vào làm', 'startDate', w.startDate, { type: 'date', col: 6 })}
                ${field('Số điện thoại', 'phone', w.phone, { col: 6 })}
                <div class="col-12 mt-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="eudrTrained" id="eudrTrainedChkEdit" ${w.eudrTrained ? 'checked' : ''}>
                        <label class="form-check-label small fw-semibold" for="eudrTrainedChkEdit">
                            Đã đào tạo EUDR
                        </label>
                    </div>
                </div>
            </div>
        `,
        onSubmit: data => {
            w.code = data.code;
            w.cccd = data.cccd;
            w.name = data.name;
            w.dept = data.dept;
            w.position = data.position;
            w.startDate = data.startDate;
            w.phone = data.phone;
            w.eudrTrained = !!data.eudrTrained;
            saveDB();
            toast('Đã cập nhật hồ sơ ' + w.name, 'success');
            refresh();
        }
    });
}
