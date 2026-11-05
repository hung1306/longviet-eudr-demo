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
        { id: 'NCC-VN-003', name: 'Xưởng bóc gỗ Đức Trọng', type: 'DOMESTIC', country: 'VN', taxCode: '4201992831', address: 'Đức Trọng, Lâm Đồng', email: 'xuong@ductrong.example', contact: 'Lê Văn Tám, 0903 888 999', chain: 'MULTI', commitment: false, contractNo: '', contractExpiry: '', site: '' },
        { id: 'NCC-VN-004', name: 'Hộ ông Nguyễn Văn Hòa (ví dụ)', type: 'DOMESTIC', country: 'VN', taxCode: '8392019284', address: 'Định Quán, Đồng Nai', email: 'vanhoa@example.com', contact: 'Nguyễn Văn Hòa, 0912 345 678', chain: 'DIRECT', commitment: true, contractNo: 'HĐ-VH-2026/02', contractExpiry: '2027-04-30', site: 'Vườn cây cao su Gia Canh: 107.352, 11.239' },
        { id: 'NCC-VN-005', name: 'Đại lý gỗ Tân Châu (ví dụ)', type: 'DOMESTIC', country: 'VN', taxCode: '3701982736', address: 'Tân Châu, Tây Ninh', email: 'tanchau@example.com', contact: 'Trần Văn Châu, 0908 776 655', chain: 'AGENT', commitment: false, contractNo: '', contractExpiry: '', site: '' },
        { id: 'NCC-CN-001', name: 'Guangxi Nanning Plywood & Veneer Co., Ltd', type: 'IMPORT', country: 'CN', taxCode: 'CN91450100MA5XXXX', address: 'Nanning High-tech Zone, Guangxi', email: 'export@gxveneer.example', contact: 'Zhang Wei, +86 771 582 9901', chain: 'DIRECT', commitment: true, contractNo: 'CTR-GX-2026/07', contractExpiry: '2027-03-31', site: 'Nhà máy veneer Nam Ninh: 108.320145, 22.816372' },
        { id: 'NCC-CN-002', name: 'Shandong Poplar Veneer (ví dụ)', type: 'IMPORT', country: 'CN', taxCode: 'CN91370100MA3YYYY', address: 'Linyi, Shandong, China', email: 'poplar@shandong-veneer.example', contact: 'Wang Jin, +86 539 881 2345', chain: 'DIRECT', commitment: false, contractNo: '', contractExpiry: '', site: '' }
    ];

    const clear = date => ({ result: 'CLEAR', source: 'JRC GFC2020 + ảnh vệ tinh', date, by: 'Lê Hoàng Phúc' });
    const plots = [
        { id: 'PLOT-VN-DN-01', supplierId: 'NCC-VN-001', owner: 'Hộ Lê Văn Thành', country: 'VN', place: 'Xã Phú Tân, Định Quán, Đồng Nai', species: 'Hevea brasiliensis', areaHa: 3.8, geometry: { type: 'Polygon', coordinates: [[[107.347512, 11.238814], [107.348421, 11.239105], [107.349145, 11.238912], [107.349603, 11.238401], [107.349312, 11.237815], [107.348604, 11.237410], [107.347915, 11.237305], [107.347318, 11.237612], [107.347105, 11.238210], [107.347512, 11.238814]]] }, plantingYear: 2014, harvestFrom: '2026-10-05', harvestTo: '2026-10-15', landDoc: 'GCNQSDĐ CN 829104', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-DN-02', supplierId: 'NCC-VN-001', owner: 'Hộ Nguyễn Văn Nam', country: 'VN', place: 'Xã Gia Canh, Định Quán, Đồng Nai', species: 'Hevea brasiliensis', areaHa: 13.7, geometry: { type: 'Polygon', coordinates: [[[107.361820, 11.245510], [107.363150, 11.245820], [107.364420, 11.245610], [107.365110, 11.244920], [107.365340, 11.243810], [107.364950, 11.242910], [107.363820, 11.242450], [107.362610, 11.242310], [107.361720, 11.242850], [107.361250, 11.243710], [107.361340, 11.244820], [107.361820, 11.245510]]] }, plantingYear: 2012, harvestFrom: '2026-10-08', harvestTo: '2026-10-18', landDoc: 'GCNQSDĐ CN 912837', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-DN-03', supplierId: 'NCC-VN-004', owner: 'Hộ ông Nguyễn Văn Hòa (ví dụ)', country: 'VN', place: 'Xã Phú Cường, Định Quán, Đồng Nai', species: 'Hevea brasiliensis', areaHa: 4.2, geometry: { type: 'Polygon', coordinates: [[[107.352100, 11.239200], [107.354100, 11.240500], [107.355200, 11.237800], [107.352100, 11.239200]]] }, plantingYear: 2015, harvestFrom: '2026-10-10', harvestTo: '2026-10-20', landDoc: 'GCNQSDĐ CN 771234', forest: clear('2026-10-20'), version: 1 },
        { id: 'PLOT-VN-TC-04', supplierId: 'NCC-VN-005', owner: 'Đại lý gỗ Tân Châu (ví dụ)', country: 'VN', place: 'Tân Châu, Tây Ninh', species: 'Eucalyptus camaldulensis', areaHa: 12.5, geometry: { type: 'Point', coordinates: [106.128450, 11.583210] }, plantingYear: 2017, harvestFrom: '2026-10-15', harvestTo: '2026-10-25', landDoc: '', forest: { result: 'NONE', source: 'Chưa có dữ liệu viễn thám', date: '', by: '' }, version: 1 },
        { id: 'PLOT-VN-BP-03', supplierId: 'NCC-VN-002', owner: 'Lâm trường Bù Đăng, khoảnh 4 lô 12', country: 'VN', place: 'Xã Bom Bo, Bù Đăng, Bình Phước', species: 'Eucalyptus camaldulensis', areaHa: 21.3, geometry: { type: 'Polygon', coordinates: [[[107.181820, 11.758920], [107.183210, 11.759240], [107.184650, 11.759110], [107.185620, 11.758410], [107.186100, 11.757350], [107.185910, 11.756210], [107.185210, 11.755310], [107.184020, 11.754820], [107.182810, 11.754750], [107.181920, 11.755210], [107.181310, 11.756150], [107.181150, 11.757280], [107.181350, 11.758250], [107.181820, 11.758920]]] }, plantingYear: 2016, harvestFrom: '2026-10-12', harvestTo: '2026-10-22', landDoc: 'QĐ giao đất 45/QĐ-UBND', forest: clear('2026-10-24'), version: 1 },
        { id: 'PLOT-CN-GX-01', supplierId: 'NCC-CN-001', owner: 'Guangxi Chongzuo Forest Base No. 3', country: 'CN', place: 'Fusui, Chongzuo, Guangxi', species: 'Populus adenopoda', areaHa: 37.0, geometry: { type: 'Polygon', coordinates: [[[107.914210, 22.648950], [107.915820, 22.649420], [107.917450, 22.649610], [107.918920, 22.649210], [107.920150, 22.648350], [107.920820, 22.647210], [107.920750, 22.645950], [107.920110, 22.644820], [107.918950, 22.644110], [107.917520, 22.643850], [107.916050, 22.644020], [107.914820, 22.644750], [107.913950, 22.645810], [107.913650, 22.646950], [107.913720, 22.648050], [107.914210, 22.648950]]] }, plantingYear: 2015, harvestFrom: '2026-08-20', harvestTo: '2026-08-28', landDoc: 'Forest License GF-2018-8812', forest: clear('2026-10-02'), version: 1 },
        { id: 'PLOT-VN-BP-04', supplierId: 'NCC-VN-002', owner: 'Lâm trường Bù Đăng (Khoảnh 6 Lô 8 - FSC)', country: 'VN', place: 'Xã Bom Bo, Bù Đăng, Bình Phước', species: 'Acacia mangium', areaHa: 21.4, geometry: { type: 'Polygon', coordinates: [[[107.194810, 11.764820], [107.196320, 11.765210], [107.197950, 11.764950], [107.199120, 11.764110], [107.199450, 11.762820], [107.199020, 11.761650], [107.197810, 11.760920], [107.196250, 11.760810], [107.195120, 11.761350], [107.194450, 11.762410], [107.194350, 11.763720], [107.194810, 11.764820]]] }, plantingYear: 2015, harvestFrom: '2026-10-18', harvestTo: '2026-10-28', landDoc: 'QĐ giao đất 78/QĐ-UBND (FSC-FM)', forest: clear('2026-10-30'), version: 1 }
    ];

    const approved = at => ({ by: 'Nguyễn Thị Thu Hà', at, reason: 'Đủ hồ sơ theo bộ tiêu chuẩn' });
    const domesticDocs = ['Bảng kê lâm sản', 'Hợp đồng mua bán', 'Hóa đơn', 'Chứng từ vận chuyển'];
    const importDocs = ['Hợp đồng mua bán', 'Hóa đơn', 'Packing list', 'Vận đơn', 'C/O', 'Tờ khai hải quan', 'Kiểm dịch thực vật'];
    const recycledDocs = ['Chứng nhận tái chế FSC/PEFC', 'Tỷ lệ nguyên sinh & tái chế', 'Xác nhận nguồn gốc dăm phụ phẩm'];
    
    // 7 Lô nguyên liệu khớp 100% Claude Artifact (4 Đạt, 1 Cần bổ sung, 2 Không đạt)
    const receipts = [
        { id: 'NL2610V01', plate: '60C-821.45', supplierId: 'NCC-VN-001', date: '2026-10-26', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 20, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 24500, tare: 10250, moisture: 14.5, grade: 'E', bay: 'K1.7-04', plotIds: ['PLOT-VN-DN-01', 'PLOT-VN-DN-02'], docs: domesticDocs, note: 'Lô cao su Định Quán', approval: approved('2026-10-26'), mitigations: [], status: 'PASS', m3: 100, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-TP-2610-01' },
        { id: 'NL2610V02', plate: '60C-417.02', supplierId: 'NCC-VN-001', date: '2026-10-26', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 17, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 20900, tare: 10150, moisture: 14.8, grade: 'E', bay: 'K1.7-05', plotIds: ['PLOT-VN-DN-02'], docs: domesticDocs, note: 'Lô cao su Gia Canh', approval: approved('2026-10-26'), mitigations: [], status: 'PASS', m3: 85, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-TP-2610-02' },
        { id: 'NL2610V03', plate: '60C-552.19', supplierId: 'NCC-VN-004', date: '2026-10-27', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 10, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 16900, tare: 8000, moisture: 15.0, grade: 'E+', bay: 'W01', plotIds: ['PLOT-VN-DN-03'], docs: ['Hợp đồng mua bán', 'Hóa đơn', 'Bảng kê lâm sản'], note: 'Tạm lưu Khu B: Chờ bổ sung chứng từ vận chuyển', approval: null, mitigations: [], status: 'PENDING', issueReason: 'Hộ ông Nguyễn Văn Hòa (ví dụ) · Thiếu chứng từ vận chuyển', m3: 50, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-VH-2610-01' },
        { id: 'NL2610V04', plate: '93C-338.90', supplierId: 'NCC-VN-005', date: '2026-10-27', species: 'Eucalyptus camaldulensis', layer: 'CORE', pkgCount: 24, sheetsPerPkg: 1000, l: 1270, w: 850, t: 2.0, gross: 32000, tare: 14000, moisture: 22.0, grade: 'E', bay: 'Q01', plotIds: ['PLOT-VN-TC-04'], docs: ['Hóa đơn'], note: 'Khóa Khu C: Thửa >4ha chưa có polygon & viễn thám', approval: null, mitigations: [], status: 'FAIL', issueReason: 'Đại lý gỗ Tân Châu (ví dụ) · Diện tích trên 4 ha phải có polygon ranh giới; Chưa có bằng chứng không phá rừng sau 31/12/2020; Thiếu giấy tờ quyền sử dụng đất / rừng', m3: 120, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-TC-2610-01' },
        { id: 'NL2610V05', plate: '93C-114.78', supplierId: 'NCC-VN-002', date: '2026-10-27', species: 'Hevea brasiliensis', layer: 'CORE', pkgCount: 10, sheetsPerPkg: 1000, l: 1270, w: 640, t: 1.7, gross: 18500, tare: 9000, moisture: 14.0, grade: 'E', bay: 'K1.7-06', plotIds: ['PLOT-VN-DN-01'], docs: domesticDocs, note: 'Lô cao su HTX Bù Đăng', approval: approved('2026-10-27'), mitigations: [], status: 'PASS', m3: 50, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-BD-2610-01' },
        { id: 'NL2610V06', plate: '93C-207.66', supplierId: 'NCC-VN-002', date: '2026-10-28', species: 'Eucalyptus camaldulensis', layer: 'CORE', pkgCount: 29, sheetsPerPkg: 1000, l: 1270, w: 850, t: 2.0, gross: 38200, tare: 15600, moisture: 15.2, grade: 'D', bay: 'K2.0-02', plotIds: ['PLOT-VN-BP-03'], docs: domesticDocs, note: 'Lô bạch đàn Bù Đăng', approval: approved('2026-10-28'), mitigations: [], status: 'PASS', m3: 116, sourceCategory: 'DOMESTIC', batchCode: 'KIEN-BD-2610-02' },
        { id: 'NL2610V07', plate: '51D-902.13 / TGHU98214', supplierId: 'NCC-CN-002', date: '2026-10-28', species: 'Populus adenopoda', layer: 'FACE', pkgCount: 12, sheetsPerPkg: 1000, l: 1270, w: 2500, t: 0.5, gross: 28500, tare: 20700, moisture: 11.8, grade: 'A', bay: 'Q02', plotIds: [], docs: ['Tờ khai HQ'], note: 'Khóa Khu C: Thiếu chứng từ xuất xứ và tọa độ vùng trồng Sơn Đông', approval: null, mitigations: [], status: 'FAIL', issueReason: 'Shandong Poplar Veneer (ví dụ) · Thiếu tọa độ vùng trồng; Thiếu kỳ khai thác; Chưa có bằng chứng không phá rừng sau 31/12/2020; Thiếu giấy tờ quyền sử dụng đất / rừng; Nhà cung cấp chưa cung cấp tọa độ và cam kết về vùng khai thác gốc; Chưa khai báo diện tích lô', m3: 48, sourceCategory: 'IMPORT', batchCode: 'CONT-SD-2610-01' }
    ];

    let pkgNo = 0;
    const packages = [];
    receipts.forEach(r => {
        const pkgM3 = +(r.m3 / r.pkgCount).toFixed(4);
        for (let i = 0; i < r.pkgCount; i++) {
            pkgNo++;
            packages.push({ id: 'PKG-LV-2026-' + String(pkgNo).padStart(4, '0'), receiptId: r.id, sheets: r.sheetsPerPkg, m3: pkgM3 });
        }
    });
    const pkgsOf = id => packages.filter(p => p.receiptId === id);

    // Cân bằng khối lượng: 135 m³ Cao su (100 m³ NL2610V01 + 35 m³ NL2610V02) & 40 m³ Bạch đàn (NL2610V06) đưa vào SX
    const wo1Allocations = [
        ...pkgsOf('NL2610V01').map(p => ({ packageId: p.id, m3: p.m3 })),
        ...pkgsOf('NL2610V02').slice(0, 7).map(p => ({ packageId: p.id, m3: p.m3 })),
        ...pkgsOf('NL2610V06').slice(0, 10).map(p => ({ packageId: p.id, m3: p.m3 }))
    ];

    const stage = (by, confirmBy, start, end, machine, out, extra = {}) => ({ status: 'DONE', by, confirmBy, shift: 'Ca 1', start, end, machine, out, at: end.slice(0, 10), note: '', revisions: [], ...extra });

    const workOrders = [
        {
            id: 'WO-261029-01', product: 'Ván ép cốp pha phủ phim 18 mm', market: 'EU', l: 1220, w: 2440, t: 18, targetSheets: 1000, plies: 13, glue: 'Phenol WBP', created: '2026-10-29',
            allocations: wo1Allocations, finishedSheets: 1000, qaNote: '100% gỗ từ nguồn đạt EUDR, hoàn tất 7 công đoạn', lot: 'FG-261029-01',
            stages: [
                stage('Đoàn Văn Mạnh', 'Phạm Quốc Bảo', '2026-10-29T07:30', '2026-10-29T16:30', 'MC-ZICZAC-01', 5500),
                stage('Trần Anh Tuấn', 'Phạm Quốc Bảo', '2026-10-30T07:30', '2026-10-30T10:30', 'MC-GLUE-02', 1050, { glue: 320 }),
                stage('Võ Thị Lệ', 'Phạm Quốc Bảo', '2026-10-30T10:45', '2026-10-30T15:30', 'MC-COLD-01', 1050, { pressure: 100, minutes: 45, patches: 142, patchLot: 'NL2610V01' }),
                stage('Nguyễn Văn Đức', 'Phạm Quốc Bảo', '2026-10-31T07:30', '2026-10-31T16:30', 'MC-HOTPRESS-01', 1045, { temp: 125, bar: 120, minutes: 22 }),
                stage('Lý Văn Sơn', 'Phạm Quốc Bảo', '2026-11-01T07:30', '2026-11-01T11:30', 'MC-SANDER-03', 1030, { thickness: 18.1 }),
                stage('Đinh Công Hậu', 'Phạm Quốc Bảo', '2026-11-01T13:00', '2026-11-01T16:30', 'MC-TRIM-02', 1020, { scrapKg: 410, scrapUse: 'Băm làm chân pallet, giữ mã lô gốc' }),
                stage('Bùi Thị Hoa', 'Nguyễn Thị Thu Hà', '2026-11-02T07:30', '2026-11-02T11:00', 'Đèn soi góc nghiêng', 1000, { gradeA: 1000, gradeB: 0, gradeC: 0 })
            ]
        }
    ];

    const pallets = [];
    for (let i = 1; i <= 20; i++) {
        pallets.push({ id: 'PAL-LV-2026-' + String(100 + i).padStart(4, '0'), workOrderId: 'WO-261029-01', sheets: 50, kg: 1875, packing: 'ISPM 15, carton ECOTECH2A PLYWOOD', location: 'Kho TP EU, kệ P-' + String(i).padStart(2, '0'), created: '2026-11-02' });
    }

    // Thông tin kiểm đếm ở trạm cân và KCS của 7 lô nguyên liệu
    const scaleInfo = { 'NL2610V01': 1, 'NL2610V02': 1, 'NL2610V03': 1, 'NL2610V04': 2, 'NL2610V05': 1, 'NL2610V06': 2, 'NL2610V07': 1 };
    receipts.forEach(r => {
        r.trip = scaleInfo[r.id] || 1;
        r.workshop = r.layer === 'FACE' ? 'Xưởng ván mặt' : 'Xưởng ván ruột';
        r.expectedKg = r.gross - r.tare;
        r.dataSource = 'Trạm cân';
        r.kcs = { by: 'Lê Hoàng Phúc', at: r.date };
        r.done = !!r.approval;
    });

    const customers = [
        { id: 'KH-DE-01', name: 'Holz & Bau Plywood Import GmbH', address: 'Hafenstraße 12, 20457 Hamburg', email: 'import@holzbau.example', eori: 'DE198273645', country: 'DE' },
        { id: 'KH-NL-01', name: 'Van den Berg Timber & Plywood BV', address: 'Westhavenweg 42, 1042 AL Amsterdam', email: 'orders@vandenbergtimber.example', eori: 'NL849201847B01', country: 'NL' },
        { id: 'KH-FR-01', name: 'Comptoir des Bois SAS', address: '8 Quai de la Fosse, 44000 Nantes', email: 'achat@comptoirbois.example', eori: 'FR88291048210', country: 'FR' },
        { id: 'KH-US-01', name: 'Pacific Panel Trading LLC', address: '400 Harbor Blvd, Long Beach, CA', email: 'buy@pacificpanel.example', eori: '', country: 'US' },
        { id: 'KH-VN-01', name: 'Công ty Xây dựng Đại Thành', address: 'Biên Hòa, Đồng Nai', email: 'vattu@daithanh.example', eori: '', country: 'VN' }
    ];

    // Xe đã cân, đang chờ kho tiếp nhận. Tương ứng khu vực Trạm cân.
    const scaleTickets = [
        { id: 'SC-261104-01', plate: '60C-338.21', workshop: 'Xưởng ván ruột', trip: 1, supplierId: 'NCC-VN-001', phone: '0918 234 567', expectedKg: 9000, gross: 17150, tare: 8200, date: '2026-11-04', plotIds: ['PLOT-VN-DN-02'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: 'Ván bóc cao su', batchCode: 'KIEN-TP-2611-03' },
        { id: 'SC-261104-02', plate: '93C-207.66', workshop: 'Xưởng ván ruột', trip: 2, supplierId: 'NCC-VN-002', phone: '0983 112 233', expectedKg: 12000, gross: 27400, tare: 15600, date: '2026-11-04', plotIds: ['PLOT-VN-BP-03'], receiptId: '', sourceCategory: 'DOMESTIC', rawType: 'Ván bóc bạch đàn', batchCode: 'KIEN-BD-2611-05' },
        { id: 'SC-261104-03', plate: '51D-902.13', workshop: 'Xưởng ván mặt', trip: 1, supplierId: 'NCC-CN-001', phone: '+86 771 582 9901', expectedKg: 8500, gross: 22500, tare: 14000, date: '2026-11-04', plotIds: ['PLOT-CN-GX-01'], receiptId: '', sourceCategory: 'IMPORT', rawType: 'Veneer mặt Poplar (Nam Ninh)', batchCode: 'CONT-NN-2611-01' },
        { id: 'SC-261104-04', plate: '60C-991.22', workshop: 'Xưởng tận dụng phụ phẩm', trip: 1, supplierId: 'NCC-VN-002', phone: '0983 112 233', expectedKg: 9000, gross: 17500, tare: 8500, date: '2026-11-04', plotIds: ['PLOT-VN-BP-03'], receiptId: '', sourceCategory: 'RECYCLED', rawType: 'Phụ phẩm bóc ván / Dăm tái chế FSC', batchCode: 'KIEN-RC-2611-01' }
    ];

    const car = (no, list) => ({ id: `XE-${no}`, product: 'Ván ép cốp pha phủ phim 18 mm', typeCar: 'Container 40HC', plate: `51D-90${no}.13`, seal: `SL26110${no}`, cont: `TGHU9821${no}`, date: '2026-11-05', kg: 18750, timeIn: '08:00', timeOut: '11:30', remark: '', palletIds: list });
    const orders = [
        {
            id: 'DPO26102801', customerId: 'KH-DE-01', customer: customers[0].name, customerAddress: customers[0].address, customerEmail: customers[0].email, eori: customers[0].eori, countryId: 'DE',
            type: 'OUT', transportType: 'WATER', certificate: 'FSC', deliveryLocation: 'Cảng Hamburg', pickUpLocation: 'Nhà máy ECOtech2A, KCN Tam Phước', shipping: 'Vận tải Biển Đông', vesselName: 'MV Pacific Star', billOfLading: 'BL-LV-261105', customsNo: '306812345670', numberOrder: 'LV-2026/118', invoice: 'INV-2611-07', paymentType: 'T/T', exportCategory: 'Xuất kinh doanh', invoiceDate: '2026-11-03', contractNo: 'CTR-LV-DE-2026-11', contractDate: '2026-10-28', shippingDate: '2026-11-05', endDate: '', viewingPeriod: '2031-11-03', passCode: 'LV2026', hsCode: '4412.33.00', filer: 'CUSTOMER', remark: '',
            items: [{ id: 'SP-1', product: 'Ván ép cốp pha phủ phim 18 mm', certificate: 'FSC', price: 420, currency: 'USD', quantity: 22.0, unit: 'm³', remark: '' }],
            cars: [car(1, pallets.slice(0, 10).map(p => p.id)), car(2, pallets.slice(10).map(p => p.id))],
            palletIds: pallets.slice(0, 20).map(p => p.id), status: 4, confirmedAt: '2026-11-03', confirmedBy: 'Phòng Kinh doanh XK', dds: { reference: 'DDS-2026-DE-LV99812', authority: 'Ủy ban Châu Âu TRACES-NT' }, created: '2026-11-02', viewLog: [], failLog: []
        }
    ];

    const contracts = [];

    const audit = [
        { at: '2026-10-28 16:00', by: 'Hệ thống', action: 'Khởi tạo', detail: 'Khởi tạo dữ liệu ví dụ (có thể xóa khi nhập dữ liệu thật)', hash: '00000000' }
    ];

    config.euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    config.certificates = ['FSC', 'PEFC', 'CARB P2', 'Không'];

    const speciesDetails = [
        { id: 'SP-HEVEA', common: 'Cao su', scientific: 'Hevea brasiliensis', family: 'Euphorbiaceae', hsCode: '4412.33.00', role: 'Ván ruột (Core)', origin: 'Việt Nam', densityKgM3: 650, risk: 'LOW' },
        { id: 'SP-POPLAR', common: 'Gỗ Dương (Poplar)', scientific: 'Populus adenopoda', family: 'Salicaceae', hsCode: '4412.34.00', role: 'Ván mặt (Face/Back)', origin: 'Trung Quốc', densityKgM3: 480, risk: 'LOW' },
        { id: 'SP-ACACIA', common: 'Keo tai tượng', scientific: 'Acacia mangium', family: 'Fabaceae', hsCode: '4412.33.00', role: 'Ván ruột (Core)', origin: 'Việt Nam', densityKgM3: 620, risk: 'LOW' },
        { id: 'SP-EUCALYPTUS', common: 'Bạch đàn', scientific: 'Eucalyptus camaldulensis', family: 'Myrtaceae', hsCode: '4412.33.00', role: 'Ván ruột (Core)', origin: 'Việt Nam', densityKgM3: 720, risk: 'LOW' },
        { id: 'SP-BIRCH', common: 'Bạch dương (Birch)', scientific: 'Betula alnoides', family: 'Betulaceae', hsCode: '4412.33.00', role: 'Ván mặt cao cấp', origin: 'Việt Nam / TQ', densityKgM3: 670, risk: 'LOW' }
    ];

    const provinces = [
        { id: 'VN-DN', name: 'Đồng Nai', code: '75', country: 'VN', forestAreaHa: 182400, rubberAreaHa: 45000 },
        { id: 'VN-BP', name: 'Bình Phước', code: '70', country: 'VN', forestAreaHa: 156000, rubberAreaHa: 240000 },
        { id: 'VN-LD', name: 'Lâm Đồng', code: '68', country: 'VN', forestAreaHa: 538000, rubberAreaHa: 12000 },
        { id: 'VN-BD', name: 'Bình Dương', code: '74', country: 'VN', forestAreaHa: 10500, rubberAreaHa: 130000 },
        { id: 'CN-GX', name: 'Quảng Tây (Guangxi)', code: '45', country: 'CN', forestAreaHa: 14800000, rubberAreaHa: 0 }
    ];
    const districts = [
        { id: 'VN-DN-DQ', provinceId: 'VN-DN', name: 'Huyện Định Quán', code: '737' },
        { id: 'VN-DN-TP', provinceId: 'VN-DN', name: 'Huyện Tân Phú', code: '738' },
        { id: 'VN-BP-BD', provinceId: 'VN-BP', name: 'Huyện Bù Đăng', code: '693' },
        { id: 'VN-LD-DT', provinceId: 'VN-LD', name: 'Huyện Đức Trọng', code: '677' },
        { id: 'CN-GX-CZ', provinceId: 'CN-GX', name: 'Thành phố Sùng Tả (Chongzuo)', code: 'CZ01' },
        { id: 'CN-GX-NN', provinceId: 'CN-GX', name: 'Thành phố Nam Ninh (Nanning)', code: 'NN01' }
    ];
    const wards = [
        { id: 'W-DN-01', districtId: 'VN-DN-DQ', name: 'Xã Phú Tân', code: '26245' },
        { id: 'W-DN-02', districtId: 'VN-DN-DQ', name: 'Xã Gia Canh', code: '26251' },
        { id: 'W-BP-03', districtId: 'VN-BP-BD', name: 'Xã Bom Bo', code: '25330' },
        { id: 'W-LD-04', districtId: 'VN-LD-DT', name: 'Xã Đa Nhim', code: '24961' },
        { id: 'W-CN-05', districtId: 'CN-GX-CZ', name: 'Huyện Phù Cừ (Fusui)', code: 'FS02' }
    ];

    const landTypes = [
        { id: 'LT-01', name: 'Đất rừng sản xuất (RSX)', desc: 'Rừng trồng lấy gỗ thương mại, có phương án quản lý rừng bền vững', code: 'RSX' },
        { id: 'LT-02', name: 'Đất nông nghiệp trồng cao su (CLN)', desc: 'Cây công nghiệp lâu năm thanh lý lấy gỗ ván lạng', code: 'CLN' },
        { id: 'LT-03', name: 'Đất lâm trường quốc doanh giao khoán', desc: 'Rừng kinh tế Nhà nước giao khoán hộ nhận khoán bảo vệ & khai thác', code: 'LTGK' }
    ];
    const landCertTypes = [
        { id: 'LC-01', name: 'Giấy chứng nhận QSDĐ (Sổ đỏ)', authority: 'UBND Huyện / Tỉnh cấp', requiredEudr: true },
        { id: 'LC-02', name: 'Quyết định giao đất / giao rừng', authority: 'Sở NN&PTNT / UBND Tỉnh', requiredEudr: true },
        { id: 'LC-03', name: 'Hợp đồng giao khoán đất lâm nghiệp', authority: 'Ban Quản lý Rừng / Lâm trường', requiredEudr: true },
        { id: 'LC-04', name: 'Bảng kê lâm sản xác nhận nguồn gốc', authority: 'Hạt Kiểm lâm phê duyệt theo TT 26/2022', requiredEudr: true },
        { id: 'LC-05', name: 'Giấy phép khai thác nước ngoài (Forest License)', authority: 'Cơ quan Lâm nghiệp nước sở tại (TQ)', requiredEudr: true }
    ];
    const certifications = [
        { id: 'CERT-FSC', name: 'FSC-FM / FSC-CoC', code: 'FSC-C102938', issuer: 'SGS Vietnam', validUntil: '2028-12-31', scope: 'Chuỗi hành trình ván ép' },
        { id: 'CERT-PEFC', name: 'PEFC / VFCS', code: 'PEFC/38-31-092', issuer: 'Hội đồng Quản lý rừng bền vững VFCO', validUntil: '2027-08-15', scope: 'Gỗ rừng trồng cao su VN' },
        { id: 'CERT-EUDR', name: 'Cam kết Không phá rừng (EUDR Art. 3)', code: 'EUDR-LV-2026', issuer: 'ECOtech2A & Nhà cung cấp ký', validUntil: '2030-12-31', scope: 'Mốc chặn 31/12/2020' },
        { id: 'CERT-CARB', name: 'CARB P2 / EPA TSCA Title VI', code: 'CARB-P2-8812', issuer: 'Benchmark Holdings LLC', validUntil: '2027-10-01', scope: 'Phát thải Formaldehyde < 0.05 ppm' }
    ];

    const machines = [
        { id: 'MC-ZICZAC-01', name: 'Máy may chỉ nhiệt Ziczac MC-01', stage: 'May ghép ván', capacity: '6,000 tấm/ca', operator: 'Đoàn Văn Mạnh', status: 'ACTIVE', note: 'May khổ ván 1220x2440' },
        { id: 'MC-GLUE-02', name: 'Máy lăn keo trục đôi MC-02', stage: 'Lăn keo & xếp lớp', capacity: '1,200 tấm/ca', operator: 'Trần Anh Tuấn', status: 'ACTIVE', note: 'Định mức 300-340 g/m² keo WBP' },
        { id: 'MC-COLD-01', name: 'Máy ép nguội thủy lực 100 Tấn', stage: 'Ép nguội & vá', capacity: '1,200 tấm/ca', operator: 'Võ Thị Lệ', status: 'ACTIVE', note: 'Ép phẳng 45 phút, vá veneer cùng lô' },
        { id: 'MC-HOTPRESS-01', name: 'Máy ép nóng thủy lực 15 tầng', stage: 'Ép nóng', capacity: '1,200 tấm/ca', operator: 'Nguyễn Văn Đức', status: 'ACTIVE', note: 'Nhiệt độ 125°C, áp suất 120 bar' },
        { id: 'MC-SANDER-03', name: 'Máy chà nhám thùng 3 trục MC-03', stage: 'Bả bột & chà nhám', capacity: '1,100 tấm/ca', operator: 'Lý Văn Sơn', status: 'ACTIVE', note: 'Dung sai độ dày ±0.3 mm' },
        { id: 'MC-TRIM-02', name: 'Máy cắt 4 biên tự động MC-02', stage: 'Cắt cạnh', capacity: '1,200 tấm/ca', operator: 'Đinh Công Hậu', status: 'ACTIVE', note: 'Kích thước chuẩn 1220x2440 mm' },
        { id: 'QC-STATION-01', name: 'Bàn KCS đèn soi góc nghiêng', stage: 'KCS đèn soi', capacity: '1,200 tấm/ca', operator: 'Bùi Thị Hoa', status: 'ACTIVE', note: 'Phân hạng A xuất EU, loại phế phẩm' }
    ];
    const warehouseBays = [
        { id: 'K1.7-04', zone: 'ZONE_A', name: 'Ô K1.7-04 (Ván ruột Đạt EUDR)', maxM3: 50, curM3: 21.92, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' },
        { id: 'K1.7-05', zone: 'ZONE_A', name: 'Ô K1.7-05 (Ván ruột Đạt EUDR)', maxM3: 50, curM3: 16.44, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' },
        { id: 'M0.5-01', zone: 'ZONE_A', name: 'Ô M0.5-01 (Ván mặt Poplar TQ Đạt)', maxM3: 60, curM3: 17.28, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' },
        { id: 'M0.5-02', zone: 'ZONE_A', name: 'Ô M0.5-02 (Ván mặt Birch TQ Đạt)', maxM3: 60, curM3: 15.87, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' },
        { id: 'K2.0-02', zone: 'ZONE_A', name: 'Ô K2.0-02 (Ván ruột Bạch đàn Đạt)', maxM3: 50, curM3: 30.6, status: 'OPEN', allowed: 'Cấp cho Lệnh SX EU' },
        { id: 'W01', zone: 'ZONE_B', name: 'Ô W01 (Khóa tạm 48h)', maxM3: 40, curM3: 13.7, status: 'LOCKED', allowed: 'Cấm đưa vào Lệnh SX' },
        { id: 'Q01', zone: 'ZONE_C', name: 'Ô Q01 (Cách ly - Mất rừng sau 2020)', maxM3: 40, curM3: 10.96, status: 'QUARANTINE', allowed: 'Chỉ xuất làm củi / nội địa' },
        { id: 'KHO-TP-EU', zone: 'EXPORT', name: 'Kho Pallet thành phẩm xuất EU', maxM3: 200, curM3: 53.58, status: 'OPEN', allowed: 'Pallet chuẩn ISPM 15' }
    ];
    const plywoodSpecs = [
        { id: 'SPEC-18-FILM', name: 'Ván cốp pha phủ phim 18mm', dim: '1220 x 2440 x 18 mm', plies: 13, glue: 'Phenol WBP', face: 'Poplar TQ 0.5mm', core: 'Cao su VN 1.7mm', density: '690 kg/m³', grade: 'Hạng A' },
        { id: 'SPEC-12-PKG', name: 'Ván ép bao bì đóng gói 12mm', dim: '1220 x 2440 x 12 mm', plies: 9, glue: 'Phenol WBP', face: 'Poplar TQ 0.5mm', core: 'Cao su / Keo VN 1.7mm', density: '660 kg/m³', grade: 'Hạng A' },
        { id: 'SPEC-15-COMM', name: 'Ván ép thương mại 15mm', dim: '1220 x 2440 x 15 mm', plies: 11, glue: 'Melamine E0', face: 'Bạch dương Birch 0.6mm', core: 'Bạch đàn VN 2.0mm', density: '710 kg/m³', grade: 'Hạng A' }
    ];
    const glueSpecs = [
        { id: 'GLUE-01', name: 'Keo Phenol Formaldehyde (WBP)', type: 'Chịu đun sôi 72h', standard: 'EN 314-2 Class 3', emission: 'E0 / CARB P2', consumption: '320 g/m² hai mặt' },
        { id: 'GLUE-02', name: 'Keo Melamine Formaldehyde (MUF)', type: 'Chịu ẩm cao', standard: 'EN 314-2 Class 2', emission: 'E0 / CARB P2', consumption: '300 g/m² hai mặt' },
        { id: 'PUTTY-01', name: 'Bột bả trám khuyết tật gỗ Plywood', type: 'Gốc nước Polymer', standard: 'REACH Compliant', emission: 'Zero VOC', consumption: '80 g/m²' }
    ];
    const surveyBatches = [
        { id: 'BAT-2026-01', name: 'Đợt 1/2026: Khảo sát vùng rừng Cao su Định Quán', date: '2026-10-01', inspector: 'Lê Hoàng Phúc', totalAreaHa: 25.4, plotsChecked: 5, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' },
        { id: 'BAT-2026-02', name: 'Đợt 2/2026: Khảo sát lâm trường Bù Đăng, Bình Phước', date: '2026-10-10', inspector: 'Nguyễn Thị Thu Hà', totalAreaHa: 32.8, plotsChecked: 6, deforestationStatus: '100% CLEAR', riskAssessment: 'LOW' },
        { id: 'BAT-2026-03', name: 'Đợt 3/2026: Thẩm tra vùng keo Đức Trọng, Lâm Đồng', date: '2026-11-01', inspector: 'Phạm Quốc Bảo', totalAreaHa: 15.2, plotsChecked: 3, deforestationStatus: 'LOSS_DETECTED (1 thửa vi phạm)', riskAssessment: 'HIGH' }
    ];
    const farmers = [
        { id: 'HL-01', name: 'Hộ Lê Văn Thành', type: 'SMALLHOLDER', phone: '0918.234.567', cccd: '075084001234', address: 'Ấp 3, Xã Phú Tân, Huyện Định Quán, Đồng Nai', areaHa: 2.8, species: 'Hevea brasiliensis', landDoc: 'GCNQSDĐ CN 829104', plots: ['PLOT-VN-DN-01'], eudrStatus: 'PASS' },
        { id: 'HL-02', name: 'Hộ Nguyễn Văn Nam', type: 'SMALLHOLDER', phone: '0983.112.233', cccd: '075082005678', address: 'Ấp 1, Xã Gia Canh, Huyện Định Quán, Đồng Nai', areaHa: 6.5, species: 'Hevea brasiliensis', landDoc: 'GCNQSDĐ CN 912837', plots: ['PLOT-VN-DN-02'], eudrStatus: 'PASS' },
        { id: 'HL-03', name: 'Nông trường Bù Đăng (Khoảnh 4 Lô 12)', type: 'FORESTRY_COMPANY', phone: '0271.382.9102', cccd: 'MST: 3801123456', address: 'Xã Bom Bo, Huyện Bù Đăng, Bình Phước', areaHa: 8.2, species: 'Eucalyptus camaldulensis', landDoc: 'QĐ giao đất 45/QĐ-UBND', plots: ['PLOT-VN-BP-03'], eudrStatus: 'PASS' },
        { id: 'HL-04', name: 'Guangxi Chongzuo Forest Base No. 3', type: 'FOREIGN_BASE', phone: '+86 771 582 9901', cccd: 'Tax: CN91450100MA5XXXX', address: 'Fusui, Chongzuo, Guangxi, China', areaHa: 14.5, species: 'Populus adenopoda', landDoc: 'License GF-2018-8812', plots: ['PLOT-CN-GX-01'], eudrStatus: 'PASS' },
        { id: 'HL-06', name: 'Guangxi Fusui Birch Plantation', type: 'FOREIGN_BASE', phone: '+86 771 582 9902', cccd: 'Tax: CN91450100MA6YYYY', address: 'Fusui, Chongzuo, Guangxi, China', areaHa: 11.2, species: 'Betula alnoides', landDoc: 'License GF-2019-9941', plots: ['PLOT-CN-GX-02'], eudrStatus: 'PASS' },
        { id: 'HL-05', name: 'Hộ Đặng Văn Hùng (Ven rừng Đa Nhim)', type: 'SMALLHOLDER', phone: '0903.888.999', cccd: '068079009876', address: 'Xã Đa Nhim, Huyện Đức Trọng, Lâm Đồng', areaHa: 5.1, species: 'Acacia mangium', landDoc: 'Chưa có sổ đỏ', plots: ['PLOT-VN-LD-99'], eudrStatus: 'FAIL' }
    ];
    const accounts = [
        { username: 'admin', fullName: 'Võ Minh Trí', role: 'quantri', position: 'Quản trị viên hệ thống', email: 'admin@ecotech2a.com', lastLogin: '2026-11-04 14:30', status: 'ACTIVE' },
        { username: 'eudr_officer', fullName: 'Nguyễn Thị Thu Hà', role: 'tuanthu', position: 'Trưởng ban Tuân thủ EUDR & DDS', email: 'ha.ntt@ecotech2a.com', lastLogin: '2026-11-04 15:10', status: 'ACTIVE' },
        { username: 'gis_specialist', fullName: 'Lê Hoàng Phúc', role: 'tuanthu', position: 'Chuyên viên GIS & Viễn thám Bản đồ', email: 'phuc.lh@ecotech2a.com', lastLogin: '2026-11-04 14:55', status: 'ACTIVE' },
        { username: 'factory_manager', fullName: 'Phạm Quốc Bảo', role: 'sanxuat', position: 'Quản đốc Nhà máy Plywood', email: 'bao.pq@ecotech2a.com', lastLogin: '2026-11-04 13:20', status: 'ACTIVE' },
        { username: 'scale_officer', fullName: 'Đặng Tuấn Anh', role: 'kho', position: 'Cán bộ trạm cân & KCS tiếp nhận', email: 'anh.dt@ecotech2a.com', lastLogin: '2026-11-04 15:00', status: 'ACTIVE' },
        { username: 'sales_export', fullName: 'Lê Thùy Dương', role: 'kinhdoanh', position: 'Trưởng phòng Kinh doanh Xuất khẩu', email: 'duong.lt@ecotech2a.com', lastLogin: '2026-11-04 11:45', status: 'ACTIVE' }
    ];

    const purchaseOrders = [
        { id: 'LM-2610-001', date: '2026-10-05', supplierId: 'NCC-VN-001', originCountry: 'VN', species: 'Hevea brasiliensis', layer: 'CORE', l: 1270, w: 640, t: 1.7, qtyM3: 185, price: 3200000, currency: 'VND', deliveryDate: '2026-10-30', deliveryPlace: 'Nhà máy ECOtech2A', status: 'OPEN', receiptIds: ['NL2610V01', 'NL2610V02'], note: '' },
        { id: 'LM-2610-002', date: '2026-10-08', supplierId: 'NCC-VN-002', originCountry: 'VN', species: 'Eucalyptus camaldulensis', layer: 'CORE', l: 1270, w: 850, t: 2.0, qtyM3: 150, price: 2900000, currency: 'VND', deliveryDate: '2026-11-10', deliveryPlace: 'Nhà máy ECOtech2A', status: 'OPEN', receiptIds: ['NL2610V06'], note: '' },
        { id: 'LM-2610-003', date: '2026-10-15', supplierId: 'NCC-CN-001', originCountry: 'CN', species: 'Populus adenopoda', layer: 'FACE', l: 1270, w: 2500, t: 0.5, qtyM3: 40, price: 185, currency: 'USD', deliveryDate: '2026-11-18', deliveryPlace: 'Nhà máy ECOtech2A', incoterm: 'CIF', port: 'Cát Lái', containers: 2, foreignContract: 'CTR-GX-2026/07', status: 'OPEN', receiptIds: [], note: '' },
        { id: 'LM-2610-004', date: '2026-10-22', supplierId: 'NCC-CN-002', originCountry: 'CN', species: 'Populus adenopoda', layer: 'FACE', l: 1270, w: 2500, t: 0.5, qtyM3: 25, price: 178, currency: 'USD', deliveryDate: '2026-12-05', deliveryPlace: 'Nhà máy ECOtech2A', incoterm: 'FOB', port: 'Cái Mép', containers: 1, foreignContract: '', status: 'DRAFT', receiptIds: [], note: '' }
    ];

    const materials = [
        ...glueSpecs.map(g => ({ id: g.id, name: g.name, group: 'Keo', spec: g.type, standard: g.standard, norm: g.consumption, unit: 'kg' })),
        { id: 'VT-BOT-01', name: 'Bột bả trám hữu cơ', group: 'Bột bả', spec: 'Trám bề mặt ván', standard: 'REACH', norm: '', unit: 'kg' },
        { id: 'VT-PHIM-01', name: 'Phim phủ mặt ván', group: 'Phim phủ', spec: 'Phủ ván cốp pha', standard: '', norm: '', unit: 'tờ' },
        { id: 'VT-PAL-01', name: 'Pallet gỗ hun trùng', group: 'Đóng gói', spec: 'Đóng hàng xuất khẩu', standard: 'ISPM 15', norm: '', unit: 'cái' },
        { id: 'VT-DAI-01', name: 'Đai đóng kiện', group: 'Đóng gói', spec: 'Đóng đai pallet', standard: '', norm: '', unit: 'cuộn' },
        { id: 'VT-TEM-01', name: 'Tem QR truy xuất', group: 'Đóng gói', spec: 'Dán góc pallet', standard: '', norm: '', unit: 'tem' }
    ];

    const ports = [
        { id: 'PORT-VN-CL', name: 'Cảng Cát Lái (TP.HCM)', code: 'VNCLI', type: 'SEAPORT', country: 'VN', role: 'Cảng bốc dỡ chính Miền Nam' },
        { id: 'PORT-VN-CM', name: 'Cảng Cái Mép - Thị Vải', code: 'VNCMT', type: 'DEEPSEAPORT', country: 'VN', role: 'Cảng nước sâu đi thẳng Âu - Mỹ' },
        { id: 'PORT-VN-DV', name: 'Cảng Đình Vũ (Hải Phòng)', code: 'VNHPH', type: 'SEAPORT', country: 'VN', role: 'Cảng trung chuyển Miền Bắc' },
        { id: 'PORT-DE-HAM', name: 'Cảng Hamburg (Đức)', code: 'DEHAM', type: 'SEAPORT', country: 'DE', role: 'Cảng nhập EU - Cửa ngõ Trung Âu' },
        { id: 'PORT-NL-RTM', name: 'Cảng Rotterdam (Hà Lan)', code: 'NLRTM', type: 'SEAPORT', country: 'NL', role: 'Cảng trung chuyển lớn nhất Châu Âu' },
        { id: 'PORT-FR-LEH', name: 'Cảng Le Havre (Pháp)', code: 'FRLEH', type: 'SEAPORT', country: 'FR', role: 'Cảng nhập Tây Âu' },
        { id: 'PORT-US-LGB', name: 'Cảng Long Beach (Mỹ)', code: 'USLGB', type: 'SEAPORT', country: 'US', role: 'Cảng nhập Bờ Tây Hoa Kỳ' }
    ];

    const hsCodeDetails = [
        { code: '4412.33.00', desc: 'Ván ép từ gỗ rừng trồng nhiệt đới (Cao su, Bạch đàn, Keo tai tượng)', unit: 'm³', eudrRequired: true, dutyRate: '0%' },
        { code: '4412.34.00', desc: 'Ván ép có ít nhất một bề mặt là gỗ cây dương (Poplar - Populus adenopoda)', unit: 'm³', eudrRequired: true, dutyRate: '0%' },
        { code: '4412.39.00', desc: 'Ván ép các lớp mặt từ gỗ lá rộng khác (Bạch dương Birch - Betula alnoides)', unit: 'm³', eudrRequired: true, dutyRate: '0%' },
        { code: '4412.94.00', desc: 'Ván khối, ván thanh và ván ghép lõi gỗ (Blockboard, Laminboard)', unit: 'm³', eudrRequired: true, dutyRate: '0%' },
        { code: '4408.39.90', desc: 'Ván lạng veneer xẻ mỏng ≤ 6mm dùng làm ván mặt và ván ruột', unit: 'm³', eudrRequired: true, dutyRate: '0%' }
    ];

    const ccpSpecs = [
        { code: 'CCP-1', stage: 'Tiếp nhận & Ô kho', name: 'Cách ly ô kho nguyên liệu', mixingRisk: 'Xếp lẫn ván lạng Khu A (Đạt EUDR) với ván Khu B (Chờ giấy tờ) hoặc Khu C (Vi phạm mốc 2020)', controlPoint: 'Thẻ QR màu từng kiện (Xanh/Vàng/Đỏ), định vị ô kho trên WMS, khóa vật lý ô B và C', actionOnViolation: 'Khóa toàn bộ lô kho, cấm cấp phát cho mọi Lệnh sản xuất EU', responsible: 'Thủ kho + KCS Tiếp nhận' },
        { code: 'CCP-2', stage: 'May ghép ván', name: 'Chống lẫn cuộn phôi ván may', mixingRisk: 'Thợ may lấy nhầm lá ván rách, phôi phế thải tồn lưu từ mẻ Non-EU trước đó đan xen vào cuộn ván EU', controlPoint: 'Quét QR kiện ván trước khi đưa lên bàn máy may; kiểm tra phôi sạch bàn máy trước ca', actionOnViolation: 'Hủy toàn bộ cuộn ván may có lẫn phôi, hạ cấp xuống ván bao bì nội địa', responsible: 'Tổ trưởng may ván + QA chuyền' },
        { code: 'CCP-3', stage: 'Lăn keo & Xếp lớp', name: 'Định mức keo & chèn lớp lõi ruột', mixingRisk: 'Công nhân tự ý chèn ván độn không rõ nguồn gốc để bù chiều dày, hoặc dùng sai loại keo Urea giá rẻ', controlPoint: 'Cân kiểm tra tải trọng xếp lớp; đếm đúng số lớp (plies) theo BoM; kiểm tra định mức keo 300-340 g/m²', actionOnViolation: 'Dừng chuyền xếp lớp, cô lập toàn bộ chồng ván chưa ép', responsible: 'Kỹ thuật viên keo + Trưởng ca ép' },
        { code: 'CCP-4', stage: 'Ép nguội & Vá phôi', name: 'Kiểm soát vật liệu vá khuyết tật bề mặt (NGUY CƠ CAO)', mixingRisk: 'KHI VÁ MẮT CHẾT/RÁCH MẶT: Thợ tiện tay nhặt mảnh ván vụn ngoài xưởng (Non-EU) để vá dán vào ván xuất EU', controlPoint: 'BẮT BUỘC miếng vá (veneer patch) phải lấy từ chính lô ván mặt/ruột cùng mã truy xuất (RC-W...). Khay miếng vá có nhãn mã lô', actionOnViolation: 'Lập biên bản vi phạm EUDR, loại bỏ tấm ván khỏi lô EU, chuyển sang bán củi/nội địa', responsible: 'Công nhân vá phôi + KCS kiểm tra 100%' },
        { code: 'CCP-5', stage: 'Ép nóng thủy lực', name: 'Chốt mẻ ép & phân tách mẻ nhiệt', mixingRisk: 'Ép gộp lẫn lộn giữa mẻ ván EU và ván nội địa trên cùng các tầng ép đa tầng 15 tầng', controlPoint: 'Mỗi mẻ ép (Press Batch) chỉ chứa sản phẩm của DUY NHẤT 1 Lệnh SX; cài đặt cảm biến nhiệt độ ≥ 120°C, áp suất ≥ 120 bar', actionOnViolation: 'Đánh dấu huỷ mẻ ép nếu nhiệt/áp suất tụt hoặc phát hiện lẫn mã lệnh', responsible: 'Trưởng ca ép nóng + Giám sát SCADA' },
        { code: 'CCP-6', stage: 'Cắt biên 4 cạnh & Phế phẩm', name: 'Xử lý đầu mẩu phế phẩm & ván tái chế', mixingRisk: 'Đầu mẩu cắt biên của ván Non-EU bị băm nhỏ rồi tái trộn vào quy trình sản xuất ván ép khối xuất EU', controlPoint: 'Đầu mẩu cắt biên phế phẩm phải chuyển thẳng sang silo băm làm củi đốt lò hơi hoặc làm chân pallet; cấm quay lại dây chuyền ép mặt', actionOnViolation: 'Cách ly khu phế liệu, niêm phong silo phụ phẩm', responsible: 'Tổ trưởng máy cắt biên + Quản lý môi trường' },
        { code: 'CCP-7', stage: 'KCS & Đóng Pallet ISPM 15', name: 'Tem nhãn & niêm phong xuất khẩu', mixingRisk: 'Dán nhầm tem QR đơn EU vào kiện pallet hàng nội địa, hoặc đóng chung pallet lẫn lộn phẩm cấp', controlPoint: 'Soi đèn góc nghiêng 100% tấm; đóng đai chuẩn ISPM 15 có mã hun trùng HT; in tem QR truy xuất phả hệ gắn chặt góc pallet', actionOnViolation: 'Xé bỏ tem, kiểm định lại 100% pallet trước khi cho phép vào khu vực Container', responsible: 'KCS Trưởng + Nhân viên đóng gói ISPM 15' }
    ];

    // Danh sách nhân sự sản xuất nhà máy ECOtech2A (Tham khảo mô hình quản trị lao động Web_VrgVietLao)
    const workers = [
        { id: 'NV-01', code: 'MS:202401', name: 'Nguyễn Huy Hoàng', cccd: '075092001824', dept: 'Tổ bóc ván & Cắt độn', position: 'Tổ trưởng vận hành máy bóc', phone: '0912 345 601', startDate: '2022-03-15', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-02', code: 'MS:202402', name: 'Trần Văn Cường', cccd: '075091002345', dept: 'Tổ bóc ván & Cắt độn', position: 'Công nhân cắt quy cách', phone: '0912 345 602', startDate: '2023-05-10', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-03', code: 'MS:202403', name: 'Lê Thị Thu', cccd: '075189004512', dept: 'Tổ sấy nhiệt & May ruột', position: 'Kỹ thuật viên buồng sấy nhiệt', phone: '0912 345 603', startDate: '2021-08-20', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-04', code: 'MS:202404', name: 'Mai Thanh Tùng', cccd: '075093006789', dept: 'Tổ sấy nhiệt & May ruột', position: 'Công nhân may ván ruột', phone: '0912 345 604', startDate: '2023-11-01', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-05', code: 'MS:202405', name: 'Phạm Đức Thắng', cccd: '075088007812', dept: 'Tổ tráng keo & Ép nóng', position: 'Tổ trưởng tráng keo - Ép nóng', phone: '0912 345 605', startDate: '2020-04-12', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-06', code: 'MS:202406', name: 'Đỗ Văn Hùng', cccd: '075095009123', dept: 'Tổ tráng keo & Ép nóng', position: 'Vận hành máy lăn keo tự động', phone: '0912 345 606', startDate: '2022-07-15', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-07', code: 'MS:202407', name: 'Hoàng Văn Lợi', cccd: '075090008456', dept: 'Tổ tráng keo & Ép nóng', position: 'Kỹ sư máy ép thủy lực đa tầng', phone: '0912 345 607', startDate: '2021-02-18', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-08', code: 'MS:202408', name: 'Vũ Thị Hạnh', cccd: '075194005678', dept: 'Tổ cưa 4 biên & Chà nhám KCS', position: 'KCS kiểm định thành phẩm', phone: '0912 345 608', startDate: '2022-09-01', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-09', code: 'MS:202409', name: 'Đặng Minh Quân', cccd: '075092003456', dept: 'Tổ cưa 4 biên & Chà nhám KCS', position: 'Thợ cưa 4 biên tự động', phone: '0912 345 609', startDate: '2023-01-15', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-10', code: 'MS:202410', name: 'Bùi Tuấn Anh', cccd: '075096001234', dept: 'Tổ cưa 4 biên & Chà nhám KCS', position: 'Vận hành chà nhám thùng', phone: '0912 345 610', startDate: '2023-06-20', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-11', code: 'MS:202411', name: 'Lê Hoàng Phúc', cccd: '075087002345', dept: 'Trạm cân & Kho bãi', position: 'Cán bộ trạm cân & Đối soát GIS', phone: '0918 777 888', startDate: '2020-01-10', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-12', code: 'MS:202412', name: 'Nguyễn Thị Thu Hà', cccd: '075185006789', dept: 'Trạm cân & Kho bãi', position: 'Thủ kho ván lạng 3 khu', phone: '0918 666 999', startDate: '2020-06-15', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-13', code: 'MS:202413', name: 'Trần Đình Khôi', cccd: '075091007890', dept: 'Trạm cân & Kho bãi', position: 'Tổ trưởng đóng gói Pallet ISPM 15', phone: '0912 345 613', startDate: '2022-04-05', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-14', code: 'MS:202414', name: 'Nguyễn Văn Long', cccd: '075089004321', dept: 'Trạm cân & Kho bãi', position: 'Lái xe nâng & Xếp dỡ kho', phone: '0912 345 614', startDate: '2021-10-12', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-15', code: 'MS:202415', name: 'Lý Quốc Bảo', cccd: '075094008765', dept: 'Tổ cơ điện & Bảo trì', position: 'Kỹ sư trưởng bảo trì thiết bị', phone: '0912 345 615', startDate: '2020-09-15', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' },
        { id: 'NV-16', code: 'MS:202416', name: 'Phan Thành Nam', cccd: '075093005432', dept: 'Tổ cơ điện & Bảo trì', position: 'Thợ điện & Điều khiển PLC', phone: '0912 345 616', startDate: '2022-12-01', eudrTrained: true, trainDate: '2026-09-10', status: 'ACTIVE' }
    ];

    // Chấm công điểm danh hàng ngày tháng 11/2026 (Ký hiệu theo chuẩn Web_VrgVietLao: X = đi làm, PN = phép năm, KL = không lương, H = đào tạo EUDR/CCP, Ô = ốm)
    const attendancePatterns = ['X', 'X', 'X', 'X', 'X', 'PN', 'X', 'X', 'X', 'H', 'X', 'X', 'X', 'X', 'Ô', 'X', 'X', 'X', 'X', 'KL', 'X', 'X', 'X', 'X', 'X', 'X', 'H', 'X', 'X', 'X'];
    const attendance = workers.map((w, idx) => {
        const days = {};
        for (let d = 1; d <= 30; d++) {
            const dayOfWeek = (d + 6) % 7; // giả định ngày 1 là CN
            if (dayOfWeek === 0) {
                days[d] = 'CN';
            } else {
                days[d] = attendancePatterns[(d + idx * 2) % attendancePatterns.length];
            }
        }
        return {
            workerId: w.id,
            workerCode: w.code,
            workerName: w.name,
            dept: w.dept,
            month: '2026-11',
            days
        };
    });

    return {
        version: 16,
        workers,
        attendance,
        config,
        speciesDetails,
        provinces,
        districts,
        wards,
        landTypes,
        landCertTypes,
        certifications,
        machines,
        warehouseBays,
        plywoodSpecs,
        glueSpecs,
        ports,
        hsCodeDetails,
        ccpSpecs,
        surveyBatches,
        farmers,
        accounts,
        suppliers,
        customers,
        scaleTickets,
        purchaseOrders,
        materials,
        contracts: typeof contracts !== 'undefined' ? contracts : [],
        plots,
        receipts,
        packages,
        workOrders,
        pallets,
        orders,
        audit,
        drills: []
    };
}
