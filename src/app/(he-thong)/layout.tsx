import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

/** Khung nằm ở layout nên thanh bên không dựng lại khi chuyển trang. */
export default function SystemLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
