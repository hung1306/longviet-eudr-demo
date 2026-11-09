/**
 * Điểm vào phía trình duyệt của phần giao diện dựng bằng chuỗi HTML.
 * Chỉ được nạp động từ component client vì các module này dùng window, document, localStorage.
 */
import * as banDo from './ban-do/ban-do.js';
import * as chamCong from './nha-may/cham-cong.js';
import * as danhMuc from './nha-may/danh-muc.js';
import * as lenhMua from './nha-may/lenh-mua.js';
import * as sanXuat from './nha-may/san-xuat.js';
import * as tiepNhan from './nha-may/tiep-nhan-don-hang.js';
import * as tongQuan from './nha-may/tong-quan.js';
import * as quanTri from './quan-tri/quan-tri.js';
import * as core from './shared/core.js';
import * as mockData from './shared/mock_data.js';
import * as navigation from './shared/navigation.js';

const MODULES = [mockData, core, navigation, sanXuat, lenhMua, banDo, quanTri, tongQuan, danhMuc, tiepNhan, chamCong];

/**
 * Chuỗi HTML gọi hàm qua thuộc tính onclick/onchange, các thuộc tính này chỉ thấy phạm vi toàn cục.
 * Dùng getter để biến thay đổi được như DB luôn đọc đúng giá trị hiện tại.
 */
function exposeGlobals() {
    MODULES.forEach(mod => {
        Object.keys(mod).forEach(name => {
            Object.defineProperty(window, name, { configurable: true, get: () => mod[name] });
        });
    });
}
exposeGlobals();

/** Mỗi lần vào trang đều bắt đầu từ bộ lọc mặc định, như khi tải lại trang. */
function resetViews() {
    lenhMua.resetPurchaseOrderViews();
    sanXuat.resetProductionViews();
    tiepNhan.resetReceiptOrderViews();
    chamCong.resetAttendanceView();
}

/**
 * Dựng một trang vào `root`, trả về hàm dọn dẹp khi rời trang.
 * @param {import('../lib/routes').PageId} pageId
 * @param {{ root: HTMLElement, industry: string, setMeta: (meta: { title: string, subtitle?: string, actions?: string }) => void }} host
 */
export function mountPage(pageId, host) {
    const render = MODULES.map(mod => mod[pageId]).find(Boolean);
    if (!render) throw new Error(`Không tìm thấy trang ${pageId}`);
    core.setIndustry(host.industry);
    resetViews();
    navigation.setPageHost(host);
    render();
    return () => {
        navigation.teardownPage();
        host.root.replaceChildren();
    };
}
