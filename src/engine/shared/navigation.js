import { Modal } from 'bootstrap';
import L from 'leaflet';
import QRCode from 'qrcode';
import { TENANT } from '../../config/tenant';
import { SUBSYSTEMS, getActiveSubsystem } from '../../lib/subsystems';
import {
    ORDER_STATUS,
    can,
    loadDB,
    rolesFor,
    saveDB,
} from './core.js';

/**
 * Khung giao diện dùng chung: thanh bên, thanh trên, modal, form, bảng, bản đồ, tệp tải về.
 */
export const esc = value => String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const fmt = (n, d = 2) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d });
export const STATUS = {
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
export const pill = (key, label) => {
    const [cls, icon, text] = STATUS[key] || ['info', 'fa-circle', key];
    return `<span class="pill pill-${cls}"><i class="fa ${icon}"></i>${esc(label || text)}</span>`;
};
export const tag = text => `<span class="tag">${esc(text)}</span>`;
export const orderPill = o => pill(o.status === 4 || o.status === 3 ? 'PASS' : o.status < 0 ? 'FAIL' : o.status === 0 ? 'DRAFT' : 'MEDIUM', ORDER_STATUS[o.status]);

export function openSubsystemModal() {
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
                <a href="/portal" class="btn btn-sm btn-outline-danger"><i class="fa fa-arrow-right-from-bracket me-1"></i>Thoát về Cổng</a>
            </div>
        `
    });
}

export function toast(message, type = 'ok') {
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.innerHTML = `<i class="fa ${type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${esc(message)}</span>`;
    document.getElementById('toast-box').append(el);
    setTimeout(() => el.remove(), type === 'ok' ? 3500 : 6500);
}

/** Chạy thao tác có kiểm tra quyền; lỗi nghiệp vụ hiện thành thông báo. Trả về true nếu thành công. */
export function guarded(perm, fn) {
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

export function field(label, name, value = '', opts = {}) {
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
export function openModal({ title, body, size = '', submitText, onSubmit, onShown, footerExtra = '' }) {
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
    const modal = new Modal(wrap);
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

export function table(columns, rows, emptyText = 'Chưa có dữ liệu') {
    return `<div class="table-responsive"><table class="table data-table"><thead><tr>${columns.map(c => `<th class="${c.num ? 'text-end' : ''}">${esc(c.title)}</th>`).join('')}</tr></thead><tbody>
        ${rows.length ? rows.map(row => `<tr>${columns.map(c => `<td class="${c.num ? 'text-end num' : ''}">${c.render(row)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}" class="empty">${esc(emptyText)}</td></tr>`}
    </tbody></table></div>`;
}

/** Năm màn hình của luồng mua nguyên liệu vào, hiện ở đầu mỗi trang để biết đang ở bước nào. */
export const FLOW_STEPS = [
    ['Nguồn cung & thương lái', '/nha-may/hop-dong-cung-ung', 'fa-people-roof', 'Đăng ký NCC, danh sách hộ, thửa'],
    ['Hợp đồng mua & hồ sơ', '/nha-may/hop-dong-mua', 'fa-file-signature', 'Điều khoản EUDR, hồ sơ, bản scan'],
    ['Lệnh mua', '/nha-may/lenh-mua', 'fa-file-invoice', 'Chỉ theo hợp đồng còn dùng được'],
    ['Tiếp nhận & đánh giá lô', '/nha-may/tiep-nhan', 'fa-truck-ramp-box', 'Cân, đối soát cổng, chấm, ký'],
    ['Kho A/B/C & sản xuất', '/nha-may/kho-nguyen-lieu', 'fa-warehouse', 'Chỉ Khu A vào lệnh EU']
];
export function flowStrip(active) {
    return `<nav class="flow-strip" aria-label="Luồng mua nguyên liệu vào">${FLOW_STEPS.map(([title, url, icon, note], i) => `<a href="${url}" class="flow-step ${i + 1 === active ? 'active' : i + 1 < active ? 'past' : ''}" ${i + 1 === active ? 'aria-current="step"' : ''}><span class="flow-no">${i + 1}</span><span class="flow-text"><b><i class="fa ${icon} me-1"></i>${esc(title)}</b><small>${esc(note)}</small></span></a>`).join('<i class="fa fa-chevron-right flow-arrow" aria-hidden="true"></i>')}</nav>`;
}

/** Nhãn kết quả Đạt / Cần bổ sung / Không đạt theo mức rủi ro. */
export const LEVEL_TEXT = { LOW: ['PASS', 'Đạt'], MEDIUM: ['MEDIUM', 'Cần bổ sung'], HIGH: ['FAIL', 'Không đạt'] };
export const levelPill = (level, label) => pill(LEVEL_TEXT[level][0], label || LEVEL_TEXT[level][1]);

/** Khung kết quả: tiêu đề theo mức và danh sách việc còn thiếu. issues: [{ level, msg }]. */
export function riskBox(title, level, issues, okText, extra = '') {
    const tone = { LOW: 'ok', MEDIUM: 'warn', HIGH: 'bad' }[level];
    const icon = { HIGH: 'fa-circle-xmark', MEDIUM: 'fa-triangle-exclamation', NOTE: 'fa-circle-info', LOW: 'fa-circle-check' };
    const list = issues.filter(i => i.level !== 'LOW');
    return `<div class="risk-box ${tone}"><strong>${esc(title)}: ${esc(LEVEL_TEXT[level][1])}</strong>${list.length ? `<ul>${list.map(i => `<li class="lv-${i.level.toLowerCase()}"><i class="fa ${icon[i.level]}"></i>${esc(i.msg)}</li>`).join('')}</ul>` : `<p>${esc(okText)}</p>`}${extra}</div>`;
}

export const card = (title, body, right = '', cls = '') => `<section class="panel ${cls}">${title ? `<header class="panel-head"><h2>${esc(title)}</h2><div>${right}</div></header>` : ''}<div class="panel-body">${body}</div></section>`;
export const kpi = (label, value, note, tone = '') => `<div class="kpi ${tone}"><span class="kpi-label">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;

export function downloadFile(name, text, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function drawPlotsMap(el, plots, { highlight = [] } = {}) {
    const map = L.map(el, { scrollWheelZoom: true });
    activeMaps.add(map);
    map.on('unload', () => activeMaps.delete(map));
    
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
        const popup = `<div style="font-family:'Be Vietnam Pro',sans-serif;font-size:12px;line-height:1.5;min-width:180px;">
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
    setTimeout(() => { if (activeMaps.has(map)) map.invalidateSize(); }, 200);
    return map;
}

export function qrInto(el, text) {
    QRCode.toCanvas(text, { width: 120, margin: 0, errorCorrectionLevel: 'M' }, (error, canvas) => {
        if (error) el.textContent = text;
        else el.append(canvas);
    });
}

export function showTag(title, code, lines) {
    openModal({
        title,
        size: 'modal-sm',
        body: `<div class="qr-tag" id="print-tag"><b>${esc(TENANT.name)}</b><div class="qr-box"></div><strong>${esc(code)}</strong><dl>${lines.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`,
        footerExtra: '<button type="button" class="btn btn-sm btn-primary" onclick="window.print()"><i class="fa fa-print me-1"></i>In tem</button>',
        onShown: el => qrInto(el.querySelector('.qr-box'), code)
    });
}

/** Bản đồ đang mở, để gỡ khi rời trang (điều hướng phía client không tải lại trang). */
const activeMaps = new Set();
let pageHost = null;

/** AppShell đăng ký vùng nội dung và nơi nhận tiêu đề/nút thao tác của trang. */
export function setPageHost(host) { pageHost = host; }

/** Khởi động một trang: nạp dữ liệu, báo tiêu đề cho khung React, gọi render. */
export function startPage(key, meta, render) {
    loadDB();
    window.currentPageKey = key;
    pageHost.setMeta(meta);
    document.documentElement.dataset.industry = pageHost.industry;
    const { root } = pageHost;
    window.refresh = () => render(root);
    window.refresh();
}

/** Dọn những gì trang đã gắn ngoài vùng React: bản đồ, modal, trạng thái body do Bootstrap đặt. */
export function teardownPage() {
    [...activeMaps].forEach(map => map.remove());
    window.curForestMap = null;
    document.querySelectorAll('body > .modal, body > .modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    pageHost = null;
}
