/**
 * Dữ liệu mẫu ban đầu. Chỉ nạp khi trình duyệt chưa có dữ liệu (xem core.js).
 * Thể tích kiện và pallet được tính từ quy cách, không gõ tay, để số liệu các trang luôn khớp.
 */
function buildSeed() {
    const config = {
        countryRisk: { VN: 'LOW', CN: 'LOW', RU: 'HIGH', BY: 'HIGH', MM: 'HIGH', KP: 'HIGH' },
        countryBox: { VN: [102.1, 8.2, 109.6, 23.4], CN: [73.5, 18.0, 135.1, 53.6] },
        species: [
            { common: 'Cao su', scientific: 'Hevea brasiliensis' },
            { common: 'Bạch đàn', scientific: 'Eucalyptus camaldulensis' },
            { common: 'Keo tai tượng', scientific: 'Acacia mangium' },
            { common: 'Dương (Poplar)', scientific: 'Populus adenopoda' },
            { common: 'Bạch dương (Birch)', scientific: 'Betula alnoides' }
        ],
        riskSpecies: [],
        hsCodes: ['4412.33.00', '4412.34.00', '4412.39.00'],
        recoveryMin: 72,
        recoveryMax: 78,
        areaTolerancePct: 20,
        maxGeoJsonMb: 25,
        retentionYears: 5
    };

    const suppliers = [
        { id: 'NCC-VN-001', name: 'Công ty TNHH Lâm nghiệp & Bóc ván Tân Phú', type: 'DOMESTIC', country: 'VN', taxCode: '3602148901', address: 'Định Quán, Đồng Nai', email: 'kinhdoanh@tanphu.example', contact: 'Nguyễn Văn Hùng, 0918 234 567', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-TP-2026/01', contractExpiry: '2027-06-30', site: 'Xưởng bóc Tân Phú: 107.351220, 11.241870' },
        { id: 'NCC-VN-002', name: 'Hợp tác xã Lâm sản Bù Đăng', type: 'DOMESTIC', country: 'VN', taxCode: '3801123456', address: 'Bù Đăng, Bình Phước', email: 'htx@budang.example', contact: 'Trần Đình Khôi, 0983 112 233', chain: 'AGENT', commitment: true, contractNo: 'HĐ-BĐ-2026/04', contractExpiry: '2026-11-20', site: 'Xưởng HTX Bù Đăng: 107.190415, 11.760238' },
        { id: 'NCC-CN-001', name: 'Guangxi Nanning Plywood & Veneer Co., Ltd', type: 'IMPORT', country: 'CN', taxCode: 'CN91450100MA5XXXX', address: 'Nanning High-tech Zone, Guangxi', email: 'export@gxveneer.example', contact: 'Zhang Wei, +86 771 582 9901', chain: 'DIRECT', commitment: true, contractNo: 'CTR-GX-2026/07', contractExpiry: '2027-03-31', site: 'Nhà máy veneer Nam Ninh: 108.320145, 22.816372' },
        { id: 'NCC-VN-003', name: 'Xưởng bóc gỗ Đức Trọng', type: 'DOMESTIC', country: 'VN', taxCode: '4201992831', address: 'Đức Trọng, Lâm Đồng', email: 'xuong@ductrong.example', contact: 'Lê Văn Tám, 0903 888 999', chain: 'MULTI', commitment: false, contractNo: '', contractExpiry: '', site: '' }
    ];

    const clear = date => ({ result: 'CLEAR', source: 'JRC GFC2020 + ảnh vệ tinh', date, by: 'Lê Hoàng Phúc' });
    const plots = [
        { id: 'PLOT-VN-DN-01', supplierId: 'NCC-VN-001', owner: 'Hộ Lê Văn Thành', country: 'VN', place: 'Xã Phú Tân, Định Quán, Đồng Nai', species: 'Hevea brasiliensis', areaHa: 2.8, geometry: { type: 'Point', coordinates: [107.348215, 11.238419] }, plantingYear: 2014, harvestFrom: '2026-10-05', harvestTo: '2026-10-15', landDoc: 'GCNQSDĐ CN 829104', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-DN-02', supplierId: 'NCC-VN-001', owner: 'Hộ Nguyễn Văn Nam', country: 'VN', place: 'Xã Gia Canh, Định Quán, Đồng Nai', species: 'Hevea brasiliensis', areaHa: 6.5, geometry: { type: 'Polygon', coordinates: [[[107.362145, 11.245123], [107.364512, 11.245481], [107.364873, 11.243214], [107.362417, 11.242876], [107.362145, 11.245123]]] }, plantingYear: 2012, harvestFrom: '2026-10-08', harvestTo: '2026-10-18', landDoc: 'GCNQSDĐ CN 912837', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-BP-03', supplierId: 'NCC-VN-002', owner: 'Nông trường Bù Đăng, khoảnh 4 lô 12', country: 'VN', place: 'Xã Bom Bo, Bù Đăng, Bình Phước', species: 'Eucalyptus camaldulensis', areaHa: 8.2, geometry: { type: 'Polygon', coordinates: [[[107.182451, 11.758213], [107.185123, 11.758547], [107.185412, 11.755962], [107.182734, 11.755631], [107.182451, 11.758213]]] }, plantingYear: 2016, harvestFrom: '2026-10-12', harvestTo: '2026-10-22', landDoc: 'QĐ giao đất 45/QĐ-UBND', forest: clear('2026-10-24'), version: 1 },
        { id: 'PLOT-CN-GX-01', supplierId: 'NCC-CN-001', owner: 'Guangxi Chongzuo Forest Base No. 3', country: 'CN', place: 'Fusui, Chongzuo, Guangxi', species: 'Populus adenopoda', areaHa: 14.5, geometry: { type: 'Polygon', coordinates: [[[107.915233, 22.648127], [107.918941, 22.648453], [107.919212, 22.645012], [107.915517, 22.644693], [107.915233, 22.648127]]] }, plantingYear: 2015, harvestFrom: '2026-08-20', harvestTo: '2026-08-28', landDoc: 'Forest License GF-2018-8812', forest: clear('2026-10-02'), version: 1 },
        { id: 'PLOT-VN-LD-99', supplierId: 'NCC-VN-003', owner: 'Khu ven rừng Đa Nhim', country: 'VN', place: 'Đức Trọng, Lâm Đồng', species: 'Acacia mangium', areaHa: 5.1, geometry: { type: 'Polygon', coordinates: [[[108.341203, 11.721407], [108.344697, 11.721753], [108.342611, 11.724089], [108.341203, 11.721407]]] }, plantingYear: 2022, harvestFrom: '2026-10-20', harvestTo: '2026-10-25', landDoc: '', forest: { result: 'LOSS', source: 'JRC GFC2020 + ảnh vệ tinh', date: '2026-11-03', by: 'Lê Hoàng Phúc' }, version: 1 }
    ];

    const approved = at => ({ by: 'Nguyễn Thị Thu Hà', at, reason: 'Đủ hồ sơ theo bộ tiêu chuẩn' });
    const domesticDocs = ['Bảng kê lâm sản', 'Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'];
    const importDocs = ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật'];
    const receipts = [
        { id: 'RC-W2610-001', plate: '60C-821.45', supplierId: 'NCC-VN-001', date: '2026-10-26', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 16, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 24500, tare: 10250, moisture: 14.5, grade: 'E', bay: 'K1.7-04', plotIds: ['PLOT-VN-DN-01', 'PLOT-VN-DN-02'], docs: domesticDocs, note: '', approval: approved('2026-10-26'), mitigations: [] },
        { id: 'RC-W2610-002', plate: '93C-114.78', supplierId: 'NCC-VN-002', date: '2026-10-27', species: 'Eucalyptus camaldulensis', layer: 'CORE', pkgCount: 15, sheetsPerPkg: 1000, l: 1270, w: 850, t: 2, gross: 38200, tare: 15600, moisture: 15.2, grade: 'D', bay: 'K2.0-02', plotIds: ['PLOT-VN-BP-03'], docs: domesticDocs, note: '', approval: approved('2026-10-27'), mitigations: [] },
        { id: 'RC-W2610-003', plate: '51D-902.13 / TGHU98214', supplierId: 'NCC-CN-001', date: '2026-10-28', species: 'Populus adenopoda', layer: 'FACE', pkgCount: 12, sheetsPerPkg: 1000, l: 1270, w: 2500, t: 0.5, gross: 28500, tare: 20700, moisture: 11.8, grade: 'A', bay: 'M0.5-01', plotIds: ['PLOT-CN-GX-01'], docs: importDocs, note: 'Tờ khai HQ 105829104', approval: approved('2026-10-28'), mitigations: [] },
        { id: 'RC-W2611-004', plate: '49C-338.90', supplierId: 'NCC-VN-003', date: '2026-11-03', species: 'Acacia mangium', layer: 'CORE', pkgCount: 8, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 14200, tare: 7100, moisture: 22, grade: 'E', bay: 'Q01', plotIds: ['PLOT-VN-LD-99'], docs: ['Hóa đơn'], note: '', approval: null, mitigations: [] },
        { id: 'RC-W2611-005', plate: '60C-552.19', supplierId: 'NCC-VN-001', date: '2026-11-04', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 10, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 16900, tare: 8000, moisture: 15, grade: 'E+', bay: 'W01', plotIds: ['PLOT-VN-DN-01'], docs: ['Hợp đồng mua bán', 'Hóa đơn'], note: 'Chờ nhà cung cấp gửi bảng kê lâm sản', approval: null, mitigations: [] },
        { id: 'RC-W2611-006', plate: '60C-417.02', supplierId: 'NCC-VN-001', date: '2026-11-02', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 12, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 20900, tare: 10150, moisture: 14.8, grade: 'E', bay: 'K1.7-05', plotIds: ['PLOT-VN-DN-02'], docs: domesticDocs, note: '', approval: approved('2026-11-02'), mitigations: [] }
    ];

    let pkgNo = 0;
    const packages = [];
    receipts.forEach(r => {
        const volume = r.l * r.w * r.t * r.sheetsPerPkg / 1e9;
        for (let i = 0; i < r.pkgCount; i++) {
            pkgNo++;
            packages.push({ id: 'PKG-LV-2026-' + String(pkgNo).padStart(4, '0'), receiptId: r.id, sheets: r.sheetsPerPkg, m3: +volume.toFixed(4) });
        }
    });
    const pkgsOf = id => packages.filter(p => p.receiptId === id);
    const allocAll = id => pkgsOf(id).map(p => ({ packageId: p.id, m3: p.m3 }));

    // 72.35 m³ đầu vào cho đơn 53.58 m³ thành phẩm: lấy hết 2 lô ruột, phần còn lại từ lô ván mặt.
    const coreAlloc = [...allocAll('RC-W2610-001'), ...allocAll('RC-W2610-002')];
    const coreM3 = coreAlloc.reduce((s, a) => s + a.m3, 0);
    let faceLeft = 72.35 - coreM3;
    const faceAlloc = [];
    pkgsOf('RC-W2610-003').forEach(p => {
        if (faceLeft <= 0.0001) return;
        const m3 = +Math.min(p.m3, faceLeft).toFixed(4);
        faceAlloc.push({ packageId: p.id, m3 });
        faceLeft -= m3;
    });

    const stage = (by, confirmBy, start, end, machine, out, extra = {}) => ({ status: 'DONE', by, confirmBy, shift: 'Ca 1', start, end, machine, out, at: end.slice(0, 10), note: '', revisions: [], ...extra });
    const lastFace = faceAlloc[faceAlloc.length - 1];
    const faceRemainder = pkgsOf('RC-W2610-003').find(p => p.id === lastFace.packageId);

    const workOrders = [
        {
            id: 'WO-261029-01', product: 'Ván ép cốp pha phủ phim 18 mm', market: 'EU', l: 1220, w: 2440, t: 18, targetSheets: 1000, plies: 13, glue: 'Phenol WBP', created: '2026-10-29',
            allocations: [...coreAlloc, ...faceAlloc], finishedSheets: 1000, qaNote: '', lot: 'FG-261029-01',
            stages: [
                stage('Đoàn Văn Mạnh', 'Phạm Quốc Bảo', '2026-10-29T07:30', '2026-10-29T16:30', 'MC-ZICZAC-01', 5500),
                stage('Trần Anh Tuấn', 'Phạm Quốc Bảo', '2026-10-30T07:30', '2026-10-30T10:30', 'MC-GLUE-02', 1050, { glue: 320 }),
                stage('Võ Thị Lệ', 'Phạm Quốc Bảo', '2026-10-30T10:45', '2026-10-30T15:30', 'MC-COLD-01', 1050, { pressure: 100, minutes: 45, patches: 142, patchLot: 'RC-W2610-003' }),
                stage('Nguyễn Văn Đức', 'Phạm Quốc Bảo', '2026-10-31T07:30', '2026-10-31T16:30', 'MC-HOTPRESS-01', 1045, { temp: 125, bar: 120, minutes: 22 }),
                stage('Lý Văn Sơn', 'Phạm Quốc Bảo', '2026-11-01T07:30', '2026-11-01T11:30', 'MC-SANDER-03', 1030, { thickness: 18.1 }),
                stage('Đinh Công Hậu', 'Phạm Quốc Bảo', '2026-11-01T13:00', '2026-11-01T16:30', 'MC-TRIM-02', 1020, { scrapKg: 410, scrapUse: 'Băm làm chân pallet, giữ mã lô gốc' }),
                stage('Bùi Thị Hoa', 'Nguyễn Thị Thu Hà', '2026-11-02T07:30', '2026-11-02T11:00', 'Đèn soi góc nghiêng', 1000, { gradeA: 1000, gradeB: 15, gradeC: 5 })
            ]
        },
        {
            id: 'WO-261103-02', product: 'Ván ép bao bì 12 mm', market: 'EU', l: 1220, w: 2440, t: 12, targetSheets: 190, plies: 9, glue: 'Phenol WBP', created: '2026-11-03',
            allocations: [
                ...pkgsOf('RC-W2611-006').slice(0, 6).map(p => ({ packageId: p.id, m3: p.m3 })),
                { packageId: faceRemainder.id, m3: +(faceRemainder.m3 - lastFace.m3).toFixed(4) }
            ].filter(a => a.m3 > 0),
            finishedSheets: 0, qaNote: '', lot: '',
            stages: [
                stage('Đoàn Văn Mạnh', 'Phạm Quốc Bảo', '2026-11-03T07:30', '2026-11-03T11:00', 'MC-ZICZAC-01', 1100),
                stage('Trần Anh Tuấn', 'Phạm Quốc Bảo', '2026-11-03T13:00', '2026-11-03T15:00', 'MC-GLUE-02', 200, { glue: 320 }),
                stage('Võ Thị Lệ', 'Phạm Quốc Bảo', '2026-11-03T15:15', '2026-11-03T17:00', 'MC-COLD-01', 200, { pressure: 100, minutes: 45, patches: 28, patchLot: 'RC-W2610-003' }),
                { status: 'TODO' }, { status: 'TODO' }, { status: 'TODO' }, { status: 'TODO' }
            ]
        }
    ];

    const pallets = [];
    for (let i = 1; i <= 20; i++) {
        pallets.push({ id: 'PAL-LV-2026-' + String(100 + i).padStart(4, '0'), workOrderId: 'WO-261029-01', sheets: 50, kg: 1875, packing: 'ISPM 15, carton LONG VIET PLYWOOD', location: 'Kho TP EU, kệ P-' + String(i).padStart(2, '0'), created: '2026-11-02' });
    }

    // Thông tin kiểm đếm ở trạm cân và KCS của các phiếu mẫu.
    const scaleInfo = { 'RC-W2610-001': 1, 'RC-W2610-002': 1, 'RC-W2610-003': 1, 'RC-W2611-004': 2, 'RC-W2611-005': 1, 'RC-W2611-006': 2 };
    receipts.forEach(r => {
        r.trip = scaleInfo[r.id];
        r.workshop = r.layer === 'FACE' ? 'Xưởng ván mặt' : 'Xưởng ván ruột';
        r.expectedKg = r.gross - r.tare;
        r.dataSource = 'Trạm cân';
        r.kcs = { by: 'Lê Hoàng Phúc', at: r.date };
        r.done = !!r.approval;
    });

    const customers = [
        { id: 'KH-DE-01', name: 'Holz & Bau Plywood Import GmbH', address: 'Hafenstraße 12, 20457 Hamburg', email: 'import@holzbau.example', eori: 'DE198273645', country: 'DE' },
        { id: 'KH-FR-01', name: 'Comptoir des Bois SAS', address: '8 Quai de la Fosse, 44000 Nantes', email: 'achat@comptoirbois.example', eori: 'FR88291048210', country: 'FR' },
        { id: 'KH-US-01', name: 'Pacific Panel Trading LLC', address: '400 Harbor Blvd, Long Beach, CA', email: 'buy@pacificpanel.example', eori: '', country: 'US' },
        { id: 'KH-VN-01', name: 'Công ty Xây dựng Đại Thành', address: 'Biên Hòa, Đồng Nai', email: 'vattu@daithanh.example', eori: '', country: 'VN' }
    ];

    // Xe đã cân, đang chờ kho tiếp nhận. Tương ứng khu vực Trạm cân.
    const scaleTickets = [
        { id: 'SC-261104-01', plate: '60C-338.21', workshop: 'Xưởng ván ruột', trip: 1, supplierId: 'NCC-VN-001', phone: '0918 234 567', expectedKg: 9000, gross: 17150, tare: 8200, date: '2026-11-04', plotIds: ['PLOT-VN-DN-02'], receiptId: '' },
        { id: 'SC-261104-02', plate: '93C-207.66', workshop: 'Xưởng ván ruột', trip: 2, supplierId: 'NCC-VN-002', phone: '0983 112 233', expectedKg: 12000, gross: 27400, tare: 15600, date: '2026-11-04', plotIds: ['PLOT-VN-BP-03'], receiptId: '' }
    ];

    const car = (no, list) => ({ id: `XE-${no}`, product: 'Ván ép cốp pha phủ phim 18 mm', typeCar: 'Container 40HC', plate: `51D-90${no}.13`, seal: `SL26110${no}`, cont: `TGHU9821${no}`, date: '2026-11-05', kg: 18750, timeIn: '08:00', timeOut: '11:30', remark: '', palletIds: list });
    const orders = [{
        id: 'DPO26102801', customerId: 'KH-DE-01', customer: customers[0].name, customerAddress: customers[0].address, customerEmail: customers[0].email, eori: customers[0].eori, countryId: 'DE',
        type: 'OUT', transportType: 'WATER', certificate: 'FSC', deliveryLocation: 'Cảng Hamburg', pickUpLocation: 'Nhà máy Long Việt, KCN Tam Phước', shipping: 'Vận tải Biển Đông', vesselName: 'MV Pacific Star', billOfLading: 'BL-LV-261105', customsNo: '306812345670', numberOrder: 'LV-2026/118', invoice: 'INV-2611-07', paymentType: 'T/T', exportCategory: 'Xuất kinh doanh', invoiceDate: '2026-11-03', contractNo: 'CTR-LV-DE-2026-11', contractDate: '2026-10-28', shippingDate: '2026-11-05', endDate: '', viewingPeriod: '2031-11-03', passCode: 'LV2026', hsCode: '4412.33.00', filer: 'CUSTOMER', remark: '',
        items: [{ id: 'SP-1', product: 'Ván ép cốp pha phủ phim 18 mm', certificate: 'FSC', price: 420, currency: 'USD', quantity: 53.58, unit: 'm³', remark: '' }],
        cars: [car(1, pallets.slice(0, 10).map(p => p.id)), car(2, pallets.slice(10).map(p => p.id))],
        palletIds: pallets.map(p => p.id), status: 1, confirmedAt: '2026-11-03', confirmedBy: 'Phòng Kinh doanh XK', dds: null, created: '2026-11-02', viewLog: [], failLog: []
    }];

    config.euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    config.certificates = ['FSC', 'PEFC', 'CARB P2', 'Không'];

    const audit = [];
    return { version: 5, config, suppliers, customers, scaleTickets, plots, receipts, packages, workOrders, pallets, orders, audit, drills: [] };
}
