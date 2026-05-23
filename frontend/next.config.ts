import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow loading thumbnails from any domain (video platforms)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Proxy API requests to the backend in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
