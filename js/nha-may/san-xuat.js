/**
 * Các trang nghiệp vụ. Mỗi trang HTML chỉ gọi một hàm page_* ở cuối tệp này qua thuộc tính data-page.
 */
const newBtn = (label, fn, icon = 'fa-plus') => `<button class="btn btn-sm btn-primary" onclick="${fn}"><i class="fa ${icon} me-1"></i>${label}</button>`;
const lightBtn = (label, fn, icon) => `<button class="btn btn-sm btn-light" onclick="${fn}">${icon ? `<i class="fa ${icon} me-1"></i>` : ''}${label}</button>`;
const traceLink = code => `<a class="tag" href="../nha-may/truy-xuat.html?code=${encodeURIComponent(code)}">${esc(code)}</a>`;
const supplierName = id => (getSupplier(id) || {}).name || id;
const speciesOptions = () => DB.config.species.map(s => [s.scientific, `${s.common} (${s.scientific})`]);

// ========== Nhà cung cấp & thửa đất (FR1, FR3, FR4, FR5) ==========

const CHAINS = [['DIRECT', 'Mua trực tiếp'], ['AGENT', 'Qua một đại lý'], ['MULTI', 'Nhiều tầng trung gian']];

function editSupplier(id) {
    const s = id ? getSupplier(id) : { type: 'DOMESTIC', country: 'VN', chain: 'DIRECT', commitment: false };
    openModal({
        title: id ? `Sửa ${id}` : 'Thêm nhà cung cấp', size: 'modal-lg', submitText: 'Lưu',
        body: `<div class="row g-2">
            ${field('Tên đơn vị', 'name', s.name, { required: true, col: 8 })}
            ${field('Mã số thuế / ĐKKD', 'taxCode', s.taxCode, { col: 4 })}
            ${field('Loại nguồn', 'type', s.type, { type: 'select', col: 4, options: [['DOMESTIC', 'Trong nước'], ['IMPORT', 'Nhập khẩu']] })}
            ${field('Mã quốc gia (ISO 2)', 'country', s.country, { required: true, col: 4, attrs: 'maxlength="2" pattern="[A-Za-z]{2}"' })}
            ${field('Chuỗi cung ứng', 'chain', s.chain, { type: 'select', col: 4, options: CHAINS })}
            ${field('Địa chỉ bưu chính', 'address', s.address, { required: true })}
            ${field('Email', 'email', s.email, { required: true, type: 'email' })}
            ${field('Người liên hệ', 'contact', s.contact)}
            ${field('Nơi bóc/sấy trung gian và tọa độ', 'site', s.site)}
            ${field('Số hợp đồng', 'contractNo', s.contractNo)}
            ${field('Hợp đồng hết hạn', 'contractExpiry', s.contractExpiry, { type: 'date' })}
            <div class="col-12"><label class="d-flex gap-2"><input class="form-check-input" type="checkbox" name="commitment" ${s.commitment ? 'checked' : ''}>
            <span>Đã ký cam kết EUDR</span></label></div>
        </div>`,
        onSubmit: data => guarded('supplier', () => {
            const clean = { ...data, country: data.country.toUpperCase(), commitment: !!data.commitment };
            if (id) {
                Object.assign(s, clean);
                logAction(id, 'Sửa nhà cung cấp', s.name);
            } else {
                const prefix = `NCC-${clean.country}-`;
                const no = DB.suppliers.filter(x => x.id.startsWith(prefix)).length + 1;
                const created = { id: prefix + String(no).padStart(3, '0'), ...clean };
                DB.suppliers.push(created);
                logAction(created.id, 'Thêm nhà cung cấp', created.name);
                toast('Đã thêm. Nạp tọa độ thửa đất để hoàn tất hồ sơ nhà cung cấp.');
                setTimeout(() => openGeoImport(created.id), 450);
            }
            refresh();
        })
    });
}

function geoResultHtml(res) {
    if (res.fatal) return `<div class="note-box bad">${esc(res.fatal)}</div>`;
    return `<div class="note-box ${res.ok ? 'ok' : 'bad'}">${res.ok ? 'Tệp hợp lệ' : 'Tệp có lỗi'}</div>
        <ul class="check-list">${res.fileErrors.map(e => `<li><i class="fa fa-circle-xmark no"></i>${esc(e)}</li>`).join('')}
        ${res.items.map(it => `<li><i class="fa ${it.errors.length ? 'fa-circle-xmark no' : 'fa-circle-check ok'}"></i><div><b>${esc(it.label)}</b>${it.errors.map(e => `<small>${esc(e)}</small>`).join('')}${it.warnings.map(w => `<small style="color:var(--warn)">${esc(w)}</small>`).join('')}</div></li>`).join('')}</ul>`;
}

const SAMPLE_GEO = {
    ok: '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[107.362145,11.245120],[107.364512,11.245481],[107.364873,11.243214],[107.362417,11.242876],[107.362145,11.245120]]]},"properties":{"PlotID":"MAU-DAT","ProducerCountry":"VN","ProducerName":"Hộ mẫu","ProductionPlace":"Định Quán, Đồng Nai","Area":6.5}}]}',
    bad: '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[107.36,11.24]},"properties":{"PlotID":"MAU-LOI-DIEM","ProducerCountry":"Việt Nam","Area":8.5}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[107.362145,11.245123],[107.364873,11.243214],[107.364512,11.245481],[107.362417,11.242876],[107.362145,11.245123]]]},"properties":{"PlotID":"MAU-TU-CAT","ProducerCountry":"VN","Area":6.5}}]}'
};

function openGeoImport(supplierId) {
    const m = openModal({
        title: 'Kiểm tra và nạp GeoJSON', size: 'modal-lg', submitText: 'Nạp vào danh sách thửa',
        body: `<div class="row g-2">
            ${field('Nhà cung cấp', 'supplierId', supplierId, { type: 'select', options: DB.suppliers.map(s => [s.id, s.name]) })}
            ${field('Loài (áp cho các thửa)', 'species', '', { type: 'select', options: speciesOptions() })}
            ${field('Khai thác từ', 'harvestFrom', '', { type: 'date', required: true })}
            ${field('Khai thác đến', 'harvestTo', '', { type: 'date', required: true })}
            ${field('Giấy tờ đất / giấy phép', 'landDoc', '', { col: 8 })}
            ${field('Năm trồng', 'plantingYear', '', { type: 'number', col: 4 })}
            <div class="col-12"><label class="form-label">Tệp .geojson hoặc dán nội dung</label>
                <input type="file" class="form-control form-control-sm mb-2" accept=".geojson,.json" id="geo-file">
                <textarea class="form-control mono" name="text" id="geo-text" rows="6" required></textarea>
                <div class="d-flex gap-2 mt-2">
                    <button type="button" class="btn btn-sm btn-light" id="geo-check">Kiểm tra</button>
                    <button type="button" class="btn btn-sm btn-light" id="geo-ok">Mẫu đúng</button>
                    <button type="button" class="btn btn-sm btn-light" id="geo-bad">Mẫu lỗi</button>
                </div>
            </div>
            <div class="col-12" id="geo-result"></div></div>`,
        onSubmit: data => {
            const res = validateGeoJsonText(data.text);
            document.querySelector('#geo-result').innerHTML = geoResultHtml(res);
            if (!res.ok) return false;
            if (data.harvestTo < data.harvestFrom) { toast('Ngày khai thác đến phải sau ngày bắt đầu', 'err'); return false; }
            return guarded('plot', () => {
                res.features.forEach((f, i) => {
                    const pr = f.properties;
                    const base = pr.PlotID || `PLOT-${pr.ProducerCountry}-${Date.now().toString(36).toUpperCase()}-${i + 1}`;
                    if (getPlot(base)) throw new Error(`Mã thửa ${base} đã tồn tại`);
                    DB.plots.push({ id: base, supplierId: data.supplierId, owner: pr.ProducerName || '', country: pr.ProducerCountry, place: pr.ProductionPlace || '', species: data.species, areaHa: pr.Area, geometry: f.geometry, plantingYear: Number(data.plantingYear) || null, harvestFrom: data.harvestFrom, harvestTo: data.harvestTo, landDoc: data.landDoc, forest: { result: 'NONE' }, version: 1 });
                    logAction(base, 'Nạp thửa đất', `${f.geometry.type}, ${pr.Area} ha`);
                });
                toast(`Đã nạp ${res.features.length} thửa. Bước tiếp theo: ghi kết quả đối chiếu bản đồ rừng.`);
                refresh();
            });
        }
    });
    const el = m.el, text = el.querySelector('#geo-text');
    const check = () => { el.querySelector('#geo-result').innerHTML = geoResultHtml(validateGeoJsonText(text.value)); };
    el.querySelector('#geo-check').onclick = check;
    el.querySelector('#geo-ok').onclick = () => { text.value = SAMPLE_GEO.ok; check(); };
    el.querySelector('#geo-bad').onclick = () => { text.value = SAMPLE_GEO.bad; check(); };
    el.querySelector('#geo-file').onchange = async e => { if (e.target.files[0]) { text.value = await e.target.files[0].text(); check(); } };
}

function editForest(id) {
    const p = getPlot(id), locked = plotLockedBy(id);
    const f = p.forest || {};
    openModal({
        title: `Đối chiếu bản đồ rừng: ${id}`, submitText: 'Lưu kết quả',
        body: `${locked.length ? `<div class="note-box warn">Đang khóa bởi đơn ${locked.map(o => esc(o.id)).join(', ')}</div>` : ''}
            <div class="note-box">Đối chiếu thủ công: <a href="https://www.globalforestwatch.org/map/" target="_blank" rel="noopener">Global Forest Watch</a> / JRC GFC2020</div>
            <div class="row g-2">
            ${field('Kết quả', 'result', f.result, { type: 'select', col: 12, options: [['NONE', 'Chưa đối chiếu'], ['CLEAR', 'Không chồng lấn'], ['OVERLAP', 'Chồng lấn một phần, cần ảnh vệ tinh'], ['LOSS', 'Mất tán rừng sau 31/12/2020']] })}
            ${field('Nguồn / bằng chứng', 'source', f.source, { required: true })}
            ${field('Ngày', 'date', f.date || todayISO(), { type: 'date', required: true })}
            ${field('Người thực hiện', 'by', f.by, { required: true })}
            ${locked.length ? field('Lý do sửa', 'reason', '', { required: true }) : ''}</div>`,
        onSubmit: data => guarded('forest', () => {
            const { reason, ...forest } = data;
            p.forest = forest;
            if (locked.length) p.version = (p.version || 1) + 1;
            logAction(id, 'Đối chiếu bản đồ rừng', `${forest.result}, ${forest.source}${reason ? `; lý do sửa: ${reason}; phiên bản ${p.version}` : ''}`);
            refresh();
        })
    });
}

function supplierGeoPill(s) {
    const plots = DB.plots.filter(p => p.supplierId === s.id);
    if (!plots.length) return pill('FAIL', 'Chưa có tọa độ');
    const bad = plots.filter(p => plotGeoCheck(p).errors.length || !p.forest || p.forest.result !== 'CLEAR').length;
    return bad ? pill('MEDIUM', `${bad}/${plots.length} thửa cần xử lý`) : pill('PASS', `${plots.length} thửa hợp lệ`);
}

/** Hộp thoại thửa đất của một nhà cung cấp. Bản đồ chỉ minh họa vị trí. */
function showSupplierPlots(id) {
    const s = getSupplier(id), plots = DB.plots.filter(p => p.supplierId === id);
    const m = openModal({
        title: `Thửa đất của ${s.name} (${plots.length})`, size: 'modal-xl',
        body: table([
            { title: 'Mã thửa', render: p => `<span class="code">${esc(p.id)}</span><span class="sub">Phiên bản ${p.version || 1}</span>` },
            { title: 'Chủ đất / địa điểm', render: p => `${esc(p.owner)}<span class="sub">${esc(p.place)} (${esc(p.country)})</span>` },
            { title: 'Loài', render: p => `<span class="sci">${esc(p.species)}</span>` },
            { title: 'Diện tích', num: true, render: p => `${fmt(p.areaHa)} ha<span class="sub">${p.geometry.type}</span>` },
            { title: 'Khai thác', render: p => `${esc(p.harvestFrom)}<span class="sub">đến ${esc(p.harvestTo)}</span>` },
            { title: 'Giấy tờ đất', render: p => p.landDoc ? esc(p.landDoc) : pill('FAIL', 'Thiếu') },
            { title: 'Hình học', render: p => { const c = plotGeoCheck(p); return c.errors.length ? pill('FAIL', c.errors[0]) : c.warnings.length ? pill('MEDIUM', 'Lệch diện tích') : pill('PASS', 'Hợp lệ'); } },
            { title: 'Bản đồ rừng', render: p => `<button type="button" class="btn btn-link p-0" data-forest="${esc(p.id)}">${pill((p.forest && p.forest.result) || 'NONE')}</button>` }
        ], plots, 'Chưa có tọa độ') +
        (plots.length ? '<div class="map-box js-plot-map mt-3"></div>' : ''),
        footerExtra: '<button type="button" class="btn btn-sm btn-primary js-geo"><i class="fa fa-file-import me-1"></i>Kiểm tra / nạp GeoJSON</button>',
        onShown: el => { const box = el.querySelector('.js-plot-map'); if (box) drawPlotsMap(box, plots); }
    });
    m.el.querySelector('.js-geo').onclick = () => { m.hide(); openGeoImport(id); };
    m.el.querySelectorAll('[data-forest]').forEach(b => { b.onclick = () => { m.hide(); editForest(b.dataset.forest); }; });
}

function page_suppliers() {
    startPage('hop-dong', { title: 'Nhà cung cấp', actions: newBtn('Thêm nhà cung cấp', 'editSupplier()') }, root => {
        root.innerHTML = card('', table([
            { title: 'Mã', render: s => `<span class="code">${esc(s.id)}</span>` },
            { title: 'Đơn vị', render: s => `${esc(s.name)}<span class="sub">${esc(s.address)} · ${esc(s.email)}</span>` },
            { title: 'Nguồn', render: s => `${s.type === 'IMPORT' ? 'Nhập khẩu' : 'Trong nước'} (${esc(s.country)})<span class="sub">${esc((CHAINS.find(c => c[0] === s.chain) || [])[1])}</span>` },
            { title: 'Hợp đồng', render: s => {
                if (!s.contractExpiry) return pill('FAIL', 'Chưa có');
                const left = Math.ceil((new Date(s.contractExpiry) - new Date(todayISO())) / 864e5);
                return `${esc(s.contractNo)}<span class="sub">đến ${esc(s.contractExpiry)}</span>${left <= 30 ? pill('MEDIUM', left < 0 ? 'Hết hạn' : `Còn ${left} ngày`) : ''}`;
            } },
            { title: 'Cam kết EUDR', render: s => s.commitment ? pill('PASS', 'Đã ký') : pill('FAIL', 'Chưa ký') },
            { title: 'Tọa độ', render: s => supplierGeoPill(s) },
            { title: '', render: s => `<div class="d-flex gap-1"><button class="btn btn-sm btn-light" onclick="showSupplierPlots('${s.id}')">Thửa đất</button><button class="btn btn-sm btn-light btn-icon" aria-label="Sửa ${s.id}" onclick="editSupplier('${s.id}')"><i class="fa fa-pen"></i></button></div>` }
        ], DB.suppliers), '', 'panel-flush');
    });
}

// ========== Kho (3 khu) ==========
function packageTag(id) {
    const p = getPackage(id), r = getReceipt(p.receiptId);
    showTag('Tem kiện', id, [['Lô', r.id], ['Loài', r.species], ['NCC', r.supplierId], ['Quy cách', `${r.l}x${r.w}x${r.t}`], ['Số lá', p.sheets], ['Thửa', r.plotIds.join(', ')], ['Ô kho', r.bay]]);
}

function page_warehouse() {
    startPage('kho-nguyen-lieu', { title: 'Kho nguyên liệu' }, root => {
        const zone = (cls, title, status, note) => {
            const list = DB.receipts.filter(r => receiptStatus(r) === status);
            return `<div class="zone ${cls}"><h3>${title}</h3><div class="meta">${note} · tồn ${fmt(sum(list, receiptStock))} m³</div>${list.map(r => {
                const isCN = r.supplierId === 'NCC-CN-001' || r.layer === 'FACE';
                return `<div class="zone-item"><span class="code">${esc(r.id)}</span> · ô <b>${esc(r.bay)}</b>${isCN ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger ms-1 small">🇨🇳 Ván mặt TQ</span>' : ''}<span class="sub"><i class="sci">${esc(r.species)}</i>, còn ${fmt(receiptStock(r))} / ${fmt(receiptM3(r))} m³</span></div>`;
            }).join('') || '<div class="zone-item text-muted">Trống</div>'}</div>`;
        };
        const rows = DB.packages.filter(p => packageStock(p) > 0.0001);
        
        root.innerHTML = `<div class="zones">${zone('zone-a', 'Khu A: Đạt', 'PASS', 'Được cấp cho lệnh EU')}${zone('zone-b', 'Khu B: Chờ', 'PENDING', 'Chưa đưa vào sản xuất')}${zone('zone-c', 'Khu C: Cách ly', 'FAIL', 'Trả lại hoặc đơn ngoài EU')}</div>` +
            card(`Kiện còn tồn (${rows.length})`, table([
                { title: 'Mã kiện', render: p => `<span class="code">${esc(p.id)}</span>` },
                { title: 'Lô', render: p => esc(p.receiptId) },
                { title: 'Loài', render: p => `<span class="sci">${esc(getReceipt(p.receiptId).species)}</span>` },
                { title: 'Còn', num: true, render: p => `${fmt(packageStock(p), 3)} / ${fmt(p.m3, 3)} m³` },
                { title: 'Khu', render: p => pill(receiptStatus(getReceipt(p.receiptId))) },
                { title: '', render: p => `<button class="btn btn-sm btn-light btn-icon" aria-label="In tem" onclick="packageTag('${p.id}')"><i class="fa fa-qrcode"></i></button>` }
            ], rows), '', 'panel-flush');
    });
}

// ========== Lệnh sản xuất (FR7) ==========
function newWorkOrder() {
    const m = openModal({
        title: 'Lệnh sản xuất mới', size: 'modal-xl', submitText: 'Phát lệnh',
        body: `<div class="row g-2">
            ${field('Sản phẩm', 'product', '', { required: true })}
            ${field('Thị trường', 'market', 'EU', { type: 'select', col: 3, options: [['EU', 'EU'], ['OTHER', 'Ngoài EU']], attrs: 'id="wo-market"' })}
            ${field('Keo', 'glue', 'Phenol WBP', { col: 3 })}
            ${field('Dài', 'l', 1220, { type: 'number', col: 2, required: true })}${field('Rộng', 'w', 2440, { type: 'number', col: 2, required: true })}${field('Dày', 't', 18, { type: 'number', col: 2, required: true })}
            ${field('Số tấm', 'targetSheets', 100, { type: 'number', col: 3, required: true, attrs: 'min="1"' })}${field('Số lớp', 'plies', 13, { type: 'number', col: 3 })}
            <div class="col-12"><label class="form-label">Lấy nguyên liệu theo lô (m³)</label><div class="pick-list" id="wo-lots"></div><div class="form-text" id="wo-rule"></div></div></div>`,
        onSubmit: (data, fd) => guarded('workorder', () => {
            const allocations = [];
            fd.getAll('lot').forEach(id => {
                let need = Number(fd.get('qty_' + id)) || 0;
                DB.packages.filter(p => p.receiptId === id).forEach(p => {
                    const take = Math.min(packageStock(p), need);
                    if (take > 0.0001) { allocations.push({ packageId: p.id, m3: +take.toFixed(4) }); need -= take; }
                });
                if (need > 0.001) throw new Error(`Lô ${id} không đủ tồn`);
            });
            const wo = createWorkOrder({ product: data.product, market: data.market, glue: data.glue, l: +data.l, w: +data.w, t: +data.t, targetSheets: +data.targetSheets, plies: +data.plies }, allocations);
            toast(`Đã phát lệnh ${wo.id}`);
            refresh();
        })
    });
    const market = m.el.querySelector('#wo-market');
    const sync = () => {
        const eu = market.value === 'EU';
        const lots = DB.receipts.filter(r => { const s = receiptStatus(r); return receiptStock(r) > 0 && (s === 'PASS' || (!eu && s === 'FAIL')); });
        m.el.querySelector('#wo-rule').textContent = eu ? 'Chỉ lô Đạt' : 'Gồm lô cách ly. Thành phẩm không vào đơn EU';
        m.el.querySelector('#wo-lots').innerHTML = lots.map(r => `<label class="align-items-center"><input class="form-check-input" type="checkbox" name="lot" value="${r.id}"><span class="flex-grow-1">${r.id} ${pill(receiptStatus(r))}<span class="sub"><i class="sci">${esc(r.species)}</i>, còn ${receiptStock(r)} m³</span></span><input class="form-control form-control-sm" style="width:100px" type="number" step="0.001" min="0" max="${receiptStock(r)}" name="qty_${r.id}" aria-label="m³ lấy từ ${r.id}"></label>`).join('') || '<div class="empty">Không có lô phù hợp còn tồn</div>';
    };
    market.onchange = sync;
    sync();
}

function woProgress(w) { return w.stages.filter(s => s.status === 'DONE').length; }

function page_workorders() {
    startPage('lenh-san-xuat', { title: 'Lệnh sản xuất', actions: newBtn('Lệnh mới', 'newWorkOrder()') }, root => {
        root.innerHTML = card('', table([
            { title: 'Lệnh SX', render: w => `<span class="code text-primary">${esc(w.id)}</span><span class="sub">${esc(w.created)}</span>` },
            { title: 'Sản phẩm & Quy cách', render: w => `<b>${esc(w.product)}</b><span class="sub">${w.l}x${w.w}x${w.t} mm · ${w.plies || 13} lớp · ${w.targetSheets} tấm</span>` },
            { title: 'Thị trường', render: w => w.market === 'EU' ? '<span class="pill pill-pass">Xuất khẩu EU</span>' : '<span class="pill pill-fail">Ngoài EU (Nội địa)</span>' },
            { title: 'Lô nguyên liệu', render: w => woReceipts(w).map(r => traceLink(r.id)).join('') },
            { title: 'Loài gỗ', render: w => uniq(woReceipts(w).map(r => r.species)).map(s => `<span class="sci d-block">${esc(s)}</span>`).join('') },
            { title: 'Vào (m³)', num: true, render: w => fmt(woInputM3(w)) },
            { title: 'Ra (m³)', num: true, render: w => w.finishedSheets ? fmt(woOutputM3(w)) : '–' },
            { title: 'Cân bằng (Thu hồi)', render: w => { if (!w.finishedSheets) return '<span class="text-muted">Đang chạy</span>'; const c = reconcile(w); return pill(c.overRun ? 'FAIL' : c.outOfBand ? 'MEDIUM' : 'PASS', c.rate + '%'); } },
            { title: 'Kiểm soát EUDR', render: w => {
                const hold = woHoldReasons(w);
                if (hold.length) return `<span class="pill pill-fail"><i class="fa fa-ban"></i>Bị giữ (${hold.join(',')})</span>`;
                if (w.qaNote && w.qaNote.includes('Giải trình')) return `<span class="pill pill-wait"><i class="fa fa-triangle-exclamation"></i>Giải trình QA</span>`;
                if (woDone(w)) return `<span class="pill pill-pass"><i class="fa fa-check"></i>100% Đạt</span>`;
                return `<span class="pill pill-info"><i class="fa fa-spinner"></i>Đang chạy</span>`;
            } },
            { title: 'Tiến độ', render: w => `<a class="btn btn-xs btn-light" href="../nha-may/nhat-ky-san-xuat.html">${woProgress(w)}/7 bước</a>` }
        ], DB.workOrders), '', 'panel-flush');
    });
}

// ========== Nhật ký 7 công đoạn ==========
const stageFilter = { status: '', code: '' };
function setStageFilter(key, value) { stageFilter[key] = value; refresh(); }

function nowLocal() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function stageForm(wo, index, s = {}, isEdit = false) {
    const spec = STAGE_SPECS[index], prev = index > 0 ? wo.stages[index - 1] : null;
    const lots = woReceipts(wo);
    const params = spec.params.map(p => field(p.label, p.key, s[p.key], { type: 'number', col: 4, required: true, attrs: `step="any" min="${p.min}"${p.max !== undefined ? ` max="${p.max}"` : ''}`, help: p.max !== undefined ? `Dải chuẩn ${p.min}-${p.max}` : p.thickness ? `Chuẩn ${wo.t} mm ± 0.3` : '' })).join('');
    return `
        <div class="ccp-box mb-2">
            <div class="ccp-head">
                <b>${esc(spec.ccpName)}</b>
                
            </div>
            <div class="text-muted small">${esc(spec.ccpControl)}</div>
            
        </div>
        <div class="small text-muted mb-2">Lô: ${lots.map(r => esc(r.id)).join(', ')}.${prev && prev.out ? ` Bước trước ra ${prev.out} tấm.` : ''}</div>
        <div class="row g-2">
        ${field('Ca', 'shift', s.shift, { type: 'select', col: 3, options: SHIFTS })}
        ${field('Máy', 'machine', s.machine, { type: 'select', col: 3, options: spec.machines })}
        ${field('Bắt đầu', 'start', s.start, { type: 'datetime-local', col: 3, required: true })}
        ${field('Kết thúc', 'end', s.end || nowLocal(), { type: 'datetime-local', col: 3, required: true })}
        ${field('Người vận hành', 'by', s.by, { required: true })}
        ${field('Người xác nhận (khác người vận hành)', 'confirmBy', s.confirmBy, { required: true })}
        ${spec.qc ? field('Hạng A (xuất EU)', 'gradeA', s.gradeA, { type: 'number', col: 4, required: true, attrs: 'min="1"' }) + field('Hạng B (bán ngoài EU)', 'gradeB', s.gradeB || 0, { type: 'number', col: 4, attrs: 'min="0"' }) + field('Hạng C (phế, loại)', 'gradeC', s.gradeC || 0, { type: 'number', col: 4, attrs: 'min="0"' }) + field('Giải trình QA (nếu thu hồi ngoài dải)', 'qaNote', s.qaNote || wo.qaNote, { col: 12 })
        : field(spec.outLabel, 'out', s.out, { type: 'number', required: true, col: 4, attrs: 'min="1"' })}
        ${params}
        ${spec.patchLot ? field('Lô của veneer vá phôi', 'patchLot', s.patchLot, { type: 'select', col: 12, options: lots.map(r => [r.id, `${r.id} (${r.species})`]) }) : ''}
        ${spec.scrap ? field('Xử lý phế liệu cắt biên', 'scrapUse', s.scrapUse, { type: 'select', col: 12, options: SCRAP_USES }) : ''}
        ${field('Ghi chú vận hành', 'note', s.note, { col: 12 })}
        ${isEdit ? field('Lý do sửa (bắt buộc)', 'reason', '', { col: 12, required: true }) : '<div class="col-12"><label class="d-flex gap-2"><input class="form-check-input" type="checkbox" required><span>Phôi thuộc lô trong lệnh</span></label></div>'}
        </div>`;
}

function logStage(woId, index) {
    const wo = getWO(woId);
    openModal({
        title: `${STAGES[index]} (Lệnh ${woId})`, size: 'modal-lg', submitText: 'Xác nhận kiểm soát', body: stageForm(wo, index),
        onSubmit: data => guarded('workorder', () => { recordStage(wo, index, data); stageView.woId = woId; stageView.step = index; refresh(); })
    });
}

function editStage(woId, index) {
    const wo = getWO(woId);
    openModal({
        title: `Sửa ${STAGES[index]} (Lệnh ${woId})`, size: 'modal-lg', submitText: 'Lưu sửa đổi', body: stageForm(wo, index, wo.stages[index], true),
        onSubmit: data => guarded('workorder', () => { correctStage(wo, index, data, data.reason); refresh(); })
    });
}

function showRevisions(woId, index) {
    const revs = getWO(woId).stages[index].revisions || [];
    openModal({
        title: `Lịch sử chỉnh sửa: ${STAGES[index]}`, size: 'modal-lg',
        body: table([
            { title: 'Thời gian', render: r => esc(r.changedAt.slice(0, 16).replace('T', ' ')) }, { title: 'Vai trò', render: r => esc(r.role) }, { title: 'Lý do sửa', render: r => esc(r.reason) },
            { title: 'Dữ liệu trước sửa', render: r => `${esc(r.out)} tấm; ${esc(r.by)}, xác nhận ${esc(r.confirmBy)}` }
        ], revs.slice().reverse())
    });
}

function stageParams(s, index) {
    const spec = STAGE_SPECS[index], parts = spec.params.map(p => `${p.label}: <b>${s[p.key]}</b>`);
    if (s.patchLot) parts.push(`Veneer vá: <code>${s.patchLot}</code>`);
    if (s.scrapUse) parts.push(`Xử lý phế: ${s.scrapUse}`);
    if (spec.qc) parts.push(`Phân loại: Hạng A <b>${s.gradeA}</b>, B <b>${s.gradeB || 0}</b>, C <b>${s.gradeC || 0}</b>`);
    if (s.note) parts.push(`Ghi chú: ${s.note}`);
    return parts.map(x => `<div>${x}</div>`).join('');
}

const stageView = { woId: null, step: null };
function openStageTab(woId, step) { stageView.woId = woId; stageView.step = step; refresh(); }

function stageTabBody(w, i, next, hold, locked) {
    const s = w.stages[i];
    const spec = STAGE_SPECS[i];
    const ccpBoxHtml = `
        <div class="ccp-box ${hold.length && !woDone(w) ? 'hold' : ''}">
            <div class="ccp-head">
                <div>
                    
                    <b class="text-dark">${esc(spec.ccpName)}</b>
                </div>
                <span class="badge ${s.status === 'DONE' ? 'bg-success' : (hold.length && !woDone(w) ? 'bg-danger' : 'bg-warning text-dark')}">
                    ${s.status === 'DONE' ? 'Đạt' : (hold.length && !woDone(w) ? 'Bị giữ' : 'Chờ ghi')}
                </span>
            </div>
            <div class="text-muted small">${esc(spec.ccpControl)}</div>
            
        </div>
    `;

    if (s.status !== 'DONE') {
        if (i !== next) return ccpBoxHtml + `<div class="empty">Chờ bước ${next + 1}</div>`;
        if (hold.length) return ccpBoxHtml + `<div class="alert alert-danger py-2 small mb-0"><i class="fa fa-ban me-1"></i>Bị giữ: lô ${hold.join(', ')}</div>`;
        return ccpBoxHtml + `<div class="p-2 text-center"><button class="btn btn-sm btn-primary" onclick="logStage('${w.id}',${i})"><i class="fa fa-pen me-1"></i>Ghi nhận ${esc(STAGES[i])}</button></div>`;
    }

    const prevOut = i >= 2 ? w.stages[i - 1].out : null;
    const facts = [
        ['Ca sản xuất', s.shift],
        ['Thiết bị máy', s.machine],
        ['Bắt đầu', String(s.start).replace('T', ' ')],
        ['Kết thúc', String(s.end).replace('T', ' ')],
        ['Người vận hành', s.by],
        ['Người xác nhận (4 mắt)', s.confirmBy],
        [spec.outLabel, `<b>${fmt(s.out, 0)} tấm</b>`],
        ['Hao hụt công đoạn', prevOut ? `${prevOut - s.out} tấm` : '–']
    ];
    const params = stageParams(s, i);
    const revs = (s.revisions || []).length;
    return ccpBoxHtml + `<div class="row g-3">
        <div class="col-lg-6">
            <table class="table table-sm mb-0"><tbody>${facts.map(f => `<tr><td class="text-muted" style="width:160px">${esc(f[0])}</td><td>${f[1]}</td></tr>`).join('')}</tbody></table>
        </div>
        <div class="col-lg-6">
            <div class="border rounded p-2 bg-light mb-2">
                <span class="small fw-bold text-muted d-block mb-1">Thông số</span>
                <div class="small">${params || '–'}</div>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                ${locked ? '<span class="text-muted small"><i class="fa fa-lock me-1"></i>Đã khóa</span>' : `<button class="btn btn-sm btn-light" onclick="editStage('${w.id}',${i})"><i class="fa fa-pen me-1"></i>Sửa có lý do</button>`}
                ${revs ? `<button class="btn btn-sm btn-light" onclick="showRevisions('${w.id}',${i})">${revs} lần sửa</button>` : ''}
            </div>
        </div>
    </div>`;
}

function page_stages() {
    startPage('nhat-ky-san-xuat', { title: 'Nhật ký sản xuất' }, root => {
        const f = stageFilter, code = f.code.trim().toLowerCase();
        const stateOf = w => woHoldReasons(w).length && !woDone(w) ? 'HOLD' : woDone(w) ? 'DONE' : 'RUN';
        const list = DB.workOrders.slice().reverse().filter(w => (!f.status || stateOf(w) === f.status) && (!code || w.id.toLowerCase().includes(code) || w.product.toLowerCase().includes(code)));
        const filters = `<section class="panel mb-3"><div class="panel-body py-2"><div class="row g-2 align-items-center">
            ${field('Trạng thái', 'fs', f.status, { type: 'select', col: 3, options: [['', 'Tất cả'], ['RUN', 'Đang chạy'], ['HOLD', 'Bị giữ (HOLD)'], ['DONE', 'Hoàn tất']], attrs: `onchange="setStageFilter('status',this.value)"` })}
            ${field('Tìm lệnh', 'fc', f.code, { col: 4, attrs: `placeholder="Mã lệnh, sản phẩm" onchange="setStageFilter('code',this.value)"` })}
            ${field('Lệnh sản xuất', 'fw', '', { type: 'select', col: 5, options: list.map(w => [w.id, `${w.id}: ${w.product} (${w.market === 'EU' ? 'EU' : 'Ngoài EU'})`]), attrs: `id="stage-wo" onchange="openStageTab(this.value,null)"` })}
            </div></div></section>`;
        if (!list.length) { root.innerHTML = filters + card('', '<div class="empty">Không có lệnh phù hợp</div>'); return; }
        const w = list.find(x => x.id === stageView.woId) || list[0];
        const next = w.stages.findIndex(s => s.status !== 'DONE');
        const step = w.id === stageView.woId && stageView.step !== null ? stageView.step : (next < 0 ? 6 : next);
        const hold = woHoldReasons(w), locked = DB.pallets.some(p => p.workOrderId === w.id);
        const rec = w.finishedSheets ? reconcile(w) : null;
        
        root.innerHTML = filters + card(`${w.id}: ${w.product}`, `
            ${hold.length && !woDone(w) ? `<div class="note-box bad py-2 mb-2"><i class="fa fa-ban me-1"></i>Bị giữ: lô ${hold.map(esc).join(', ')}</div>` : ''}
            <div class="stages" role="tablist">${w.stages.map((s, i) => `<button type="button" role="tab" aria-selected="${i === step}" class="stage ${s.status === 'DONE' ? 'done' : ''} ${i === step ? 'next' : ''}" onclick="openStageTab('${w.id}',${i})"><span class="n"><span>B${i + 1}</span></span><b>${STAGES[i]}</b><small>${s.status === 'DONE' ? `${fmt(s.out, 0)} tấm · ${esc(s.at)}` : i === next ? (hold.length ? 'Bị giữ' : 'Chờ ghi') : 'Chưa tới'}</small></button>`).join('')}</div>
            <div class="stage-panel" role="tabpanel"><h3 class="h6 mb-2">Bước ${step + 1}: ${STAGES[step]}</h3>${stageTabBody(w, step, next, hold, locked)}</div>
            <div class="mt-3 d-flex flex-wrap gap-3 align-items-center small">
                <span><span class="text-muted">Thửa kế thừa:</span> ${woPlots(w).map(p => traceLink(p.id)).join('')}</span>
                ${rec ? `<span><span class="text-muted">Cân đối (Mass Balance):</span> vào ${fmt(rec.input)} m³, ra ${fmt(rec.output)} m³ ${pill(rec.overRun ? 'FAIL' : rec.outOfBand ? 'MEDIUM' : 'PASS', rec.rate + '%')}</span>` : ''}
                ${w.qaNote ? `<span class="badge bg-warning text-dark"><i class="fa fa-triangle-exclamation me-1"></i>QA: ${esc(w.qaNote)}</span>` : ''}
            </div>`, w.lot ? tag(w.lot) : '');
        document.getElementById('stage-wo').value = w.id;
    });
}

// ========== Pallet ==========
function newPallet() {
    const wos = DB.workOrders.filter(w => woDone(w) && w.finishedSheets > woPalletSheets(w));
    if (!wos.length) { toast('Không có lệnh đã xong KCS còn tấm chưa đóng pallet', 'err'); return; }
    openModal({
        title: 'Đóng pallet', submitText: 'Lưu',
        body: `<div class="row g-2">${field('Lô thành phẩm', 'workOrderId', '', { type: 'select', col: 12, options: wos.map(w => [w.id, `${w.lot}: ${w.product} (còn ${w.finishedSheets - woPalletSheets(w)} tấm)`]) })}
            ${field('Số tấm', 'sheets', 50, { type: 'number', required: true, attrs: 'min="1"' })}${field('Khối lượng tịnh (kg)', 'kg', '', { type: 'number', required: true, attrs: 'min="1"' })}
            ${field('Đóng gói', 'packing', 'ISPM 15, carton ECOTECH2A PLYWOOD')}${field('Vị trí', 'location', '')}</div>`,
        onSubmit: data => guarded('pallet', () => { createPallet({ ...data, sheets: +data.sheets, kg: +data.kg }); refresh(); })
    });
}

function palletTag(id) {
    const p = getPallet(id), w = getWO(p.workOrderId);
    showTag('Tem pallet', id, [['Lô TP', w.lot], ['Sản phẩm', w.product], ['Số tấm', p.sheets], ['Thể tích', palletM3(p) + ' m³'], ['Loài', uniq(woReceipts(w).map(r => r.species)).join(', ')]]);
}

function page_pallets() {
    startPage('pallet', { title: 'Pallet thành phẩm', actions: newBtn('Đóng pallet', 'newPallet()') }, root => {
        root.innerHTML = card('', table([
            { title: 'Pallet', render: p => traceLink(p.id) },
            { title: 'Lô thành phẩm', render: p => { const w = getWO(p.workOrderId) || { lot: '–', product: '–' }; return `${esc(w.lot)}<span class="sub">${esc(w.product)}</span>`; } },
            { title: 'Số tấm', num: true, render: p => p.sheets },
            { title: 'Thể tích', num: true, render: p => fmt(palletM3(p), 3) + ' m³' },
            { title: 'Khối lượng', num: true, render: p => fmt(p.kg, 0) + ' kg' },
            { title: 'Vị trí', render: p => esc(p.location) },
            { title: 'Đơn', render: p => { const o = palletOrder(p.id); return o ? esc(o.id) : '<span class="text-muted">Còn tồn</span>'; } },
            { title: '', render: p => `<button class="btn btn-sm btn-light btn-icon" aria-label="In tem" onclick="palletTag('${p.id}')"><i class="fa fa-qrcode"></i></button>` }
        ], DB.pallets), '', 'panel-flush');
    });
}

// ========== Truy xuất (FR8, FR11) ==========
let traceMode = 'internal';

function runTrace(code) {
    const box = document.getElementById('trace-result');
    const t = trace(code);
    if (!t) { box.innerHTML = ''; return; }
    if (t.notFound) { box.innerHTML = `<div class="note-box warn">Không tìm thấy mã ${esc(t.query)}.</div>`; return; }
    const pub = traceMode === 'public';
    if (pub && t.orders.length) {
        const o = t.orders[0], pass = document.getElementById('trace-pass');
        const access = verifyOrderAccess(o, pass ? pass.value : '');
        if (!access.ok) { box.innerHTML = `<div class="note-box warn">${esc(access.msg)}</div>`; return; }
    }
    const lane = (title, items) => `<div class="lane"><h3>${title} (${items.length})</h3>${items.slice(0, 8).join('')}${items.length > 8 ? `<div class="sub">và ${items.length - 8} mục khác</div>` : ''}</div>`;
    const link = id => `<a href="../nha-may/truy-xuat.html?code=${encodeURIComponent(id)}">${esc(id)}</a>`;
    box.innerHTML = card(`${t.type}: ${t.query}`, `<div class="lanes">
        ${lane('Đơn hàng', t.orders.map(o => `<div class="lane-item">${link(o.id)}<span class="sub">${esc(o.customer)}</span>${o.dds ? `<span class="sub">DDS ${esc(o.dds.reference)}</span>` : ''}</div>`))}
        ${lane('Pallet', t.pallets.map(p => `<div class="lane-item">${link(p.id)}<span class="sub">${p.sheets} tấm</span></div>`))}
        ${lane('Lệnh SX', t.wos.map(w => `<div class="lane-item">${link(w.id)}<span class="sub">${esc(w.product)}</span>${w.lot ? `<span class="sub">${esc(w.lot)}</span>` : ''}</div>`))}
        ${lane('Lô nguyên liệu', t.receipts.map(r => {
            const isCN = r.supplierId === 'NCC-CN-001' || r.layer === 'FACE';
            return `<div class="lane-item">${link(r.id)}<span class="sub sci">${esc(r.species)} ${isCN ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger small">🇨🇳 TQ</span>' : ''}</span>${pub ? '' : `<span class="sub">${esc(supplierName(r.supplierId))}</span>`}</div>`;
        }))}
        ${lane('Thửa đất', t.plots.map(p => {
            const isCN = p.country === 'CN' || p.id.startsWith('PLOT-CN');
            return `<div class="lane-item">${link(p.id)}<span class="sub">${isCN ? '<b class="text-danger">🇨🇳 TQ (Quảng Tây)</b>' : '🇻🇳 VN'}, ${esc(p.areaHa)} ha</span>${pub ? '' : `<span class="sub">${esc(p.owner)}; ${esc(p.landDoc || 'thiếu giấy đất')}</span>`}</div>`;
        }))}
        </div>${pub ? '' : `<div class="mt-2 text-muted">Nơi xử lý: ${uniq(t.receipts.map(r => (getSupplier(r.supplierId) || {}).site).filter(Boolean)).map(esc).join('; ') || 'chưa có'}; Nhà máy ECOtech2A, KCN Tam Phước, Đồng Nai.</div>`}`) + card('Vị trí thửa', '<div id="trace-map" class="map-box"></div>');
    drawPlotsMap(document.getElementById('trace-map'), t.plots);
}

function page_trace() {
    startPage('truy-xuat', { title: 'Truy xuất hai chiều' }, root => {
        const code = new URLSearchParams(location.search).get('code') || 'DPO26102801';
        root.innerHTML = card('', `<form class="d-flex flex-wrap gap-2" id="trace-form"><input class="form-control form-control-sm" style="max-width:340px" id="trace-code" value="${esc(code)}" aria-label="Mã cần truy xuất"><button class="btn btn-sm btn-primary"><i class="fa fa-magnifying-glass me-1"></i>Truy xuất</button><select class="form-select form-select-sm" style="width:auto" id="trace-mode" aria-label="Chế độ"><option value="internal">Nội bộ đầy đủ</option><option value="public">Công khai rút gọn</option></select><input class="form-control form-control-sm" style="max-width:170px" type="password" id="trace-pass" placeholder="Mật khẩu đơn" aria-label="Mật khẩu đơn"></form>`) + '<div id="trace-result"></div>';
        const input = document.getElementById('trace-code');
        document.getElementById('trace-form').onsubmit = e => { e.preventDefault(); runTrace(input.value); };
        document.getElementById('trace-mode').onchange = e => { traceMode = e.target.value; runTrace(input.value); };
        runTrace(code);
    });
}
