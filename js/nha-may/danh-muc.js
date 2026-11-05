// ========================================================
// PHÂN HỆ 1: DANH MỤC NHÀ MÁY (FACTORY MASTER DATA)
// ========================================================

/** 13. Danh mục Nhà máy (Ô kho, Thiết bị, Quy cách ván, Keo & Hóa chất) */
const CATALOG_TITLES = { bays: 'Ô kho', machines: 'Máy móc', specs: 'Quy cách ván', materials: 'Vật tư', ports_hs: 'Cảng & Mã HS' };
function page_factory_danh_muc() {
    const urlTab = new URLSearchParams(location.search).get('tab');
    const initialTab = CATALOG_TITLES[urlTab] ? urlTab : 'bays';
    startPage('factory-danh-muc', {
        title: CATALOG_TITLES[initialTab],
        actions: newBtn('Thêm', 'addFactoryMasterModal()')
    }, root => {
        let activeTab = initialTab;

        const renderContent = () => {

            let bodyHtml = '';
            if (activeTab === 'bays') {
                bodyHtml = card('', table([
                    { title: 'Mã Ô', render: b => `<span class="code text-primary">${esc(b.id)}</span>` },
                    { title: 'Tên vị trí lưu trữ', render: b => `<b>${esc(b.name)}</b>` },
                    { title: 'Phân khu EUDR', render: b => {
                        if (b.zone === 'ZONE_A') return '<span class="pill pill-pass">Khu A: Đạt chuẩn EUDR</span>';
                        if (b.zone === 'ZONE_B') return '<span class="pill pill-wait">Khu B: Khóa tạm 48h</span>';
                        if (b.zone === 'ZONE_C') return '<span class="pill pill-fail">Khu C: Cách ly nội địa</span>';
                        return '<span class="pill pill-info">Kho Pallet xuất EU</span>';
                    } },
                    { title: 'Sức chứa tối đa', num: true, render: b => b.maxM3 + ' m³' },
                    { title: 'Tồn thực tế', num: true, render: b => fmt(b.curM3, 2) + ' m³' },
                    { title: 'Trạng thái khóa', render: b => b.status === 'OPEN' ? '<span class="badge bg-success">Mở cấp phát</span>' : (b.status === 'LOCKED' ? '<span class="badge bg-warning text-dark">Khóa tạm</span>' : '<span class="badge bg-danger">Cách ly</span>') },
                    { title: 'Quy chế cấp phát Lệnh SX', render: b => esc(b.allowed) }
                ], DB.warehouseBays), '', 'panel-flush');
            } else if (activeTab === 'machines') {
                bodyHtml = card('', table([
                    { title: 'Mã Máy', render: m => `<span class="code text-primary">${esc(m.id)}</span>` },
                    { title: 'Tên thiết bị máy', render: m => `<b>${esc(m.name)}</b>` },
                    { title: 'Công đoạn phụ trách', render: m => `<span class="tag">${esc(m.stage)}</span>` },
                    { title: 'Công suất thiết kế', render: m => esc(m.capacity) },
                    { title: 'Công nhân phụ trách chính', render: m => esc(m.operator) },
                    { title: 'Thông số kỹ thuật / Chốt chặn', render: m => esc(m.note) },
                    { title: 'Trạng thái', render: m => m.status === 'ACTIVE' ? '<span class="pill pill-pass">Đang chạy</span>' : '<span class="pill pill-wait">Bảo trì</span>' }
                ], DB.machines), '', 'panel-flush');
            } else if (activeTab === 'specs') {
                bodyHtml = card('', table([
                    { title: 'Mã Quy Cách', render: s => `<span class="code text-primary">${esc(s.id)}</span>` },
                    { title: 'Tên sản phẩm ván', render: s => `<b>${esc(s.name)}</b>` },
                    { title: 'Kích thước chuẩn', render: s => `<span class="tag">${esc(s.dim)}</span>` },
                    { title: 'Số lớp (Plies)', num: true, render: s => `${s.plies} lớp` },
                    { title: 'Cấu trúc kết cấu', render: s => `Mặt: ${esc(s.face)}<span class="sub">Ruột: ${esc(s.core)}</span>` },
                    { title: 'Loại keo sử dụng', render: s => esc(s.glue) },
                    { title: 'Tỷ trọng', render: s => esc(s.density) },
                    { title: 'Phẩm cấp', render: s => `<span class="badge bg-success">${esc(s.grade)}</span>` }
                ], DB.plywoodSpecs), '', 'panel-flush');
            } else if (activeTab === 'materials') {
                bodyHtml = card('', table([
                    { title: 'Mã', render: m => `<span class="code text-primary">${esc(m.id)}</span>` },
                    { title: 'Tên vật tư', render: m => `<b>${esc(m.name)}</b>` },
                    { title: 'Nhóm', render: m => tag(m.group) },
                    { title: 'Quy cách / Công dụng', render: m => esc(m.spec) },
                    { title: 'Tiêu chuẩn', render: m => esc(m.standard || '–') },
                    { title: 'Định mức', render: m => esc(m.norm || '–') },
                    { title: 'ĐVT', render: m => esc(m.unit) }
                ], DB.materials), '', 'panel-flush');
            } else {
                bodyHtml = `<div class="row g-3">
                    <div class="col-md-6">
                        ${card('Cảng', table([
                            { title: 'Mã Cảng', render: p => `<span class="code text-primary">${esc(p.id)}</span>` },
                            { title: 'Tên Cảng biển', render: p => `<b>${esc(p.name)}</b>` },
                            { title: 'Mã UN/LOCODE', render: p => `<span class="tag">${esc(p.code)}</span>` },
                            { title: 'Quốc gia', render: p => esc(p.country) },
                            { title: 'Vai trò chuỗi cung ứng', render: p => esc(p.role) }
                        ], DB.ports || []), '', 'panel-flush')}
                    </div>
                    <div class="col-md-6">
                        ${card('Mã HS', table([
                            { title: 'Mã HS', render: h => `<span class="code text-success">${esc(h.code)}</span>` },
                            { title: 'Mô tả hàng hóa lâm sản', render: h => `<b>${esc(h.desc)}</b>` },
                            { title: 'ĐVT', render: h => esc(h.unit) },
                            { title: 'EUDR', render: h => h.eudrRequired ? '<span class="pill pill-pass">Bắt buộc</span>' : '<span class="pill pill-info">Miễn trừ</span>' },
                            { title: 'Thuế suất EU', render: h => esc(h.dutyRate) }
                        ], DB.hsCodeDetails || []), '', 'panel-flush')}
                    </div>
                </div>`;
            }

            root.innerHTML = bodyHtml;
        };

        window.switchFactoryTab = function(t) {
            activeTab = t;
            renderContent();
        };

        window.addFactoryMasterModal = function() {
            openModal({
                title: 'Thêm danh mục',
                size: 'modal-lg',
                submitText: 'Lưu',
                body: `<div class="row g-2">
                    ${field('Loại danh mục', 'catType', 'bay', { type: 'select', options: [['bay', 'Ô kho lưu trữ'], ['machine', 'Máy / Dây chuyền sản xuất'], ['material', 'Vật tư']], col: 6 })}
                    ${field('Mã định danh', 'id', `KHO-A-01`, { required: true, col: 6 })}
                    ${field('Tên gọi', 'name', '', { required: true, col: 12 })}
                    ${field('Ghi chú / Thông số', 'note', '', { col: 12 })}
                </div>`,
                onSubmit: data => guarded('config', () => {
                    if (data.catType === 'material') {
                        DB.materials.push({ id: data.id.trim(), name: data.name.trim(), group: 'Khác', spec: data.note, standard: '', norm: '', unit: '' });
                        toast(`Đã thêm vật tư ${data.name}`);
                    } else if (data.catType === 'bay') {
                        DB.warehouseBays.push({ id: data.id.trim(), zone: 'ZONE_A', name: data.name.trim(), maxM3: 50, curM3: 0, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' });
                        toast(`Đã thêm ô kho ${data.name}`);
                    } else {
                        DB.machines.push({ id: data.id.trim(), name: data.name.trim(), stage: 'May ghép ván', capacity: '1,000 tấm/ca', operator: 'Theo ca', status: 'ACTIVE', note: data.note });
                        toast(`Đã thêm thiết bị ${data.name}`);
                    }
                    renderContent();
                })
            });
        };

        renderContent();
    });
}
