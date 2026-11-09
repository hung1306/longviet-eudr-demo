import {
    newBtn,
    speciesOptions,
    supplierName,
} from '../nha-may/san-xuat.js';
import {
    exportGeo,
} from '../nha-may/tiep-nhan-don-hang.js';
import {
    DB,
    ROLES,
    currentRole,
    getPallet,
    getPlot,
    getWO,
    logAction,
    plotLockedBy,
    sum,
    todayISO,
    uniq,
    woReceipts,
    orderPlots,
} from '../shared/core.js';
import {
    card,
    drawPlotsMap,
    esc,
    field,
    fmt,
    guarded,
    kpi,
    openModal,
    pill,
    startPage,
    table,
    toast,
} from '../shared/navigation.js';

// ========================================================
// PHÂN HỆ 2: BẢN ĐỒ GIS VÙNG TRỒNG (MAP SUBSYSTEM)
// ========================================================

/** 1. Bản đồ vùng trồng GIS vệ tinh */
export function page_map_tong_quan() {
    startPage('map-tong-quan', {
        title: 'Bản đồ vùng trồng GIS',
        actions: `<a href="/ban-do/map-export-traces" class="btn btn-sm btn-light border"><i class="fa fa-code-compare me-1 text-primary"></i>Kiểm tra GeoJSON</a>`
    }, root => {
        const totalArea = sum(DB.plots, p => p.areaHa);
        const clearPlots = DB.plots.filter(p => p.forest && p.forest.result === 'CLEAR');
        const lossPlots = DB.plots.filter(p => p.forest && p.forest.result === 'LOSS');
        const totalSpecies = uniq(DB.plots.map(p => p.species)).length;

        const kpisHtml = `<div class="kpi-row">
            ${kpi('Diện tích vùng trồng', fmt(totalArea, 1) + ' ha', `${DB.plots.length} vườn cây`, 'ok')}
            ${kpi('Vườn đạt chuẩn', clearPlots.length + ' vườn', 'Trồng trước 2021', 'ok')}
            ${kpi('Cảnh báo / Cần kiểm tra', lossPlots.length + ' vườn', lossPlots.length ? 'Cần thẩm tra lại' : '0 cảnh báo', lossPlots.length ? 'bad' : 'ok')}
            ${kpi('Loài cây trồng', totalSpecies + ' loài', 'Cao su, keo, bạch đàn...', 'ok')}
        </div>`;

        const filterHtml = `<div class="panel mb-3"><div class="panel-body py-2"><div class="row g-2 align-items-center">
            <div class="col-md-3">
                <label class="form-label mb-1 text-muted small">Địa bàn / Tỉnh thành</label>
                <select class="form-select form-select-sm" id="map-filter-province" onchange="filterMapPlots()">
                    <option value="">Tất cả địa bàn</option>
                    ${DB.provinces.map(pr => `<option value="${esc(pr.name)}">${esc(pr.name)} (${esc(pr.country)})</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label mb-1 text-muted small">Loài cây trồng</label>
                <select class="form-select form-select-sm" id="map-filter-species" onchange="filterMapPlots()">
                    <option value="">Tất cả loài cây</option>
                    ${DB.speciesDetails.map(s => `<option value="${esc(s.scientific)}">${esc(s.common)} (${esc(s.scientific)})</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label mb-1 text-muted small">Hiện trạng rừng</label>
                <select class="form-select form-select-sm" id="map-filter-forest" onchange="filterMapPlots()">
                    <option value="">Tất cả trạng thái</option>
                    <option value="CLEAR">Đạt chuẩn (Trước 2021)</option>
                    <option value="LOSS">Cảnh báo vi phạm</option>
                </select>
            </div>
            <div class="col-md-3 text-end pt-3">
                <span class="badge bg-success bg-opacity-10 text-success border border-success me-1 px-2 py-1"><i class="fa fa-circle-check me-1"></i>Đạt chuẩn</span>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1"><i class="fa fa-triangle-exclamation me-1"></i>Cảnh báo</span>
            </div>
        </div></div></div>`;

        const mapBoxHtml = card('Bản đồ vệ tinh các vườn cây nguyên liệu',
            `<div id="forest-big-map" style="height:520px;border-radius:8px;" class="border shadow-sm"></div>`
        );

        const plotsTableHtml = card('Danh sách vườn cây & thửa đất vùng trồng', table([
            { title: 'Mã vườn', render: p => `<span class="code text-primary">${esc(p.id)}</span>` },
            { title: 'Chủ vườn / Nông hộ', render: p => `<b>${esc(p.owner)}</b>${p.country === 'CN' ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger ms-1 small">🇨🇳 Nhập khẩu</span>' : ''}<span class="sub">${esc(p.place)}</span>` },
            { title: 'Loài cây', render: p => `<i>${esc(p.species)}</i>` },
            { title: 'Diện tích', num: true, render: p => fmt(p.areaHa, 2) + ' ha' },
            { title: 'Định vị hình học', render: p => `<span class="tag">${p.geometry.type === 'Point' ? 'Điểm tọa độ (&le;4ha)' : 'Ranh giới Polygon (>4ha)'}</span>` },
            { title: 'Năm trồng', render: p => p.plantingYear || '–' },
            { title: 'Pháp lý đất', render: p => p.country === 'CN' ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary small">Giấy phép khai thác</span><span class="sub">${esc(p.landDoc)}</span>` : esc(p.landDoc || 'Chưa có sổ') },
            { title: 'Hiện trạng', render: p => pill(p.forest && p.forest.result === 'CLEAR' ? 'CLEAR' : 'LOSS', p.forest && p.forest.result === 'CLEAR' ? 'Đạt chuẩn (Trước 2021)' : 'Cảnh báo vi phạm') },
            { title: '', render: p => `<button class="btn btn-sm btn-light btn-icon" onclick="zoomPlotOnMap('${p.id}')" title="Định vị vườn trên bản đồ"><i class="fa fa-crosshairs text-primary"></i></button>` }
        ], DB.plots), '', 'panel-flush');

        root.innerHTML = kpisHtml + filterHtml + mapBoxHtml + plotsTableHtml;

        setTimeout(() => {
            const mapEl = document.getElementById('forest-big-map');
            if (mapEl) {
                window.curForestMap = drawPlotsMap(mapEl, DB.plots);
            }
        }, 100);

        window.filterMapPlots = function() {
            const prov = document.getElementById('map-filter-province').value;
            const spec = document.getElementById('map-filter-species').value;
            const fst = document.getElementById('map-filter-forest').value;

            const filtered = DB.plots.filter(p => {
                if (prov && !p.place.includes(prov)) return false;
                if (spec && p.species !== spec) return false;
                if (fst && (!p.forest || p.forest.result !== fst)) return false;
                return true;
            });

            const mapEl = document.getElementById('forest-big-map');
            if (mapEl && window.curForestMap) {
                window.curForestMap.remove();
                window.curForestMap = drawPlotsMap(mapEl, filtered);
            }
        };

        window.zoomPlotOnMap = function(plotId) {
            const p = getPlot(plotId);
            if (!p || !window.curForestMap) return;
            window.location.hash = '#forest-big-map';
            if (p.geometry.type === 'Point') {
                window.curForestMap.setView([p.geometry.coordinates[1], p.geometry.coordinates[0]], 15);
            } else {
                const ll = p.geometry.coordinates[0].map(c => [c[1], c[0]]);
                window.curForestMap.fitBounds(ll, { padding: [40, 40] });
            }
        };
    });
}

/** 2. Quản lý Vườn cây & Thửa đất / Polygon (PlaceMark Manage) */
export function page_map_thua_dat() {
    startPage('map-thua-dat', {
        title: 'Vườn cây & Thửa đất (PlaceMark)',
        actions: newBtn('Thêm vườn cây mới', 'addPlotModal()')
    }, root => {
        const tableHtml = card('', table([
            { title: 'Mã vườn', render: p => `<span class="code text-primary">${esc(p.id)}</span>` },
            { title: 'Nhà cung cấp', render: p => supplierName(p.supplierId) },
            { title: 'Chủ vườn / Nông hộ', render: p => `<b>${esc(p.owner)}</b><span class="sub">${esc(p.place)}</span>` },
            { title: 'Loài cây', render: p => `<i>${esc(p.species)}</i>` },
            { title: 'Diện tích (ha)', num: true, render: p => fmt(p.areaHa, 2) },
            { title: 'Định dạng hình học', render: p => `<span class="tag">${p.geometry.type === 'Point' ? 'Điểm tọa độ (1 điểm)' : 'Ranh giới đa giác (' + p.geometry.coordinates[0].length + ' đỉnh)'}</span>` },
            { title: 'Năm trồng / Khai thác', render: p => `${p.plantingYear || '–'} / <small>${esc(p.harvestFrom || '–')}</small>` },
            { title: 'Hồ sơ pháp lý đất', render: p => esc(p.landDoc || 'Chưa có sổ đỏ') },
            { title: 'Hiện trạng', render: p => pill(p.forest && p.forest.result === 'CLEAR' ? 'CLEAR' : 'LOSS', p.forest && p.forest.result === 'CLEAR' ? 'Đạt chuẩn (Trước 2021)' : 'Cảnh báo vi phạm') },
            { title: '', render: p => `
                <button class="btn btn-sm btn-light btn-icon" onclick="viewPlotModal('${p.id}')" title="Xem chi tiết & Vệ tinh"><i class="fa fa-eye text-primary"></i></button>
                <button class="btn btn-sm btn-light btn-icon" onclick="editPlotModal('${p.id}')" title="Sửa thông tin"><i class="fa fa-pen"></i></button>
            ` }
        ], DB.plots), '', 'panel-flush');

        root.innerHTML = tableHtml;

        window.addPlotModal = function() {
            openModal({
                title: 'Thêm vườn cây mới',
                size: 'modal-lg',
                submitText: 'Lưu vườn cây',
                body: `<div class="row g-2">
                    ${field('Mã vườn cây (Plot ID)', 'id', `PLOT-VN-${todayISO().slice(2,4)}-${String(DB.plots.length + 1).padStart(2,'0')}`, { required: true, col: 4 })}
                    ${field('Nhà cung cấp', 'supplierId', '', { type: 'select', options: DB.suppliers.map(s => [s.id, s.name]), required: true, col: 8 })}
                    ${field('Chủ vườn / Nông hộ', 'owner', '', { required: true, col: 6 })}
                    ${field('Địa chỉ / Xã, Huyện, Tỉnh', 'place', 'Xã Phú Tân, Định Quán, Đồng Nai', { required: true, col: 6 })}
                    ${field('Loài cây trồng', 'species', 'Hevea brasiliensis', { type: 'select', options: speciesOptions(), col: 6 })}
                    ${field('Diện tích (Hectare)', 'areaHa', 3.5, { type: 'number', required: true, col: 3, attrs: 'step="0.1" min="0.1"' })}
                    ${field('Năm trồng', 'plantingYear', 2015, { type: 'number', col: 3 })}
                    ${field('Loại định dạng hình học', 'geoType', 'Point', { type: 'select', options: [['Point', 'Điểm tọa độ (Vườn &le; 4ha)'], ['Polygon', 'Ranh giới đa giác (Vườn > 4ha)']], col: 6 })}
                    ${field('Hồ sơ pháp lý đất (Sổ đỏ / QĐ giao đất)', 'landDoc', 'GCNQSDĐ số ', { required: true, col: 6 })}
                    ${field('Tọa độ WGS84 [Kinh độ Lng, Vĩ độ Lat]', 'coordsRaw', '107.348215, 11.238419', { col: 12, help: 'Kinh độ, vĩ độ. Tối thiểu 6 số thập phân' })}
                </div>`,
                onSubmit: data => guarded('plot', () => {
                    const coords = data.coordsRaw.split(',').map(x => parseFloat(x.trim()));
                    if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1])) throw new Error('Tọa độ WGS84 không hợp lệ');
                    const area = parseFloat(data.areaHa);
                    if (area > 4 && data.geoType === 'Point') throw new Error('Quy định: Vườn cây có diện tích > 4ha bắt buộc phải vẽ ranh giới đa giác Polygon!');

                    const newPlot = {
                        id: data.id.trim(),
                        supplierId: data.supplierId,
                        owner: data.owner.trim(),
                        country: data.place.includes('China') || data.place.includes('Quảng Tây') ? 'CN' : 'VN',
                        place: data.place.trim(),
                        species: data.species,
                        areaHa: area,
                        geometry: data.geoType === 'Point' ? { type: 'Point', coordinates: [coords[0], coords[1]] } : {
                            type: 'Polygon',
                            coordinates: [[[coords[0], coords[1]], [coords[0] + 0.003, coords[1]], [coords[0] + 0.003, coords[1] - 0.003], [coords[0], coords[1] - 0.003], [coords[0], coords[1]]]]
                        },
                        plantingYear: parseInt(data.plantingYear) || 2015,
                        harvestFrom: todayISO(),
                        harvestTo: todayISO(),
                        landDoc: data.landDoc.trim(),
                        forest: { result: 'CLEAR', source: 'Ảnh vệ tinh Sentinel-2', date: todayISO(), by: ROLES[currentRole()] },
                        version: 1
                    };
                    DB.plots.push(newPlot);
                    logAction(newPlot.id, 'Thêm vườn cây', `${newPlot.areaHa} ha, ${newPlot.species}`);
                    toast(`Đã thêm thành công vườn ${newPlot.id}`);
                    refresh();
                })
            });
        };

        window.editPlotModal = function(plotId) {
            const p = getPlot(plotId), locked = plotLockedBy(plotId);
            openModal({
                title: `Sửa thông tin vườn cây: ${plotId}`,
                size: 'modal-lg',
                submitText: 'Lưu thay đổi',
                body: `${locked.length ? `<div class="note-box warn">Đang liên kết với đơn ${locked.map(o => esc(o.id)).join(', ')}</div>` : ''}<div class="row g-2">
                    ${field('Chủ vườn / Nông hộ', 'owner', p.owner, { required: true })}
                    ${field('Địa bàn / Tỉnh thành', 'place', p.place, { required: true })}
                    ${field('Loài cây trồng', 'species', p.species, { type: 'select', options: speciesOptions() })}
                    ${field('Diện tích (ha)', 'areaHa', p.areaHa, { type: 'number', required: true, col: 3, attrs: 'step="any" min="0.01"' })}
                    ${field('Năm trồng', 'plantingYear', p.plantingYear, { type: 'number', col: 3 })}
                    ${field('Giấy tờ đất (Sổ đỏ)', 'landDoc', p.landDoc, { col: 12 })}
                    ${locked.length ? field('Lý do sửa', 'reason', '', { required: true, col: 12 }) : ''}
                </div>`,
                onSubmit: data => guarded('plot', () => {
                    const area = parseFloat(data.areaHa);
                    if (area > 4 && p.geometry.type === 'Point') throw new Error('Vườn cây trên 4 ha phải dùng ranh giới đa giác Polygon');
                    Object.assign(p, { owner: data.owner.trim(), place: data.place.trim(), species: data.species, areaHa: area, plantingYear: parseInt(data.plantingYear) || null, landDoc: data.landDoc.trim() });
                    if (locked.length) p.version = (p.version || 1) + 1;
                    logAction(plotId, 'Sửa vườn cây', data.reason ? `Lý do: ${data.reason}; phiên bản ${p.version}` : `${area} ha`);
                    refresh();
                })
            });
        };

        window.viewPlotModal = function(plotId) {
            const p = getPlot(plotId);
            if (!p) return;
            openModal({
                title: `Chi tiết vườn cây: ${p.id}`,
                size: 'modal-lg',
                body: `<div class="row g-2">
                    <div class="col-md-6">
                        <table class="table table-sm table-bordered">
                            <tr><td class="text-muted" style="width:40%;">Chủ vườn / Nông hộ:</td><td><b>${esc(p.owner)}</b></td></tr>
                            <tr><td class="text-muted">Địa bàn:</td><td>${esc(p.place)}</td></tr>
                            <tr><td class="text-muted">Nhà cung cấp:</td><td>${esc(supplierName(p.supplierId))}</td></tr>
                            <tr><td class="text-muted">Loài cây trồng:</td><td><i>${esc(p.species)}</i></td></tr>
                            <tr><td class="text-muted">Diện tích:</td><td><b>${p.areaHa} ha</b></td></tr>
                            <tr><td class="text-muted">Năm trồng:</td><td>${p.plantingYear}</td></tr>
                            <tr><td class="text-muted">Pháp lý đất:</td><td>${esc(p.landDoc || 'Chưa có sổ')}</td></tr>
                            <tr><td class="text-muted">Hiện trạng:</td><td>${pill(p.forest && p.forest.result === 'CLEAR' ? 'CLEAR' : 'LOSS', p.forest && p.forest.result === 'CLEAR' ? 'Đạt chuẩn (Trước 2021)' : 'Cảnh báo vi phạm')}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <div id="modal-plot-map" style="height:250px;" class="border rounded"></div>
                    </div>
                    <div class="col-12 mt-2">
                        <span class="text-muted small">Tọa độ GeoJSON WGS84:</span>
                        <pre class="bg-light p-2 border rounded font-monospace small mb-0">${esc(JSON.stringify(p.geometry, null, 2))}</pre>
                    </div>
                </div>`,
                onShown: el => {
                    const mapDiv = el.querySelector('#modal-plot-map');
                    if (mapDiv) drawPlotsMap(mapDiv, [p]);
                }
            });
        };
    });
}

/** 3. Quản lý Thương lái & Nông hộ chủ rừng */
export function page_map_chu_rung() {
    startPage('map-chu-rung', {
        title: 'Thương lái & Nông hộ',
        actions: newBtn('Thêm đối tượng', 'addFarmerModal()')
    }, root => {
        let activeTab = 'farmers';

        const renderContent = () => {
            const tabsHtml = `<ul class="nav nav-tabs mb-3">
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'farmers' ? 'active' : ''}" onclick="switchFarmerTab('farmers')"><i class="fa fa-person-digging me-1"></i>Hộ trồng rừng / Nông hộ (${DB.farmers.length})</button></li>
                <li class="nav-item"><button type="button" class="nav-link ${activeTab === 'suppliers' ? 'active' : ''}" onclick="switchFarmerTab('suppliers')"><i class="fa fa-warehouse me-1"></i>Nhà cung cấp, thương lái (${DB.suppliers.length})</button></li>
            </ul>`;

            let bodyHtml = '';
            if (activeTab === 'farmers') {
                bodyHtml = card('', table([
                    { title: 'Mã Hộ', render: f => `<span class="code text-primary">${esc(f.id)}</span>` },
                    { title: 'Chủ vườn / Nông hộ', render: f => `<b>${esc(f.name)}</b><span class="sub">CCCD/MST: ${esc(f.cccd)}</span>` },
                    { title: 'Số điện thoại', render: f => esc(f.phone) },
                    { title: 'Địa chỉ vườn cây', render: f => esc(f.address) },
                    { title: 'Diện tích (ha)', num: true, render: f => fmt(f.areaHa, 2) },
                    { title: 'Loài cây', render: f => `<i>${esc(f.species)}</i>` },
                    { title: 'Hồ sơ pháp lý đất', render: f => esc(f.landDoc) },
                    { title: 'Vườn cây liên kết', render: f => f.plots.map(pid => `<span class="tag">${esc(pid)}</span>`).join('') },
                    { title: 'Hiện trạng', render: f => pill(f.eudrStatus, f.eudrStatus === 'PASS' ? 'Đạt chuẩn' : 'Cảnh báo') }
                ], DB.farmers), '', 'panel-flush');
            } else {
                bodyHtml = card('', table([
                    { title: 'Mã Đơn Vị', render: s => `<span class="code text-primary">${esc(s.id)}</span>` },
                    { title: 'Tên xưởng / Nhà cung cấp', render: s => `<b>${esc(s.name)}</b><span class="sub">MST: ${esc(s.taxCode)}</span>` },
                    { title: 'Loại nguồn', render: s => `<span class="tag">${s.type === 'IMPORT' ? 'Nhập khẩu' : 'Trong nước'}</span>` },
                    { title: 'Đại diện & Liên hệ', render: s => `${esc(s.contact)}<span class="sub">${esc(s.email)}</span>` },
                    { title: 'Địa chỉ', render: s => esc(s.address) },
                    { title: 'Chuỗi cung ứng', render: s => esc(s.chain) },
                    { title: 'Cam kết nguồn gốc', render: s => s.commitment ? `<span class="pill pill-pass"><i class="fa fa-check"></i>Đã ký cam kết</span>` : `<span class="pill pill-fail"><i class="fa fa-ban"></i>Chưa ký</span>` },
                    { title: 'Hợp đồng mua bán', render: s => s.contractNo ? `${esc(s.contractNo)}<span class="sub">Hạn: ${esc(s.contractExpiry)}</span>` : '–' }
                ], DB.suppliers), '', 'panel-flush');
            }

            root.innerHTML = tabsHtml + bodyHtml;
        };

        window.switchFarmerTab = function(tab) {
            activeTab = tab;
            renderContent();
        };

        window.addFarmerModal = function() {
            openModal({
                title: 'Thêm hộ trồng rừng',
                size: 'modal-lg',
                submitText: 'Lưu hồ sơ hộ',
                body: `<div class="row g-2">
                    ${field('Mã hộ trồng rừng', 'id', `HL-${String(DB.farmers.length + 1).padStart(2,'0')}`, { required: true, col: 4 })}
                    ${field('Họ và tên chủ rừng', 'name', '', { required: true, col: 8 })}
                    ${field('CCCD / Định danh cá nhân', 'cccd', '', { required: true, col: 6 })}
                    ${field('Số điện thoại', 'phone', '', { col: 6 })}
                    ${field('Địa chỉ thường trú & vị trí rừng', 'address', 'Định Quán, Đồng Nai', { required: true, col: 12 })}
                    ${field('Loài cây trồng', 'species', 'Hevea brasiliensis', { type: 'select', options: speciesOptions(), col: 6 })}
                    ${field('Diện tích rừng (ha)', 'areaHa', 3.0, { type: 'number', required: true, col: 6, attrs: 'step="0.1"' })}
                    ${field('Hồ sơ đất (Số sổ đỏ)', 'landDoc', 'GCNQSDĐ CN ', { required: true, col: 12 })}
                </div>`,
                onSubmit: data => guarded('supplier', () => {
                    const newFarmer = {
                        id: data.id.trim(),
                        name: data.name.trim(),
                        type: 'SMALLHOLDER',
                        phone: data.phone.trim(),
                        cccd: data.cccd.trim(),
                        address: data.address.trim(),
                        areaHa: parseFloat(data.areaHa) || 0,
                        species: data.species,
                        landDoc: data.landDoc.trim(),
                        plots: [],
                        eudrStatus: 'PASS'
                    };
                    DB.farmers.push(newFarmer);
                    logAction(newFarmer.id, 'Thêm hộ trồng rừng', `${newFarmer.name}, ${newFarmer.areaHa} ha`);
                    toast(`Đã lưu hồ sơ hộ ${newFarmer.name}`);
                    renderContent();
                })
            });
        };

        renderContent();
    });
}

/** 4. Đợt kiểm kê & Đánh giá hiện trạng vùng trồng */
export function page_map_kiem_ke() {
    startPage('map-kiem-ke', {
        title: 'Đợt kiểm kê vùng trồng',
        actions: newBtn('Tạo đợt kiểm kê', 'addBatchModal()')
    }, root => {
        const tableHtml = card('', table([
            { title: 'Mã Đợt', render: b => `<span class="code text-primary">${esc(b.id)}</span>` },
            { title: 'Tên đợt kiểm kê', render: b => `<b>${esc(b.name)}</b>` },
            { title: 'Ngày thẩm tra', render: b => esc(b.date) },
            { title: 'Cán bộ kiểm tra', render: b => esc(b.inspector) },
            { title: 'Diện tích (ha)', num: true, render: b => fmt(b.totalAreaHa, 1) + ' ha' },
            { title: 'Số vườn cây', num: true, render: b => b.plotsChecked + ' vườn' },
            { title: 'Hiện trạng', render: b => b.deforestationStatus.includes('CLEAR') ? `<span class="pill pill-pass"><i class="fa fa-check"></i>100% Đạt chuẩn</span>` : `<span class="pill pill-fail"><i class="fa fa-ban"></i>${esc(b.deforestationStatus)}</span>` },
            { title: 'Phân loại rủi ro', render: b => pill(b.riskAssessment, b.riskAssessment === 'LOW' ? 'Rủi ro thấp' : b.riskAssessment === 'HIGH' ? 'Rủi ro cao' : 'Tiêu chuẩn') },
            { title: '', render: b => `<button class="btn btn-sm btn-light btn-icon" onclick="viewBatchDetail('${b.id}')" title="Xem biên bản"><i class="fa fa-file-lines text-primary"></i></button>` }
        ], DB.surveyBatches), '', 'panel-flush');

        root.innerHTML = tableHtml;

        window.addBatchModal = function() {
            openModal({
                title: 'Tạo đợt kiểm kê',
                size: 'modal-lg',
                submitText: 'Tạo đợt kiểm kê',
                body: `<div class="row g-2">
                    ${field('Mã đợt kiểm kê', 'id', `BAT-2026-${String(DB.surveyBatches.length + 1).padStart(2,'0')}`, { required: true, col: 4 })}
                    ${field('Tên đợt kiểm kê', 'name', 'Đợt thẩm tra vùng trồng khai thác ', { required: true, col: 8 })}
                    ${field('Ngày thực hiện', 'date', todayISO(), { type: 'date', required: true, col: 4 })}
                    ${field('Cán bộ phụ trách', 'inspector', ROLES[currentRole()], { required: true, col: 4 })}
                    ${field('Mức rủi ro sơ bộ', 'riskAssessment', 'LOW', { type: 'select', options: [['LOW', 'Thấp (Low Risk)'], ['STANDARD', 'Chuẩn (Standard)'], ['HIGH', 'Cao (High Risk)']], col: 4 })}
                    ${field('Tổng diện tích kiểm kê (ha)', 'totalAreaHa', 20.5, { type: 'number', required: true, col: 6, attrs: 'step="0.1"' })}
                    ${field('Số vườn cây kiểm tra', 'plotsChecked', 4, { type: 'number', required: true, col: 6 })}
                </div>`,
                onSubmit: data => guarded('forest', () => {
                    const newBatch = {
                        id: data.id.trim(),
                        name: data.name.trim(),
                        date: data.date,
                        inspector: data.inspector.trim(),
                        totalAreaHa: parseFloat(data.totalAreaHa) || 0,
                        plotsChecked: parseInt(data.plotsChecked) || 0,
                        deforestationStatus: '100% CLEAR',
                        riskAssessment: data.riskAssessment
                    };
                    DB.surveyBatches.push(newBatch);
                    logAction(newBatch.id, 'Tạo đợt kiểm kê', newBatch.name);
                    toast(`Đã tạo ${newBatch.id}`);
                    refresh();
                })
            });
        };

        window.viewBatchDetail = function(batchId) {
            const b = DB.surveyBatches.find(x => x.id === batchId);
            if (!b) return;
            openModal({
                title: `Biên bản thẩm tra: ${b.name}`,
                size: 'modal-md',
                body: `<div class="p-2 small">
                    <div class="mb-2"><b>Mã đợt:</b> ${esc(b.id)} | <b>Ngày:</b> ${esc(b.date)}</div>
                    <div class="mb-2"><b>Cán bộ thẩm định:</b> ${esc(b.inspector)}</div>
                    <div class="mb-2"><b>Tổng diện tích:</b> ${b.totalAreaHa} ha (${b.plotsChecked} thửa)</div>
                    <div class="mb-2"><b>Kết quả đối chiếu viễn thám:</b> ${esc(b.deforestationStatus)}</div>
                    <div class="mb-2"><b>Phân loại rủi ro EUDR:</b> <span class="badge ${b.riskAssessment === 'LOW' ? 'bg-success' : 'bg-danger'}">${b.riskAssessment}</span></div>
                    
                </div>`
            });
        };
    });
}

/** 5. Bộ lọc GeoJSON & Xuất dữ liệu bản đồ */
export function page_map_export_traces() {
    startPage('map-export-traces', {
        title: 'Xuất dữ liệu bản đồ GeoJSON & DDS',
        actions: `<button class="btn btn-sm btn-primary" onclick="exportDdsForOrder('DPO26102801')"><i class="fa fa-download me-1"></i>Xuất GeoJSON DPO26102801</button>`
    }, root => {
        const samplePass = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [[[107.362145, 11.245123], [107.364512, 11.245481], [107.364873, 11.243214], [107.362417, 11.242876], [107.362145, 11.245123]]]
                    },
                    properties: { PlotID: "PLOT-VN-DN-02", AreaHa: 6.5, Species: "Hevea brasiliensis", DeforestationPost2020: false }
                }
            ]
        };

        const sampleFailPolygon = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [107.36, 11.24] },
                    properties: { PlotID: "PLOT-ERR-01", AreaHa: 8.5, Species: "Acacia mangium" }
                }
            ]
        };

        const sampleFailLoss = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [[[108.341203, 11.721407], [108.344697, 11.721753], [108.342611, 11.724089], [108.341203, 11.721407]]]
                    },
                    properties: { PlotID: "PLOT-VN-LD-99", AreaHa: 5.1, DeforestationPost2020: true }
                }
            ]
        };

        const checkerHtml = card('Kiểm tra GeoJSON', `
            <div class="row g-2 mb-2">
                <div class="col-12 d-flex flex-wrap gap-2 align-items-center">
                    
                    <button class="btn btn-xs btn-outline-success" onclick="loadCheckerSample('pass')">Mẫu đạt</button>
                    <button class="btn btn-xs btn-outline-warning" onclick="loadCheckerSample('err_poly')">Mẫu lỗi Polygon</button>
                    <button class="btn btn-xs btn-outline-danger" onclick="loadCheckerSample('err_loss')">Mẫu lỗi mất rừng</button>
                </div>
                <div class="col-12">
                    <textarea id="geojson-input-area" class="form-control font-monospace small" rows="7" placeholder="GeoJSON">${esc(JSON.stringify(samplePass, null, 2))}</textarea>
                </div>
                <div class="col-12">
                    <button class="btn btn-sm btn-primary" onclick="runLiveGeoJsonCheck()"><i class="fa fa-magnifying-glass me-1"></i>Kiểm tra</button>
                </div>
                <div class="col-12 mt-2" id="geojson-check-results"></div>
            </div>
        `);

        const ddsExportTableHtml = card('Gói DDS TRACES-NT', table([
            { title: 'Đơn Hàng', render: o => `<span class="code text-primary">${esc(o.id)}</span>` },
            { title: 'Khách hàng EU', render: o => `<b>${esc(o.customer)}</b><span class="sub">EORI: ${esc(o.eori)}</span>` },
            { title: 'Số Pallet / Thể tích', render: o => `${o.palletIds.length} pallet (${fmt(o.items[0].quantity, 2)} m³)` },
            { title: 'Thửa đất rừng', render: o => `${orderPlots(o).length} thửa đất` },
            { title: 'Dung lượng GeoJSON', render: o => `<span class="badge bg-light text-dark border">142 KB (&lt; 25MB)</span>` },
            { title: 'Mã số DDS', render: o => o.dds ? `<code class="text-primary">${esc(o.dds.reference)}</code>` : '<span class="text-muted">Chờ cấp mã</span>' },
            { title: 'Trạng thái', render: o => `<span class="pill pill-pass"><i class="fa fa-check"></i>Sẵn sàng nộp</span>` },
            { title: '', render: o => `<button class="btn btn-sm btn-light" onclick="exportGeo('${o.id}')"><i class="fa fa-download me-1"></i>Tải GeoJSON</button>` }
        ], DB.orders), '', 'panel-flush');

        root.innerHTML = checkerHtml + ddsExportTableHtml;

        window.loadCheckerSample = function(type) {
            const ta = document.getElementById('geojson-input-area');
            if (type === 'pass') ta.value = JSON.stringify(samplePass, null, 2);
            else if (type === 'err_poly') ta.value = JSON.stringify(sampleFailPolygon, null, 2);
            else if (type === 'err_loss') ta.value = JSON.stringify(sampleFailLoss, null, 2);
            runLiveGeoJsonCheck();
        };

        window.runLiveGeoJsonCheck = function() {
            const val = document.getElementById('geojson-input-area').value;
            const resBox = document.getElementById('geojson-check-results');
            try {
                const json = JSON.parse(val);
                let checks = [];
                let pass = true;

                if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
                    checks.push({ name: 'Chuẩn FeatureCollection', ok: true, msg: `${json.features.length} đối tượng` });
                } else {
                    checks.push({ name: 'Chuẩn FeatureCollection', ok: false, msg: 'Sai định dạng' });
                    pass = false;
                }

                let decimalOk = true, polygonClosed = true, areaThresholdOk = true, deforestationOk = true;

                (json.features || []).forEach(f => {
                    const g = f.geometry || {};
                    const props = f.properties || {};

                    if (g.type === 'Point') {
                        const coords = g.coordinates || [];
                        const d0 = (String(coords[0]).split('.')[1] || '').length;
                        const d1 = (String(coords[1]).split('.')[1] || '').length;
                        if (d0 < 6 || d1 < 6) decimalOk = false;
                        if (props.AreaHa && props.AreaHa > 4) areaThresholdOk = false;
                    } else if (g.type === 'Polygon') {
                        const ring = (g.coordinates || [])[0] || [];
                        ring.forEach(([lng, lat]) => {
                            if ((String(lng).split('.')[1] || '').length < 6 || (String(lat).split('.')[1] || '').length < 6) decimalOk = false;
                        });
                        if (ring.length > 0) {
                            const first = ring[0], last = ring[ring.length - 1];
                            if (first[0] !== last[0] || first[1] !== last[1]) polygonClosed = false;
                        }
                    }

                    if (props.DeforestationPost2020 === true) deforestationOk = false;
                });

                checks.push({ name: 'WGS84 &ge; 6 số thập phân', ok: decimalOk, msg: decimalOk ? 'Đạt' : 'Dưới 6 số thập phân' });
                checks.push({ name: 'Đa giác khép kín', ok: polygonClosed, msg: polygonClosed ? 'Đạt' : 'Chưa khép kín' });
                checks.push({ name: 'Ngưỡng 4 ha', ok: areaThresholdOk, msg: areaThresholdOk ? 'Đạt' : 'Thửa > 4 ha cần Polygon' });
                checks.push({ name: 'Mốc 31/12/2020', ok: deforestationOk, msg: deforestationOk ? 'Đạt' : 'Có mất rừng' });

                if (!decimalOk || !polygonClosed || !areaThresholdOk || !deforestationOk) pass = false;

                resBox.innerHTML = `
                    <div class="alert ${pass ? 'alert-success' : 'alert-danger'} py-2 mb-2">
                        <b>${pass ? 'Đạt' : 'Có lỗi, không xuất được'}</b>
                    </div>
                    <ul class="list-unstyled mb-0">
                        ${checks.map(c => `<li class="py-1 small"><i class="fa ${c.ok ? 'fa-check text-success' : 'fa-xmark text-danger'} me-2"></i><b>${c.name}:</b> ${c.msg}</li>`).join('')}
                    </ul>
                `;
            } catch (e) {
                resBox.innerHTML = `<div class="alert alert-danger py-2 small mb-0">Lỗi cú pháp JSON: ${e.message}</div>`;
            }
        };

        window.exportDdsForOrder = function(orderId) {
            exportGeo(orderId);
        };
    });
}
