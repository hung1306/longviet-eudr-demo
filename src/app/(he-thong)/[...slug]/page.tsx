import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_ROUTES, findRoute } from "@/lib/routes";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return APP_ROUTES.map((route) => ({ slug: route.path.split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: findRoute(slug.join("/"))?.title };
}

/** Nội dung do AppShell dựng phía client; trang này chỉ khai báo đường dẫn hợp lệ và tiêu đề. */
export default async function SystemPage({ params }: PageProps) {
  const { slug } = await params;
  if (!findRoute(slug.join("/"))) notFound();
  return null;
}
