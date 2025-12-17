import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "/tools",
  trailingSlash: true,
};

export default nextConfig;
