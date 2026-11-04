/**
 * Khung giao diện dùng chung: thanh bên, thanh trên, modal, form, bảng, bản đồ, tệp tải về.
 */
const NAV = [
    { header: 'Nguyên liệu' },
    { key: 'hop-dong', title: 'Nhà cung cấp & Tọa độ', icon: 'fa-handshake', url: 'hop-dong-cung-ung.html' },
    { key: 'tiep-nhan', title: 'Tiếp nhận & Rủi ro', icon: 'fa-truck-ramp-box', url: 'tiep-nhan.html' },
    { key: 'kho-nguyen-lieu', title: 'Kho 3 khu', icon: 'fa-warehouse', url: 'kho-nguyen-lieu.html' },
    { header: 'Sản xuất' },
    { key: 'lenh-san-xuat', title: 'Lệnh sản xuất', icon: 'fa-clipboard-list', url: 'lenh-san-xuat.html' },
    { key: 'nhat-ky-san-xuat', title: 'Nhật ký 7 công đoạn', icon: 'fa-industry', url: 'nhat-ky-san-xuat.html' },
    { header: 'Xuất hàng' },
    { key: 'pallet', title: 'Pallet thành phẩm', icon: 'fa-boxes-stacked', url: 'pallet-manage.html' },
    { key: 'don-hang', title: 'Đơn EU & DDS', icon: 'fa-file-circle-check', url: 'don-hang-eudr.html' },
    { key: 'truy-xuat', title: 'Truy xuất', icon: 'fa-route', url: 'truy-xuat.html' }
];

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
    const nav = NAV.map(item => item.header
        ? `<li class="nav-head">${item.header}</li>`
        : `<li><a href="${item.url}" class="nav-link-item ${item.key === activeKey ? 'active' : ''}"${item.key === activeKey ? ' aria-current="page"' : ''}><i class="fa ${item.icon}"></i><span>${item.title}</span></a></li>`
    ).join('');
    const roleOptions = Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === currentRole() ? 'selected' : ''}>${v}</option>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `
        <aside class="sidebar" id="sidebar">
            <a class="brand" href="tiep-nhan.html">
                <img class="brand-logo" src="img/logo.png" alt="Long Việt Premium Hardwood Plywood" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'brand-fallback',textContent:'LONG VIỆT'}))">
                <small>Truy xuất nguồn gốc EUDR</small>
            </a>
            <ul class="nav-list">${nav}</ul>
            <div class="sidebar-foot">Quy định (EU) 2023/1115<br>Áp dụng từ 30/12/2026</div>
        </aside>
        <div class="main">
            <header class="topbar">
                <button class="btn btn-sm btn-light d-lg-none" aria-label="Mở menu" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="fa fa-bars"></i></button>
                <div class="topbar-title"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
                <div class="topbar-actions" id="page-actions">${actions}</div>
                <label class="role-switch" title="Vai trò demo. Bản triển khai phải gắn với tài khoản đăng nhập">
                    <span class="avatar" aria-hidden="true">${esc(ROLES[currentRole()].split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</span>
                    <select id="role-select" aria-label="Vai trò">${roleOptions}</select>
                </label>
            </header>
            <main class="content" id="page"></main>
        </div>
        <div class="toast-box" id="toast-box" role="status" aria-live="polite"></div>`);
    document.getElementById('role-select').addEventListener('change', e => {
        setRole(e.target.value);
        location.reload();
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
        toast(`Thao tác này dành cho vai trò ${rolesFor(perm)}. Đổi vai trò ở góc trên bên phải.`, 'err');
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
    const map = L.map(el, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(map);
    const bounds = [];
    plots.forEach(p => {
        const bad = !p.forest || p.forest.result !== 'CLEAR';
        const color = bad ? '#b42318' : highlight.includes(p.id) ? '#1d6fa5' : '#1f7a55';
        const popup = `<b>${esc(p.id)}</b><br>${esc(p.owner)}<br>${esc(p.place)}<br>${esc(p.areaHa)} ha, <i>${esc(p.species)}</i>`;
        if (p.geometry.type === 'Point') {
            const ll = [p.geometry.coordinates[1], p.geometry.coordinates[0]];
            bounds.push(ll);
            L.circleMarker(ll, { radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 1 }).bindPopup(popup).addTo(map);
        } else {
            const ll = p.geometry.coordinates[0].map(c => [c[1], c[0]]);
            bounds.push(...ll);
            L.polygon(ll, { color, weight: 2, fillOpacity: 0.3 }).bindPopup(popup).addTo(map);
            // Thửa rất nhỏ so với khung nhìn toàn quốc nên thêm điểm đánh dấu để vẫn nhìn thấy.
            L.circleMarker(ll[0], { radius: 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 1 }).bindPopup(popup).addTo(map);
        }
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    else map.setView([14, 107], 5);
    setTimeout(() => map.invalidateSize(), 150);
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
        body: `<div class="qr-tag" id="print-tag"><b>LONG VIET PLYWOOD</b><div class="qr-box"></div><strong>${esc(code)}</strong><dl>${lines.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`,
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
