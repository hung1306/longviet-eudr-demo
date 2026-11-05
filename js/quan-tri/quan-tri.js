// ========================================================
// PHÂN HỆ 3: QUẢN TRỊ & MASTER DATA (ADMIN SUBSYSTEM)
// ========================================================

/** 6. Tổng quan quản trị hệ thống */
function page_admin_dashboard() {
    startPage('admin-dashboard', {
        title: 'Bàn làm việc Quản trị',
        actions: `<button class="btn btn-sm btn-light" onclick="verifySystemIntegrity()"><i class="fa fa-shield-halved me-1"></i>Xác minh chuỗi băm</button>`
    }, root => {
        const auditStatus = verifyAudit();

        const kpisHtml = `<div class="kpi-row">
            ${kpi('Danh mục loài cây', DB.speciesDetails.length + ' loài', '', 'ok')}
            ${kpi('Địa bàn hành chính', `${DB.provinces.length} tỉnh / ${DB.districts.length} huyện`, '', 'ok')}
            ${kpi('Pháp lý & Chứng chỉ', `${DB.landCertTypes.length + DB.certifications.length} danh mục`, '', 'ok')}
            ${kpi('Nhật ký', DB.audit.length + ' bản ghi', auditStatus.ok ? 'Toàn vẹn' : 'Sai lệch', auditStatus.ok ? 'ok' : 'bad')}
        </div>`;

        const quickLinksHtml = card('Danh mục', `
            <div class="row g-2 text-center">
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../quan-tri/admin-loai-cay.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-tree text-success fs-3 mb-2 d-block"></i>
                        <b>Loài cây & Giống</b>
                        <small class="text-muted d-block">${DB.speciesDetails.length} danh mục</small>
                    </a>
                </div>
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../quan-tri/admin-dia-ban.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-location-dot text-primary fs-3 mb-2 d-block"></i>
                        <b>Địa bàn hành chính</b>
                        <small class="text-muted d-block">${DB.provinces.length} tỉnh thành</small>
                    </a>
                </div>
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../quan-tri/admin-phap-ly-dat.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-certificate text-warning fs-3 mb-2 d-block"></i>
                        <b>Pháp lý & Chứng chỉ</b>
                        <small class="text-muted d-block">Sổ đỏ, FSC, PEFC</small>
                    </a>
                </div>
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../quan-tri/admin-doi-tac.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-users-gear text-info fs-3 mb-2 d-block"></i>
                        <b>Đối tác & Khách hàng</b>
                        <small class="text-muted d-block">${DB.suppliers.length} NCC, ${DB.customers.length} KH</small>
                    </a>
                </div>
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../nha-may/factory-danh-muc.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-industry text-secondary fs-3 mb-2 d-block"></i>
                        <b>Danh mục Nhà máy</b>
                        <small class="text-muted d-block">Ô kho, Máy, Vật tư</small>
                    </a>
                </div>
                <div class="col-md-2 col-sm-4 col-6">
                    <a href="../quan-tri/admin-tai-khoan.html" class="p-3 border rounded d-block text-decoration-none text-dark bg-light hover-shadow">
                        <i class="fa fa-user-shield text-danger fs-3 mb-2 d-block"></i>
                        <b>Tài khoản & Phân quyền</b>
                        <small class="text-muted d-block">${DB.accounts.length} người dùng</small>
                    </a>
                </div>
            </div>
        `);

        const recentAuditHtml = card('Nhật ký gần nhất', table([
            { title: 'Thời gian', render: e => `<small class="text-muted">${esc(e.at.slice(0, 19).replace('T', ' '))}</small>` },
            { title: 'Vai trò', render: e => `<span class="tag">${esc(e.role)}</span>` },
            { title: 'Đối tượng', render: e => `<span class="code">${esc(e.entity)}</span>` },
            { title: 'Hành động', render: e => `<b>${esc(e.action)}</b>` },
            { title: 'Chi tiết thay đổi', render: e => esc(e.detail) },
            { title: 'Mã băm móc xích', render: e => `<code class="small text-muted">${esc(e.hash)}</code>` }
        ], DB.audit.slice(-6).reverse()), '', 'panel-flush');

        root.innerHTML = kpisHtml + quickLinksHtml + recentAuditHtml;

        window.verifySystemIntegrity = function() {
            const v = verifyAudit();
            if (v.ok) toast(`Hợp lệ: ${v.count} bản ghi`);
            else toast(`Sai lệch tại bản ghi ${v.index + 1}`, 'err');
        };
    });
}

/** 7. Danh mục Loài cây & Giống gỗ lâm nghiệp (Tree & Species) */
function page_admin_loai_cay() {
    startPage('admin-loai-cay', {
        title: 'Loài cây & Giống gỗ',
        actions: newBtn('Thêm loài cây', 'addSpeciesModal()')
    }, root => {
        const tableHtml = card('', table([
            { title: 'Mã Loài', render: s => `<span class="code text-primary">${esc(s.id)}</span>` },
            { title: 'Tên thường gọi', render: s => `<b>${esc(s.common)}</b>` },
            { title: 'Tên khoa học (Scientific Name)', render: s => `<i class="text-dark fw-bold">${esc(s.scientific)}</i>` },
            { title: 'Họ thực vật', render: s => esc(s.family) },
            { title: 'Mã HS', render: s => `<span class="tag">${esc(s.hsCode)}</span>` },
            { title: 'Vị trí kết cấu ván', render: s => esc(s.role) },
            { title: 'Quốc gia nguồn gốc', render: s => esc(s.origin) },
            { title: 'Khối lượng riêng', num: true, render: s => `${s.densityKgM3} kg/m³` },
            { title: 'Rủi ro EUDR', render: s => pill(s.risk, s.risk) },
            { title: '', render: s => `<button class="btn btn-sm btn-light btn-icon" onclick="toast('Đã khóa theo quy định danh mục')"><i class="fa fa-lock text-muted"></i></button>` }
        ], DB.speciesDetails), '', 'panel-flush');

        root.innerHTML = tableHtml;

        window.addSpeciesModal = function() {
            openModal({
                title: 'Thêm loài cây',
                size: 'modal-lg',
                submitText: 'Lưu loài cây',
                body: `<div class="row g-2">
                    ${field('Mã loài', 'id', `SP-${String(DB.speciesDetails.length + 1).padStart(2,'0')}`, { required: true, col: 4 })}
                    ${field('Tên tiếng Việt', 'common', '', { required: true, col: 4 })}
                    ${field('Tên khoa học La-tinh (chuẩn EUDR)', 'scientific', '', { required: true, col: 4 })}
                    ${field('Họ thực vật (Family)', 'family', '', { col: 4 })}
                    ${field('Mã HS sản phẩm gỗ', 'hsCode', '4412.33.00', { required: true, col: 4 })}
                    ${field('Vị trí dùng trong kết cấu ván', 'role', 'Ván ruột (Core)', { type: 'select', options: ['Ván ruột (Core)', 'Ván mặt (Face/Back)', 'Ván bọc pallet'], col: 4 })}
                    ${field('Quốc gia nguồn gốc', 'origin', 'Việt Nam', { col: 6 })}
                    ${field('Khối lượng riêng (kg/m³)', 'densityKgM3', 650, { type: 'number', col: 6 })}
                </div>`,
                onSubmit: data => guarded('config', () => {
                    const newSpec = {
                        id: data.id.trim(),
                        common: data.common.trim(),
                        scientific: data.scientific.trim(),
                        family: data.family.trim(),
                        hsCode: data.hsCode.trim(),
                        role: data.role,
                        origin: data.origin.trim(),
                        densityKgM3: parseInt(data.densityKgM3) || 600,
                        risk: 'LOW'
                    };
                    DB.speciesDetails.push(newSpec);
                    DB.config.species.push({ common: newSpec.common, scientific: newSpec.scientific });
                    logAction(newSpec.id, 'Thêm loài cây', newSpec.scientific);
                    toast(`Đã thêm loài ${newSpec.common}`);
                    refresh();
                })
            });
        };
    });
}

/** 8. Danh mục Địa bàn hành chính (Province, District, Ward) */
function page_admin_dia_ban() {
    startPage('admin-dia-ban', {
        title: 'Địa bàn hành chính',
        actions: newBtn('Thêm địa bàn', 'addProvinceModal()')
    }, root => {
        let activeTab = 'province';

        const renderTabs = () => {
            const tabsHtml = `<ul class="nav nav-tabs mb-3">
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'province' ? 'active' : ''}" onclick="switchAreaTab('province')">Tỉnh / Thành phố (${DB.provinces.length})</button></li>
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'district' ? 'active' : ''}" onclick="switchAreaTab('district')">Quận / Huyện (${DB.districts.length})</button></li>
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'ward' ? 'active' : ''}" onclick="switchAreaTab('ward')">Phường / Xã (${DB.wards.length})</button></li>
            </ul>`;

            let bodyHtml = '';
            if (activeTab === 'province') {
                bodyHtml = card('', table([
                    { title: 'Mã Tỉnh', render: p => `<span class="code text-primary">${esc(p.id)}</span>` },
                    { title: 'Tên Tỉnh / Thành phố', render: p => `<b>${esc(p.name)}</b>` },
                    { title: 'Mã hành chính', render: p => `<span class="tag">${esc(p.code)}</span>` },
                    { title: 'Quốc gia', render: p => `<span class="badge bg-light text-dark border">${esc(p.country)}</span>` },
                    { title: 'Diện tích rừng lâm nghiệp', num: true, render: p => fmt(p.forestAreaHa, 0) + ' ha' },
                    { title: 'Diện tích cao su', num: true, render: p => fmt(p.rubberAreaHa, 0) + ' ha' }
                ], DB.provinces), '', 'panel-flush');
            } else if (activeTab === 'district') {
                bodyHtml = card('', table([
                    { title: 'Mã Huyện', render: d => `<span class="code text-primary">${esc(d.id)}</span>` },
                    { title: 'Tên Quận / Huyện', render: d => `<b>${esc(d.name)}</b>` },
                    { title: 'Mã hành chính', render: d => `<span class="tag">${esc(d.code)}</span>` },
                    { title: 'Thuộc Tỉnh / Thành phố', render: d => (getProvince(d.provinceId) || {}).name || d.provinceId }
                ], DB.districts), '', 'panel-flush');
            } else {
                bodyHtml = card('', table([
                    { title: 'Mã Xã', render: w => `<span class="code text-primary">${esc(w.id)}</span>` },
                    { title: 'Tên Phường / Xã', render: w => `<b>${esc(w.name)}</b>` },
                    { title: 'Mã chuẩn hành chính', render: w => `<span class="tag">${esc(w.code)}</span>` },
                    { title: 'Thuộc Quận / Huyện', render: w => (getDistrict(w.districtId) || {}).name || w.districtId }
                ], DB.wards), '', 'panel-flush');
            }

            root.innerHTML = tabsHtml + bodyHtml;
        };

        window.switchAreaTab = function(t) {
            activeTab = t;
            renderTabs();
        };

        window.addProvinceModal = function() {
            openModal({
                title: 'Thêm tỉnh/thành',
                size: 'modal-md',
                submitText: 'Lưu địa bàn',
                body: `<div class="row g-2">
                    ${field('Mã định danh', 'id', `VN-NEW`, { required: true, col: 4 })}
                    ${field('Tên Tỉnh / Thành phố', 'name', '', { required: true, col: 8 })}
                    ${field('Mã hành chính', 'code', '99', { required: true, col: 6 })}
                    ${field('Quốc gia (ISO 2)', 'country', 'VN', { required: true, col: 6 })}
                </div>`,
                onSubmit: data => guarded('config', () => {
                    DB.provinces.push({ id: data.id.trim(), name: data.name.trim(), code: data.code.trim(), country: data.country.trim(), forestAreaHa: 10000, rubberAreaHa: 5000 });
                    toast(`Đã thêm ${data.name}`);
                    renderTabs();
                })
            });
        };

        renderTabs();
    });
}

/** 9. Danh mục Pháp lý đất & Chứng chỉ rừng */
function page_admin_phap_ly_dat() {
    startPage('admin-phap-ly-dat', {
        title: 'Pháp lý đất & Chứng chỉ rừng',
        actions: newBtn('Thêm chứng chỉ', 'addCertModal()')
    }, root => {
        const landTypesHtml = card('Loại đất', table([
            { title: 'Mã loại', render: l => `<span class="code text-primary">${esc(l.id)}</span>` },
            { title: 'Tên loại đất', render: l => `<b>${esc(l.name)}</b>` },
            { title: 'Ký hiệu quy hoạch', render: l => `<span class="tag">${esc(l.code)}</span>` },
            { title: 'Mô tả & Phạm vi khai thác gỗ', render: l => esc(l.desc) }
        ], DB.landTypes), '', 'panel-flush mb-3');

        const landCertHtml = card('Giấy tờ đất', table([
            { title: 'Mã hồ sơ', render: c => `<span class="code text-primary">${esc(c.id)}</span>` },
            { title: 'Tên loại giấy tờ', render: c => `<b>${esc(c.name)}</b>` },
            { title: 'Cơ quan có thẩm quyền phê duyệt', render: c => esc(c.authority) },
            { title: 'Bắt buộc với EUDR', render: c => c.requiredEudr ? `<span class="pill pill-pass"><i class="fa fa-check"></i>Bắt buộc</span>` : `<span class="pill pill-info">Tùy chọn</span>` }
        ], DB.landCertTypes), '', 'panel-flush mb-3');

        const certsHtml = card('Chứng chỉ', table([
            { title: 'Mã', render: c => `<span class="code text-primary">${esc(c.id)}</span>` },
            { title: 'Tên chứng chỉ', render: c => `<b>${esc(c.name)}</b>` },
            { title: 'Mã số chứng chỉ', render: c => `<span class="tag">${esc(c.code)}</span>` },
            { title: 'Tổ chức cấp chứng nhận', render: c => esc(c.issuer) },
            { title: 'Hiệu lực đến', render: c => esc(c.validUntil) },
            { title: 'Phạm vi áp dụng', render: c => esc(c.scope) }
        ], DB.certifications), '', 'panel-flush');

        root.innerHTML = landTypesHtml + landCertHtml + certsHtml;

        window.addCertModal = function() {
            openModal({
                title: 'Thêm chứng chỉ',
                size: 'modal-lg',
                submitText: 'Lưu chứng chỉ',
                body: `<div class="row g-2">
                    ${field('Mã chứng chỉ', 'id', `CERT-NEW`, { required: true, col: 4 })}
                    ${field('Tên chứng chỉ / Tiêu chuẩn', 'name', '', { required: true, col: 8 })}
                    ${field('Mã số chứng nhận', 'code', '', { required: true, col: 6 })}
                    ${field('Tổ chức cấp (Certification Body)', 'issuer', '', { required: true, col: 6 })}
                    ${field('Thời hạn hiệu lực', 'validUntil', '2028-12-31', { type: 'date', col: 6 })}
                    ${field('Phạm vi chứng nhận', 'scope', 'Ván ép Plywood xuất khẩu', { col: 6 })}
                </div>`,
                onSubmit: data => guarded('config', () => {
                    DB.certifications.push({ id: data.id.trim(), name: data.name.trim(), code: data.code.trim(), issuer: data.issuer.trim(), validUntil: data.validUntil, scope: data.scope.trim() });
                    toast(`Đã lưu chứng chỉ ${data.name}`);
                    refresh();
                })
            });
        };
    });
}

/** 10. Danh mục Đối tác & Khách hàng EU */
function page_admin_doi_tac() {
    startPage('admin-doi-tac', {
        title: 'Đối tác & Khách hàng EU',
        actions: newBtn('Thêm khách hàng EU', 'addCustomerModal()')
    }, root => {
        let activeTab = 'suppliers';

        const renderContent = () => {
            const tabsHtml = `<ul class="nav nav-tabs mb-3">
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'suppliers' ? 'active' : ''}" onclick="switchPartnerTab('suppliers')">Nhà cung cấp / Xưởng bóc (${DB.suppliers.length})</button></li>
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'customers' ? 'active' : ''}" onclick="switchPartnerTab('customers')">Khách hàng nhập khẩu EU (${DB.customers.length})</button></li>
            </ul>`;

            let bodyHtml = '';
            if (activeTab === 'suppliers') {
                bodyHtml = card('', table([
                    { title: 'Mã', render: s => `<span class="code text-primary">${esc(s.id)}</span>` },
                    { title: 'Tên nhà cung cấp / Xưởng', render: s => `<b>${esc(s.name)}</b><span class="sub">MST: ${esc(s.taxCode)}</span>` },
                    { title: 'Nguồn', render: s => s.type === 'IMPORT' ? '<span class="tag">Nhập khẩu (TQ)</span>' : '<span class="tag">Trong nước</span>' },
                    { title: 'Địa chỉ', render: s => esc(s.address) },
                    { title: 'Liên hệ', render: s => `${esc(s.contact)}<span class="sub">${esc(s.email)}</span>` },
                    { title: 'Hợp đồng', render: s => s.contractNo ? `${esc(s.contractNo)}<span class="sub">Hạn: ${esc(s.contractExpiry)}</span>` : '<span class="text-danger">Chưa có</span>' },
                    { title: 'Cam kết EUDR', render: s => s.commitment ? `<span class="pill pill-pass"><i class="fa fa-check"></i>Đã ký</span>` : `<span class="pill pill-fail"><i class="fa fa-ban"></i>Chưa ký</span>` }
                ], DB.suppliers), '', 'panel-flush');
            } else {
                bodyHtml = card('', table([
                    { title: 'Mã KH', render: c => `<span class="code text-primary">${esc(c.id)}</span>` },
                    { title: 'Khách hàng / Nhà nhập khẩu EU', render: c => `<b>${esc(c.name)}</b><span class="sub">${esc(c.address)}</span>` },
                    { title: 'Mã số EORI (EU)', render: c => c.eori ? `<b class="text-primary">${esc(c.eori)}</b>` : '<span class="text-muted">–</span>' },
                    { title: 'Quốc gia', render: c => `<span class="badge bg-light text-dark border">${esc(c.country)}</span>` },
                    { title: 'Email liên hệ', render: c => esc(c.email) },
                    { title: 'Đơn hàng đã xuất', render: c => `${DB.orders.filter(o => o.customerId === c.id).length} đơn hàng` }
                ], DB.customers), '', 'panel-flush');
            }

            root.innerHTML = tabsHtml + bodyHtml;
        };

        window.switchPartnerTab = function(t) {
            activeTab = t;
            renderContent();
        };

        window.addCustomerModal = function() {
            openModal({
                title: 'Thêm khách hàng EU',
                size: 'modal-lg',
                submitText: 'Lưu khách hàng',
                body: `<div class="row g-2">
                    ${field('Mã khách hàng', 'id', `KH-EU-${String(DB.customers.length + 1).padStart(2,'0')}`, { required: true, col: 4 })}
                    ${field('Tên công ty nhập khẩu (Operator/Trader)', 'name', '', { required: true, col: 8 })}
                    ${field('Mã EORI (Bắt buộc với nhà nhập khẩu EU)', 'eori', '', { required: true, col: 6 })}
                    ${field('Quốc gia thành viên EU (ISO 2)', 'country', 'DE', { required: true, col: 6 })}
                    ${field('Địa chỉ trụ sở tại EU', 'address', '', { required: true, col: 12 })}
                    ${field('Email liên hệ nhận hồ sơ DDS', 'email', '', { type: 'email', required: true, col: 12 })}
                </div>`,
                onSubmit: data => guarded('order', () => {
                    const newCust = {
                        id: data.id.trim(),
                        name: data.name.trim(),
                        eori: data.eori.trim(),
                        country: data.country.trim().toUpperCase(),
                        address: data.address.trim(),
                        email: data.email.trim()
                    };
                    DB.customers.push(newCust);
                    logAction(newCust.id, 'Thêm khách hàng EU', `${newCust.name}, EORI: ${newCust.eori}`);
                    toast(`Đã thêm khách hàng ${newCust.name}`);
                    renderContent();
                })
            });
        };

        renderContent();
    });
}

/** 11. Tài khoản & Phân quyền hệ thống */
function page_admin_tai_khoan() {
    startPage('admin-tai-khoan', {
        title: 'Tài khoản & Phân quyền',
        actions: newBtn('Thêm tài khoản', 'addAccountModal()')
    }, root => {
        const tableHtml = card('Tài khoản', table([
            { title: 'Tên đăng nhập', render: a => `<span class="code text-primary">${esc(a.username)}</span>` },
            { title: 'Họ và tên', render: a => `<b>${esc(a.fullName)}</b>` },
            { title: 'Chức danh / Vị trí', render: a => esc(a.position) },
            { title: 'Nhóm vai trò (RBAC)', render: a => `<span class="tag">${ROLES[a.role] || a.role}</span>` },
            { title: 'Phân hệ được phép', render: a => a.role === 'quantri' ? '<span class="pill pill-pass">Toàn bộ 3 phân hệ</span>' : (a.role === 'tuanthu' ? '<span class="pill pill-info">Bản đồ & Tuân thủ</span>' : '<span class="pill pill-wait">Nhà máy sản xuất</span>') },
            { title: 'Email', render: a => esc(a.email) },
            { title: 'Đăng nhập cuối', render: a => `<small class="text-muted">${esc(a.lastLogin)}</small>` },
            { title: 'Trạng thái', render: a => a.status === 'ACTIVE' ? `<span class="pill pill-pass">Hoạt động</span>` : `<span class="pill pill-fail">Khóa</span>` }
        ], DB.accounts), '', 'panel-flush mb-3');

        const matrixHtml = card('Phân quyền', `
            <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Vai trò người dùng</th>
                            <th class="text-center">1. Phân hệ Nhà Máy</th>
                            <th class="text-center">2. Phân hệ Bản Đồ</th>
                            <th class="text-center">3. Phân hệ Quản Trị</th>
                            <th class="text-center">Phê duyệt DDS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><b>Quản trị viên (quantri)</b></td><td class="text-center text-success">Toàn quyền</td><td class="text-center text-success">Toàn quyền</td><td class="text-center text-success">Toàn quyền</td><td class="text-center text-success">Có</td></tr>
                        <tr><td><b>Cán bộ Tuân thủ EUDR (tuanthu)</b></td><td class="text-center text-success">Đối soát KCS</td><td class="text-center text-success">Toàn quyền GIS</td><td class="text-center text-muted">Xem</td><td class="text-center text-success">Ký số DDS</td></tr>
                        <tr><td><b>Quản đốc Sản xuất (sanxuat)</b></td><td class="text-center text-success">Lệnh SX, 7 Công đoạn</td><td class="text-center text-muted">Xem thửa</td><td class="text-center text-muted">–</td><td class="text-center text-muted">–</td></tr>
                        <tr><td><b>Thủ kho & Trạm cân (kho)</b></td><td class="text-center text-success">Phiếu cân, Kho nguyên liệu</td><td class="text-center text-muted">Gán thửa</td><td class="text-center text-muted">–</td><td class="text-center text-muted">–</td></tr>
                        <tr><td><b>Kinh doanh Xuất khẩu (kinhdoanh)</b></td><td class="text-center text-success">Đơn hàng, Pallet</td><td class="text-center text-muted">Xem</td><td class="text-center text-muted">Xem đối tác</td><td class="text-center text-success">Tải gói DDS</td></tr>
                    </tbody>
                </table>
            </div>
        `);

        root.innerHTML = tableHtml + matrixHtml;

        window.addAccountModal = function() {
            openModal({
                title: 'Thêm tài khoản',
                size: 'modal-lg',
                submitText: 'Tạo tài khoản',
                body: `<div class="row g-2">
                    ${field('Tên đăng nhập', 'username', '', { required: true, col: 4 })}
                    ${field('Họ và tên', 'fullName', '', { required: true, col: 8 })}
                    ${field('Chức vụ / Vị trí', 'position', 'Cán bộ kỹ thuật', { required: true, col: 6 })}
                    ${field('Nhóm vai trò', 'role', 'tuanthu', { type: 'select', options: Object.entries(ROLES).map(([k, v]) => [k, v]), col: 6 })}
                    ${field('Email công vụ', 'email', '', { type: 'email', required: true, col: 12 })}
                </div>`,
                onSubmit: data => guarded('config', () => {
                    const newAcc = {
                        username: data.username.trim(),
                        fullName: data.fullName.trim(),
                        position: data.position.trim(),
                        role: data.role,
                        email: data.email.trim(),
                        lastLogin: 'Chưa đăng nhập',
                        status: 'ACTIVE'
                    };
                    DB.accounts.push(newAcc);
                    logAction(newAcc.username, 'Tạo tài khoản', newAcc.position);
                    toast(`Đã tạo tài khoản ${newAcc.username}`);
                    refresh();
                })
            });
        };
    });
}

/** 12. Nhật ký kiểm toán hệ thống (Audit Trail) */
function page_admin_lich_su() {
    startPage('admin-lich-su', {
        title: 'Nhật ký kiểm toán (Audit Trail)',
        actions: `<button class="btn btn-sm btn-light" onclick="verifyFullAudit()"><i class="fa fa-shield-halved me-1"></i>Xác minh chuỗi băm</button>`
    }, root => {
        const verifyStatus = verifyAudit();

        const alertHtml = `<div class="alert ${verifyStatus.ok ? 'alert-success' : 'alert-danger'} py-2 mb-3 small d-flex justify-content-between align-items-center">
            <div>
                <i class="fa ${verifyStatus.ok ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'} me-2"></i>
                Chuỗi băm: ${verifyStatus.ok ? `toàn vẹn (${verifyStatus.count} bản ghi)` : `sai lệch tại bản ghi ${verifyStatus.index + 1}`}
            </div>
            
        </div>`;

        const tableHtml = card('', table([
            { title: 'STT', render: (e, idx) => `<span class="text-muted">${DB.audit.length - DB.audit.indexOf(e)}</span>` },
            { title: 'Thời gian ghi nhận', render: e => `<small class="text-muted">${esc(e.at.slice(0, 19).replace('T', ' '))}</small>` },
            { title: 'Vai trò thực hiện', render: e => `<span class="tag">${esc(e.role)}</span>` },
            { title: 'Đối tượng tác động', render: e => `<span class="code text-primary">${esc(e.entity)}</span>` },
            { title: 'Hành động', render: e => `<b>${esc(e.action)}</b>` },
            { title: 'Chi tiết thay đổi', render: e => esc(e.detail) },
            { title: 'Mã băm khối này (Hash)', render: e => `<code class="small text-success">${esc(e.hash)}</code>` },
            { title: 'Khối trước (Prev Hash)', render: e => `<code class="small text-muted">${esc(e.prev)}</code>` }
        ], DB.audit.slice().reverse()), '', 'panel-flush');

        root.innerHTML = alertHtml + tableHtml;

        window.verifyFullAudit = function() {
            const v = verifyAudit();
            if (v.ok) toast(`Hợp lệ: ${v.count} bản ghi`);
            else toast(`Sai lệch tại bản ghi ${v.index + 1}`, 'err');
        };
    });
}
