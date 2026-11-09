import type { Metadata } from "next";
import Link from "next/link";
import { PortalChooser } from "@/components/PortalChooser";
import "./portal.css";

export const metadata: Metadata = { title: "Chọn phân hệ" };

const MODULES = [
  { href: "/nha-may/lenh-mua", name: "Nhà Máy", icon: "fa-industry", className: "pxh-factory" },
  { href: "/ban-do/map-tong-quan", name: "Bản Đồ", icon: "fa-map-location-dot", className: "pxh-map" },
  { href: "/quan-tri/admin-dashboard", name: "Quản Trị", icon: "fa-sliders", className: "pxh-admin" },
];

export default function PortalPage() {
  return (
    <div className="pxh" data-page="portal">
      <header className="pxh-top">
        <Link className="pxh-brand text-white text-decoration-none" href="/portal">
          <span className="pxh-logo">
            <i className="fa fa-tree" />
          </span>
          <span>
            <b style={{ color: "#22c55e" }}>ECO</b>
            <b style={{ color: "#f97316" }}>TECH2A</b> &ndash; TRUY XUẤT EUDR NGÀNH GỖ
          </span>
        </Link>
      </header>
      <main className="pxh-main">
        <div className="pxh-panel">
          <PortalChooser />
          <h1 className="pxh-title">Chọn phân hệ làm việc</h1>
          <nav className="pxh-cards" aria-label="Phân hệ">
            {MODULES.map((module) => (
              <Link key={module.href} className={`pxh-card ${module.className}`} href={module.href}>
                <i className={`fa ${module.icon} pxh-ico`} />
                {module.name}
                <i className="fa fa-arrow-right go" />
              </Link>
            ))}
          </nav>
          <div className="pxh-extra">
            <Link href="/gioi-thieu"><i className="fa fa-circle-info" />Giới thiệu giải pháp</Link>
            <Link href="/gop-y"><i className="fa fa-comment-dots" />Góp ý</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
