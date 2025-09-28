import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase the maximum request body size for API routes
    serverComponentsExternalPackages: [],
  },
  // For Next.js 13+ App Router, we need to configure this differently
  serverExternalPackages: [],
};

export default nextConfig;
