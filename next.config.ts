import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // QUESTA È LA FORMULA MAGICA:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;