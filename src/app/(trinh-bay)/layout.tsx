import Link from "next/link";
import type { ReactNode } from "react";
import "./present.css";

export default function PresentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pr">
      <header className="pr-top">
        <Link className="pr-brand" href="/portal">
          <span style={{ color: "#009b5c" }}>ECO</span>
          <span style={{ color: "#ec4c24" }}>TECH2A</span>
        </Link>
        <nav aria-label="Trang">
          <Link href="/gioi-thieu">Giới thiệu</Link>
          <Link href="/portal">Demo</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
