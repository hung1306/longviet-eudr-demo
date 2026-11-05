const PAGES = {
    suppliers: page_suppliers,
    purchase_orders: page_purchase_orders,
    receipts: page_receipts,
    attendance: page_attendance,
    cham_cong_nhan_su: page_attendance,
    warehouse: page_warehouse,
    workorders: page_workorders,
    stages: page_stages,
    pallets: page_pallets,
    orders: page_orders,
    trace: page_trace,
    // Phân hệ Nhà Máy
    dashboard: typeof page_factory_dashboard !== 'undefined' ? page_factory_dashboard : page_receipts,
    factory_dashboard: typeof page_factory_dashboard !== 'undefined' ? page_factory_dashboard : page_receipts,
    factory_danh_muc: typeof page_factory_danh_muc !== 'undefined' ? page_factory_danh_muc : null,
    // Phân hệ Bản Đồ GIS
    map_tong_quan: typeof page_map_tong_quan !== 'undefined' ? page_map_tong_quan : null,
    map_thua_dat: typeof page_map_thua_dat !== 'undefined' ? page_map_thua_dat : null,
    map_chu_rung: typeof page_map_chu_rung !== 'undefined' ? page_map_chu_rung : null,
    map_kiem_ke: typeof page_map_kiem_ke !== 'undefined' ? page_map_kiem_ke : null,
    map_export_traces: typeof page_map_export_traces !== 'undefined' ? page_map_export_traces : null,
    // Phân hệ Quản Trị & Master Data
    admin_dashboard: typeof page_admin_dashboard !== 'undefined' ? page_admin_dashboard : null,
    admin_loai_cay: typeof page_admin_loai_cay !== 'undefined' ? page_admin_loai_cay : null,
    admin_dia_ban: typeof page_admin_dia_ban !== 'undefined' ? page_admin_dia_ban : null,
    admin_phap_ly_dat: typeof page_admin_phap_ly_dat !== 'undefined' ? page_admin_phap_ly_dat : null,
    admin_doi_tac: typeof page_admin_doi_tac !== 'undefined' ? page_admin_doi_tac : null,
    admin_tai_khoan: typeof page_admin_tai_khoan !== 'undefined' ? page_admin_tai_khoan : null,
    admin_lich_su: typeof page_admin_lich_su !== 'undefined' ? page_admin_lich_su : null
};
if (document.currentScript && document.currentScript.dataset.page && PAGES[document.currentScript.dataset.page]) {
    PAGES[document.currentScript.dataset.page]();
}
