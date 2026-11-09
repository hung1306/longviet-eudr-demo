import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thư mục cha có cấu trúc riêng, cố định gốc dự án tại đây.
  turbopack: { root: __dirname },
  // Giữ các liên kết .html cũ còn hoạt động.
  async redirects() {
    return [
      { source: "/index.html", destination: "/portal", permanent: true },
      { source: "/portal.html", destination: "/portal", permanent: true },
      { source: "/nha-may/index.html", destination: "/nha-may", permanent: true },
      { source: "/:section(nha-may|ban-do|quan-tri)/:page.html", destination: "/:section/:page", permanent: true },
    ];
  },
};

export default nextConfig;
