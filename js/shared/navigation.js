/**
 * Khung giao diện dùng chung: thanh bên, thanh trên, modal, form, bảng, bản đồ, tệp tải về.
 */
/**
 * Khung giao diện dùng chung 3 Phân hệ: Nhà Máy, Bản Đồ, Quản Trị
 */
const SUBSYSTEMS = {
    factory: {
        id: 'factory',
        name: 'Nhà Máy',
        fullName: 'Phân Hệ Nhà Máy & Chế Biến Gỗ',
        icon: 'fa-industry',
        badge: 'Factory',
        defaultUrl: '../nha-may/lenh-mua.html',
        nav: [
            { header: 'NGUYÊN LIỆU & SẢN XUẤT' },
            { key: 'lenh-mua', title: 'Lệnh mua nguyên liệu', icon: 'fa-file-invoice', url: '../nha-may/lenh-mua.html' },
            { key: 'hop-dong', title: 'Nhà cung cấp', icon: 'fa-handshake', url: '../nha-may/hop-dong-cung-ung.html' },
            { key: 'tiep-nhan', title: 'Tiếp nhận nguyên liệu', icon: 'fa-truck-ramp-box', url: '../nha-may/tiep-nhan.html' },
            { key: 'kho-nguyen-lieu', title: 'Kho nguyên liệu', icon: 'fa-warehouse', url: '../nha-may/kho-nguyen-lieu.html' },
            { key: 'lenh-san-xuat', title: 'Lệnh sản xuất', icon: 'fa-clipboard-list', url: '../nha-may/lenh-san-xuat.html' },
            { key: 'nhat-ky-san-xuat', title: 'Nhật ký sản xuất', icon: 'fa-industry', url: '../nha-may/nhat-ky-san-xuat.html' },
            { key: 'pallet', title: 'Kho thành phẩm', icon: 'fa-boxes-stacked', url: '../nha-may/pallet-manage.html', badge: '1' },
            { header: 'NHÂN SỰ' },
            { key: 'cham-cong-nhan-su', tab: 'attendance', first: true, title: 'Chấm công', icon: 'fa-calendar-check', url: '../nha-may/cham-cong-nhan-su.html?tab=attendance' },
            { key: 'cham-cong-nhan-su', tab: 'workers', title: 'Nhân sự', icon: 'fa-id-card-clip', url: '../nha-may/cham-cong-nhan-su.html?tab=workers' },
            { header: 'XUẤT BÁN & TUÂN THỦ' },
            { key: 'don-hang', title: 'Đơn hàng điện tử & DDS', icon: 'fa-file-circle-check', url: '../nha-may/don-hang-eudr.html', badge: '1' },
            { key: 'truy-xuat', title: 'Truy xuất đơn hàng', icon: 'fa-route', url: '../nha-may/truy-xuat.html' },
            { header: 'DANH MỤC' },
            { key: 'factory-danh-muc', tab: 'bays', first: true, title: 'Ô kho', icon: 'fa-warehouse', url: '../nha-may/factory-danh-muc.html?tab=bays' },
            { key: 'factory-danh-muc', tab: 'machines', title: 'Máy móc', icon: 'fa-gears', url: '../nha-may/factory-danh-muc.html?tab=machines' },
            { key: 'factory-danh-muc', tab: 'specs', title: 'Quy cách ván', icon: 'fa-layer-group', url: '../nha-may/factory-danh-muc.html?tab=specs' },
            { key: 'factory-danh-muc', tab: 'materials', title: 'Vật tư', icon: 'fa-boxes-packing', url: '../nha-may/factory-danh-muc.html?tab=materials' },
            { key: 'factory-danh-muc', tab: 'ports_hs', title: 'Cảng & Mã HS', icon: 'fa-ship', url: '../nha-may/factory-danh-muc.html?tab=ports_hs' },
            { header: 'THỐNG KÊ' },
            { key: 'dashboard', title: 'Thống kê', icon: 'fa-chart-pie', url: '../nha-may/index.html' }
        ]
    },
    map: {
        id: 'map',
        name: 'Bản Đồ',
        fullName: 'Phân Hệ Bản Đồ GIS Vùng Trồng',
        icon: 'fa-map-location-dot',
        badge: 'GIS Map',
        defaultUrl: '../ban-do/map-tong-quan.html',
        nav: [
            { header: 'Bản đồ không gian' },
            { key: 'map-tong-quan', title: 'Bản đồ vùng trồng GIS', icon: 'fa-earth-asia', url: '../ban-do/map-tong-quan.html' },
            { key: 'map-thua-dat', title: 'Vườn cây & Thửa đất', icon: 'fa-draw-polygon', url: '../ban-do/map-thua-dat.html' },
            { key: 'map-chu-rung', title: 'Thương lái & Nông hộ', icon: 'fa-people-roof', url: '../ban-do/map-chu-rung.html' },
            { key: 'map-kiem-ke', title: 'Đợt kiểm kê vùng trồng', icon: 'fa-calendar-check', url: '../ban-do/map-kiem-ke.html' },
            { key: 'map-export-traces', title: 'Xuất dữ liệu bản đồ GeoJSON', icon: 'fa-code-compare', url: '../ban-do/map-export-traces.html' }
        ]
    },
    admin: {
        id: 'admin',
        name: 'Quản Trị',
        fullName: 'Phân Hệ Quản Trị & Master Data',
        icon: 'fa-sliders',
        badge: 'Admin',
        defaultUrl: '../quan-tri/admin-dashboard.html',
        nav: [
            { header: 'Tổng quan hệ thống' },
            { key: 'admin-dashboard', title: 'Bàn làm việc quản trị', icon: 'fa-gauge-high', url: '../quan-tri/admin-dashboard.html' },
            { header: 'Danh mục lâm nghiệp' },
            { key: 'admin-loai-cay', title: 'Loài cây & Giống gỗ', icon: 'fa-tree', url: '../quan-tri/admin-loai-cay.html' },
            { key: 'admin-dia-ban', title: 'Địa bàn hành chính', icon: 'fa-location-dot', url: '../quan-tri/admin-dia-ban.html' },
            { key: 'admin-phap-ly-dat', title: 'Pháp lý đất & Chứng chỉ', icon: 'fa-certificate', url: '../quan-tri/admin-phap-ly-dat.html' },
            { key: 'admin-doi-tac', title: 'Đối tác & Khách hàng EU', icon: 'fa-users-gear', url: '../quan-tri/admin-doi-tac.html' },
            { header: 'Bảo mật & Kiểm toán' },
            { key: 'admin-tai-khoan', title: 'Tài khoản & Phân quyền', icon: 'fa-user-shield', url: '../quan-tri/admin-tai-khoan.html' },
            { key: 'cham-cong-nhan-su', title: 'Hồ sơ nhân sự & Chấm công', icon: 'fa-user-check', url: '../nha-may/cham-cong-nhan-su.html' },
            { key: 'admin-lich-su', title: 'Nhật ký kiểm toán (Audit)', icon: 'fa-clock-rotate-left', url: '../quan-tri/admin-lich-su.html' }
        ]
    }
};

function getActiveSubsystem(activeKey) {
    if (!activeKey) return 'factory';
    if (activeKey.startsWith('map-') || activeKey === 'map') return 'map';
    if (activeKey.startsWith('admin-') || activeKey === 'admin') return 'admin';
    return 'factory';
}

const esc = value => String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n, d = 2) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d });
const STATUS = {
    PASS: ['pass', 'fa-circle-check', 'Đạt'],
    PENDING: ['wait', 'fa-clock', 'Chờ bổ sung/duyệt'],
    FAIL: ['fail', 'fa-ban', 'Không đạt'],
    LOW: ['pass', 'fa-circle-check', 'Thấp'],
    MEDIUM: ['wait', 'fa-triangle-exclamation', 'Trung bình'],
    HIGH: ['fail', 'fa-ban', 'Cao'],
    CLEAR: ['pass', 'fa-circle-check', 'Không chồng lấn'],
    OVERLAP: ['wait', 'fa-triangle-exclamation', 'Chồng lấn một phần'],
    LOSS: ['fail', 'fa-ban', 'Mất rừng sau mốc'],
    NONE: ['fail', 'fa-circle-question', 'Chưa đối chiếu'],
    DRAFT: ['info', 'fa-pen', 'Nháp']
};
const pill = (key, label) => {
    const [cls, icon, text] = STATUS[key] || ['info', 'fa-circle', key];
    return `<span class="pill pill-${cls}"><i class="fa ${icon}"></i>${esc(label || text)}</span>`;
};
const tag = text => `<span class="tag">${esc(text)}</span>`;
const orderPill = o => pill(o.status === 4 || o.status === 3 ? 'PASS' : o.status < 0 ? 'FAIL' : o.status === 0 ? 'DRAFT' : 'MEDIUM', ORDER_STATUS[o.status]);

function renderAppLayout(activeKey, { title, subtitle, actions = '' }) {
    window.currentPageKey = activeKey;
    const curSysKey = getActiveSubsystem(activeKey);
    const curSys = SUBSYSTEMS[curSysKey] || SUBSYSTEMS.factory;

    const urlTab = new URLSearchParams(location.search).get('tab');
    const isActive = item => item.key === activeKey && (!item.tab || item.tab === urlTab || (!urlTab && item.first));
    const nav = curSys.nav.map(item => item.header
        ? `<li class="nav-head">${esc(item.header)}</li>`
        : `<li><a href="${item.url}" class="nav-link-item ${isActive(item) ? 'active' : ''}"${isActive(item) ? ' aria-current="page"' : ''}><i class="fa ${item.icon}"></i><span class="flex-grow-1">${esc(item.title)}</span>${item.badge ? `<span class="nav-item-badge">${esc(item.badge)}</span>` : ''}</a></li>`
    ).join('');


    const subsystemPills = Object.values(SUBSYSTEMS).map(sys => `
        <a href="${sys.defaultUrl}" class="subsystem-btn ${sys.id === curSysKey ? 'active' : ''}" title="${esc(sys.fullName)}">
            <i class="fa ${sys.icon}"></i><span>${esc(sys.name)}</span>
        </a>
    `).join('');

    document.body.insertAdjacentHTML('afterbegin', `
        <aside class="sidebar" id="sidebar">
            <a class="brand brand-header-v2" href="../portal.html" title="Về Cổng chọn phân hệ">
                <div class="d-flex align-items-center gap-2">
                    <div class="brand-logo-circle" style="background: linear-gradient(135deg, #009b5c, #166534);">
                        <i class="fa fa-tree text-white fs-6"></i>
                    </div>
                    <div class="brand-text-wrap text-start">
                        <div class="brand-name-v2" style="letter-spacing: 0.5px;"><span style="color:#009b5c">ECO</span><span style="color:#ec4c24">TECH2A</span></div>
                        <div class="brand-sub-v2">CSDL Vùng Trồng &amp; Quản Lý Gỗ</div>
                    </div>
                </div>
            </a>
            <div class="sidebar-subsystem-tag" onclick="openSubsystemModal()" title="Bấm để chuyển đổi phân hệ" style="cursor:pointer">
                <i class="fa ${curSys.icon}"></i>
                <span>${esc(curSys.fullName)}</span>
                <i class="fa fa-chevron-right ms-auto small opacity-75"></i>
            </div>
            <ul class="nav-list">${nav}</ul>
            </aside>
        <div class="main">
            <header class="topbar">
                <button class="btn btn-sm btn-light d-lg-none" aria-label="Mở menu" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="fa fa-bars"></i></button>
                <div class="topbar-subsystem-tag">
                    <span class="subsystem-badge-pill"><i class="fa ${curSys.icon} me-1.5 text-success"></i><span class="subsystem-badge-text">${esc(curSys.fullName)}</span></span>
                </div>
                <div class="topbar-title"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
                <div class="topbar-actions" id="page-actions">${actions}</div>
            </header>
            <main class="content" id="page"></main>
        </div>
        <div class="toast-box" id="toast-box" role="status" aria-live="polite"></div>`);
}

function openSubsystemModal() {
    const curSysKey = getActiveSubsystem(window.currentPageKey || '');
    const cardsHtml = Object.values(SUBSYSTEMS).map(sys => {
        const isCur = sys.id === curSysKey;
        const modulesCount = sys.nav.filter(n => !n.header).length;
        return `
            <div class="col-md-4">
                <div class="card h-100 ${isCur ? 'border-primary border-2 shadow-sm' : ''}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="subsystem-modal-icon ${isCur ? 'bg-primary text-white' : 'bg-light text-primary'}">
                                <i class="fa ${sys.icon}"></i>
                            </span>
                            <div>
                                <h4 class="h6 mb-0 fw-bold">${esc(sys.name)}</h4>
                                <small class="text-muted">${esc(sys.badge)}</small>
                            </div>
                            
                        </div>
                        <p class="small text-muted flex-grow-1 mb-3">${modulesCount} chức năng</p>
                        <a href="${sys.defaultUrl}" class="btn btn-sm ${isCur ? 'btn-outline-primary disabled' : 'btn-primary'} w-100">
                            ${isCur ? '<i class="fa fa-check me-1"></i>Đang mở' : '<i class="fa fa-arrow-right-to-bracket me-1"></i>Mở'}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    openModal({
        title: 'Đổi phân hệ',
        size: 'modal-lg',
        body: `
            
            <div class="row g-3 mb-3">${cardsHtml}</div>
            <div class="text-end">
                <a href="../portal.html" class="btn btn-sm btn-outline-danger"><i class="fa fa-arrow-right-from-bracket me-1"></i>Thoát về Cổng</a>
            </div>
        `
    });
}

function toast(message, type = 'ok') {
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.innerHTML = `<i class="fa ${type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${esc(message)}</span>`;
    document.getElementById('toast-box').append(el);
    setTimeout(() => el.remove(), type === 'ok' ? 3500 : 6500);
}

/** Chạy thao tác có kiểm tra quyền; lỗi nghiệp vụ hiện thành thông báo. Trả về true nếu thành công. */
function guarded(perm, fn) {
    if (perm && !can(perm)) {
        toast(`Thao tác này dành cho vai trò ${rolesFor(perm)}.`, 'err');
        return false;
    }
    try {
        fn();
        saveDB();
        return true;
    } catch (e) {
        toast(e.message, 'err');
        return false;
    }
}

function field(label, name, value = '', opts = {}) {
    const { type = 'text', required, options, col = 6, help, attrs = '' } = opts;
    const req = required ? 'required' : '';
    let input;
    if (type === 'select') {
        input = `<select class="form-select form-select-sm" name="${name}" ${req} ${attrs}>${options.map(o => {
            const [v, t] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`;
        }).join('')}</select>`;
    } else if (type === 'textarea') {
        input = `<textarea class="form-control form-control-sm" name="${name}" rows="${opts.rows || 2}" ${req} ${attrs}>${esc(value)}</textarea>`;
    } else {
        input = `<input class="form-control form-control-sm" type="${type}" name="${name}" value="${esc(value)}" ${req} ${attrs}>`;
    }
    return `<div class="col-md-${col}"><label class="form-label">${esc(label)}${required ? ' <span class="text-danger">*</span>' : ''}</label>${input}${help ? `<div class="form-text">${esc(help)}</div>` : ''}</div>`;
}

/** Modal dựng động. onSubmit trả về false để giữ modal mở. */
function openModal({ title, body, size = '', submitText, onSubmit, onShown, footerExtra = '' }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal fade';
    wrap.tabIndex = -1;
    wrap.innerHTML = `
        <div class="modal-dialog modal-dialog-scrollable ${size}">
            <form class="modal-content" novalidate>
                <div class="modal-header"><h2 class="modal-title">${esc(title)}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div>
                <div class="modal-body">${body}</div>
                <div class="modal-footer">${footerExtra}<button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Đóng</button>${submitText ? `<button class="btn btn-sm btn-primary">${esc(submitText)}</button>` : ''}</div>
            </form>
        </div>`;
    document.body.append(wrap);
    const modal = new bootstrap.Modal(wrap);
    const form = wrap.querySelector('form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!onSubmit) return;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            toast('Vui lòng điền đủ các trường bắt buộc', 'err');
            return;
        }
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        if (onSubmit(data, fd, form) !== false) modal.hide();
    });
    wrap.addEventListener('shown.bs.modal', () => onShown && onShown(wrap));
    wrap.addEventListener('hidden.bs.modal', () => wrap.remove());
    modal.show();
    return { modal, el: wrap, hide: () => modal.hide() };
}

function table(columns, rows, emptyText = 'Chưa có dữ liệu') {
    return `<div class="table-responsive"><table class="table data-table"><thead><tr>${columns.map(c => `<th class="${c.num ? 'text-end' : ''}">${esc(c.title)}</th>`).join('')}</tr></thead><tbody>
        ${rows.length ? rows.map(row => `<tr>${columns.map(c => `<td class="${c.num ? 'text-end num' : ''}">${c.render(row)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}" class="empty">${esc(emptyText)}</td></tr>`}
    </tbody></table></div>`;
}

const card = (title, body, right = '', cls = '') => `<section class="panel ${cls}">${title ? `<header class="panel-head"><h2>${esc(title)}</h2><div>${right}</div></header>` : ''}<div class="panel-body">${body}</div></section>`;
const kpi = (label, value, note, tone = '') => `<div class="kpi ${tone}"><span class="kpi-label">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;

function downloadFile(name, text, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function drawPlotsMap(el, plots, { highlight = [] } = {}) {
    if (typeof L === 'undefined') {
        el.innerHTML = '<div class="empty">Không tải được thư viện bản đồ. Kiểm tra kết nối mạng.</div>';
        return null;
    }
    const map = L.map(el, { scrollWheelZoom: true });
    
    // Sử dụng lớp vệ tinh Google Hybrid và Esri (chuẩn GIS, không bị chặn 403 như OpenStreetMap)
    const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20
    });
    const googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20
    });
    const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri Satellite',
        maxZoom: 19
    });

    googleHybrid.addTo(map);

    L.control.layers({
        '🛰️ Vệ tinh Google': googleHybrid,
        '🗺️ Bản đồ Google': googleStreets,
        '🌍 Vệ tinh Esri': esriSat
    }, null, { position: 'topright' }).addTo(map);

    const bounds = [];
    plots.forEach(p => {
        const bad = !p.forest || p.forest.result !== 'CLEAR';
        const color = bad ? '#ef4444' : highlight.includes(p.id) ? '#2563eb' : '#16a34a';
        const strokeColor = bad ? '#b91c1c' : highlight.includes(p.id) ? '#1d4ed8' : '#15803d';
        const popup = `<div style="font-family:'Plus Jakarta Sans','Inter',sans-serif;font-size:12px;line-height:1.5;min-width:180px;">
            <div style="font-weight:700;font-size:13px;color:#1e3a8a;margin-bottom:4px;">${esc(p.id)}</div>
            <div><b>Chủ vườn / Nông hộ:</b> ${esc(p.owner)}</div>
            <div><b>Địa bàn:</b> ${esc(p.place)}</div>
            <div><b>Loài cây:</b> <i>${esc(p.species)}</i></div>
            <div><b>Diện tích:</b> ${esc(p.areaHa)} ha</div>
            <div style="margin-top:5px;"><span class="badge ${bad ? 'bg-danger' : 'bg-success'} text-white" style="font-size:10.5px;padding:3px 8px;">${bad ? 'Cảnh báo vi phạm' : 'Đạt chuẩn (Trước 2021)'}</span></div>
        </div>`;
        if (p.geometry.type === 'Point') {
            const ll = [p.geometry.coordinates[1], p.geometry.coordinates[0]];
            bounds.push(ll);
            L.circleMarker(ll, { radius: 8, fillColor: color, color: '#fff', weight: 2.5, fillOpacity: 0.95 }).bindPopup(popup).addTo(map);
        } else {
            const ll = p.geometry.coordinates[0].map(c => [c[1], c[0]]);
            bounds.push(...ll);
            L.polygon(ll, { color: strokeColor, weight: 2.5, fillColor: color, fillOpacity: 0.35 }).bindPopup(popup).addTo(map);
            L.circleMarker(ll[0], { radius: 6, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.95 }).bindPopup(popup).addTo(map);
        }
    });

    // Toàn cảnh: bao quát toàn bộ vùng trồng
    if (bounds.length) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
        map.setView([14.0583, 108.2772], 6); // Toàn cảnh Việt Nam
    }
    setTimeout(() => map.invalidateSize(), 200);
    return map;
}

function qrInto(el, text) {
    if (typeof QRCode === 'undefined') {
        el.textContent = text;
        return;
    }
    new QRCode(el, { text, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M });
}

function showTag(title, code, lines) {
    openModal({
        title,
        size: 'modal-sm',
        body: `<div class="qr-tag" id="print-tag"><b>ECOTECH2A PLYWOOD</b><div class="qr-box"></div><strong>${esc(code)}</strong><dl>${lines.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`,
        footerExtra: '<button type="button" class="btn btn-sm btn-primary" onclick="window.print()"><i class="fa fa-print me-1"></i>In tem</button>',
        onShown: el => qrInto(el.querySelector('.qr-box'), code)
    });
}

/** Khởi động một trang: nạp dữ liệu, dựng khung, gọi render. */
function startPage(key, meta, render) {
    document.addEventListener('DOMContentLoaded', () => {
        loadDB();
        renderAppLayout(key, meta);
        window.refresh = () => render(document.getElementById('page'));
        window.refresh();
    });
}
