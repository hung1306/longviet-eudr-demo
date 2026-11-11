"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { IndustrySelect } from "@/components/IndustrySelect";
import { findRoute, type AppRoute } from "@/lib/routes";
import { SUBSYSTEMS, getActiveSubsystem, type NavItem, type NavLink as NavLinkItem } from "@/lib/subsystems";
import { useIndustry } from "@/lib/useIndustry";

interface PageMeta {
  title: string;
  subtitle?: string;
  actions?: string;
}

const isNavLink = (item: NavItem): item is NavLinkItem => !("header" in item);

function NavList({ items, activeKey, urlTab, onNavigate }: {
  items: readonly NavItem[];
  activeKey: string;
  urlTab: string | null;
  onNavigate: () => void;
}) {
  return (
    <ul className="nav-list">
      {items.map((item) => {
        if (!isNavLink(item)) {
          return <li className="nav-head" key={item.header}>{item.header}</li>;
        }
        const active = item.key === activeKey && (!item.tab || item.tab === urlTab || (!urlTab && Boolean(item.first)));
        return (
          <li key={item.url}>
            <Link
              href={item.url}
              className={`nav-link-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <i className={`fa ${item.icon}`} />
              <span className="flex-grow-1">{item.title}</span>
              {item.badge ? <span className="nav-item-badge">{item.badge}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList(props: Omit<Parameters<typeof NavList>[0], "urlTab">) {
  return <NavList {...props} urlTab={useSearchParams().get("tab")} />;
}

/** Dựng nội dung trang vào #page mỗi khi đường dẫn hoặc tham số URL đổi. */
function PageMount({ route, rootRef, onMeta }: {
  route: AppRoute;
  rootRef: RefObject<HTMLElement | null>;
  onMeta: (meta: PageMeta) => void;
}) {
  const search = useSearchParams().toString();
  const industry = useIndustry();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("@/engine/index.js")
      .then(({ mountPage }) => {
        if (!cancelled) dispose = mountPage(route.page, { root, industry, setMeta: onMeta });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [route.page, search, industry, rootRef, onMeta]);

  return null;
}

/** Liên kết nằm trong chuỗi HTML của trang cũng đi qua router, không tải lại toàn bộ. */
function useInternalLinks() {
  const router = useRouter();
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="/"]') : null;
      if (!link || link.target || link.hasAttribute("download")) return;
      event.preventDefault();
      router.push(link.getAttribute("href") ?? "/");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
}

export function AppShell({ children }: { children: ReactNode }) {
  const route = findRoute(usePathname());
  const rootRef = useRef<HTMLElement>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useInternalLinks();

  // Đường dẫn không có trong bảng định tuyến: để trang 404 tự hiển thị.
  if (!route) return <>{children}</>;

  const subsystem = SUBSYSTEMS[getActiveSubsystem(route.navKey)];
  const closeSidebar = () => setSidebarOpen(false);
  const navProps = { items: subsystem.nav, activeKey: route.navKey, onNavigate: closeSidebar };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
        <Link className="brand brand-header-v2" href="/portal" title="Về Cổng chọn phân hệ">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-logo-circle" style={{ background: "linear-gradient(135deg, #009b5c, #166534)" }}>
              <i className="fa fa-tree text-white fs-6" />
            </div>
            <div className="brand-text-wrap text-start">
              <div className="brand-name-v2" style={{ letterSpacing: "0.5px" }}>
                <span style={{ color: "#009b5c" }}>ECO</span>
                <span style={{ color: "#ec4c24" }}>TECH2A</span>
              </div>
              <div className="brand-sub-v2">Truy xuất EUDR ngành gỗ</div>
            </div>
          </div>
        </Link>
        <div className="sidebar-industry">
          <IndustrySelect className="form-select form-select-sm" />
        </div>
        <Suspense fallback={<NavList {...navProps} urlTab={null} />}>
          <ActiveNavList {...navProps} />
        </Suspense>
        <div className="sidebar-links">
          <Link href="/gioi-thieu"><i className="fa fa-circle-info" />Giới thiệu</Link>
          <Link href="/gop-y"><i className="fa fa-comment-dots" />Góp ý</Link>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn btn-sm btn-light d-lg-none"
            aria-label="Mở menu"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <i className="fa fa-bars" />
          </button>
          <div className="topbar-subsystem-tag">
            <span className="subsystem-badge-pill">
              <i className={`fa ${subsystem.icon} me-1.5 text-success`} />
              <span className="subsystem-badge-text">{subsystem.fullName}</span>
            </span>
          </div>
          <div className="topbar-title">
            <h1>{meta?.title}</h1>
            {meta?.subtitle ? <p>{meta.subtitle}</p> : null}
          </div>
          {/* Nút thao tác do trang cung cấp dưới dạng HTML nội bộ, đã thoát ký tự khi dựng. */}
          <div className="topbar-actions" id="page-actions" dangerouslySetInnerHTML={{ __html: meta?.actions ?? "" }} />
        </header>
        <main className="content" id="page" ref={rootRef} />
      </div>
      <div className="toast-box" id="toast-box" role="status" aria-live="polite" />
      <Suspense fallback={null}>
        <PageMount route={route} rootRef={rootRef} onMeta={setMeta} />
      </Suspense>
      {children}
    </>
  );
}
